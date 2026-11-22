// Cala Solara — Organic Crescent Coastline, Ridged Volcanic Mountains, Curved Roads & Puente del Sol Bridge

import * as THREE from 'three';
import { WORLD_CONFIG } from '../config.js';

export function coastZAtX(x) {
  const dx = x + 110;
  return 162 - 0.00052 * dx * dx + 14 * Math.sin(x * 0.011);
}

export function boulevardZAtX(x) {
  return coastZAtX(x) - 34;
}

function fbm2(x, z) {
  let val = 0;
  let amp = 0.55;
  let freq = 0.0085;
  for (let i = 0; i < 4; i++) {
    const n = Math.sin(x * freq + Math.cos(z * freq * 1.13) * 1.4) * Math.cos(z * freq * 0.91 - Math.sin(x * freq * 0.77) * 1.2);
    val += (1 - Math.abs(n)) * amp;
    freq *= 2.07;
    amp *= 0.48;
  }
  return val;
}

export class CityWorld {
  constructor(scene, textures) {
    this.scene = scene;
    this.textures = textures;
    this.colliders = []; // { minX, maxX, minZ, maxZ, maxY, label }
    this.roadNodes = [];
    this.buildingFootprints = []; // For organic minimap rendering
    this.ramps = [];
    this.bridgeLampMaterials = [];

    this.oceanMesh = null;
    this.buildVolcanicTerrain();
    this.buildCoastalRoadsAndBridge();
    this.buildStuntRamps();
  }

  addCollider(cx, cz, sx, sz, sy = 20, label = 'building') {
    this.colliders.push({
      minX: cx - sx * 0.5,
      maxX: cx + sx * 0.5,
      minZ: cz - sz * 0.5,
      maxZ: cz + sz * 0.5,
      maxY: sy,
      label,
    });
  }

  isOnBridge(x, z) {
    const a = WORLD_CONFIG.bridgeStart;
    const b = WORLD_CONFIG.bridgeEnd;
    const vx = b.x - a.x;
    const vz = b.z - a.z;
    const lenSq = vx * vx + vz * vz;
    const t = ((x - a.x) * vx + (z - a.z) * vz) / lenSq;
    if (t < -0.04 || t > 1.04) return null;
    const px = a.x + vx * t;
    const pz = a.z + vz * t;
    const dist = Math.hypot(x - px, z - pz);
    if (dist <= WORLD_CONFIG.bridgeWidth * 0.56) {
      const clampedT = Math.max(0, Math.min(1, t));
      const y = Math.sin(clampedT * Math.PI) * WORLD_CONFIG.bridgePeakY + 0.3;
      return { t: clampedT, y, dist, px, pz };
    }
    return null;
  }

  getBridgePoint(t) {
    const a = WORLD_CONFIG.bridgeStart;
    const b = WORLD_CONFIG.bridgeEnd;
    const x = a.x + (b.x - a.x) * t;
    const z = a.z + (b.z - a.z) * t;
    const y = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * WORLD_CONFIG.bridgePeakY + 0.3;
    return { x, y, z };
  }

  getTerrainHeight(x, z) {
    // 1) Bridge deck takes precedence when on Puente del Sol
    const br = this.isOnBridge(x, z);
    if (br) return br.y;

    // 2) Stunt ramps elevation
    for (const r of this.ramps) {
      const dx = x - r.x;
      const dz = z - r.z;
      const lx = dx * Math.cos(-r.yaw) - dz * Math.sin(-r.yaw);
      const lz = dx * Math.sin(-r.yaw) + dz * Math.cos(-r.yaw);
      if (Math.abs(lx) <= r.width * 0.52 && lz >= -r.length * 0.5 && lz <= r.length * 0.5) {
        const u = (lz + r.length * 0.5) / r.length;
        return 0.2 + u * r.height;
      }
    }

    // 3) Monte Faro Volcanic Island (SE across bay)
    const dIsland = Math.hypot(x - 398, z - 145);
    if (dIsland < 126) {
      const n = 1 - dIsland / 126;
      const ridge = fbm2(x * 1.4, z * 1.4);
      // Flat accessible lighthouse & villa plateau near road
      const plateau = Math.min(1, n * 2.1);
      const peak = dIsland < 55 ? 8.5 + (55 - dIsland) * 0.14 : plateau * 7.8;
      return Math.max(0.25, peak + ridge * 2.2 * Math.max(0, n - 0.35));
    }

    // 4) Main peninsula vs crescent beach vs ocean
    const cz = coastZAtX(x);
    if (x > 214 && z < 118) return -1.8; // East bay water
    if (z > cz + 14) return -2.0; // South ocean water
    if (z > cz - 16) {
      // Smooth sandy beach slope into turquoise lagoon
      const t = (z - (cz - 16)) / 30;
      return 0.35 * (1 - t) - 0.8 * t;
    }

    // 5) Ridged Volcanic Sierra behind city (z < -235 or x < -330)
    let mountain = 0;
    if (z < -228) {
      const rise = Math.min(1, (-228 - z) / 145);
      const ridge = fbm2(x, z);
      mountain = Math.max(mountain, Math.pow(rise, 1.35) * (58 + ridge * 78));
    }
    if (x < -325) {
      const rise = Math.min(1, (-325 - x) / 130);
      const ridge = fbm2(x + 90, z - 40);
      mountain = Math.max(mountain, Math.pow(rise, 1.4) * (42 + ridge * 58));
    }
    return 0.2 + mountain;
  }

  isWater(x, z) {
    if (this.isOnBridge(x, z)) return false;
    return this.getTerrainHeight(x, z) < 0.05;
  }

  buildVolcanicTerrain() {
    // Sculpted high-resolution continuous land + beach + volcanic ridge mesh (NO cone mountains!)
    const sizeX = 1240;
    const sizeZ = 1040;
    const segX = 160;
    const segZ = 140;
    const geo = new THREE.PlaneGeometry(sizeX, sizeZ, segX, segZ);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + 60;
      const wz = pos.getZ(i) - 40;
      pos.setX(i, wx);
      pos.setZ(i, wz);

      // Compute raw land elevation (excluding bridge deck)
      const cz = coastZAtX(wx);
      const dIsland = Math.hypot(wx - 398, wz - 145);
      let y = 0.2;

      if (dIsland < 130) {
        const n = 1 - dIsland / 130;
        const ridge = fbm2(wx * 1.4, wz * 1.4);
        y = -1.6 + Math.pow(n, 0.72) * (10.5 + ridge * 6.5);
        if (dIsland < 48) y = Math.max(y, 10.5 + (48 - dIsland) * 0.12);
      } else if (wx > 212 && wz < 120) {
        y = -3.4;
      } else if (wz > cz + 12) {
        y = -3.4;
      } else if (wz > cz - 18) {
        const t = (wz - (cz - 18)) / 30;
        y = 0.35 * (1 - t) - 1.6 * t;
      } else {
        let m = 0;
        if (wz < -226) {
          const rise = Math.min(1, (-226 - wz) / 148);
          m = Math.max(m, Math.pow(rise, 1.32) * (62 + fbm2(wx, wz) * 84));
        }
        if (wx < -324) {
          const rise = Math.min(1, (-324 - wx) / 135);
          m = Math.max(m, Math.pow(rise, 1.38) * (46 + fbm2(wx + 80, wz - 30) * 64));
        }
        y = 0.16 + m;
      }
      pos.setY(i, y);

      // Rich vertex biome coloring: golden beach sand -> city travertine/emerald -> lush tropical volcanic slopes -> basalt peaks
      if (y < 0.05) {
        col.setHex(0xc9b38c);
      } else if (wz > cz - 24 && dIsland > 125) {
        col.setHex(0xe8cfa0); // Warm golden sand
      } else if (y < 1.2) {
        col.setHex(dIsland < 125 ? 0xe5ca96 : 0x5c7f4c); // Urban parks / coastal grass
      } else if (y < 24) {
        col.setHex(0x3a6e43); // Lush tropical jungle slopes
      } else if (y < 58) {
        col.setHex(0x6e604e); // Sun-warmed volcanic tuff
      } else {
        col.setHex(0x4a4347); // Dark basalt volcanic caldera peaks
      }
      // Slight organic variation
      const jitter = (Math.sin(wx * 0.07) * Math.cos(wz * 0.07)) * 0.04;
      colors[i * 3] = Math.min(1, Math.max(0, col.r + jitter));
      colors[i * 3 + 1] = Math.min(1, Math.max(0, col.g + jitter));
      colors[i * 3 + 2] = Math.min(1, Math.max(0, col.b + jitter));
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.04,
    });
    const terrainMesh = new THREE.Mesh(geo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    // Urban concrete/travertine plaza base slabs for clean sidewalks
    const citySlabMat = new THREE.MeshStandardMaterial({
      map: this.textures.boardwalkMap,
      roughness: 0.82,
      metalness: 0.06,
    });
    const coreSlab = new THREE.Mesh(new THREE.BoxGeometry(530, 0.32, 345), citySlabMat);
    coreSlab.position.set(-45, 0.14, -52);
    coreSlab.receiveShadow = true;
    this.scene.add(coreSlab);

    // Cobblestone Fiesta Plaza in Barrio Viejo
    const plazaMat = new THREE.MeshStandardMaterial({
      map: this.textures.cobbleMap,
      roughness: 0.78,
      metalness: 0.05,
    });
    const plazaSlab = new THREE.Mesh(new THREE.BoxGeometry(78, 0.36, 78), plazaMat);
    plazaSlab.position.set(WORLD_CONFIG.plazaCenter.x, 0.18, WORLD_CONFIG.plazaCenter.z);
    plazaSlab.receiveShadow = true;
    this.scene.add(plazaSlab);
  }

  buildCoastalRoadsAndBridge() {
    const makeRoadMat = (repX, repY) => {
      const m = this.textures.asphaltMap.clone();
      m.needsUpdate = true;
      m.repeat.set(repX, repY);
      const r = this.textures.asphaltRoughness.clone();
      r.needsUpdate = true;
      r.repeat.set(repX, repY);
      return new THREE.MeshStandardMaterial({
        map: m,
        roughnessMap: r,
        roughness: 0.62,
        metalness: 0.16,
      });
    };

    // 1) Curved Oceanfront Boulevard (Avenida del Sol) — 26 smooth ribbon segments!
    const segs = 26;
    const xStart = -300;
    const xEnd = 128;
    const roadW = 19;
    const bvPositions = [];
    const bvUvs = [];
    const bvIndices = [];
    const boardPositions = [];
    const boardUvs = [];
    const boardIndices = [];

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = xStart + (xEnd - xStart) * t;
      const z = boulevardZAtX(x);
      const dzdx = (boulevardZAtX(x + 2) - boulevardZAtX(x - 2)) / 4;
      const invLen = 1 / Math.hypot(1, dzdx);
      const nx = -dzdx * invLen;
      const nz = 1 * invLen;

      bvPositions.push(
        x - nx * roadW * 0.5, 0.34, z - nz * roadW * 0.5,
        x + nx * roadW * 0.5, 0.34, z + nz * roadW * 0.5
      );
      bvUvs.push(0, t * 24, 1, t * 24);

      // Sunlit oceanfront palm boardwalk immediately south of Avenida del Sol
      boardPositions.push(
        x + nx * (roadW * 0.5), 0.39, z + nz * (roadW * 0.5),
        x + nx * (roadW * 0.5 + 11.5), 0.39, z + nz * (roadW * 0.5 + 11.5)
      );
      boardUvs.push(0, t * 28, 1, t * 28);

      if (i < segs) {
        const k = i * 2;
        bvIndices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        boardIndices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }

      if (i % 3 === 0) this.roadNodes.push({ x, z, lane: 'boulevard' });
    }

    const bvGeo = new THREE.BufferGeometry();
    bvGeo.setAttribute('position', new THREE.Float32BufferAttribute(bvPositions, 3));
    bvGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bvUvs, 2));
    bvGeo.setIndex(bvIndices);
    bvGeo.computeVertexNormals();
    const bvMesh = new THREE.Mesh(bvGeo, makeRoadMat(1, 1));
    bvMesh.receiveShadow = true;
    this.scene.add(bvMesh);

    const bwGeo = new THREE.BufferGeometry();
    bwGeo.setAttribute('position', new THREE.Float32BufferAttribute(boardPositions, 3));
    bwGeo.setAttribute('uv', new THREE.Float32BufferAttribute(boardUvs, 2));
    bwGeo.setIndex(boardIndices);
    bwGeo.computeVertexNormals();
    const bwTex = this.textures.boardwalkMap.clone();
    bwTex.needsUpdate = true;
    bwTex.repeat.set(1, 2);
    const bwMesh = new THREE.Mesh(bwGeo, new THREE.MeshStandardMaterial({ map: bwTex, roughness: 0.78 }));
    bwMesh.receiveShadow = true;
    this.scene.add(bwMesh);

    // 2) Financial Core & Barrio Viejo & Puerto Caldera interconnecting avenues
    const addStraightRoad = (x1, z1, x2, z2, width = 16) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const yaw = Math.atan2(x2 - x1, z2 - z1);
      const geo = new THREE.PlaneGeometry(width, len);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, makeRoadMat(1, Math.max(1, Math.round(len / 18))));
      mesh.position.set((x1 + x2) * 0.5, 0.35, (z1 + z2) * 0.5);
      mesh.rotation.y = yaw;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const steps = Math.max(2, Math.floor(len / 48));
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        this.roadNodes.push({ x: x1 + (x2 - x1) * u, z: z1 + (z2 - z1) * u, lane: 'avenue' });
      }
    };

    // North-South Avenues
    addStraightRoad(-275, -185, -275, boulevardZAtX(-275), 15);
    addStraightRoad(-145, -195, -145, boulevardZAtX(-145), 16);
    addStraightRoad(-45, -205, -45, boulevardZAtX(-45), 18);
    addStraightRoad(45, -205, 45, boulevardZAtX(45), 18);
    addStraightRoad(132, -180, 132, 98, 17);
    // East-West Cross Streets
    addStraightRoad(-280, -185, 195, -185, 16);
    addStraightRoad(-280, -108, 195, -108, 16);
    addStraightRoad(-150, -24, 195, -24, 16);
    addStraightRoad(-280, 48, 195, 48, 16);
    // Puerto Caldera & Marina Promenade road
    addStraightRoad(192, -175, 192, 68, 14);

    // 3) Grand Twin-Tower Suspension Bridge — PUENTE DEL SOL
    this.buildPuenteDelSol(makeRoadMat(1, 1));
  }

  buildPuenteDelSol(roadMat) {
    const a = WORLD_CONFIG.bridgeStart;
    const b = WORLD_CONFIG.bridgeEnd;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const span = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const w = WORLD_CONFIG.bridgeWidth;
    const segs = 32;

    const deckPos = [];
    const deckUv = [];
    const deckIdx = [];
    const underMat = new THREE.MeshStandardMaterial({ color: 0x3b4454, roughness: 0.65, metalness: 0.45 });
    const coralSteel = new THREE.MeshStandardMaterial({ color: 0xd94b3d, roughness: 0.42, metalness: 0.55 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x262e3d, roughness: 0.4, metalness: 0.72 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.48, metalness: 0.4 });

    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const pt = this.getBridgePoint(t);
      deckPos.push(
        pt.x - rightX * w * 0.5, pt.y, pt.z - rightZ * w * 0.5,
        pt.x + rightX * w * 0.5, pt.y, pt.z + rightZ * w * 0.5
      );
      deckUv.push(0, t * 14, 1, t * 14);
      if (i < segs) {
        const k = i * 2;
        deckIdx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
      if (i % 4 === 0) this.roadNodes.push({ x: pt.x, z: pt.z, lane: 'bridge' });
    }

    const deckGeo = new THREE.BufferGeometry();
    deckGeo.setAttribute('position', new THREE.Float32BufferAttribute(deckPos, 3));
    deckGeo.setAttribute('uv', new THREE.Float32BufferAttribute(deckUv, 2));
    deckGeo.setIndex(deckIdx);
    deckGeo.computeVertexNormals();
    const deckMesh = new THREE.Mesh(deckGeo, roadMat);
    deckMesh.receiveShadow = true;
    this.scene.add(deckMesh);

    // Bridge girder underside, concrete barriers, and deck streetlamps
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xfff0c8,
      emissive: 0xffb347,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    this.bridgeLampMaterials.push(lampMat);

    for (let i = 0; i < segs; i++) {
      const t0 = i / segs;
      const t1 = (i + 1) / segs;
      const p0 = this.getBridgePoint(t0);
      const p1 = this.getBridgePoint(t1);
      const mid = new THREE.Vector3((p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5, (p0.z + p1.z) * 0.5);
      const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
      const pitch = -Math.atan2(p1.y - p0.y, Math.hypot(p1.x - p0.x, p1.z - p0.z));

      const girder = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 1.4, segLen + 0.2), underMat);
      girder.position.set(mid.x, mid.y - 0.78, mid.z);
      girder.rotation.order = 'YXZ';
      girder.rotation.y = yaw;
      girder.rotation.x = pitch;
      this.scene.add(girder);

      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.05, segLen + 0.15), railMat);
        rail.position.set(mid.x + rightX * side * (w * 0.5 + 0.25), mid.y + 0.45, mid.z + rightZ * side * (w * 0.5 + 0.25));
        rail.rotation.order = 'YXZ';
        rail.rotation.y = yaw;
        rail.rotation.x = pitch;
        this.scene.add(rail);
      }

      if (i % 4 === 2) {
        for (const side of [-1, 1]) {
          const lx = mid.x + rightX * side * (w * 0.5 + 0.4);
          const lz = mid.z + rightZ * side * (w * 0.5 + 0.4);
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.2, 6), cableMat);
          pole.position.set(lx, mid.y + 3.1, lz);
          this.scene.add(pole);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), lampMat);
          bulb.position.set(lx - rightX * side * 0.9, mid.y + 6.1, lz - rightZ * side * 0.9);
          this.scene.add(bulb);
        }
      }
    }

    // Twin Monumental Coral-Red H-Towers at t = 0.28 and t = 0.72
    const towerTs = [0.28, 0.72];
    const towerTopY = 56;
    for (const tt of towerTs) {
      const pt = this.getBridgePoint(tt);
      const grp = new THREE.Group();
      grp.position.set(pt.x, 0, pt.z);
      grp.rotation.y = yaw;

      // Concrete marine pier foundation
      const pier = new THREE.Mesh(new THREE.BoxGeometry(w + 7, 10, 6.5), underMat);
      pier.position.set(0, 2, 0);
      grp.add(pier);

      // Left & right sculpted steel columns
      for (const side of [-1, 1]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(2.4, towerTopY, 3.0), coralSteel);
        col.position.set(side * (w * 0.5 + 1.4), towerTopY * 0.5, 0);
        col.castShadow = true;
        col.receiveShadow = true;
        grp.add(col);
      }
      // Crossbeams forming iconic Art-Deco H-arch
      for (const cy of [pt.y + 13, pt.y + 27, towerTopY - 4]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(w + 4.8, 2.2, 2.4), coralSteel);
        beam.position.set(0, cy, 0);
        beam.castShadow = true;
        grp.add(beam);
      }
      // Red aviation warning beacons on top of each tower
      const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff3b4d, emissive: 0xff2238, emissiveIntensity: 3.2 });
      for (const side of [-1, 1]) {
        const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), beaconMat);
        bMesh.position.set(side * (w * 0.5 + 1.4), towerTopY + 0.8, 0);
        grp.add(bMesh);
      }
      this.scene.add(grp);
    }

    // Graceful parabolic catenary main suspension cables & vertical suspenders (thin dark steel, NEVER thick yellow pipes!)
    const cableHeight = (t) => {
      if (t <= 0.28) {
        const u = t / 0.28;
        return 4 + Math.pow(u, 1.85) * (towerTopY - 6);
      }
      if (t >= 0.72) {
        const u = (1 - t) / 0.28;
        return 4 + Math.pow(u, 1.85) * (towerTopY - 6);
      }
      const u = (t - 0.5) / 0.22; // -1..1 between towers
      return 21.5 + u * u * (towerTopY - 23.5);
    };

    for (const side of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const bp = this.getBridgePoint(t);
        pts.push(new THREE.Vector3(
          bp.x + rightX * side * (w * 0.5 + 1.3),
          cableHeight(t),
          bp.z + rightZ * side * (w * 0.5 + 1.3)
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.32, 6, false), cableMat);
      tube.castShadow = true;
      this.scene.add(tube);

      // Vertical suspender cables
      for (let i = 2; i < 39; i += 2) {
        const t = i / 40;
        if (Math.abs(t - 0.28) < 0.03 || Math.abs(t - 0.72) < 0.03) continue;
        const bp = this.getBridgePoint(t);
        const cy = cableHeight(t);
        const len = Math.max(1, cy - bp.y);
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, len, 5), cableMat);
        rod.position.set(
          bp.x + rightX * side * (w * 0.5 + 1.3),
          bp.y + len * 0.5,
          bp.z + rightZ * side * (w * 0.5 + 1.3)
        );
        this.scene.add(rod);
      }
    }

    // Monte Faro Island scenic paved loop road up to Lighthouse Overlook
    const islandPts = [
      { x: 350, z: 132 },
      { x: 382, z: 122 },
      { x: 418, z: 134 },
      { x: 432, z: 156 },
      { x: 405, z: 175 },
      { x: 368, z: 158 },
    ];
    for (let i = 0; i < islandPts.length - 1; i++) {
      const p0 = islandPts[i];
      const p1 = islandPts[i + 1];
      const y0 = this.getTerrainHeight(p0.x, p0.z) + 0.16;
      const y1 = this.getTerrainHeight(p1.x, p1.z) + 0.16;
      const len = Math.hypot(p1.x - p0.x, y1 - y0, p1.z - p0.z);
      const rYaw = Math.atan2(p1.x - p0.x, p1.z - p0.z);
      const rPitch = -Math.atan2(y1 - y0, Math.hypot(p1.x - p0.x, p1.z - p0.z));
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, len + 2), underMat);
      mesh.position.set((p0.x + p1.x) * 0.5, (y0 + y1) * 0.5, (p0.z + p1.z) * 0.5);
      mesh.rotation.order = 'YXZ';
      mesh.rotation.y = rYaw;
      mesh.rotation.x = rPitch;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.roadNodes.push({ x: p0.x, z: p0.z, lane: 'island' });
    }
  }

  buildStuntRamps() {
    const specs = [
      { x: -12, z: boulevardZAtX(-12) - 4, yaw: Math.PI * 0.5, width: 7.5, length: 13, height: 3.4, name: 'Boardwalk Leap' },
      { x: 168, z: -76, yaw: 0, width: 7.2, length: 12, height: 3.2, name: 'Crane Yard Launch' },
      { x: -95, z: -108, yaw: Math.PI * 0.5, width: 7.5, length: 13, height: 3.5, name: 'Midtown Overpass' },
    ];
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xffa630, roughness: 0.45, metalness: 0.25 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff3b6b, emissive: 0xff2b59, emissiveIntensity: 1.4 });

    for (const s of specs) {
      this.ramps.push({ ...s, cleared: false });
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(s.length, 0);
      shape.lineTo(s.length, s.height);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: s.width, bevelEnabled: false });
      geo.translate(-s.length * 0.5, 0, -s.width * 0.5);
      geo.rotateY(-Math.PI * 0.5);
      const mesh = new THREE.Mesh(geo, rampMat);
      mesh.position.set(s.x, 0.35, s.z);
      mesh.rotation.y = s.yaw;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const beacon = new THREE.Mesh(new THREE.BoxGeometry(s.width + 0.3, 0.35, 0.45), stripeMat);
      beacon.position.set(
        s.x + Math.sin(s.yaw) * (s.length * 0.48),
        s.height + 0.35,
        s.z + Math.cos(s.yaw) * (s.length * 0.48)
      );
      beacon.rotation.y = s.yaw;
      this.scene.add(beacon);
    }
  }
}

// Cala Solara — Tactical 5-Star CSPD Police Dispatch (PIT Flankers, Roadblocks & Spikes, Dismounting SWAT, Air-1 Volumetric Chopper)

import * as THREE from 'three';
import { WANTED_TIERS } from '../config.js';
import { createStylizedCharacterRig } from '../entities/characters.js';

function createVolumetricSearchlightMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(0xcdeeff) },
      uOpacity: { value: 0.44 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      void main() {
        // Soft fresnel edge fade + smooth vertical attenuation (NEVER an opaque white triangle!)
        float edge = pow(abs(dot(normalize(vNormalV), normalize(vViewDir))), 1.55);
        float verticalFade = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.08, vUv.y);
        float alpha = edge * verticalFade * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

function buildAirOneChopperMesh() {
  const root = new THREE.Group();
  const darkBody = new THREE.MeshStandardMaterial({ color: 0x161f2e, roughness: 0.35, metalness: 0.65 });
  const whiteStripe = new THREE.MeshStandardMaterial({ color: 0xf0f4fa, roughness: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x12263a, roughness: 0.1, metalness: 0.9 });
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.5 });

  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 5.2), darkBody);
  fuselage.castShadow = true;
  root.add(fuselage);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 1.9), glass);
  canopy.position.set(0, 0.15, 2.35);
  canopy.rotation.x = 0.28;
  root.add(canopy);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.32, 4.4), whiteStripe);
  stripe.position.set(0, -0.2, 0.1);
  root.add(stripe);

  const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.72, 5.4), darkBody);
  tailBoom.position.set(0, 0.35, -4.6);
  root.add(tailBoom);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 1.1), darkBody);
  tailFin.position.set(0, 0.9, -7.1);
  root.add(tailFin);

  // Landing skids
  for (const sx of [-1.15, 1.15]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 6), rotorMat);
    skid.rotation.x = Math.PI * 0.5;
    skid.position.set(sx, -1.55, 0.3);
    root.add(skid);
  }

  // Spinning main rotor & tail rotor
  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 1.35, 0.2);
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.07, 0.34), rotorMat);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 10.8), rotorMat);
  mainRotor.add(b1, b2);
  root.add(mainRotor);

  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.22, 1.05, -7.1);
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.65, 0.18), rotorMat);
  tailRotor.add(tb);
  root.add(tailRotor);

  // Red/Blue nav beacons
  const redBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff2238, emissive: 0xff1128, emissiveIntensity: 4.8 })
  );
  redBeacon.position.set(0, -0.95, -0.8);
  root.add(redBeacon);

  // Soft volumetric GLSL searchlight cone
  const coneGeo = new THREE.CylinderGeometry(0.65, 9.8, 38, 22, 1, true);
  coneGeo.translate(0, -19, 0);
  const coneMat = createVolumetricSearchlightMaterial();
  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  coneMesh.position.set(0, -0.9, 2.2);
  root.add(coneMesh);

  // Dynamic illuminated spotlight pool on road/bridge (balanced to avoid milky blowout)
  const groundSpot = new THREE.PointLight(0xc8ecff, 4.2, 28);
  root.add(groundSpot);

  return { root, mainRotor, tailRotor, coneMesh, coneMat, groundSpot };
}

export class PoliceDispatchSystem {
  constructor(scene, cityWorld, vehicleSystem, atmosphere, audio) {
    this.scene = scene;
    this.cityWorld = cityWorld;
    this.vehicleSystem = vehicleSystem;
    this.atmosphere = atmosphere;
    this.audio = audio;

    this.wantedLevel = 0;
    this.heatScore = 0;
    this.evasionTimer = 0;
    this.radarJammedTimer = 0;
    this.dispatchBanner = '';
    this.dispatchTimer = 0;

    this.units = []; // { vehicle, tactic, swatsDismounted }
    this.officers = []; // On-foot CSPD / SWAT officers with real combat AI
    this.roadblocks = []; // { group, spikes, barrels, pos }
    this.airOne = null;
    this.airOnePos = new THREE.Vector3(240, 32, 114);
    this.airOneFireCd = 0;
    this.spawnTimer = 0;
    this.roadblockCd = 0;
  }

  getTier() {
    return WANTED_TIERS[Math.min(5, Math.max(0, this.wantedLevel))];
  }

  addHeat(amount, reason = '') {
    this.heatScore = Math.min(520, this.heatScore + amount);
    const prev = this.wantedLevel;
    const next = this.heatScore >= 420 ? 5
      : this.heatScore >= 300 ? 4
      : this.heatScore >= 190 ? 3
      : this.heatScore >= 95 ? 2
      : this.heatScore >= 25 ? 1 : 0;
    if (next > prev) {
      this.wantedLevel = next;
      this.evasionTimer = 0;
      const tier = this.getTier();
      this.dispatchBanner = `CSPD DISPATCH: ${tier.label}${reason ? ' — ' + reason : ''}`;
      this.dispatchTimer = 5.5;
    }
  }

  setWantedLevel(stars, reason = '') {
    const thresholds = [0, 40, 120, 220, 330, 460];
    this.wantedLevel = Math.max(0, Math.min(5, stars));
    this.heatScore = thresholds[this.wantedLevel];
    this.evasionTimer = 0;
    if (this.wantedLevel > 0) {
      this.dispatchBanner = `CSPD DISPATCH: ${this.getTier().label}${reason ? ' — ' + reason : ''}`;
      this.dispatchTimer = 5.5;
    } else {
      this.clearHeat();
    }
  }

  jamRadar(duration = 12) {
    this.radarJammedTimer = duration;
    if (this.wantedLevel > 1) this.setWantedLevel(this.wantedLevel - 1, 'RADAR SCRAMBLED');
    else this.clearHeat();
    // Disable nearby spike strips
    for (const rb of this.roadblocks) rb.spikesActive = false;
  }

  clearHeat() {
    this.wantedLevel = 0;
    this.heatScore = 0;
    this.evasionTimer = 0;
    this.dispatchBanner = '';
    for (const u of this.units) u.vehicle.sirenOn = false;
    if (this.airOne) this.airOne.root.visible = false;
  }

  spawnOfficer(x, z, isSwat = false) {
    const rig = createStylizedCharacterRig({
      jacket: isSwat ? 0x161d29 : 0x1c3459,
      shirt: isSwat ? 0x222938 : 0x2b4875,
      pants: 0x141b26,
      skin: 0xd9a17a,
      hair: 0x1c1818,
      hat: isSwat ? 'swat' : 'police',
      sunglasses: true,
      weaponId: isSwat ? 'carbine' : 'pistol',
    });
    const y = Math.max(0.25, this.cityWorld.getTerrainHeight(x, z));
    rig.root.position.set(x, y, z);
    this.scene.add(rig.root);

    const off = {
      rig,
      pos: new THREE.Vector3(x, y, z),
      yaw: 0,
      hp: isSwat ? 115 : 65,
      maxHp: isSwat ? 115 : 65,
      isSwat,
      alive: true,
      fireCd: 0.6 + Math.random() * 0.6,
      walkCycle: 0,
    };
    this.officers.push(off);
    return off;
  }

  deployRoadblockAndSpikes(x, z, yaw, withSwat = false) {
    // Keep at most 2 active roadblocks
    if (this.roadblocks.length >= 2) {
      const old = this.roadblocks.shift();
      this.scene.remove(old.group);
    }

    const group = new THREE.Group();
    const y = Math.max(0.25, this.cityWorld.getTerrainHeight(x, z));
    group.position.set(x, y, z);
    group.rotation.y = yaw;

    // Striped red/white police barricades
    const barMat = new THREE.MeshStandardMaterial({ color: 0xe63b45, roughness: 0.55 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.5 });
    for (const sx of [-4.2, 4.2]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.15, 0.45), barMat);
      bar.position.set(sx, 0.6, 0);
      bar.castShadow = true;
      group.add(bar);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.84, 0.35, 0.48), whiteMat);
      stripe.position.set(sx, 0.72, 0);
      group.add(stripe);
    }

    // Glowing amber emergency road flares
    const flareMat = new THREE.MeshStandardMaterial({ color: 0xff8b24, emissive: 0xff6b14, emissiveIntensity: 4.5 });
    for (const sx of [-5.8, -1.8, 1.8, 5.8]) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.38, 8), flareMat);
      f.position.set(sx, 0.2, 1.8);
      group.add(f);
    }

    // Metallic tire-puncturing spike strip across center gap!
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8e3, roughness: 0.28, metalness: 0.9 });
    const stripBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 0.65), spikeMat);
    stripBase.position.set(0, 0.05, 1.1);
    group.add(stripBase);
    for (let sx = -2.4; sx <= 2.4; sx += 0.48) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 4), spikeMat);
      tooth.position.set(sx, 0.18, 1.1);
      group.add(tooth);
    }

    // Explosive red fuel barrel beside barricade (shootable!)
    const barrelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 1.2, 10),
      new THREE.MeshStandardMaterial({ color: 0xd92b2b, roughness: 0.45, metalness: 0.35 })
    );
    barrelMesh.position.set(-6.4, 0.6, -0.5);
    barrelMesh.castShadow = true;
    group.add(barrelMesh);

    this.scene.add(group);

    // Park angled CSPD cruiser or SWAT truck behind roadblock + deploy cover officers
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);
    const cruiser = this.vehicleSystem.spawnVehicle(
      withSwat ? 'swat' : 'police',
      x + rightX * 3.8,
      z + rightZ * 3.8,
      yaw + 1.15,
      { sirenOn: true, role: 'police', tactic: 'ROADBLOCK' }
    );
    this.units.push({ vehicle: cruiser, tactic: 'ROADBLOCK', swatsDismounted: true });

    this.spawnOfficer(x - rightX * 3.6, z - rightZ * 3.6, withSwat);
    this.spawnOfficer(x + rightX * 1.4, z + rightZ * 1.4, withSwat);

    const barrelWorld = new THREE.Vector3(-6.4, 0.6, -0.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(new THREE.Vector3(x, y, z));
    const rb = { group, pos: new THREE.Vector3(x, y, z), yaw, spikesActive: true, barrelMesh, barrelPos: barrelWorld, barrelAlive: true };
    this.roadblocks.push(rb);
    return rb;
  }

  deploySwatSquad(swatVehicle) {
    const offsets = [[-2.6, -1.5], [2.6, -1.5], [0, -3.8]];
    for (const [ox, oz] of offsets) {
      const p = new THREE.Vector3(ox, 0, oz).applyAxisAngle(new THREE.Vector3(0, 1, 0), swatVehicle.yaw).add(swatVehicle.pos);
      this.spawnOfficer(p.x, p.z, true);
    }
    this.dispatchBanner = 'CSPD SWAT DISMOUNTED — ENGAGING HOSTILE';
    this.dispatchTimer = 4.2;
  }

  ensureAirOne() {
    if (!this.airOne) {
      this.airOne = buildAirOneChopperMesh();
      this.scene.add(this.airOne.root);
    }
    this.airOne.root.visible = true;
    return this.airOne;
  }

  aimSearchlightAt(targetPos) {
    if (!this.airOne) return;
    const ch = this.airOne;
    ch.root.updateMatrixWorld(true);
    const localTarget = ch.root.worldToLocal(targetPos.clone());
    const localOrigin = ch.coneMesh.position;
    const dir = new THREE.Vector3().subVectors(localTarget, localOrigin);
    const len = Math.max(8, dir.length());
    dir.normalize();
    ch.coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    ch.coneMesh.scale.set(1, len / 38, 1);
    ch.groundSpot.position.copy(localTarget).add(new THREE.Vector3(0, 3.5, 0));
  }

  updateAirOneChopper(dt, targetPos, player, combatSystem) {
    if (this.wantedLevel < 5 || this.radarJammedTimer > 0) {
      if (this.airOne) this.airOne.root.visible = false;
      return;
    }
    const ch = this.ensureAirOne();
    const orbitAngle = performance.now() * 0.00055;
    const goalX = targetPos.x + Math.cos(orbitAngle) * 26;
    const goalZ = targetPos.z + Math.sin(orbitAngle) * 22;
    const goalY = Math.max(targetPos.y + 24, 28);

    this.airOnePos.lerp(new THREE.Vector3(goalX, goalY, goalZ), Math.min(1, dt * 1.8));
    ch.root.position.copy(this.airOnePos);
    ch.root.lookAt(targetPos.x, this.airOnePos.y - 4, targetPos.z);

    ch.mainRotor.rotation.y += dt * 24;
    ch.tailRotor.rotation.x += dt * 32;

    // Aim volumetric searchlight cone directly onto targetPos
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.airOnePos);
    this.aimSearchlightAt(targetPos);

    // Periodic suppression burst
    this.airOneFireCd -= dt;
    if (this.airOneFireCd <= 0 && toTarget.length() < 65) {
      this.airOneFireCd = 2.4;
      const start = this.airOnePos.clone().add(new THREE.Vector3(0, -1.2, 0));
      const miss = new THREE.Vector3((Math.random() - 0.5) * 4, 0.6, (Math.random() - 0.5) * 4);
      const end = targetPos.clone().add(miss);
      this.atmosphere.spawnTracer(start, end, 0xffd27a, 0.14);
      if (miss.length() < 2.1 && combatSystem) {
        if (player.vehicle) this.vehicleSystem.damageVehicle(player.vehicle, 6);
        else player.takeDamage(5);
      }
    }
  }

  update(dt, player, combatSystem) {
    if (this.dispatchTimer > 0) this.dispatchTimer = Math.max(0, this.dispatchTimer - dt);
    if (this.radarJammedTimer > 0) this.radarJammedTimer = Math.max(0, this.radarJammedTimer - dt);
    if (this.wantedLevel <= 0) return;

    const pPos = player.pos;
    const tier = this.getTier();

    // 1) Spawn pursuing units up to current star cap
    this.spawnTimer -= dt;
    const activeUnits = this.units.filter((u) => !u.vehicle.destroyed && u.vehicle.role !== 'player');
    if (this.spawnTimer <= 0 && activeUnits.length < tier.maxUnits) {
      this.spawnTimer = 4.2;
      const ang = Math.random() * Math.PI * 2;
      const sx = pPos.x + Math.cos(ang) * 72;
      const sz = pPos.z + Math.sin(ang) * 72;
      if (!this.cityWorld.isWater(sx, sz)) {
        const isSwat = this.wantedLevel >= 4 && activeUnits.filter((u) => u.vehicle.type === 'swat').length < 1;
        const vType = isSwat ? 'swat' : 'police';
        const yaw = Math.atan2(pPos.x - sx, pPos.z - sz);
        const veh = this.vehicleSystem.spawnVehicle(vType, sx, sz, yaw, { sirenOn: true, role: 'police' });
        const tactic = isSwat ? 'SWAT' : (this.wantedLevel >= 2 && activeUnits.length % 2 === 1 ? 'PIT' : 'PURSUIT');
        this.units.push({ vehicle: veh, tactic, swatsDismounted: false });
      }
    }

    // 2) Deploy ahead-of-player roadblock & spike strip at 3★+
    this.roadblockCd -= dt;
    if (this.wantedLevel >= 3 && this.roadblockCd <= 0 && player.vehicle && player.vehicle.speed > 10) {
      const fx = pPos.x + Math.sin(player.yaw) * 68;
      const fz = pPos.z + Math.cos(player.yaw) * 68;
      if (!this.cityWorld.isWater(fx, fz)) {
        this.deployRoadblockAndSpikes(fx, fz, player.yaw + Math.PI, this.wantedLevel >= 4);
        this.roadblockCd = 24;
      }
    }

    // 3) Check spike strip tire puncture on player vehicle
    if (player.vehicle && !player.vehicle.tiresPopped && player.vehicle.type !== 'boat') {
      for (const rb of this.roadblocks) {
        if (!rb.spikesActive) continue;
        if (Math.hypot(player.pos.x - rb.pos.x, player.pos.z - rb.pos.z) < 4.5) {
          player.vehicle.tiresPopped = true;
          this.atmosphere.spawnImpactSparks(player.pos.clone().add(new THREE.Vector3(0, 0.3, 0)), 14, 0xffe49e);
          this.dispatchBanner = 'SPIKE STRIP HIT — TIRES PUNCTURED!';
          this.dispatchTimer = 4.0;
        }
      }
    }

    // 4) Tactical Police Driving AI (PATROL / PIT FLANK / SWAT DISMOUNT)
    let anySeesPlayer = false;
    for (const u of this.units) {
      const v = u.vehicle;
      if (v.destroyed || v === player.vehicle) continue;

      const dist = Math.hypot(pPos.x - v.pos.x, pPos.z - v.pos.z);
      if (dist < 62 && this.radarJammedTimer <= 0) anySeesPlayer = true;

      if (u.tactic === 'ROADBLOCK') {
        this.vehicleSystem.updateDrivingPhysics(v, { throttle: 0, steer: 0, handbrake: true, nitro: false }, dt);
        continue;
      }

      // SWAT BearCat intercepts within 24m then dismounts 3 armored SWAT officers!
      if (u.tactic === 'SWAT' && dist < 24 && !u.swatsDismounted) {
        u.swatsDismounted = true;
        this.deploySwatSquad(v);
      }

      let aimX = pPos.x;
      let aimZ = pPos.z;
      if (u.tactic === 'PIT' && player.vehicle && dist < 38) {
        // Aim for player's rear quarter-panel to execute a genuine PIT maneuver!
        aimX = pPos.x - Math.sin(player.yaw) * 3.8 + Math.cos(player.yaw) * 2.4;
        aimZ = pPos.z - Math.cos(player.yaw) * 3.8 - Math.sin(player.yaw) * 2.4;
      }

      const desiredYaw = Math.atan2(aimX - v.pos.x, aimZ - v.pos.z);
      let yawErr = desiredYaw - v.yaw;
      while (yawErr > Math.PI) yawErr -= Math.PI * 2;
      while (yawErr < -Math.PI) yawErr += Math.PI * 2;

      const shouldStop = u.tactic === 'SWAT' && u.swatsDismounted && dist < 18;
      const throttle = shouldStop ? -0.6 : (Math.abs(yawErr) > 1.2 ? 0.35 : 0.94);
      const steer = THREE.MathUtils.clamp(yawErr * 1.8, -1, 1);
      this.vehicleSystem.updateDrivingPhysics(v, { throttle, steer, handbrake: shouldStop, nitro: dist > 30 }, dt);
    }

    // 5) On-Foot Police & SWAT Officer Combat AI
    for (let i = this.officers.length - 1; i >= 0; i--) {
      const off = this.officers[i];
      if (!off.alive) continue;
      const dx = pPos.x - off.pos.x;
      const dz = pPos.z - off.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 52 && this.radarJammedTimer <= 0) anySeesPlayer = true;

      off.yaw = Math.atan2(dx, dz);
      let spd = 0;
      if (dist > 18 && dist < 85) {
        spd = off.isSwat ? 5.2 : 4.5;
        const nx = off.pos.x + (dx / dist) * spd * dt;
        const nz = off.pos.z + (dz / dist) * spd * dt;
        if (!this.cityWorld.isWater(nx, nz)) {
          off.pos.x = nx;
          off.pos.z = nz;
        }
      }
      off.pos.y = Math.max(0.2, this.cityWorld.getTerrainHeight(off.pos.x, off.pos.z));
      off.walkCycle += spd * dt * 1.7;
      off.rig.root.position.copy(off.pos);
      off.rig.root.rotation.y = off.yaw;
      off.rig.animatePose(off.walkCycle, spd, dist < 42, dt);

      off.fireCd -= dt;
      if (off.fireCd <= 0 && dist < 42 && this.radarJammedTimer <= 0) {
        off.fireCd = off.isSwat ? 0.72 : 1.15;
        const muzzle = off.rig.getMuzzleWorldPos();
        const aimPt = pPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, 1.15, (Math.random() - 0.5) * 1.4));
        this.atmosphere.spawnMuzzleFlash(muzzle, aimPt.clone().sub(muzzle).normalize(), 0xffd07a);
        this.atmosphere.spawnTracer(muzzle, aimPt, 0xffb366, 0.09);
        if (Math.random() < (off.isSwat ? 0.36 : 0.22)) {
          if (player.vehicle) this.vehicleSystem.damageVehicle(player.vehicle, off.isSwat ? 6 : 3.5);
          else player.takeDamage(off.isSwat ? 7 : 4.5);
        }
      }
    }

    // 6) Air-1 Chopper at 5★
    this.updateAirOneChopper(dt, pPos, player, combatSystem);

    // 7) Line-of-Sight Evasion Cooldown
    if (!anySeesPlayer && this.wantedLevel < 5) {
      this.evasionTimer += dt;
      if (this.evasionTimer >= 14) {
        this.clearHeat();
      }
    } else if (anySeesPlayer) {
      this.evasionTimer = Math.max(0, this.evasionTimer - dt * 2);
    }
  }
}

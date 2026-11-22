// Cala Solara — Sculpted 6-District Architecture, Landmarks, Marina, Fiesta Plaza & Palm Groves

import * as THREE from 'three';
import { WORLD_CONFIG } from '../config.js';
import { createNeonSignTexture } from '../render/materials.js';
import { boulevardZAtX, coastZAtX } from './city-world.js';

export function buildDistrictLandmarks(scene, cityWorld, textures) {
  const emissiveMaterials = [];
  const animatedProps = []; // Lighthouse beam, palm fronds, fiesta lights, fountain

  buildArtDecoStrip(scene, cityWorld, textures, emissiveMaterials);
  buildSkylineCore(scene, cityWorld, textures, emissiveMaterials);
  buildOldTownPlaza(scene, cityWorld, textures, emissiveMaterials, animatedProps);
  buildHarborMarina(scene, cityWorld, textures, emissiveMaterials);
  buildMonteFaroIsland(scene, cityWorld, textures, emissiveMaterials, animatedProps);
  buildPalmGrovesAndBeach(scene, cityWorld, animatedProps);

  return { emissiveMaterials, animatedProps };
}

function buildArtDecoStrip(scene, cityWorld, textures, emissiveMaterials) {
  const hotels = [
    { x: -175, w: 30, d: 22, h: 28, tint: 0xffd5c8, neon: 'HOTEL CORAL', sub: 'BEACH RESORT', glow: '#ff4f8b' },
    { x: -115, w: 34, d: 24, h: 36, tint: 0xdff5f0, neon: 'SOLARA CLUB', sub: 'ROOFTOP LOUNGE', glow: '#00e6ff' },
    { x: -55, w: 28, d: 22, h: 25, tint: 0xffe8c2, neon: 'PALMERA', sub: 'OCEANFRONT', glow: '#ffae38' },
    { x: 5, w: 34, d: 24, h: 40, tint: 0xe6e0ff, neon: 'AZUL BAY', sub: 'GRAND CASINO', glow: '#c46bff' },
    { x: 75, w: 30, d: 22, h: 30, tint: 0xffdce4, neon: 'MIRAMAR', sub: 'SUITES & SPA', glow: '#ff5d73' },
  ];

  const awningColors = [0xff5277, 0x00c9d8, 0xffaa33, 0x3bd48a];
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x243040, roughness: 0.45, metalness: 0.6 });
  const balconyMat = new THREE.MeshStandardMaterial({ color: 0xfff6ec, roughness: 0.65 });

  for (let i = 0; i < hotels.length; i++) {
    const b = hotels[i];
    const z = boulevardZAtX(b.x) - 25;
    const grp = new THREE.Group();
    grp.position.set(b.x, 0.3, z);

    const wallMat = new THREE.MeshStandardMaterial({
      color: b.tint,
      map: textures.decoMap,
      emissive: 0xffffff,
      emissiveMap: textures.decoEmissive,
      emissiveIntensity: 0.85,
      roughness: 0.62,
      metalness: 0.08,
    });
    emissiveMaterials.push({ mat: wallMat, base: 0.85 });

    // Main hotel tower
    const main = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), wallMat);
    main.position.y = b.h * 0.5;
    main.castShadow = true;
    main.receiveShadow = true;
    grp.add(main);

    // Art-Deco stepped penthouse crown
    const crown = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.62, 6.5, b.d * 0.62), wallMat);
    crown.position.y = b.h + 3.25;
    crown.castShadow = true;
    grp.add(crown);

    // 3D Recessed cantilevered balconies facing the ocean boulevard
    const floors = Math.floor(b.h / 6.5);
    for (let f = 1; f < floors; f++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.86, 0.55, 2.6), balconyMat);
      slab.position.set(0, f * 6.2, b.d * 0.5 + 1.1);
      slab.castShadow = true;
      grp.add(slab);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.86, 0.9, 0.16), darkMetal);
      rail.position.set(0, f * 6.2 + 0.6, b.d * 0.5 + 2.3);
      grp.add(rail);
    }

    // Ground-floor striped café awning & warm lobby glow
    const awningMat = new THREE.MeshStandardMaterial({ color: awningColors[i % awningColors.length], roughness: 0.72 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.92, 0.45, 4.4), awningMat);
    awning.position.set(0, 4.3, b.d * 0.5 + 2.1);
    awning.rotation.x = 0.24;
    awning.castShadow = true;
    grp.add(awning);

    // Luminous HDR-bloomed rooftop neon sign facing the beach boulevard
    const signTex = createNeonSignTexture(b.neon, '#101526', b.glow, b.sub);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      emissiveMap: signTex,
      emissive: 0xffffff,
      emissiveIntensity: 2.35,
      roughness: 0.2,
    });
    emissiveMaterials.push({ mat: signMat, base: 2.35, alwaysBright: true });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.82, 4.8, 0.7), signMat);
    signBoard.position.set(0, b.h + 2.6, b.d * 0.5 + 0.6);
    grp.add(signBoard);

    // Neon trim tube along roofline
    const tubeMat = new THREE.MeshStandardMaterial({
      color: b.glow,
      emissive: b.glow,
      emissiveIntensity: 2.8,
    });
    emissiveMaterials.push({ mat: tubeMat, base: 2.8, alwaysBright: true });
    const trim = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.6, 0.48, b.d + 0.6), tubeMat);
    trim.position.y = b.h - 0.4;
    grp.add(trim);

    scene.add(grp);
    cityWorld.addCollider(b.x, z, b.w + 1.5, b.d + 3.5, b.h);
    cityWorld.buildingFootprints.push({ x: b.x, z, w: b.w, d: b.d, color: '#ff96b5' });
  }
}

function buildSkylineCore(scene, cityWorld, textures, emissiveMaterials) {
  const towers = [
    { x: -95, z: -150, w: 32, d: 30, h: 74, tint: 0x9cd2eb, accent: '#00e6ff', helipad: true },
    { x: -95, z: -66, w: 30, d: 28, h: 58, tint: 0xd9c7a8, accent: '#ffae42', helipad: false },
    { x: -95, z: 12, w: 28, d: 24, h: 42, tint: 0xaad4e6, accent: '#ff5d8f', helipad: false },
    { x: 0, z: -152, w: 36, d: 34, h: 98, tint: 0xbce6ff, accent: '#ffd066', helipad: true }, // Flagship Solara Spire
    { x: 90, z: -150, w: 30, d: 28, h: 82, tint: 0xa6d0e8, accent: '#5bf59c', helipad: false },
    { x: 90, z: -66, w: 32, d: 28, h: 66, tint: 0xe3d1b8, accent: '#ff7052', helipad: true },
    { x: 90, z: 14, w: 28, d: 24, h: 46, tint: 0x9ec8e2, accent: '#45d9ff', helipad: false },
    { x: 0, z: 14, w: 32, d: 24, h: 52, tint: 0xc2d8e8, accent: '#ff6ba3', helipad: false },
  ];

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x2f3b4d, roughness: 0.35, metalness: 0.72 });

  for (const t of towers) {
    const grp = new THREE.Group();
    grp.position.set(t.x, 0.3, t.z);

    const glassMat = new THREE.MeshStandardMaterial({
      color: t.tint,
      map: textures.skyMap,
      emissive: 0xffffff,
      emissiveMap: textures.skyEmissive,
      emissiveIntensity: 0.95,
      roughness: 0.24,
      metalness: 0.68,
    });
    emissiveMaterials.push({ mat: glassMat, base: 0.95 });

    // Podium base
    const podium = new THREE.Mesh(new THREE.BoxGeometry(t.w + 3.5, 9, t.d + 3.5), steelMat);
    podium.position.y = 4.5;
    podium.castShadow = true;
    podium.receiveShadow = true;
    grp.add(podium);

    // Lower tower shaft
    const shaftH = t.h * 0.72;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(t.w, shaftH, t.d), glassMat);
    shaft.position.y = 9 + shaftH * 0.5;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    grp.add(shaft);

    // Architectural setback upper tier
    const upperH = t.h * 0.28;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(t.w * 0.74, upperH, t.d * 0.74), glassMat);
    upper.position.y = 9 + shaftH + upperH * 0.5;
    upper.castShadow = true;
    grp.add(upper);

    // Glowing architectural crown band
    const glowMat = new THREE.MeshStandardMaterial({
      color: t.accent,
      emissive: t.accent,
      emissiveIntensity: 2.5,
    });
    emissiveMaterials.push({ mat: glowMat, base: 2.5, alwaysBright: true });
    const band = new THREE.Mesh(new THREE.BoxGeometry(t.w * 0.76, 1.1, t.d * 0.76), glowMat);
    band.position.y = 9 + t.h - 0.6;
    grp.add(band);

    // Rooftop details: spire antenna or helipad
    if (t.helipad) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.6, 0.7, 20), steelMat);
      pad.position.y = 9 + t.h + 0.35;
      grp.add(pad);
      const ring = new THREE.Mesh(new THREE.RingGeometry(4.8, 5.6, 20), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 9 + t.h + 0.76;
      grp.add(ring);
    } else {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.95, 16, 8), steelMat);
      spire.position.y = 9 + t.h + 8;
      grp.add(spire);
    }

    scene.add(grp);
    cityWorld.addCollider(t.x, t.z, t.w + 3.5, t.d + 3.5, t.h + 9);
    cityWorld.buildingFootprints.push({ x: t.x, z: t.z, w: t.w + 3, d: t.d + 3, color: '#6fd3ff' });
  }

  // Central Solara Obelisk Fountain Park at (0, 0, -68)
  const parkGrp = new THREE.Group();
  parkGrp.position.set(0, 0.35, -68);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe6dac5, roughness: 0.72 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(11, 12, 1.2, 24), stoneMat);
  basin.position.y = 0.6;
  basin.receiveShadow = true;
  parkGrp.add(basin);
  const pool = new THREE.Mesh(
    new THREE.CylinderGeometry(9.8, 9.8, 0.9, 24),
    new THREE.MeshStandardMaterial({ color: 0x1bd1d8, roughness: 0.12, metalness: 0.25 })
  );
  pool.position.y = 0.85;
  parkGrp.add(pool);
  const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.2, 16, 4), stoneMat);
  obelisk.position.y = 8.5;
  obelisk.castShadow = true;
  parkGrp.add(obelisk);
  scene.add(parkGrp);
  cityWorld.addCollider(0, -68, 20, 20, 16, 'fountain');
}

function buildOldTownPlaza(scene, cityWorld, textures, emissiveMaterials, animatedProps) {
  const pc = WORLD_CONFIG.plazaCenter; // (-220, -20)
  const buildings = [
    { x: pc.x - 42, z: pc.z - 28, w: 22, d: 28, h: 16, tint: 0xe89b6b, roof: 0xa6462e },
    { x: pc.x - 42, z: pc.z + 24, w: 22, d: 30, h: 14, tint: 0xf0be7a, roof: 0xb24e32 },
    { x: pc.x + 42, z: pc.z - 26, w: 22, d: 30, h: 17, tint: 0xdf8262, roof: 0x993e28 },
    { x: pc.x + 42, z: pc.z + 26, w: 22, d: 26, h: 15, tint: 0xf2c88c, roof: 0xad4a30 },
    { x: pc.x - 16, z: pc.z - 46, w: 32, d: 18, h: 19, tint: 0xe6a172, roof: 0xa8432b },
    { x: pc.x + 20, z: pc.z - 46, w: 28, d: 18, h: 16, tint: 0xf4ce94, roof: 0xb55235 },
    { x: pc.x - 18, z: pc.z + 46, w: 28, d: 18, h: 14, tint: 0xe38f68, roof: 0x9e3f28 },
    { x: -210, z: -146, w: 42, d: 26, h: 18, tint: 0xe9a977, roof: 0xa8462c },
  ];

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf3e2c8, roughness: 0.78 });

  for (const b of buildings) {
    const grp = new THREE.Group();
    grp.position.set(b.x, 0.3, b.z);
    const mat = new THREE.MeshStandardMaterial({
      color: b.tint,
      map: textures.oldTownMap,
      emissive: 0xffffff,
      emissiveMap: textures.oldTownEmissive,
      emissiveIntensity: 0.75,
      roughness: 0.82,
    });
    emissiveMaterials.push({ mat, base: 0.75 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
    body.position.y = b.h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    grp.add(body);

    // Terracotta hip roof overhang
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.72, 4.6, 4),
      new THREE.MeshStandardMaterial({ color: b.roof, roughness: 0.85 })
    );
    roof.rotation.y = Math.PI * 0.25;
    roof.position.y = b.h + 2.3;
    roof.castShadow = true;
    grp.add(roof);

    // Arched colonnade pillars along street face
    for (let px = -b.w * 0.38; px <= b.w * 0.38; px += 6.2) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 5.2, 8), pillarMat);
      col.position.set(px, 2.6, b.d * 0.5 + 1.1);
      col.castShadow = true;
      grp.add(col);
    }

    scene.add(grp);
    cityWorld.addCollider(b.x, b.z, b.w + 1.4, b.d + 2.2, b.h);
    cityWorld.buildingFootprints.push({ x: b.x, z: b.z, w: b.w, d: b.d, color: '#f0a763' });
  }

  // Ornate Fiesta Plaza Mosaic Fountain at (-220, 0, -20)
  const fGrp = new THREE.Group();
  fGrp.position.set(pc.x, 0.36, pc.z);
  const mosaicMat = new THREE.MeshStandardMaterial({ color: 0x2a88a8, roughness: 0.35, metalness: 0.15 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 7.2, 1.1, 16), pillarMat);
  rim.position.y = 0.55;
  rim.castShadow = true;
  rim.receiveShadow = true;
  fGrp.add(rim);
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.85, 16), mosaicMat);
  basin.position.y = 0.72;
  fGrp.add(basin);
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.4, 2.6, 12), pillarMat);
  tier1.position.y = 2.0;
  tier1.castShadow = true;
  fGrp.add(tier1);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 1.6, 0.8, 14), mosaicMat);
  bowl.position.y = 3.4;
  fGrp.add(bowl);
  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 1.15, 2.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x9ef6ff, transparent: true, opacity: 0.76, roughness: 0.1 })
  );
  spout.position.y = 4.6;
  fGrp.add(spout);
  scene.add(fGrp);
  cityWorld.addCollider(pc.x, pc.z, 13, 13, 5, 'plaza-fountain');

  // Tactile Market Stalls & Cover Crates around Plaza de la Fiesta
  const stallSpecs = [
    { x: pc.x - 18, z: pc.z + 14, yaw: 0.4, color: 0xe64848 },
    { x: pc.x + 17, z: pc.z + 15, yaw: -0.35, color: 0x1bb5a8 },
    { x: pc.x - 19, z: pc.z - 15, yaw: -0.45, color: 0xf2a72b },
    { x: pc.x + 19, z: pc.z - 14, yaw: 0.3, color: 0xd9488b },
  ];
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4f2b, roughness: 0.85 });
  for (const st of stallSpecs) {
    const sg = new THREE.Group();
    sg.position.set(st.x, 0.36, st.z);
    sg.rotation.y = st.yaw;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.25, 2.1), woodMat);
    counter.position.y = 0.62;
    counter.castShadow = true;
    counter.receiveShadow = true;
    sg.add(counter);
    for (const sx of [-2.3, 2.3]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.3, 6), woodMat);
      post.position.set(sx, 1.65, -0.8);
      sg.add(post);
    }
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.22, 3.0),
      new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.75 })
    );
    canopy.position.set(0, 3.25, 0.1);
    canopy.rotation.x = 0.16;
    canopy.castShadow = true;
    sg.add(canopy);
    scene.add(sg);
    cityWorld.addCollider(st.x, st.z, 4.8, 2.4, 2.8, 'stall');
  }

  // Warm glowing overhead Fiesta Lantern Strings crisscrossing the plaza!
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: 0xffa834,
    emissiveIntensity: 2.6,
  });
  emissiveMaterials.push({ mat: lanternMat, base: 2.6, alwaysBright: true });
  const stringPairs = [
    [new THREE.Vector3(pc.x - 32, 9.5, pc.z - 22), new THREE.Vector3(pc.x + 32, 9.5, pc.z + 22)],
    [new THREE.Vector3(pc.x - 32, 9.5, pc.z + 22), new THREE.Vector3(pc.x + 32, 9.5, pc.z - 22)],
    [new THREE.Vector3(pc.x - 32, 9.5, pc.z), new THREE.Vector3(pc.x + 32, 9.5, pc.z)],
  ];
  for (const [pA, pB] of stringPairs) {
    const numBulbs = 9;
    for (let k = 1; k < numBulbs; k++) {
      const u = k / numBulbs;
      const pos = new THREE.Vector3().lerpVectors(pA, pB, u);
      pos.y -= Math.sin(u * Math.PI) * 1.65;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lanternMat);
      bulb.position.copy(pos);
      scene.add(bulb);
    }
  }
}

function buildHarborMarina(scene, cityWorld, textures, emissiveMaterials) {
  // 1) Twin Industrial Shipping Gantry Cranes in Puerto Caldera (x=208, z=-125 & z=-72)
  const craneRed = new THREE.MeshStandardMaterial({ color: 0xd93d32, roughness: 0.48, metalness: 0.45 });
  const craneWhite = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.5 });
  for (const cz of [-128, -74]) {
    const cg = new THREE.Group();
    cg.position.set(206, 0.3, cz);
    for (const dx of [-6, 6]) {
      for (const dz of [-4.5, 4.5]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 34, 1.4), craneRed);
        leg.position.set(dx, 17, dz);
        leg.castShadow = true;
        cg.add(leg);
      }
    }
    const boom = new THREE.Mesh(new THREE.BoxGeometry(46, 2.4, 3.2), craneRed);
    boom.position.set(10, 29, 0);
    boom.castShadow = true;
    cg.add(boom);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 4.2), craneWhite);
    cab.position.set(12, 26.2, 0);
    cg.add(cab);
    scene.add(cg);
    cityWorld.addCollider(206, cz, 14, 11, 34, 'crane');
  }

  // 2) Stacked Multi-Color Corrugated Shipping Containers
  const contColors = [0xc93b32, 0x266bb8, 0xe89b2d, 0x268a5c, 0x4b5c72];
  const contCoords = [
    [164, -142, 0, 2], [176, -142, 0, 1], [164, -124, 0, 3],
    [164, -92, 0, 2], [178, -92, 0, 1], [164, -56, 0, 2],
  ];
  for (let i = 0; i < contCoords.length; i++) {
    const [cx, cz, yaw, stack] = contCoords[i];
    for (let s = 0; s < stack; s++) {
      const cm = new THREE.MeshStandardMaterial({
        color: contColors[(i + s) % contColors.length],
        map: textures.containerMap,
        roughness: 0.65,
        metalness: 0.28,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.6, 11.2), cm);
      box.position.set(cx, 0.3 + 1.8 + s * 3.65, cz);
      box.rotation.y = yaw;
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
    }
    cityWorld.addCollider(cx, cz, 4.8, 11.6, stack * 3.8, 'container');
    cityWorld.buildingFootprints.push({ x: cx, z: cz, w: 5, d: 12, color: '#5bf59c' });
  }

  // 3) Camila's Modern Coastal Safehouse & Solara Customs Paint Garage at (154, 0, 16)
  const sg = new THREE.Group();
  sg.position.set(154, 0.3, 14);
  const stucco = new THREE.MeshStandardMaterial({ color: 0xf7f2e8, roughness: 0.58 });
  const warmWood = new THREE.MeshStandardMaterial({ color: 0x9c663b, roughness: 0.72 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x45c8e8, roughness: 0.12, metalness: 0.8 });

  const mainVilla = new THREE.Mesh(new THREE.BoxGeometry(22, 9.5, 16), stucco);
  mainVilla.position.set(0, 4.75, 0);
  mainVilla.castShadow = true;
  mainVilla.receiveShadow = true;
  sg.add(mainVilla);

  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(24.5, 1.1, 18.5), warmWood);
  upperDeck.position.set(0, 9.8, 0);
  upperDeck.castShadow = true;
  sg.add(upperDeck);

  const loft = new THREE.Mesh(new THREE.BoxGeometry(14, 5.2, 11), glass);
  loft.position.set(-2, 12.8, -1);
  loft.castShadow = true;
  sg.add(loft);

  const garageSignTex = createNeonSignTexture('SOLARA CUSTOMS', '#111829', '#00e6ff', 'SAFEHOUSE & TUNING');
  const garageSignMat = new THREE.MeshStandardMaterial({
    map: garageSignTex,
    emissiveMap: garageSignTex,
    emissive: 0xffffff,
    emissiveIntensity: 2.1,
  });
  emissiveMaterials.push({ mat: garageSignMat, base: 2.1, alwaysBright: true });
  const gSign = new THREE.Mesh(new THREE.BoxGeometry(12, 2.8, 0.5), garageSignMat);
  gSign.position.set(0, 7.6, 8.3);
  sg.add(gSign);

  scene.add(sg);
  cityWorld.addCollider(154, 14, 23, 17, 15, 'safehouse');
  cityWorld.buildingFootprints.push({ x: 154, z: 14, w: 22, d: 16, color: '#ffcf6e' });

  // 4) Wooden Marina Yacht Piers & Moored Luxury White Yachts + Sailboats
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x8f6b49, roughness: 0.82 });
  const hullWhite = new THREE.MeshStandardMaterial({ color: 0xf7f9fc, roughness: 0.25, metalness: 0.2 });
  const navyStripe = new THREE.MeshStandardMaterial({ color: 0x193658, roughness: 0.35 });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xfff8ed, roughness: 0.65, side: THREE.DoubleSide });

  for (const pz of [-10, 22, 54]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(44, 0.7, 5.2), pierMat);
    pier.position.set(228, 0.85, pz);
    pier.castShadow = true;
    pier.receiveShadow = true;
    scene.add(pier);

    // Moored yacht beside each pier
    const yg = new THREE.Group();
    yg.position.set(240, 0.45, pz + 7.4);
    yg.rotation.y = Math.PI * 0.5;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.6, 12.5), hullWhite);
    hull.castShadow = true;
    yg.add(hull);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.35, 11.8), navyStripe);
    stripe.position.y = 0.25;
    yg.add(stripe);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.5, 6.2), glass);
    cabin.position.set(0, 1.45, -1.0);
    yg.add(cabin);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.35, 6.8), hullWhite);
    roof.position.set(0, 2.3, -1.1);
    yg.add(roof);
    scene.add(yg);
  }

  // Graceful offshore sailboats in the bay for skyline/ocean depth
  const sailboats = [
    { x: -140, z: 220, yaw: 0.4 },
    { x: -15, z: 235, yaw: -0.6 },
    { x: 110, z: 205, yaw: 0.8 },
    { x: 285, z: 58, yaw: -0.3 },
    { x: 295, z: -38, yaw: 0.5 },
  ];
  for (const sb of sailboats) {
    const sg2 = new THREE.Group();
    sg2.position.set(sb.x, 0.35, sb.z);
    sg2.rotation.y = sb.yaw;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 7.8), hullWhite);
    sg2.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 11.5, 6), navyStripe);
    mast.position.y = 5.8;
    sg2.add(mast);
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.6, 0, 0, 10.8, 0, 0, 2.0, -4.4], 3));
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sg2.add(sail);
    scene.add(sg2);
  }
}

function buildMonteFaroIsland(scene, cityWorld, textures, emissiveMaterials, animatedProps) {
  const lh = WORLD_CONFIG.lighthousePos;
  const baseY = cityWorld.getTerrainHeight(lh.x, lh.z);

  const lg = new THREE.Group();
  lg.position.set(lh.x, baseY - 0.5, lh.z);

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf9f7f2, roughness: 0.55 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xd9383a, roughness: 0.55 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xfff4c4,
    emissive: 0xffd166,
    emissiveIntensity: 3.4,
  });
  emissiveMaterials.push({ mat: lanternMat, base: 3.4, alwaysBright: true });

  // Striped tapered lighthouse tower
  const segH = 5.4;
  for (let i = 0; i < 6; i++) {
    const rBot = 4.2 - i * 0.34;
    const rTop = 4.2 - (i + 1) * 0.34;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segH, 16), i % 2 === 0 ? whiteMat : redMat);
    cyl.position.y = i * segH + segH * 0.5;
    cyl.castShadow = true;
    lg.add(cyl);
  }
  const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 3.4, 14), lanternMat);
  lanternRoom.position.y = 6 * segH + 1.7;
  lg.add(lanternRoom);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.2, 14), redMat);
  cap.position.y = 6 * segH + 4.9;
  lg.add(cap);

  // Soft Fresnel-faded rotating atmospheric lighthouse beam (never a hard cone!)
  const beamGeo = new THREE.CylinderGeometry(1.4, 13.5, 95, 20, 1, true);
  beamGeo.translate(0, -47.5, 0);
  beamGeo.rotateX(Math.PI * 0.5);
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(0xffe094) } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.9);
        float lenFade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        gl_FragColor = vec4(uColor, edge * lenFade * 0.22);
      }
    `,
  });
  const beamPivot = new THREE.Group();
  beamPivot.position.y = 6 * segH + 1.7;
  beamPivot.rotation.y = 1.1;
  beamPivot.add(new THREE.Mesh(beamGeo, beamMat));
  lg.add(beamPivot);
  animatedProps.push({ type: 'rotateY', obj: beamPivot, speed: 0.45 });

  scene.add(lg);
  cityWorld.addCollider(lh.x, lh.z, 9, 9, 36, 'lighthouse');

  // Cliffside Luxury Villa overlooking the bay
  const vx = 382;
  const vz = 166;
  const vy = cityWorld.getTerrainHeight(vx, vz);
  const villa = new THREE.Mesh(new THREE.BoxGeometry(20, 7.5, 14), whiteMat);
  villa.position.set(vx, vy + 3.2, vz);
  villa.castShadow = true;
  villa.receiveShadow = true;
  scene.add(villa);
  const infPool = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x1ee6df, emissive: 0x0ea4b0, emissiveIntensity: 0.6, roughness: 0.1 })
  );
  infPool.position.set(vx - 11, vy + 0.6, vz - 3);
  scene.add(infPool);
  cityWorld.addCollider(vx, vz, 21, 15, 10, 'villa');
}

function buildPalmGrovesAndBeach(scene, cityWorld, animatedProps) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7b5a3c, roughness: 0.9 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x2c8c4a, roughness: 0.68, side: THREE.DoubleSide });
  const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x273242, roughness: 0.45, metalness: 0.65 });
  const lampGlowMat = new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffb85c, emissiveIntensity: 2.2 });

  const addPalm = (x, z, scale = 1.0, lean = 0.18, dir = 0) => {
    const y = cityWorld.getTerrainHeight(x, z);
    if (y < 0.08) return;
    const grp = new THREE.Group();
    grp.position.set(x, y, z);

    // Gracefully curved 4-segment trunk
    let curY = 0;
    let curX = 0;
    const h = 10.5 * scale;
    for (let s = 0; s < 4; s++) {
      const segH = h * 0.26;
      const r0 = (0.34 - s * 0.05) * scale;
      const r1 = (0.29 - s * 0.05) * scale;
      const tilt = lean * (s + 0.6) * 0.55;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segH, 6), trunkMat);
      seg.position.set(curX + Math.sin(tilt) * segH * 0.5, curY + segH * 0.48, 0);
      seg.rotation.z = -tilt;
      seg.castShadow = true;
      grp.add(seg);
      curX += Math.sin(tilt) * segH * 0.92;
      curY += Math.cos(tilt) * segH * 0.95;
    }
    grp.rotation.y = dir;

    // Crown of 7 arched palm fronds
    const crown = new THREE.Group();
    crown.position.set(curX, curY, 0);
    for (let f = 0; f < 7; f++) {
      const a = (f / 7) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.95 * scale, 4.4 * scale, 4), frondMat);
      frond.scale.set(1, 1, 0.22);
      frond.position.set(Math.cos(a) * 1.9 * scale, -0.3 * scale, Math.sin(a) * 1.9 * scale);
      frond.rotation.order = 'YXZ';
      frond.rotation.y = -a + Math.PI * 0.5;
      frond.rotation.x = 1.18;
      frond.castShadow = true;
      crown.add(frond);
    }
    grp.add(crown);
    scene.add(grp);
    animatedProps.push({ type: 'sway', obj: crown, phase: x * 0.13 + z * 0.09 });
  };

  // Palm-lined curved Avenida del Sol boardwalk + streetlamps + beach umbrellas
  const umbColors = [0xff5277, 0x00c9d8, 0xffbe3b, 0xffffff, 0xff7b3d];
  for (let x = -275; x <= 115; x += 22) {
    const bz = boulevardZAtX(x);
    addPalm(x, bz + 12.2, 0.95 + ((Math.abs(x) * 7) % 10) * 0.03, 0.22, (x * 0.3) % 6.28);
    if (x % 44 === 0) addPalm(x + 9, bz - 12.2, 0.88, 0.14, 1.4);

    // Boulevard streetlamp
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 7.6, 6), lampPoleMat);
    pole.position.set(x + 11, 4.1, bz + 10.6);
    pole.castShadow = true;
    scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), lampGlowMat);
    bulb.position.set(x + 11, 7.9, bz + 9.8);
    scene.add(bulb);

    // Beach umbrella & towel on golden crescent sand
    const cz = coastZAtX(x);
    const uz = cz - 9;
    const uy = cityWorld.getTerrainHeight(x + 5, uz);
    if (uy > 0.12) {
      const upole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), trunkMat);
      upole.position.set(x + 5, uy + 1.3, uz);
      scene.add(upole);
      const uTop = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 0.85, 8),
        new THREE.MeshStandardMaterial({ color: umbColors[Math.abs(Math.floor(x / 22)) % umbColors.length], roughness: 0.75 })
      );
      uTop.position.set(x + 5, uy + 2.5, uz);
      uTop.castShadow = true;
      scene.add(uTop);
    }
  }

  // Palms around Marina Promenade, Financial Park & Monte Faro (keep Marina vista clean!)
  const extraPalms = [
    [140, 12], [186, 6], [190, 52], [136, 38], [198, 44],
    [-22, -55], [22, -55], [-22, -82], [22, -82],
    [-242, -36], [-198, -36], [-242, -2], [-198, -2],
    [372, 134], [412, 144], [394, 166], [420, 162],
  ];
  for (let i = 0; i < extraPalms.length; i++) {
    addPalm(extraPalms[i][0], extraPalms[i][1], 0.92 + (i % 3) * 0.12, 0.16, i * 1.1);
  }
}

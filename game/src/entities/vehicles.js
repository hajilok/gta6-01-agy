// Cala Solara — Sculpted 9-Class Vehicle Builder, Suspension/Drift Physics & Destructible Vehicle System

import * as THREE from 'three';
import { VEHICLE_CATALOG } from '../config.js';

function makePlateTexture(text = 'SOL-604') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 48;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f2e4';
  g.fillRect(0, 0, 128, 48);
  g.fillStyle = '#ff6b4a';
  g.fillRect(0, 0, 128, 11);
  g.fillStyle = '#182438';
  g.font = '900 24px monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 64, 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildWheelMesh(radius, width) {
  const grp = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x15181e, roughness: 0.85, metalness: 0.08 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8e0eb, roughness: 0.22, metalness: 0.88 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xe63242, roughness: 0.35, metalness: 0.45 });

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), tireMat);
  tire.rotation.z = Math.PI * 0.5;
  tire.castShadow = true;
  grp.add(tire);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, width + 0.03, 12), rimMat);
  rim.rotation.z = Math.PI * 0.5;
  grp.add(rim);

  // 5-spoke metallic star detail
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, radius * 1.15, radius * 0.14), rimMat);
    spoke.rotation.x = (i / 5) * Math.PI;
    grp.add(spoke);
  }
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, radius * 0.42, radius * 0.32), caliperMat);
  caliper.position.set(0, radius * 0.12, -radius * 0.25);
  grp.add(caliper);
  return grp;
}

export function buildSculptedVehicleMesh(type, paintHex) {
  const spec = VEHICLE_CATALOG[type] || VEHICLE_CATALOG.supercar;
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const colorHex = paintHex !== undefined ? paintHex : spec.colors[0];
  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: type === 'swat' ? 0.65 : 0.19,
    metalness: type === 'swat' ? 0.38 : 0.72,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x151a22, roughness: 0.62, metalness: 0.42 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x101c2a, roughness: 0.08, metalness: 0.92, transparent: true, opacity: 0.84 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdce5f0, roughness: 0.18, metalness: 0.94 });
  const headLightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d4, emissiveIntensity: 3.4 });
  const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xff2238, emissive: 0xff1e38, emissiveIntensity: 3.2 });
  const nitroMat = new THREE.MeshBasicMaterial({ color: 0x38d8ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });

  const wheels = [];
  const sirenMaterials = [];
  let sirenLightRed = null;
  let sirenLightBlue = null;
  const nitroCones = [];
  const w = spec.width;
  const h = spec.height;
  const l = spec.length;

  if (type === 'boat') {
    // Sleek sculpted coastal speedboat
    const hull = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, l * 0.78), paintMat);
    hull.position.set(0, 0.55, -0.35);
    hull.castShadow = true;
    bodyPivot.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(w * 0.64, l * 0.38, 4), paintMat);
    bow.rotation.x = Math.PI * 0.5;
    bow.rotation.y = Math.PI * 0.25;
    bow.scale.set(1, 1, 0.45);
    bow.position.set(0, 0.62, l * 0.48);
    bodyPivot.add(bow);
    const deckStripe = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, 0.14, l * 0.68), chromeMat);
    deckStripe.position.set(0, 1.02, -0.3);
    bodyPivot.add(deckStripe);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.62, 1.15), glassMat);
    windshield.position.set(0, 1.32, 0.55);
    windshield.rotation.x = -0.48;
    bodyPivot.add(windshield);
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.75), trimMat);
    engine.position.set(0, 0.78, -l * 0.46);
    bodyPivot.add(engine);
    return { root, bodyPivot, paintMat, tailLightMat, wheels, sirenMaterials, sirenLightRed, sirenLightBlue, nitroCones };
  }

  if (type === 'moto') {
    // Sleek Sport Motorcycle (Veloce 900R)
    const fw = buildWheelMesh(0.36, 0.2);
    fw.position.set(0, 0.36, 0.84);
    const rw = buildWheelMesh(0.38, 0.26);
    rw.position.set(0, 0.38, -0.82);
    root.add(fw, rw);
    wheels.push(fw, rw);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 1.55), paintMat);
    chassis.position.set(0, 0.74, 0.02);
    chassis.castShadow = true;
    bodyPivot.add(chassis);
    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.75), paintMat);
    fairing.position.set(0, 0.96, 0.64);
    fairing.rotation.x = 0.35;
    bodyPivot.add(fairing);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.45), glassMat);
    visor.position.set(0, 1.18, 0.68);
    visor.rotation.x = -0.55;
    bodyPivot.add(visor);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.72), trimMat);
    seat.position.set(0, 0.96, -0.35);
    bodyPivot.add(seat);
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.1), headLightMat);
    hl.position.set(0, 0.92, 1.05);
    bodyPivot.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.08), tailLightMat);
    tl.position.set(0, 0.98, -0.92);
    bodyPivot.add(tl);
    return { root, bodyPivot, paintMat, tailLightMat, wheels, sirenMaterials, sirenLightRed, sirenLightBlue, nitroCones };
  }

  // 4-Wheeled Sculpted Automotive Chassis (Supercar, Muscle, Convertible, SUV, Van, Police, SWAT)
  const wheelR = type === 'swat' ? 0.52 : (type === 'suv' || type === 'van' ? 0.44 : 0.39);
  const wheelW = type === 'supercar' || type === 'muscle' ? 0.34 : 0.3;
  const axleZ = l * 0.31;
  const trackX = w * 0.46;

  // Lower sculpted body & dark undertray + recessed dark wheel wells
  const chassisH = type === 'swat' ? 1.15 : (type === 'van' ? 1.0 : (type === 'suv' ? 0.78 : 0.56));
  const chassisY = wheelR + chassisH * 0.44;
  const undertray = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.24, l * 0.96), trimMat);
  undertray.position.set(0, wheelR * 0.82, 0);
  bodyPivot.add(undertray);

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(w, chassisH, l * 0.94), paintMat);
  mainBody.position.set(0, chassisY, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  bodyPivot.add(mainBody);

  // Sloped sculpted front nose/hood & front carbon splitter
  const noseH = chassisH * 0.74;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, noseH, l * 0.3), paintMat);
  nose.position.set(0, chassisY - 0.06, l * 0.36);
  nose.rotation.x = type === 'supercar' ? 0.14 : 0.06;
  nose.castShadow = true;
  bodyPivot.add(nose);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.12, 0.42), trimMat);
  splitter.position.set(0, wheelR * 0.72, l * 0.48);
  bodyPivot.add(splitter);

  // Side skirts & dark recessed wheel arches
  for (const sx of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, l * 0.5), trimMat);
    skirt.position.set(sx * (w * 0.49), wheelR * 0.78, 0);
    bodyPivot.add(skirt);
    for (const sz of [axleZ, -axleZ]) {
      const well = new THREE.Mesh(new THREE.CylinderGeometry(wheelR + 0.09, wheelR + 0.09, 0.36, 12), trimMat);
      well.rotation.z = Math.PI * 0.5;
      well.position.set(sx * (trackX - 0.06), wheelR + 0.04, sz);
      bodyPivot.add(well);
    }
  }

  // Cabin / Greenhouse + Interior Driver Silhouette
  if (type === 'convertible') {
    // Open-top coastal convertible with raked windshield, leather seats & seated driver silhouette
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.52, 0.12), glassMat);
    windshield.position.set(0, chassisY + chassisH * 0.5 + 0.18, l * 0.12);
    windshield.rotation.x = -0.62;
    bodyPivot.add(windshield);
    const tub = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.28, l * 0.38), trimMat);
    tub.position.set(0, chassisY + chassisH * 0.36, -0.2);
    bodyPivot.add(tub);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x8f342c, roughness: 0.7 });
    for (const sx of [-0.42, 0.42]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.62, 0.48), seatMat);
      seat.position.set(sx, chassisY + chassisH * 0.55, -0.45);
      bodyPivot.add(seat);
    }
  } else {
    const cabW = type === 'swat' ? w * 0.94 : (type === 'van' ? w * 0.94 : w * 0.84);
    const cabH = type === 'swat' ? 0.95 : (type === 'van' ? 1.02 : (type === 'suv' ? 0.74 : 0.52));
    const cabL = type === 'van' ? l * 0.72 : (type === 'swat' ? l * 0.74 : (type === 'suv' ? l * 0.58 : l * 0.46));
    const cabZ = type === 'van' ? -0.35 : (type === 'suv' ? -0.32 : -0.22);
    const cabY = chassisY + chassisH * 0.5 + cabH * 0.44;

    const glassBox = new THREE.Mesh(new THREE.BoxGeometry(cabW, cabH, cabL), glassMat);
    glassBox.position.set(0, cabY, cabZ);
    glassBox.castShadow = true;
    bodyPivot.add(glassBox);

    // Sculpted roof panel (white roof on CSPD Interceptor!)
    const roofMat = type === 'police'
      ? new THREE.MeshStandardMaterial({ color: 0xf4f7fc, roughness: 0.25, metalness: 0.3 })
      : paintMat;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.94, 0.12, cabL * 0.86), roofMat);
    roof.position.set(0, cabY + cabH * 0.5, cabZ);
    bodyPivot.add(roof);

    // Driver headrest/silhouette visible inside tinted cabin
    const driverSil = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), trimMat);
    driverSil.position.set(-0.38, cabY + 0.05, cabZ + 0.15);
    bodyPivot.add(driverSil);
  }

  // Class-Specific Hero Silhouettes
  if (type === 'supercar') {
    // Sleek sculpted rear GT wing + rear diffuser + quad chrome exhausts
    const wing = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.08, 0.38), trimMat);
    wing.position.set(0, chassisY + chassisH * 0.5 + 0.28, -l * 0.44);
    wing.castShadow = true;
    bodyPivot.add(wing);
    for (const sx of [-0.58, 0.58]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.22), trimMat);
      strut.position.set(sx, chassisY + chassisH * 0.5 + 0.12, -l * 0.44);
      bodyPivot.add(strut);
    }
  } else if (type === 'muscle') {
    // Twin racing stripes + hood intake scoop
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.35 });
    for (const sx of [-0.22, 0.22]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, l * 0.95), stripeMat);
      st.position.set(sx, chassisY + chassisH * 0.5 + 0.01, 0);
      bodyPivot.add(st);
    }
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.85), trimMat);
    scoop.position.set(0, chassisY + chassisH * 0.5 + 0.08, l * 0.24);
    bodyPivot.add(scoop);
  } else if (type === 'police') {
    // Crisp white CSPD doors, heavy steel push-bumper & glowing red/blue LED roof lightbar!
    const doorWhite = new THREE.MeshStandardMaterial({ color: 0xf4f7fc, roughness: 0.24, metalness: 0.35 });
    const doors = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, chassisH * 0.92, l * 0.42), doorWhite);
    doors.position.set(0, chassisY, -0.1);
    bodyPivot.add(doors);

    const pushBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.66, 0.46, 0.32), trimMat);
    pushBar.position.set(0, chassisY - 0.04, l * 0.52);
    bodyPivot.add(pushBar);

    const barY = chassisY + chassisH * 0.5 + 0.62;
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff2238, emissive: 0xff1128, emissiveIntensity: 4.5 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1e88ff, emissive: 0x1678ff, emissiveIntensity: 4.5 });
    sirenMaterials.push(redMat, blueMat);

    const redBar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.28), redMat);
    redBar.position.set(-0.36, barY, -0.18);
    const blueBar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.28), blueMat);
    blueBar.position.set(0.36, barY, -0.18);
    bodyPivot.add(redBar, blueBar);

    // Dynamic red/blue siren point lights illuminating nearby asphalt & cars!
    sirenLightRed = new THREE.PointLight(0xff2238, 0, 20);
    sirenLightRed.position.set(-0.6, barY + 0.5, -0.18);
    sirenLightBlue = new THREE.PointLight(0x1e88ff, 0, 20);
    sirenLightBlue.position.set(0.6, barY + 0.5, -0.18);
    bodyPivot.add(sirenLightRed, sirenLightBlue);
  } else if (type === 'swat') {
    // Heavy BearCat armor bumper, roof turret cupola & flashing blue tactical strobes
    const ram = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.65, 0.55), trimMat);
    ram.position.set(0, chassisY - 0.12, l * 0.52);
    bodyPivot.add(ram);
    const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.42, 10), trimMat);
    cupola.position.set(0, chassisY + chassisH * 0.5 + 1.05, -0.4);
    bodyPivot.add(cupola);

    const blueMat = new THREE.MeshStandardMaterial({ color: 0x2694ff, emissive: 0x1a82ff, emissiveIntensity: 4.5 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff2b45, emissive: 0xff2238, emissiveIntensity: 4.5 });
    sirenMaterials.push(redMat, blueMat);
    const strobeL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.25), blueMat);
    strobeL.position.set(-0.7, chassisY + chassisH * 0.5 + 0.96, 1.35);
    const strobeR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.25), redMat);
    strobeR.position.set(0.7, chassisY + chassisH * 0.5 + 0.96, 1.35);
    bodyPivot.add(strobeL, strobeR);

    sirenLightBlue = new THREE.PointLight(0x2694ff, 0, 22);
    sirenLightBlue.position.set(0, chassisY + chassisH * 0.5 + 1.4, 1.35);
    bodyPivot.add(sirenLightBlue);
  }

  // Front LED Headlights & Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(w * 0.54, chassisH * 0.36, 0.14), trimMat);
  grille.position.set(0, chassisY - 0.06, l * 0.48);
  bodyPivot.add(grille);
  for (const sx of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.14), headLightMat);
    hl.position.set(sx * (w * 0.34), chassisY + 0.05, l * 0.48);
    bodyPivot.add(hl);
    // Side mirror
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.16), paintMat);
    mirror.position.set(sx * (w * 0.52), chassisY + chassisH * 0.45, l * 0.1);
    bodyPivot.add(mirror);
  }

  // Full-width sculpted rear LED taillight bar + diffuser + exhaust tips + license plate
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.15, 0.12), tailLightMat);
  tailBar.position.set(0, chassisY + 0.12, -l * 0.475);
  bodyPivot.add(tailBar);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.24, 0.18), trimMat);
  diffuser.position.set(0, wheelR * 0.88, -l * 0.47);
  bodyPivot.add(diffuser);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.22),
    new THREE.MeshBasicMaterial({ map: makePlateTexture(type === 'police' ? 'CSPD-09' : 'SOL-604') })
  );
  plate.rotation.y = Math.PI;
  plate.position.set(0, chassisY - 0.08, -l * 0.482);
  bodyPivot.add(plate);

  // Twin exhaust pipes & sleek layered translucent nitro jets (no clunky solid cyan cones!)
  const nitroOuterMat = new THREE.MeshBasicMaterial({
    color: 0x26b4ff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const nitroCoreMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c2,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const sx of [-0.46, 0.46]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.28, 8), chromeMat);
    pipe.rotation.x = Math.PI * 0.5;
    pipe.position.set(sx, wheelR * 0.86, -l * 0.5);
    bodyPivot.add(pipe);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.72, 8), nitroOuterMat);
    flame.rotation.x = -Math.PI * 0.5;
    flame.position.set(sx, wheelR * 0.86, -l * 0.5 - 0.36);
    bodyPivot.add(flame);
    nitroCones.push(flame);

    const core = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.42, 8), nitroCoreMat);
    core.rotation.x = -Math.PI * 0.5;
    core.position.set(sx, wheelR * 0.86, -l * 0.5 - 0.22);
    bodyPivot.add(core);
    nitroCones.push(core);
  }

  // 4 Multi-Spoke Wheels
  const wheelCoords = [
    [-trackX, wheelR, axleZ],
    [trackX, wheelR, axleZ],
    [-trackX, wheelR, -axleZ],
    [trackX, wheelR, -axleZ],
  ];
  for (const [wx, wy, wz] of wheelCoords) {
    const wh = buildWheelMesh(wheelR, wheelW);
    wh.position.set(wx, wy, wz);
    root.add(wh);
    wheels.push(wh);
  }

  return { root, bodyPivot, paintMat, tailLightMat, wheels, sirenMaterials, sirenLightRed, sirenLightBlue, nitroCones };
}

export class VehicleSystem {
  constructor(scene, cityWorld, atmosphere, audio) {
    this.scene = scene;
    this.cityWorld = cityWorld;
    this.atmosphere = atmosphere;
    this.audio = audio;
    this.vehicles = [];
    this.nextId = 1;
  }

  spawnVehicle(type, x, z, yaw = 0, opts = {}) {
    const spec = VEHICLE_CATALOG[type] || VEHICLE_CATALOG.supercar;
    const paint = opts.color !== undefined ? opts.color : spec.colors[this.nextId % spec.colors.length];
    const parts = buildSculptedVehicleMesh(type, paint);
    const y = type === 'boat' ? 0.25 : this.cityWorld.getTerrainHeight(x, z);

    parts.root.position.set(x, y, z);
    parts.root.rotation.y = yaw;
    this.scene.add(parts.root);

    const v = {
      id: this.nextId++,
      type,
      spec,
      ...parts,
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(0, 0, 0),
      yaw,
      speed: 0,
      steerAngle: 0,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      nitro: 100,
      drifting: false,
      sirenOn: !!opts.sirenOn,
      role: opts.role || 'civilian', // 'player', 'civilian', 'police', 'swat', 'racer', 'mission'
      tactic: opts.tactic || 'PATROL',
      tiresPopped: false,
      destroyed: false,
      smokeTimer: 0,
      skidTimer: 0,
      sirenPhase: Math.random() * 6.28,
      airborne: false,
      airTime: 0,
      colorHex: paint,
      turboLevel: 1,
      armorLevel: 1,
    };
    this.vehicles.push(v);
    return v;
  }

  setPaint(v, hex) {
    v.colorHex = hex;
    v.paintMat.color.setHex(hex);
  }

  repairVehicle(v) {
    v.hp = v.maxHp * (1 + (v.armorLevel - 1) * 0.35);
    v.tiresPopped = false;
    v.destroyed = false;
    v.nitro = 100;
  }

  damageVehicle(v, amount, attackerIsPlayer = false) {
    if (!v || v.destroyed) return false;
    v.hp -= amount;
    this.atmosphere.spawnImpactSparks(
      v.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, 1.1, (Math.random() - 0.5) * 1.8)),
      5,
      0xffcc66
    );
    if (v.hp <= 0) {
      v.hp = 0;
      v.destroyed = true;
      v.sirenOn = false;
      v.paintMat.color.setHex(0x1f1d1d);
      v.paintMat.roughness = 0.95;
      v.paintMat.metalness = 0.1;
      if (v.sirenLightRed) v.sirenLightRed.intensity = 0;
      if (v.sirenLightBlue) v.sirenLightBlue.intensity = 0;
      this.atmosphere.spawnExplosion(v.pos, v.type === 'swat' ? 1.45 : 1.15);
      if (this.audio) this.audio.playExplosion();
      return true;
    }
    return false;
  }

  updateDrivingPhysics(v, ctrl, dt) {
    if (v.destroyed) {
      v.vel.multiplyScalar(Math.max(0, 1 - dt * 3.5));
      v.pos.addScaledVector(v.vel, dt);
      v.root.position.copy(v.pos);
      v.smokeTimer -= dt;
      if (v.smokeTimer <= 0) {
        v.smokeTimer = 0.22;
        this.atmosphere.spawnSprite(
          v.pos.clone().add(new THREE.Vector3(0, 1.3, 0)),
          new THREE.Vector3((Math.random() - 0.5) * 1.2, 2.8, (Math.random() - 0.5) * 1.2),
          { color: 0x222228, size: 1.6, grow: 3.4, life: 1.2, opacity: 0.62 }
        );
      }
      return;
    }

    const sp = v.spec;
    const isBoat = v.type === 'boat';
    const fwd = new THREE.Vector3(Math.sin(v.yaw), 0, Math.cos(v.yaw));
    const right = new THREE.Vector3(Math.cos(v.yaw), 0, -Math.sin(v.yaw));

    let fwdSpeed = v.vel.dot(fwd);
    let latSpeed = v.vel.dot(right);

    const throttle = ctrl.throttle || 0;
    const steer = ctrl.steer || 0;
    const handbrake = !!ctrl.handbrake;
    const useNitro = !!ctrl.nitro && v.nitro > 4 && throttle > 0.1;

    const topMult = (1 + (v.turboLevel - 1) * 0.14) * (useNitro ? 1.34 : 1.0) * (v.tiresPopped ? 0.58 : 1.0);
    const maxSpd = sp.maxSpeed * topMult;

    if (throttle > 0) {
      fwdSpeed += throttle * sp.accel * (useNitro ? 1.65 : 1.0) * dt;
    } else if (throttle < 0) {
      if (fwdSpeed > 1.5) fwdSpeed += throttle * sp.brake * dt;
      else fwdSpeed += throttle * sp.accel * 0.58 * dt;
    } else {
      fwdSpeed *= Math.max(0, 1 - dt * (isBoat ? 0.9 : 1.25));
    }

    if (handbrake && !isBoat) {
      fwdSpeed *= Math.max(0, 1 - dt * 1.9);
    }

    fwdSpeed = Math.max(-sp.reverseSpeed, Math.min(maxSpd, fwdSpeed));

    // Steering response
    const speedFactor = Math.min(1, Math.abs(fwdSpeed) / 7.5);
    const reverseSign = fwdSpeed >= -0.2 ? 1 : -1;
    const wobble = v.tiresPopped ? Math.sin(performance.now() * 0.018) * 0.35 : 0;
    const targetYawRate = (steer + wobble) * sp.steerRate * speedFactor * (handbrake ? 1.42 : 1.0) * reverseSign;
    v.yaw += targetYawRate * dt;

    // Lateral grip vs sporty controlled drift
    const grip = handbrake ? sp.driftGrip : (v.tiresPopped ? sp.driftGrip * 0.85 : sp.grip);
    latSpeed *= Math.max(0, 1 - grip * dt);
    v.drifting = !isBoat && (handbrake || Math.abs(latSpeed) > 5.5) && Math.abs(fwdSpeed) > 10;

    // Recompute horizontal velocity
    const newFwd = new THREE.Vector3(Math.sin(v.yaw), 0, Math.cos(v.yaw));
    const newRight = new THREE.Vector3(Math.cos(v.yaw), 0, -Math.sin(v.yaw));
    const prevY = v.vel.y;
    v.vel.copy(newFwd).multiplyScalar(fwdSpeed).addScaledVector(newRight, latSpeed);
    v.vel.y = prevY;
    v.speed = Math.hypot(v.vel.x, v.vel.z);

    // Nitro consumption / recharge & exhaust glow
    if (useNitro) {
      v.nitro = Math.max(0, v.nitro - 28 * dt);
      for (const cone of v.nitroCones) {
        cone.material.opacity = 0.85;
        cone.scale.set(1, 0.85 + Math.random() * 0.5, 1);
      }
    } else {
      v.nitro = Math.min(100, v.nitro + (v.drifting ? 18 : 6.5) * dt);
      for (const cone of v.nitroCones) cone.material.opacity = 0;
    }

    // Brake light glow boost
    if (v.tailLightMat) {
      v.tailLightMat.emissiveIntensity = (throttle < -0.1 || handbrake) ? 5.2 : 2.6;
    }

    // Integrate position & handle terrain / bridge / water boundaries
    const nextX = v.pos.x + v.vel.x * dt;
    const nextZ = v.pos.z + v.vel.z * dt;

    if (isBoat) {
      if (this.cityWorld.isWater(nextX, nextZ)) {
        v.pos.x = nextX;
        v.pos.z = nextZ;
      } else {
        v.vel.multiplyScalar(-0.25);
      }
      v.pos.y = 0.25 + Math.sin(performance.now() * 0.004 + v.id) * 0.14;
    } else {
      const bounds = { minX: -375, maxX: 485, minZ: -250, maxZ: 245 };
      const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, nextX));
      const clampedZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, nextZ));

      // Prevent driving deep into open ocean (keep shallow beach accessible)
      const groundY = this.cityWorld.getTerrainHeight(clampedX, clampedZ);
      if (groundY < -0.45) {
        v.vel.multiplyScalar(-0.35);
      } else {
        v.pos.x = clampedX;
        v.pos.z = clampedZ;
      }

      // Vertical gravity & ramp airtime
      const targetY = Math.max(0.12, this.cityWorld.getTerrainHeight(v.pos.x, v.pos.z));
      if (v.pos.y > targetY + 0.28) {
        v.vel.y -= 24 * dt;
        v.pos.y += v.vel.y * dt;
        v.airborne = true;
        v.airTime += dt;
        if (v.pos.y <= targetY) {
          v.pos.y = targetY;
          v.vel.y = 0;
          v.airborne = false;
        }
      } else {
        const slopeLaunch = (targetY - v.pos.y) / Math.max(dt, 0.016);
        v.pos.y = targetY;
        v.vel.y = Math.max(0, Math.min(13.5, slopeLaunch * 0.65));
        v.airborne = false;
        v.airTime = 0;
      }

      // Building AABB collision resolution
      const halfR = Math.max(sp.width, sp.length) * 0.36;
      for (const c of this.cityWorld.colliders) {
        if (v.pos.y > c.maxY) continue;
        if (v.pos.x + halfR > c.minX && v.pos.x - halfR < c.maxX && v.pos.z + halfR > c.minZ && v.pos.z - halfR < c.maxZ) {
          const penL = Math.abs((v.pos.x + halfR) - c.minX);
          const penR = Math.abs(c.maxX - (v.pos.x - halfR));
          const penT = Math.abs((v.pos.z + halfR) - c.minZ);
          const penB = Math.abs(c.maxZ - (v.pos.z - halfR));
          const minP = Math.min(penL, penR, penT, penB);
          if (minP === penL) v.pos.x = c.minX - halfR;
          else if (minP === penR) v.pos.x = c.maxX + halfR;
          else if (minP === penT) v.pos.z = c.minZ - halfR;
          else v.pos.z = c.maxZ + halfR;
          if (v.speed > 14) {
            this.damageVehicle(v, (v.speed - 12) * 0.45);
          }
          v.vel.multiplyScalar(-0.28);
        }
      }
    }

    // Visual chassis suspension roll/pitch & wheel spin
    v.root.position.copy(v.pos);
    v.root.rotation.y = v.yaw;

    const targetRoll = v.type === 'moto'
      ? -steer * 0.36 * speedFactor
      : THREE.MathUtils.clamp(-latSpeed * 0.015 - steer * 0.045 * speedFactor, -0.14, 0.14);
    const targetPitch = THREE.MathUtils.clamp((throttle < 0 ? 0.055 : -throttle * 0.035) * (useNitro ? 1.5 : 1), -0.09, 0.09);
    v.bodyPivot.rotation.z = THREE.MathUtils.lerp(v.bodyPivot.rotation.z, targetRoll, Math.min(1, dt * 10));
    v.bodyPivot.rotation.x = THREE.MathUtils.lerp(v.bodyPivot.rotation.x, targetPitch, Math.min(1, dt * 10));

    // Wheel spin & front steering turn
    v.steerAngle = THREE.MathUtils.lerp(v.steerAngle, steer * 0.42, Math.min(1, dt * 12));
    for (let i = 0; i < v.wheels.length; i++) {
      const wh = v.wheels[i];
      if ((v.wheels.length === 4 && i < 2) || (v.wheels.length === 2 && i === 0)) {
        wh.rotation.y = v.steerAngle;
      }
      wh.children[0].rotation.x += fwdSpeed * dt * 2.2;
    }

    // Drift tire smoke & twin rubber skidmarks
    if (v.drifting && !v.airborne) {
      v.skidTimer -= dt;
      if (v.skidTimer <= 0) {
        v.skidTimer = 0.055;
        const rearZ = -sp.length * 0.32;
        for (const sx of [-sp.width * 0.38, sp.width * 0.38]) {
          const wp = new THREE.Vector3(sx, 0.06, rearZ).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw).add(v.pos);
          this.atmosphere.spawnTireSmoke(wp, v.vel);
          this.atmosphere.spawnSkidMark(wp, v.yaw);
        }
      }
    }

    // Boat foam wake
    if (isBoat && v.speed > 5) {
      v.smokeTimer -= dt;
      if (v.smokeTimer <= 0) {
        v.smokeTimer = 0.07;
        const stern = new THREE.Vector3(0, 0.15, -sp.length * 0.48).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw).add(v.pos);
        this.atmosphere.spawnSprite(stern, new THREE.Vector3(0, 0.5, 0), {
          color: 0xe6fbff, size: 1.4, grow: 3.0, life: 0.8, opacity: 0.48,
        });
      }
    }

    // Damage smoke (<55% HP) and engine fire (<25% HP)
    const hpRatio = v.hp / v.maxHp;
    if (hpRatio < 0.55) {
      v.smokeTimer -= dt;
      if (v.smokeTimer <= 0) {
        v.smokeTimer = hpRatio < 0.25 ? 0.08 : 0.16;
        const hoodPos = new THREE.Vector3(0, 1.15, sp.length * 0.32).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw).add(v.pos);
        this.atmosphere.spawnSprite(hoodPos, new THREE.Vector3(0, 2.5, 0), {
          color: hpRatio < 0.25 ? 0xff7b24 : 0x3a3d45,
          size: hpRatio < 0.25 ? 1.1 : 1.0,
          grow: 2.2,
          life: 0.6,
          opacity: 0.65,
          additive: hpRatio < 0.25,
        });
      }
    }
  }

  updateSirensAndCollisions(dt) {
    // 1) Animate police red/blue lightbars & ground-casting siren point lights
    for (const v of this.vehicles) {
      if (v.sirenMaterials.length >= 2) {
        if (v.sirenOn && !v.destroyed) {
          v.sirenPhase += dt * 11;
          const phaseA = Math.sin(v.sirenPhase) > 0;
          v.sirenMaterials[0].emissiveIntensity = phaseA ? 6.5 : 0.6;
          v.sirenMaterials[1].emissiveIntensity = phaseA ? 0.6 : 6.5;
          if (v.sirenLightRed) v.sirenLightRed.intensity = phaseA ? 7.5 : 0.4;
          if (v.sirenLightBlue) v.sirenLightBlue.intensity = phaseA ? 0.4 : 7.5;
        } else {
          v.sirenMaterials[0].emissiveIntensity = 0.2;
          v.sirenMaterials[1].emissiveIntensity = 0.2;
          if (v.sirenLightRed) v.sirenLightRed.intensity = 0;
          if (v.sirenLightBlue) v.sirenLightBlue.intensity = 0;
        }
      }
    }

    // 2) Vehicle-to-vehicle physical impulse collisions
    for (let i = 0; i < this.vehicles.length; i++) {
      const a = this.vehicles[i];
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const b = this.vehicles[j];
        if (Math.abs(a.pos.y - b.pos.y) > 2.6) continue;
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const minDist = (a.spec.width + b.spec.width) * 0.62;
        const dSq = dx * dx + dz * dz;
        if (dSq > 0.001 && dSq < minDist * minDist) {
          const dist = Math.sqrt(dSq);
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = (minDist - dist) * 0.52;
          a.pos.x -= nx * overlap;
          a.pos.z -= nz * overlap;
          b.pos.x += nx * overlap;
          b.pos.z += nz * overlap;

          const relVx = b.vel.x - a.vel.x;
          const relVz = b.vel.z - a.vel.z;
          const impact = -(relVx * nx + relVz * nz);
          if (impact > 0) {
            const totalMass = a.spec.mass + b.spec.mass;
            const impA = (impact * 1.15 * b.spec.mass) / totalMass;
            const impB = (impact * 1.15 * a.spec.mass) / totalMass;
            a.vel.x -= nx * impA;
            a.vel.z -= nz * impA;
            b.vel.x += nx * impB;
            b.vel.z += nz * impB;
            if (impact > 9) {
              this.damageVehicle(a, impact * 0.75);
              this.damageVehicle(b, impact * 0.75);
              this.atmosphere.spawnImpactSparks(
                new THREE.Vector3((a.pos.x + b.pos.x) * 0.5, a.pos.y + 0.9, (a.pos.z + b.pos.z) * 0.5),
                6,
                0xffcf6e
              );
            }
          }
        }
      }
    }
  }
}

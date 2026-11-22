// Cala Solara — Proportioned Stylized Character Rigs, Distinct 3D Weapons & On-Foot Player Controller

import * as THREE from 'three';
import { WEAPON_CATALOG } from '../config.js';

export function buildWeaponMesh(weaponId) {
  const grp = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x202632, roughness: 0.35, metalness: 0.78 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x3b2c22, roughness: 0.8 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 0.85 });

  let muzzleZ = 0.5;
  if (weaponId === 'pistol') {
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.34), metal);
    slide.position.set(0, 0.04, 0.12);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.09), gripMat);
    grip.position.set(0, -0.05, 0.01);
    grip.rotation.x = 0.25;
    grp.add(slide, grip);
    muzzleZ = 0.32;
  } else if (weaponId === 'smg') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.48), metal);
    body.position.set(0, 0.04, 0.16);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), metal);
    barrel.rotation.x = Math.PI * 0.5;
    barrel.position.set(0, 0.05, 0.48);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.24, 0.07), metal);
    mag.position.set(0, -0.1, 0.2);
    mag.rotation.x = 0.18;
    grp.add(body, barrel, mag);
    muzzleZ = 0.62;
  } else if (weaponId === 'shotgun') {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.32), gripMat);
    stock.position.set(0, 0.01, -0.08);
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.42), metal);
    receiver.position.set(0, 0.04, 0.2);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.56, 8), metal);
    barrel.rotation.x = Math.PI * 0.5;
    barrel.position.set(0, 0.07, 0.55);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.22), gripMat);
    pump.position.set(0, 0.01, 0.52);
    grp.add(stock, receiver, barrel, pump);
    muzzleZ = 0.86;
  } else if (weaponId === 'launcher') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.72, 10), metal);
    tube.rotation.x = Math.PI * 0.5;
    tube.position.set(0, 0.06, 0.28);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 10), accent);
    drum.rotation.x = Math.PI * 0.5;
    drum.position.set(0, 0.02, 0.2);
    grp.add(tube, drum);
    muzzleZ = 0.68;
  } else {
    // Carbine rifle
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.28), metal);
    stock.position.set(0, 0.02, -0.08);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.46), metal);
    body.position.set(0, 0.04, 0.22);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.42, 6), metal);
    barrel.rotation.x = Math.PI * 0.5;
    barrel.position.set(0, 0.06, 0.62);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.08), accent);
    mag.position.set(0, -0.1, 0.28);
    mag.rotation.x = 0.22;
    grp.add(stock, body, barrel, mag);
    muzzleZ = 0.85;
  }

  const muzzleAnchor = new THREE.Object3D();
  muzzleAnchor.position.set(0, 0.06, muzzleZ);
  grp.add(muzzleAnchor);
  return { mesh: grp, muzzleAnchor };
}

export function createStylizedCharacterRig({
  jacket = 0xff4c6b,
  shirt = 0xf5f2eb,
  pants = 0x222938,
  skin = 0xdba078,
  hair = 0x1c1718,
  hat = null,
  sunglasses = true,
  weaponId = null,
} = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const jacketMat = new THREE.MeshStandardMaterial({ color: jacket, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.62 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.75 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x171a20, roughness: 0.5 });

  // Articulated legs with boots
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.88, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.88, 0);

  for (const leg of [leftLeg, rightLeg]) {
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.44, 0.18), pantsMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.15), pantsMat);
    shin.position.y = -0.58;
    shin.castShadow = true;
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.24), bootMat);
    boot.position.set(0, -0.81, 0.04);
    leg.add(thigh, shin, boot);
  }
  body.add(leftLeg, rightLeg);

  // Tailored torso with open jacket lapels & shirt center
  const torso = new THREE.Group();
  torso.position.set(0, 1.24, 0);
  const shirtCore = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.24), shirtMat);
  shirtCore.castShadow = true;
  torso.add(shirtCore);

  const jacketBack = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.62, 0.14), jacketMat);
  jacketBack.position.set(0, 0, -0.07);
  jacketBack.castShadow = true;
  torso.add(jacketBack);

  for (const sx of [-0.16, 0.16]) {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.62, 0.13), jacketMat);
    lapel.position.set(sx, 0, 0.08);
    lapel.castShadow = true;
    torso.add(lapel);
  }
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.27), bootMat);
  belt.position.y = -0.3;
  torso.add(belt);
  body.add(torso);

  // Articulated shoulders & arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.31, 1.46, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.31, 1.46, 0);

  for (const arm of [leftArm, rightArm]) {
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.15), jacketMat);
    upper.position.y = -0.15;
    upper.castShadow = true;
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.13), skinMat);
    fore.position.set(0, -0.44, 0.04);
    fore.castShadow = true;
    arm.add(upper, fore);
  }
  body.add(leftArm, rightArm);

  // Proportioned rounded head, styled hair, sunglasses / helmet (zero Minecraft cubes!)
  const head = new THREE.Group();
  head.position.set(0, 1.72, 0);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 8), skinMat);
  neck.position.y = -0.14;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), skinMat);
  skull.scale.set(0.92, 1.08, 0.96);
  skull.castShadow = true;
  head.add(neck, skull);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.152, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
  hairCap.position.set(0, 0.02, -0.015);
  head.add(hairCap);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 8), hairMat);
  hairBack.scale.set(1.05, 1.2, 0.65);
  hairBack.position.set(0, -0.02, -0.1);
  head.add(hairBack);

  if (sunglasses) {
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.1, metalness: 0.9 });
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 0.06), shadeMat);
    shades.position.set(0, 0.02, 0.115);
    head.add(shades);
  }
  if (hat === 'police') {
    const capMat = new THREE.MeshStandardMaterial({ color: 0x16243d, roughness: 0.6 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.1, 10), capMat);
    cap.position.set(0, 0.17, 0);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.16), bootMat);
    visor.position.set(0, 0.13, 0.12);
    head.add(cap, visor);
  } else if (hat === 'swat') {
    const helmMat = new THREE.MeshStandardMaterial({ color: 0x161b24, roughness: 0.45, metalness: 0.4 });
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), helmMat);
    helm.position.set(0, 0.07, 0);
    head.add(helm);
  }
  body.add(head);

  // Weapon mount on right hand
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, -0.56, 0.14);
  rightArm.add(weaponSocket);

  let weaponObj = null;
  const setWeapon = (id) => {
    if (weaponObj) weaponSocket.remove(weaponObj.mesh);
    if (!id) {
      weaponObj = null;
      return;
    }
    weaponObj = buildWeaponMesh(id);
    weaponSocket.add(weaponObj.mesh);
  };
  if (weaponId) setWeapon(weaponId);

  const getMuzzleWorldPos = (targetVec = new THREE.Vector3()) => {
    if (weaponObj) {
      weaponObj.muzzleAnchor.getWorldPosition(targetVec);
      return targetVec;
    }
    return root.position.clone().add(new THREE.Vector3(0, 1.38, 0));
  };

  const animatePose = (walkCycle, speed, aiming, dt, rollProgress = 0) => {
    if (rollProgress > 0) {
      body.rotation.x = rollProgress * Math.PI * 2;
      body.position.y = Math.sin(rollProgress * Math.PI) * 0.32;
      return;
    }
    body.rotation.x = 0;
    body.position.y = 0;

    const swing = Math.sin(walkCycle) * Math.min(1, speed / 5.5) * 0.68;
    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;

    if (aiming && weaponObj) {
      // Crisp 2-handed aiming stance aimed directly forward along character yaw!
      rightArm.rotation.x = -1.48;
      rightArm.rotation.y = -0.06;
      leftArm.rotation.x = -1.36;
      leftArm.rotation.y = 0.46;
      weaponSocket.rotation.x = 1.48;
    } else {
      rightArm.rotation.x = -swing * 0.6;
      rightArm.rotation.y = 0;
      leftArm.rotation.x = swing * 0.6;
      leftArm.rotation.y = 0;
      weaponSocket.rotation.x = 0.25;
    }
  };

  return { root, body, leftLeg, rightLeg, leftArm, rightArm, head, setWeapon, getMuzzleWorldPos, animatePose };
}

export class PlayerController {
  constructor(scene, cityWorld, vehicleSystem) {
    this.scene = scene;
    this.cityWorld = cityWorld;
    this.vehicleSystem = vehicleSystem;

    // Camila Vega — Sun-soaked coastal anti-heroine in coral-red tailored jacket & cream tee
    this.rig = createStylizedCharacterRig({
      jacket: 0xe63c5e,
      shirt: 0xf7f3ea,
      pants: 0x1d2536,
      skin: 0xdca178,
      hair: 0x181316,
      sunglasses: true,
      weaponId: 'smg',
    });
    scene.add(this.rig.root);

    this.pos = new THREE.Vector3(164, 0.35, 32);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.armor = 75;
    this.maxArmor = 100;
    this.cash = 14850;
    this.vehicle = null;
    this.aiming = false;
    this.walkCycle = 0;
    this.rollTimer = 0;
    this.rollDir = new THREE.Vector3();
    this.weaponIndex = 1; // Starts with Viper SMG ready
    this.ammo = WEAPON_CATALOG.map((w) => ({ mag: w.mag, reserve: w.reserve }));
    this.rig.root.position.copy(this.pos);
  }

  get currentWeapon() {
    return WEAPON_CATALOG[this.weaponIndex];
  }

  selectWeapon(idx) {
    const clamped = ((idx % WEAPON_CATALOG.length) + WEAPON_CATALOG.length) % WEAPON_CATALOG.length;
    this.weaponIndex = clamped;
    this.rig.setWeapon(WEAPON_CATALOG[clamped].id);
  }

  enterVehicle(v) {
    if (!v || v.destroyed) return false;
    this.vehicle = v;
    v.role = 'player';
    this.pos.copy(v.pos);
    this.yaw = v.yaw;
    this.rig.root.visible = false;
    return true;
  }

  exitVehicle() {
    if (!this.vehicle) return null;
    const v = this.vehicle;
    const sideOffset = new THREE.Vector3(-v.spec.width * 0.78 - 0.65, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw);
    this.pos.copy(v.pos).add(sideOffset);
    this.pos.y = Math.max(0.25, this.cityWorld.getTerrainHeight(this.pos.x, this.pos.z));
    this.yaw = v.yaw;
    this.rig.root.position.copy(this.pos);
    this.rig.root.rotation.y = this.yaw;
    this.rig.root.visible = true;
    this.vehicle = null;
    return v;
  }

  findNearestVehicle(maxDist = 6.2) {
    let best = null;
    let bestD = maxDist;
    for (const v of this.vehicleSystem.vehicles) {
      if (v.destroyed) continue;
      const d = Math.hypot(v.pos.x - this.pos.x, v.pos.z - this.pos.z);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  takeDamage(amount) {
    if (this.rollTimer > 0) return; // Dodge-roll i-frames
    let rem = amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, rem * 0.65);
      this.armor -= absorbed;
      rem -= absorbed;
    }
    this.hp = Math.max(0, this.hp - rem);
  }

  startDodgeRoll(camYaw) {
    if (this.vehicle || this.rollTimer > 0) return;
    this.rollTimer = 0.42;
    this.rollDir.set(Math.sin(this.yaw || camYaw), 0, Math.cos(this.yaw || camYaw)).normalize();
  }

  updateOnFoot(input, camYaw, dt) {
    if (this.vehicle) {
      this.pos.copy(this.vehicle.pos);
      this.yaw = this.vehicle.yaw;
      return;
    }

    let mx = 0;
    let mz = 0;
    if (input.keys.KeyW || input.keys.ArrowUp) mz += 1;
    if (input.keys.KeyS || input.keys.ArrowDown) mz -= 1;
    if (input.keys.KeyA || input.keys.ArrowLeft) mx += 1;
    if (input.keys.KeyD || input.keys.ArrowRight) mx -= 1;

    const sprinting = !!(input.keys.ShiftLeft || input.keys.ShiftRight);
    this.aiming = !!(input.mouseRight || input.mouseLeft);

    const fwdX = Math.sin(camYaw);
    const fwdZ = Math.cos(camYaw);
    const rightX = Math.cos(camYaw);
    const rightZ = -Math.sin(camYaw);

    let moveX = fwdX * mz + rightX * mx;
    let moveZ = fwdZ * mz + rightZ * mx;
    const len = Math.hypot(moveX, moveZ);

    let speed = 0;
    if (this.rollTimer > 0) {
      this.rollTimer = Math.max(0, this.rollTimer - dt);
      moveX = this.rollDir.x;
      moveZ = this.rollDir.z;
      speed = 13.5;
    } else if (len > 0.01) {
      moveX /= len;
      moveZ /= len;
      speed = this.aiming ? 5.2 : (sprinting ? 10.6 : 6.8);
    }

    const nextX = this.pos.x + moveX * speed * dt;
    const nextZ = this.pos.z + moveZ * speed * dt;

    if (!this.cityWorld.isWater(nextX, nextZ)) {
      let blocked = false;
      const r = 0.55;
      for (const c of this.cityWorld.colliders) {
        if (this.pos.y > c.maxY) continue;
        if (nextX + r > c.minX && nextX - r < c.maxX && nextZ + r > c.minZ && nextZ - r < c.maxZ) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        this.pos.x = nextX;
        this.pos.z = nextZ;
      }
    }

    this.pos.y = Math.max(0.2, this.cityWorld.getTerrainHeight(this.pos.x, this.pos.z));

    if (this.aiming) {
      this.yaw = camYaw;
    } else if (len > 0.01) {
      const targetYaw = Math.atan2(moveX, moveZ);
      let diff = targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 12);
    }

    this.walkCycle += speed * dt * 1.65;
    this.rig.root.position.copy(this.pos);
    this.rig.root.rotation.y = this.yaw;
    const rollProg = this.rollTimer > 0 ? 1 - this.rollTimer / 0.42 : 0;
    this.rig.animatePose(this.walkCycle, speed, this.aiming, dt, rollProg);
  }
}

// Cala Solara — Full-Spectrum Combat, Barrel-Locked Aiming, Vehicle Destruction & Grenade Explosives

import * as THREE from 'three';

export class CombatAndDestructionSystem {
  constructor(scene, cityWorld, vehicleSystem, policeSystem, trafficSystem, atmosphere, audio) {
    this.scene = scene;
    this.cityWorld = cityWorld;
    this.vehicleSystem = vehicleSystem;
    this.policeSystem = policeSystem;
    this.trafficSystem = trafficSystem;
    this.atmosphere = atmosphere;
    this.audio = audio;

    this.fireCd = 0;
    this.recoilKick = 0;
    this.hostiles = []; // Mission & gang enemies
    this.grenades = [];
  }

  setHostiles(list) {
    this.hostiles = list;
  }

  getCrosshairAimPoint(camera, maxRange = 95) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    const origin = ray.ray.origin;
    const dir = ray.ray.direction;

    let bestDist = maxRange;
    let bestHit = null;

    // 1) Check mission/gang hostiles
    for (const h of this.hostiles) {
      if (!h.alive) continue;
      const center = h.pos.clone().add(new THREE.Vector3(0, 1.15, 0));
      const d = this.raySphereDist(origin, dir, center, 0.95);
      if (d > 0 && d < bestDist) {
        bestDist = d;
        bestHit = { kind: 'hostile', target: h, point: origin.clone().addScaledVector(dir, d) };
      }
    }

    // 2) Check on-foot police & SWAT officers
    for (const off of this.policeSystem.officers) {
      if (!off.alive) continue;
      const center = off.pos.clone().add(new THREE.Vector3(0, 1.15, 0));
      const d = this.raySphereDist(origin, dir, center, 0.95);
      if (d > 0 && d < bestDist) {
        bestDist = d;
        bestHit = { kind: 'officer', target: off, point: origin.clone().addScaledVector(dir, d) };
      }
    }

    // 3) Check ALL vehicles (police cruisers, SWAT trucks, civilian cars — shootable & destructible!)
    for (const v of this.vehicleSystem.vehicles) {
      if (v.role === 'player') continue;
      const center = v.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
      const d = this.raySphereDist(origin, dir, center, Math.max(v.spec.width, v.spec.length) * 0.44);
      if (d > 0 && d < bestDist) {
        bestDist = d;
        bestHit = { kind: 'vehicle', target: v, point: origin.clone().addScaledVector(dir, d) };
      }
    }

    // 4) Check roadblock explosive fuel barrels
    for (const rb of this.policeSystem.roadblocks) {
      if (!rb.barrelAlive) continue;
      const d = this.raySphereDist(origin, dir, rb.barrelPos, 1.05);
      if (d > 0 && d < bestDist) {
        bestDist = d;
        bestHit = { kind: 'barrel', target: rb, point: origin.clone().addScaledVector(dir, d) };
      }
    }

    const worldPoint = bestHit ? bestHit.point : origin.clone().addScaledVector(dir, maxRange);
    return { hit: bestHit, point: worldPoint, dir: dir.clone() };
  }

  raySphereDist(origin, dir, center, radius) {
    const oc = new THREE.Vector3().subVectors(origin, center);
    const b = oc.dot(dir);
    const c = oc.dot(oc) - radius * radius;
    const disc = b * b - c;
    if (disc < 0) return -1;
    const t = -b - Math.sqrt(disc);
    return t > 0.5 ? t : -1;
  }

  firePlayerWeapon(player, camera, onKillCb) {
    if (this.fireCd > 0) return false;
    const weapon = player.currentWeapon;
    const ammoState = player.ammo[player.weaponIndex];
    if (ammoState.mag <= 0) {
      if (ammoState.reserve > 0) {
        const take = Math.min(weapon.mag, ammoState.reserve);
        ammoState.mag = take;
        ammoState.reserve -= take;
      } else {
        return false;
      }
    }

    ammoState.mag -= 1;
    this.fireCd = weapon.fireRate;
    this.recoilKick = weapon.explosive ? 0.08 : (weapon.id === 'shotgun' ? 0.06 : 0.024);

    // Exact muzzle origin: gun barrel when on foot, driver window during drive-by
    const muzzle = player.vehicle
      ? player.pos.clone().add(new THREE.Vector3(0, 1.35, 0))
      : player.rig.getMuzzleWorldPos();

    const aim = this.getCrosshairAimPoint(camera, weapon.range);
    const fireDir = new THREE.Vector3().subVectors(aim.point, muzzle).normalize();

    this.atmosphere.spawnMuzzleFlash(muzzle, fireDir, weapon.color);
    if (this.audio) this.audio.playGunshot(weapon.id);
    this.trafficSystem.triggerPanic(player.pos);

    if (weapon.explosive) {
      // Launch parabolic 40mm grenade
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff7a2f, emissive: 0xff5514, emissiveIntensity: 3.5 })
      );
      mesh.position.copy(muzzle);
      this.scene.add(mesh);
      this.grenades.push({
        mesh,
        pos: muzzle.clone(),
        vel: fireDir.clone().multiplyScalar(42).add(new THREE.Vector3(0, 5.5, 0)),
        life: 2.2,
        onKillCb,
      });
      this.policeSystem.addHeat(45, 'EXPLOSIVE DISCHARGE');
      return true;
    }

    // Pellet / bullet hits strictly aligned from barrel to crosshair target!
    for (let p = 0; p < weapon.pellets; p++) {
      const spreadVec = new THREE.Vector3(
        (Math.random() - 0.5) * weapon.spread * 2,
        (Math.random() - 0.5) * weapon.spread * 2,
        (Math.random() - 0.5) * weapon.spread * 2
      );
      const pelletEnd = aim.point.clone().addScaledVector(spreadVec, muzzle.distanceTo(aim.point));
      this.atmosphere.spawnTracer(muzzle, pelletEnd, weapon.color, 0.09);

      if (aim.hit && p === 0) {
        this.applyDirectHit(aim.hit, weapon.damage * weapon.pellets, player, onKillCb);
      } else if (!aim.hit && p === 0) {
        this.atmosphere.spawnImpactSparks(pelletEnd, 4, 0xffd27a);
      }
    }
    return true;
  }

  applyDirectHit(hit, damage, player, onKillCb) {
    this.atmosphere.spawnImpactSparks(hit.point, 7, 0xffc857);
    if (hit.kind === 'hostile') {
      hit.target.hp -= damage;
      if (hit.target.hp <= 0 && hit.target.alive) {
        hit.target.alive = false;
        hit.target.rig.root.rotation.x = Math.PI * 0.5;
        hit.target.rig.root.position.y -= 0.7;
        player.cash += 250;
        if (onKillCb) onKillCb('hostile', hit.target);
      }
    } else if (hit.kind === 'officer') {
      hit.target.hp -= damage;
      this.policeSystem.addHeat(38, 'OFFICER UNDER FIRE');
      if (hit.target.hp <= 0 && hit.target.alive) {
        hit.target.alive = false;
        hit.target.rig.root.rotation.x = Math.PI * 0.5;
        hit.target.rig.root.position.y -= 0.7;
        this.policeSystem.addHeat(65, 'CSPD UNIT DOWN');
      }
    } else if (hit.kind === 'vehicle') {
      const blown = this.vehicleSystem.damageVehicle(hit.target, damage * 1.15, true);
      this.policeSystem.addHeat(blown ? 85 : 20, blown ? 'VEHICLE DESTROYED' : 'PROPERTY DAMAGE');
      if (blown && onKillCb) onKillCb('vehicle', hit.target);
    } else if (hit.kind === 'barrel') {
      hit.target.barrelAlive = false;
      hit.target.barrelMesh.visible = false;
      this.detonateExplosion(hit.target.barrelPos, 11, player, onKillCb);
    }
  }

  detonateExplosion(center, radius, player, onKillCb) {
    this.atmosphere.spawnExplosion(center, 1.35);
    if (this.audio) this.audio.playExplosion();
    this.policeSystem.addHeat(75, 'EXPLOSION REPORTED');

    for (const h of this.hostiles) {
      if (h.alive && h.pos.distanceTo(center) < radius) {
        h.hp = 0;
        h.alive = false;
        h.rig.root.rotation.x = Math.PI * 0.5;
        player.cash += 250;
        if (onKillCb) onKillCb('hostile', h);
      }
    }
    for (const off of this.policeSystem.officers) {
      if (off.alive && off.pos.distanceTo(center) < radius) {
        off.hp = 0;
        off.alive = false;
        off.rig.root.rotation.x = Math.PI * 0.5;
      }
    }
    for (const v of this.vehicleSystem.vehicles) {
      if (!v.destroyed && v.pos.distanceTo(center) < radius + 2) {
        this.vehicleSystem.damageVehicle(v, 190, true);
      }
    }
  }

  update(dt, player) {
    if (this.fireCd > 0) this.fireCd = Math.max(0, this.fireCd - dt);
    if (this.recoilKick > 0) this.recoilKick = Math.max(0, this.recoilKick - dt * 0.25);

    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.life -= dt;
      g.vel.y -= 20 * dt;
      g.pos.addScaledVector(g.vel, dt);
      g.mesh.position.copy(g.pos);
      const ground = this.cityWorld.getTerrainHeight(g.pos.x, g.pos.z);
      if (g.life <= 0 || g.pos.y <= ground + 0.25) {
        this.scene.remove(g.mesh);
        this.detonateExplosion(g.pos, 11.5, player, g.onKillCb);
        this.grenades.splice(i, 1);
      }
    }
  }
}

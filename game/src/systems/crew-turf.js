// Cala Solara — Active 3-Member Crew System, 6-District Turf Control, AI Street Races & Golden Relics

import * as THREE from 'three';
import { CREW_ROSTER, DISTRICTS } from '../config.js';
import { boulevardZAtX } from '../world/city-world.js';
import { createStylizedCharacterRig } from '../entities/characters.js';

const RACE_CHECKPOINTS = [
  { x: -165, z: boulevardZAtX(-165) },
  { x: -70, z: boulevardZAtX(-70) },
  { x: 35, z: boulevardZAtX(35) },
  { x: 120, z: 96 },
  { x: 132, z: -24 },
  { x: -45, z: -24 },
  { x: -145, z: 48 },
];

export class CrewAndTurfSystem {
  constructor(scene, cityWorld, vehicleSystem, policeSystem, atmosphere) {
    this.scene = scene;
    this.cityWorld = cityWorld;
    this.vehicleSystem = vehicleSystem;
    this.policeSystem = policeSystem;
    this.atmosphere = atmosphere;

    this.districts = DISTRICTS.map((d) => ({ ...d }));
    this.crew = CREW_ROSTER.map((c) => ({ ...c, level: 1, cdLeft: 0 }));
    this.activeCrewIndex = 0;
    this.incomeTimer = 30;

    // 3D Deployed Ally (Mateo Cruz enforcer rig that joins firefights!)
    this.ally = null;
    this.allyTimer = 0;

    // Side activities: 12 Golden Relics + Street Race
    this.relics = [];
    this.relicsCollected = 0;
    this.raceActive = false;
    this.raceGateIdx = 0;
    this.raceOpponents = [];
    this.raceGateMesh = null;

    this.spawnGoldenRelics();
  }

  get activeMember() {
    return this.crew[this.activeCrewIndex];
  }

  cycleCrew() {
    this.activeCrewIndex = (this.activeCrewIndex + 1) % this.crew.length;
    return this.activeMember;
  }

  upgradeCrew(id, player) {
    const member = this.crew.find((c) => c.id === id);
    if (!member) return false;
    const cost = member.upgradeCost * member.level;
    if (player.cash < cost) return false;
    player.cash -= cost;
    member.level += 1;
    member.cooldown = Math.max(10, member.cooldown - 3);
    return true;
  }

  addDistrictControl(districtId, amount) {
    const d = this.districts.find((x) => x.id === districtId);
    if (d) d.control = Math.min(100, d.control + amount);
  }

  getDistrictAt(x, z) {
    let best = this.districts[0];
    let bestD = Infinity;
    for (const d of this.districts) {
      const dist = Math.hypot(x - d.center.x, z - d.center.z);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    return best;
  }

  spawnEnforcerAlly(pos, yaw = 0, duration = 22) {
    if (this.ally) this.scene.remove(this.ally.rig.root);
    const rig = createStylizedCharacterRig({
      jacket: 0x2c3e58,
      shirt: 0x1a202c,
      pants: 0x1a1e28,
      skin: 0xc98c64,
      hair: 0x181515,
      sunglasses: true,
      weaponId: 'carbine',
    });
    const y = Math.max(0.25, this.cityWorld.getTerrainHeight(pos.x, pos.z));
    rig.root.position.set(pos.x, y, pos.z);
    rig.root.rotation.y = yaw;
    this.scene.add(rig.root);
    this.ally = {
      rig,
      pos: new THREE.Vector3(pos.x, y, pos.z),
      yaw,
      fireCd: 0.35,
      walkCycle: 0,
    };
    this.allyTimer = duration;
    return this.ally;
  }

  triggerAbility(player, onToast) {
    const m = this.activeMember;
    if (m.cdLeft > 0) {
      if (onToast) onToast(`${m.name} recharging (${Math.ceil(m.cdLeft)}s)`);
      return false;
    }
    m.cdLeft = m.cooldown;

    if (m.id === 'mateo') {
      // Deploy Mateo beside Camila with heavy carbine support + armor pack
      const side = new THREE.Vector3(2.4, 0, -1.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw).add(player.pos);
      this.spawnEnforcerAlly(side, player.yaw, 20 + m.level * 5);
      player.armor = Math.min(player.maxArmor, player.armor + 55 + m.level * 10);
      if (onToast) onToast(`MATEO DEPLOYED — Covering Fire + Armor Restored!`);
    } else if (m.id === 'nadia') {
      // Signal Hack: scramble police radar, drop 1★ heat, disable spike strips
      this.policeSystem.jamRadar(12 + m.level * 3);
      if (onToast) onToast(`NADIA HACK ACTIVE — CSPD Radar Jammed & Spikes Disabled!`);
    } else if (m.id === 'tomas') {
      // Wheelman: tune/repair active vehicle + 100% nitro OR drop fresh Solara GT-R
      if (player.vehicle) {
        this.vehicleSystem.repairVehicle(player.vehicle);
        if (onToast) onToast(`TOMAS EXPRESS TUNE — Chassis Repaired & Nitro 100%!`);
      } else {
        const dropPos = player.pos.clone().add(new THREE.Vector3(Math.sin(player.yaw) * 6, 0, Math.cos(player.yaw) * 6));
        this.vehicleSystem.spawnVehicle('supercar', dropPos.x, dropPos.z, player.yaw, { color: 0x00d9e8, role: 'civilian' });
        if (onToast) onToast(`TOMAS DELIVERED — Tuned Solara GT-R Ready!`);
      }
    }
    return true;
  }

  spawnGoldenRelics() {
    const spots = [
      [-175, boulevardZAtX(-175) + 14], [-55, boulevardZAtX(-55) + 14], [45, boulevardZAtX(45) + 14],
      [-245, -45], [0, -52], [-95, -108], [90, -108],
      [168, -110], [228, 22], [235, 114], [382, 166], [428, 148],
    ];
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd24c,
      emissive: 0xffa624,
      emissiveIntensity: 1.6,
      roughness: 0.18,
      metalness: 0.92,
    });
    for (const [rx, rz] of spots) {
      const y = Math.max(0.3, this.cityWorld.getTerrainHeight(rx, rz)) + 1.2;
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), goldMat);
      mesh.position.set(rx, y, rz);
      this.scene.add(mesh);
      this.relics.push({ mesh, pos: new THREE.Vector3(rx, y, rz), collected: false });
    }
  }

  startStreetRace(player, onToast) {
    this.raceActive = true;
    this.raceGateIdx = 0;
    const startPt = RACE_CHECKPOINTS[0];
    const nextPt = RACE_CHECKPOINTS[1];
    const yaw = Math.atan2(nextPt.x - startPt.x, nextPt.z - startPt.z);

    // Clear old race opponents
    for (const r of this.raceOpponents) this.scene.remove(r.vehicle.root);
    this.raceOpponents = [];

    // Spawn 3 competitive AI street racers
    const colors = [0xff496e, 0xffbe3b, 0x7b4dff];
    for (let i = 0; i < 3; i++) {
      const rx = startPt.x - Math.sin(yaw) * (7 + i * 5) + Math.cos(yaw) * ((i - 1) * 3.5);
      const rz = startPt.z - Math.cos(yaw) * (7 + i * 5) - Math.sin(yaw) * ((i - 1) * 3.5);
      const veh = this.vehicleSystem.spawnVehicle(i === 0 ? 'supercar' : 'muscle', rx, rz, yaw, { color: colors[i], role: 'racer' });
      this.raceOpponents.push({ vehicle: veh, gateIdx: 1 });
    }

    if (!this.raceGateMesh) {
      const gateGeo = new THREE.TorusGeometry(6.2, 0.32, 8, 24, Math.PI);
      const gateMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00d9ff, emissiveIntensity: 3.2 });
      this.raceGateMesh = new THREE.Mesh(gateGeo, gateMat);
      this.scene.add(this.raceGateMesh);
    }
    this.positionRaceGate();
    if (onToast) onToast('PALMERA STREET CIRCUIT STARTED — Beat 3 Rivals ($4,500 Prize)!');
  }

  positionRaceGate() {
    if (!this.raceGateMesh) return;
    const pt = RACE_CHECKPOINTS[this.raceGateIdx];
    const nxt = RACE_CHECKPOINTS[(this.raceGateIdx + 1) % RACE_CHECKPOINTS.length];
    const y = Math.max(0.3, this.cityWorld.getTerrainHeight(pt.x, pt.z));
    this.raceGateMesh.position.set(pt.x, y, pt.z);
    this.raceGateMesh.rotation.y = Math.atan2(nxt.x - pt.x, nxt.z - pt.z);
    this.raceGateMesh.visible = this.raceActive;
  }

  update(dt, player, hostiles, onToast) {
    for (const c of this.crew) {
      if (c.cdLeft > 0) c.cdLeft = Math.max(0, c.cdLeft - dt);
    }

    // Passive turf control cash payouts
    this.incomeTimer -= dt;
    if (this.incomeTimer <= 0) {
      this.incomeTimer = 30;
      const total = Math.round(this.districts.reduce((acc, d) => acc + d.income * (d.control / 100), 0));
      if (total > 0) {
        player.cash += total;
        if (onToast) onToast(`TERRITORY INCOME: +$${total.toLocaleString()}`);
      }
    }

    // Active Mateo Enforcer 3D Ally AI
    if (this.ally) {
      this.allyTimer -= dt;
      if (this.allyTimer <= 0) {
        this.scene.remove(this.ally.rig.root);
        this.ally = null;
      } else {
        const a = this.ally;
        // Follow Camila at 4m flank and fire at nearest hostile/cop
        const targetFollow = player.pos.clone().add(new THREE.Vector3(2.8, 0, -2.0));
        const dx = targetFollow.x - a.pos.x;
        const dz = targetFollow.z - a.pos.z;
        const dist = Math.hypot(dx, dz);
        let spd = 0;
        if (dist > 3.5) {
          spd = 6.2;
          a.pos.x += (dx / dist) * spd * dt;
          a.pos.z += (dz / dist) * spd * dt;
          a.yaw = Math.atan2(dx, dz);
        }
        a.pos.y = Math.max(0.25, this.cityWorld.getTerrainHeight(a.pos.x, a.pos.z));

        // Pick nearest enemy
        let bestEnemy = null;
        let bestD = 42;
        for (const h of hostiles) {
          if (!h.alive) continue;
          const ed = a.pos.distanceTo(h.pos);
          if (ed < bestD) { bestD = ed; bestEnemy = h; }
        }
        if (bestEnemy) {
          a.yaw = Math.atan2(bestEnemy.pos.x - a.pos.x, bestEnemy.pos.z - a.pos.z);
          a.fireCd -= dt;
          if (a.fireCd <= 0) {
            a.fireCd = 0.55;
            const muzzle = a.rig.getMuzzleWorldPos();
            const hitPt = bestEnemy.pos.clone().add(new THREE.Vector3(0, 1.15, 0));
            this.atmosphere.spawnMuzzleFlash(muzzle, hitPt.clone().sub(muzzle).normalize(), 0xffe49e);
            this.atmosphere.spawnTracer(muzzle, hitPt, 0xffd07a, 0.09);
            this.atmosphere.spawnImpactSparks(hitPt, 4, 0xffcf6e);
            bestEnemy.hp -= 24;
            if (bestEnemy.hp <= 0) {
              bestEnemy.alive = false;
              bestEnemy.rig.root.rotation.x = Math.PI * 0.5;
              player.cash += 250;
            }
          }
        }
        a.walkCycle += spd * dt * 1.8;
        a.rig.root.position.copy(a.pos);
        a.rig.root.rotation.y = a.yaw;
        a.rig.animatePose(a.walkCycle, spd, !!bestEnemy, dt);
      }
    }

    // Spin & collect Golden Relics
    for (const r of this.relics) {
      if (r.collected) continue;
      r.mesh.rotation.y += dt * 2.2;
      if (player.pos.distanceTo(r.pos) < 3.6) {
        r.collected = true;
        r.mesh.visible = false;
        this.relicsCollected += 1;
        player.cash += 1200;
        if (onToast) onToast(`GOLDEN RELIC ${this.relicsCollected}/${this.relics.length} (+$1,200)`);
      }
    }

    // Stunt ramp airtime rewards
    if (player.vehicle && !player.vehicle.airborne && player.vehicle.airTime > 0.75) {
      const bonus = Math.round(player.vehicle.airTime * 700);
      player.cash += bonus;
      if (onToast) onToast(`INSANE STUNT BONUS (+$${bonus})`);
    }

    // Update Street Race AI & gates
    if (this.raceActive) {
      const curGate = RACE_CHECKPOINTS[this.raceGateIdx];
      if (Math.hypot(player.pos.x - curGate.x, player.pos.z - curGate.z) < 12) {
        this.raceGateIdx += 1;
        if (this.raceGateIdx >= RACE_CHECKPOINTS.length) {
          this.raceActive = false;
          this.raceGateMesh.visible = false;
          player.cash += 4500;
          this.addDistrictControl('palmera', 15);
          if (onToast) onToast('STREET CIRCUIT WON! +$4,500 & +15% Palmera Control!');
        } else {
          this.positionRaceGate();
        }
      }
      for (const op of this.raceOpponents) {
        const v = op.vehicle;
        if (v.destroyed) continue;
        const g = RACE_CHECKPOINTS[op.gateIdx % RACE_CHECKPOINTS.length];
        if (Math.hypot(v.pos.x - g.x, v.pos.z - g.z) < 14) op.gateIdx = (op.gateIdx + 1) % RACE_CHECKPOINTS.length;
        const desired = Math.atan2(g.x - v.pos.x, g.z - v.pos.z);
        let err = desired - v.yaw;
        while (err > Math.PI) err -= Math.PI * 2;
        while (err < -Math.PI) err += Math.PI * 2;
        this.vehicleSystem.updateDrivingPhysics(v, { throttle: 0.92, steer: THREE.MathUtils.clamp(err * 1.6, -1, 1), handbrake: false, nitro: Math.abs(err) < 0.2 }, dt);
      }
    }
  }
}

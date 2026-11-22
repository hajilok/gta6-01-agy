// Cala Solara — Autonomous Yielding Traffic Vehicles & Living Boardwalk/Plaza Pedestrians

import * as THREE from 'three';
import { boulevardZAtX } from '../world/city-world.js';
import { createStylizedCharacterRig } from './characters.js';

const TRAFFIC_LOOPS = [
  // Curved Coastal Boulevard loop (eastbound & westbound)
  [
    { x: -275, z: boulevardZAtX(-275) + 4.2 },
    { x: -170, z: boulevardZAtX(-170) + 4.2 },
    { x: -60, z: boulevardZAtX(-60) + 4.2 },
    { x: 45, z: boulevardZAtX(45) + 4.2 },
    { x: 122, z: boulevardZAtX(122) + 4.2 },
    { x: 132, z: 48 },
    { x: 45, z: 48 },
    { x: -45, z: 48 },
    { x: -145, z: 48 },
    { x: -275, z: 48 },
  ],
  // Financial Core & Marina downtown loop
  [
    { x: -145, z: -185 },
    { x: 45, z: -185 },
    { x: 132, z: -180 },
    { x: 132, z: -24 },
    { x: 45, z: -24 },
    { x: -45, z: -24 },
    { x: -145, z: -24 },
  ],
  // Midtown cross-avenue loop
  [
    { x: -275, z: -108 },
    { x: 192, z: -108 },
    { x: 192, z: 48 },
    { x: -45, z: 48 },
    { x: -45, z: -108 },
  ],
  // Puente del Sol Bridge & Harbor loop
  [
    { x: 45, z: boulevardZAtX(45) + 4 },
    { x: 120, z: 96 },
    { x: 235, z: 114 },
    { x: 350, z: 132 },
    { x: 382, z: 122 },
    { x: 350, z: 132 },
    { x: 235, z: 114 },
    { x: 120, z: 96 },
    { x: 132, z: -24 },
    { x: 45, z: -24 },
  ],
];

export class TrafficAndCrowdSystem {
  constructor(scene, cityWorld, vehicleSystem) {
    this.scene = scene;
    this.cityWorld = cityWorld;
    this.vehicleSystem = vehicleSystem;
    this.trafficAgents = [];
    this.pedestrians = [];
    this.panicTimer = 0;
    this.panicOrigin = new THREE.Vector3();

    this.spawnInitialTraffic();
    this.spawnInitialCrowds();
  }

  triggerPanic(origin) {
    this.panicTimer = 7.0;
    this.panicOrigin.copy(origin);
  }

  spawnInitialTraffic() {
    const civTypes = ['convertible', 'muscle', 'suv', 'supercar', 'van', 'moto'];
    let idx = 0;
    for (let li = 0; li < TRAFFIC_LOOPS.length; li++) {
      const loop = TRAFFIC_LOOPS[li];
      const count = li === 0 ? 7 : 5;
      for (let k = 0; k < count; k++) {
        const wpIdx = Math.floor((k / count) * loop.length);
        const cur = loop[wpIdx];
        const nxt = loop[(wpIdx + 1) % loop.length];
        const yaw = Math.atan2(nxt.x - cur.x, nxt.z - cur.z);
        const type = civTypes[(idx++) % civTypes.length];
        const v = this.vehicleSystem.spawnVehicle(type, cur.x, cur.z, yaw, { role: 'civilian' });
        this.trafficAgents.push({
          vehicle: v,
          loopIndex: li,
          wpIndex: (wpIdx + 1) % loop.length,
          cruiseSpeed: type === 'supercar' ? 20 : (type === 'van' ? 14 : 17),
        });
      }
    }
  }

  spawnInitialCrowds() {
    const jackets = [0xff6b8b, 0x00c2d1, 0xffb347, 0x5bd48a, 0x7b6dff, 0xf2f4f8, 0xe86b42];
    const pants = [0x1f2a3d, 0x3b4454, 0xe8dfd1, 0x26384d, 0x4a382c];
    const skins = [0xe4b28a, 0xc78962, 0x996042, 0xf0c7a5];

    const zones = [
      // Palmera Boardwalk strollers
      ...Array.from({ length: 14 }, (_, i) => {
        const x = -220 + i * 24;
        return { x, z: boulevardZAtX(x) + 14.5, axis: 'x' };
      }),
      // Fiesta Plaza Barrio Viejo locals
      ...Array.from({ length: 10 }, (_, i) => {
        const ang = (i / 10) * Math.PI * 2;
        return { x: -220 + Math.cos(ang) * 24, z: -20 + Math.sin(ang) * 22, axis: 'circle' };
      }),
      // Downtown Financial Core & Marina promenade
      { x: -34, z: -58, axis: 'z' }, { x: 34, z: -58, axis: 'z' },
      { x: -34, z: -86, axis: 'z' }, { x: 34, z: -86, axis: 'z' },
      { x: 180, z: 18, axis: 'z' }, { x: 182, z: 36, axis: 'z' },
      { x: 180, z: -4, axis: 'z' }, { x: 142, z: 36, axis: 'x' },
    ];

    zones.forEach((zInfo, i) => {
      const rig = createStylizedCharacterRig({
        jacket: jackets[i % jackets.length],
        shirt: 0xf7f5ef,
        pants: pants[i % pants.length],
        skin: skins[i % skins.length],
        hair: i % 3 === 0 ? 0x3d281c : 0x181518,
        sunglasses: i % 2 === 0,
      });
      const y = Math.max(0.2, this.cityWorld.getTerrainHeight(zInfo.x, zInfo.z));
      rig.root.position.set(zInfo.x, y, zInfo.z);
      this.scene.add(rig.root);

      this.pedestrians.push({
        rig,
        pos: new THREE.Vector3(zInfo.x, y, zInfo.z),
        home: new THREE.Vector3(zInfo.x, y, zInfo.z),
        yaw: (i * 1.37) % (Math.PI * 2),
        speed: 1.8 + (i % 4) * 0.35,
        walkCycle: i * 0.9,
        fleeing: false,
        alive: true,
      });
    });
  }

  update(dt, playerPos, playerVehicle) {
    if (this.panicTimer > 0) this.panicTimer = Math.max(0, this.panicTimer - dt);

    // 1) Autonomous traffic with obstacle/intersection yielding
    for (const agent of this.trafficAgents) {
      const v = agent.vehicle;
      if (v.role !== 'civilian' || v.destroyed || v === playerVehicle) continue;

      const loop = TRAFFIC_LOOPS[agent.loopIndex];
      const wp = loop[agent.wpIndex];
      const dx = wp.x - v.pos.x;
      const dz = wp.z - v.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 14) {
        agent.wpIndex = (agent.wpIndex + 1) % loop.length;
      }

      const desiredYaw = Math.atan2(dx, dz);
      let yawErr = desiredYaw - v.yaw;
      while (yawErr > Math.PI) yawErr -= Math.PI * 2;
      while (yawErr < -Math.PI) yawErr += Math.PI * 2;

      // Check forward clearance for yielding to player or other vehicles
      const fwdX = Math.sin(v.yaw);
      const fwdZ = Math.cos(v.yaw);
      let blockedAhead = false;
      for (const other of this.vehicleSystem.vehicles) {
        if (other === v) continue;
        const ox = other.pos.x - v.pos.x;
        const oz = other.pos.z - v.pos.z;
        const forwardDot = ox * fwdX + oz * fwdZ;
        const sideDot = Math.abs(ox * fwdZ - oz * fwdX);
        if (forwardDot > 1.5 && forwardDot < 13.5 && sideDot < 3.1) {
          blockedAhead = true;
          break;
        }
      }
      if (!playerVehicle) {
        const px = playerPos.x - v.pos.x;
        const pz = playerPos.z - v.pos.z;
        const pdot = px * fwdX + pz * fwdZ;
        const pside = Math.abs(px * fwdZ - pz * fwdX);
        if (pdot > 1 && pdot < 10 && pside < 2.6) blockedAhead = true;
      }

      const targetSpeed = this.panicTimer > 0 && v.pos.distanceTo(this.panicOrigin) < 55
        ? agent.cruiseSpeed * 1.45
        : (blockedAhead ? 0 : agent.cruiseSpeed);

      const throttle = blockedAhead ? -0.8 : (v.speed < targetSpeed ? 0.62 : 0.05);
      const steer = THREE.MathUtils.clamp(yawErr * 1.55, -1, 1);
      this.vehicleSystem.updateDrivingPhysics(v, { throttle, steer, handbrake: blockedAhead, nitro: false }, dt);
    }

    // 2) Pedestrians strolling & fleeing gunfire/danger
    for (const ped of this.pedestrians) {
      if (!ped.alive) continue;
      let moveSpeed = ped.speed;
      if (this.panicTimer > 0 && ped.pos.distanceTo(this.panicOrigin) < 42) {
        ped.fleeing = true;
        ped.yaw = Math.atan2(ped.pos.x - this.panicOrigin.x, ped.pos.z - this.panicOrigin.z);
        moveSpeed = 5.4;
      } else {
        ped.fleeing = false;
        // Gentle promenade patrol around home area
        const distHome = Math.hypot(ped.pos.x - ped.home.x, ped.pos.z - ped.home.z);
        if (distHome > 22) {
          ped.yaw = Math.atan2(ped.home.x - ped.pos.x, ped.home.z - ped.pos.z);
        } else {
          ped.yaw += Math.sin(ped.walkCycle * 0.25) * 0.28 * dt;
        }
      }

      const nx = ped.pos.x + Math.sin(ped.yaw) * moveSpeed * dt;
      const nz = ped.pos.z + Math.cos(ped.yaw) * moveSpeed * dt;
      if (!this.cityWorld.isWater(nx, nz)) {
        let hit = false;
        for (const c of this.cityWorld.colliders) {
          if (nx + 0.5 > c.minX && nx - 0.5 < c.maxX && nz + 0.5 > c.minZ && nz - 0.5 < c.maxZ) {
            hit = true;
            break;
          }
        }
        if (!hit) {
          ped.pos.x = nx;
          ped.pos.z = nz;
        } else {
          ped.yaw += Math.PI * 0.65;
        }
      } else {
        ped.yaw += Math.PI * 0.75;
      }
      ped.pos.y = Math.max(0.2, this.cityWorld.getTerrainHeight(ped.pos.x, ped.pos.z));
      ped.walkCycle += moveSpeed * dt * 1.8;
      ped.rig.root.position.copy(ped.pos);
      ped.rig.root.rotation.y = ped.yaw;
      ped.rig.animatePose(ped.walkCycle, moveSpeed, false, dt);
    }
  }
}

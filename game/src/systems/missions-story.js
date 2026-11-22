// Cala Solara — 8-Mission Multi-Stage Story Campaign, Character Radio Comms & 3D Objective Beacons

import * as THREE from 'three';
import { WORLD_CONFIG } from '../config.js';
import { boulevardZAtX } from '../world/city-world.js';
import { createStylizedCharacterRig } from '../entities/characters.js';

export const STORY_CAMPAIGN = [
  {
    id: 'm1',
    title: 'Sunset Run on Avenida del Sol',
    district: 'palmera',
    reward: 3500,
    controlGain: 25,
    stages: [
      { type: 'goto', label: 'Hit the Palmera Strip drop before CSPD locks down the coast', pos: { x: -115, z: boulevardZAtX(-115) }, radius: 14, wanted: 2, comms: { speaker: 'Tomas Delgado', initials: 'TD', color: '#ffcf40', text: 'CSPD interceptors spotted your GT-R off Hotel Coral. Keep the throttle pinned down Avenida del Sol!' } },
      { type: 'goto', label: 'Shake the 3★ pursuit and reach Solara Customs Marina', pos: { x: 148, z: 24 }, radius: 16, wanted: 3, comms: { speaker: 'Nadia Reyes', initials: 'NR', color: '#45d9ff', text: 'Roadblock ahead near Miramar! Use [Q] for radar scramble or drift past into Puerto Caldera.' } },
    ],
  },
  {
    id: 'm2',
    title: 'Plaza de la Fiesta Ambush',
    district: 'barrio',
    reward: 4800,
    controlGain: 30,
    stages: [
      { type: 'combat', label: 'Clear cartel enforcers in Plaza de la Fiesta & secure the V8 Coupe', pos: { x: -220, z: -20 }, enemyCount: 5, radius: 18, wanted: 2, comms: { speaker: 'Mateo Cruz', initials: 'MC', color: '#ff6b4a', text: 'Cartel gunmen boxed in the fountain plaza! Take cover behind the stalls—I am laying down covering fire.' } },
      { type: 'goto', label: 'Escape Barrio Viejo in the Caldera V8 to Financial Plaza', pos: { x: 0, z: -45 }, radius: 16, wanted: 2, comms: { speaker: 'Camila Vega', initials: 'CV', color: '#ff5a7d', text: 'Plaza is ours. Grabbing the V8 Coupe and heading east toward the Financial Core!' } },
    ],
  },
  {
    id: 'm3',
    title: 'Gantry Crane Contraband',
    district: 'puerto',
    reward: 5600,
    controlGain: 25,
    stages: [
      { type: 'combat', label: 'Eliminate harbor guards under the Puerto Caldera cranes', pos: { x: 178, z: -112 }, enemyCount: 5, radius: 18, wanted: 2, comms: { speaker: 'Nadia Reyes', initials: 'NR', color: '#45d9ff', text: 'Manifest points to the red shipping containers under Crane 01. Clear the yard.' } },
      { type: 'goto', label: 'Deliver the manifest to Safehouse Marina', pos: { x: 162, z: 24 }, radius: 15, wanted: 3, comms: { speaker: 'Tomas Delgado', initials: 'TD', color: '#ffcf40', text: 'Harbor patrol is closing in—bring the manifest straight to Solara Customs!' } },
    ],
  },
  {
    id: 'm4',
    title: 'Skyline Vault Extraction',
    district: 'core',
    reward: 7200,
    controlGain: 35,
    stages: [
      { type: 'goto', label: 'Breach Solara Spire Plaza in the Financial Core', pos: { x: 0, z: -110 }, radius: 15, wanted: 2, comms: { speaker: 'Nadia Reyes', initials: 'NR', color: '#45d9ff', text: 'Security grid is looped for 90 seconds. Pull up to Solara Spire Plaza now.' } },
      { type: 'combat', label: 'Neutralize private security at the Obelisk Fountain', pos: { x: 0, z: -70 }, enemyCount: 6, radius: 20, wanted: 3, comms: { speaker: 'Mateo Cruz', initials: 'MC', color: '#ff6b4a', text: 'Heavy security rushing from the lobby! Watch your flanks and light up their cruisers!' } },
      { type: 'goto', label: 'Evade CSPD and return to Palmera Boardwalk', pos: { x: -60, z: boulevardZAtX(-60) }, radius: 16, wanted: 4, comms: { speaker: 'Camila Vega', initials: 'CV', color: '#ff5a7d', text: 'Vault bearer bonds secured. Punching south toward the beach strip!' } },
    ],
  },
  {
    id: 'm5',
    title: 'Bay Speedboat Smuggle',
    district: 'puerto',
    reward: 6400,
    controlGain: 20,
    stages: [
      { type: 'goto', label: 'Board the Cala WaveRunner at Marina Pier 2', pos: { x: 236, z: 24 }, radius: 14, wanted: 1, comms: { speaker: 'Tomas Delgado', initials: 'TD', color: '#ffcf40', text: 'Fuelled the WaveRunner at Pier 2. Take it across the turquoise lagoon to Monte Faro cove!' } },
      { type: 'goto', label: 'Pilot across the bay to Monte Faro South Cove', pos: { x: 342, z: 190 }, radius: 22, wanted: 2, comms: { speaker: 'Nadia Reyes', initials: 'NR', color: '#45d9ff', text: 'Keep it wide open over the chop—signal drop buoy is glowing off Monte Faro.' } },
    ],
  },
  {
    id: 'm6',
    title: 'Hotel Coral High-Roller Takedown',
    district: 'palmera',
    reward: 8100,
    controlGain: 30,
    stages: [
      { type: 'combat', label: 'Crash the syndicate meeting outside Hotel Coral', pos: { x: -168, z: boulevardZAtX(-168) - 8 }, enemyCount: 6, radius: 18, wanted: 3, comms: { speaker: 'Camila Vega', initials: 'CV', color: '#ff5a7d', text: 'The rival bosses are splitting our Palmera Strip cut out front of Hotel Coral. End it.' } },
      { type: 'goto', label: 'Outrun SWAT BearCats back to Barrio Viejo Plaza', pos: { x: -220, z: -20 }, radius: 16, wanted: 4, comms: { speaker: 'Mateo Cruz', initials: 'MC', color: '#ff6b4a', text: 'SWAT BearCat rolling in! Hit the alleyways into Barrio Viejo to lose them.' } },
    ],
  },
  {
    id: 'm7',
    title: 'Puente del Sol 5★ Lockdown',
    district: 'puente',
    reward: 11500,
    controlGain: 45,
    stages: [
      { type: 'goto', label: 'Punch east across Puente del Sol under 5★ Air-1 lockdown to Faro Lighthouse', pos: { x: 422, z: 150 }, radius: 22, wanted: 5, comms: { speaker: 'Nadia Reyes', initials: 'NR', color: '#45d9ff', text: 'Air-1 has a searchlight lock on Puente del Sol! Smash through the SWAT barricade and reach Faro Lighthouse!' } },
    ],
  },
  {
    id: 'm8',
    title: 'Crown of Monte Faro',
    district: 'faro',
    reward: 18000,
    controlGain: 60,
    stages: [
      { type: 'combat', label: 'Storm the Monte Faro Cliffside Villa syndicate compound', pos: { x: 388, z: 156 }, enemyCount: 7, radius: 22, wanted: 4, comms: { speaker: 'Camila Vega', initials: 'CV', color: '#ff5a7d', text: 'This is the final push. Take the cliffside villa and Cala Solara belongs to our crew.' } },
      { type: 'goto', label: 'Claim the Faro Solara Lighthouse overlook', pos: { x: 432, z: 152 }, radius: 16, wanted: 5, comms: { speaker: 'Mateo Cruz', initials: 'MC', color: '#ff6b4a', text: 'Compound clear! Meet at the lighthouse beacon—we own the bay!' } },
    ],
  },
];

export class MissionDirector {
  constructor(scene, cityWorld, combatSystem, policeSystem, crewTurf) {
    this.scene = scene;
    this.cityWorld = cityWorld;
    this.combatSystem = combatSystem;
    this.policeSystem = policeSystem;
    this.crewTurf = crewTurf;

    this.activeMissionIndex = 0;
    this.stageIndex = 0;
    this.completedIds = new Set();
    this.hostiles = [];
    this.activeComms = null;
    this.commsTimer = 0;

    // Luminous 3D vertical waypoint beacon
    this.beaconGroup = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffc44d,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.beaconBeam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.2, 46, 16, 1, true), beamMat);
    this.beaconBeam.position.y = 23;
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffcf6e,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    this.beaconRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.6, 24), ringMat);
    this.beaconRing.rotation.x = -Math.PI * 0.5;
    this.beaconRing.position.y = 0.25;
    this.beaconGroup.add(this.beaconBeam, this.beaconRing);
    scene.add(this.beaconGroup);

    this.startMission(0, false);
  }

  get currentMission() {
    return STORY_CAMPAIGN[this.activeMissionIndex] || STORY_CAMPAIGN[0];
  }

  get currentStage() {
    const m = this.currentMission;
    return m.stages[this.stageIndex] || m.stages[0];
  }

  clearHostiles() {
    for (const h of this.hostiles) {
      this.scene.remove(h.rig.root);
    }
    this.hostiles = [];
    this.combatSystem.setHostiles(this.hostiles);
  }

  startMission(index, triggerWanted = true) {
    this.activeMissionIndex = ((index % STORY_CAMPAIGN.length) + STORY_CAMPAIGN.length) % STORY_CAMPAIGN.length;
    this.stageIndex = 0;
    this.setupStage(triggerWanted);
  }

  setupStage(triggerWanted = true) {
    this.clearHostiles();
    const st = this.currentStage;
    const y = Math.max(0.25, this.cityWorld.getTerrainHeight(st.pos.x, st.pos.z));
    this.beaconGroup.position.set(st.pos.x, y, st.pos.z);
    this.beaconGroup.visible = true;
    // Keep combat arenas crisp without a giant yellow beam washing out the center
    this.beaconBeam.visible = st.type !== 'combat';

    if (st.comms) {
      this.activeComms = st.comms;
      this.commsTimer = 8.0;
    }
    if (triggerWanted && st.wanted) {
      this.policeSystem.setWantedLevel(Math.max(this.policeSystem.wantedLevel, st.wanted));
    }

    if (st.type === 'combat') {
      const count = st.enemyCount || 5;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + 0.4;
        const dist = 7 + (i % 3) * 4.5;
        const ex = st.pos.x + Math.cos(ang) * dist;
        const ez = st.pos.z + Math.sin(ang) * dist;
        const ey = Math.max(0.25, this.cityWorld.getTerrainHeight(ex, ez));
        const rig = createStylizedCharacterRig({
          jacket: i % 2 === 0 ? 0x262936 : 0x5c2330,
          shirt: 0x1a1e28,
          pants: 0x171a22,
          skin: 0xc98f68,
          hair: 0x1a1618,
          sunglasses: true,
          weaponId: i % 3 === 0 ? 'carbine' : 'smg',
        });
        rig.root.position.set(ex, ey, ez);
        this.scene.add(rig.root);
        this.hostiles.push({
          rig,
          pos: new THREE.Vector3(ex, ey, ez),
          yaw: ang + Math.PI,
          hp: 65,
          maxHp: 65,
          alive: true,
          fireCd: 0.8 + Math.random() * 1.1,
          walkCycle: i,
        });
      }
      this.combatSystem.setHostiles(this.hostiles);
    }
  }

  getObjectiveText() {
    const st = this.currentStage;
    if (st.type === 'combat') {
      const rem = this.hostiles.filter((h) => h.alive).length;
      return `${st.label} (${rem} left)`;
    }
    return st.label;
  }

  update(dt, player, atmosphere, onToast) {
    if (this.commsTimer > 0) this.commsTimer = Math.max(0, this.commsTimer - dt);
    this.beaconRing.rotation.z += dt * 1.8;

    const st = this.currentStage;
    const pPos = player.pos;

    // Update active cartel/syndicate hostiles
    for (const h of this.hostiles) {
      if (!h.alive) continue;
      const dx = pPos.x - h.pos.x;
      const dz = pPos.z - h.pos.z;
      const dist = Math.hypot(dx, dz);
      h.yaw = Math.atan2(dx, dz);

      let spd = 0;
      if (dist > 15 && dist < 68) {
        spd = 4.2;
        const nx = h.pos.x + (dx / dist) * spd * dt;
        const nz = h.pos.z + (dz / dist) * spd * dt;
        if (!this.cityWorld.isWater(nx, nz)) {
          h.pos.x = nx;
          h.pos.z = nz;
        }
      }
      h.pos.y = Math.max(0.25, this.cityWorld.getTerrainHeight(h.pos.x, h.pos.z));
      h.walkCycle += spd * dt * 1.8;
      h.rig.root.position.copy(h.pos);
      h.rig.root.rotation.y = h.yaw;
      h.rig.animatePose(h.walkCycle, spd, dist < 44, dt);

      h.fireCd -= dt;
      if (h.fireCd <= 0 && dist < 44) {
        h.fireCd = 1.05 + Math.random() * 0.7;
        const muzzle = h.rig.getMuzzleWorldPos();
        const aim = pPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.8, 1.1, (Math.random() - 0.5) * 1.8));
        atmosphere.spawnMuzzleFlash(muzzle, aim.clone().sub(muzzle).normalize(), 0xffb35c);
        atmosphere.spawnTracer(muzzle, aim, 0xffaa55, 0.09);
        if (Math.random() < 0.24) {
          if (player.vehicle) player.vehicle.hp = Math.max(10, player.vehicle.hp - 4);
          else player.takeDamage(5);
        }
      }
    }

    // Check stage completion
    let stageDone = false;
    if (st.type === 'goto') {
      const dist = Math.hypot(pPos.x - st.pos.x, pPos.z - st.pos.z);
      if (dist <= st.radius) stageDone = true;
    } else if (st.type === 'combat') {
      const alive = this.hostiles.filter((h) => h.alive).length;
      if (alive === 0) stageDone = true;
    }

    if (stageDone) {
      const m = this.currentMission;
      if (this.stageIndex + 1 < m.stages.length) {
        this.stageIndex += 1;
        this.setupStage(true);
        if (onToast) onToast(`STAGE COMPLETE — ${this.currentStage.label}`);
      } else {
        this.completedIds.add(m.id);
        player.cash += m.reward;
        this.crewTurf.addDistrictControl(m.district, m.controlGain);
        if (onToast) onToast(`MISSION COMPLETE: ${m.title} (+$${m.reward.toLocaleString()})`);
        const nextIdx = (this.activeMissionIndex + 1) % STORY_CAMPAIGN.length;
        this.startMission(nextIdx, false);
      }
    }
  }
}

// Cala Solara — Main 3D Open-World Engine, Third-Person Camera, Controls & Live Game Loop

import * as THREE from 'three';
import { WORLD_CONFIG } from './config.js';
import { BloomPostProcessor } from './render/postfx.js';
import { createPbrTextureLibrary } from './render/materials.js';
import { CityWorld, boulevardZAtX } from './world/city-world.js';
import { buildDistrictLandmarks } from './world/districts.js';
import { AtmosphereAndVfxSystem } from './world/atmosphere.js';
import { VehicleSystem } from './entities/vehicles.js';
import { PlayerController } from './entities/characters.js';
import { TrafficAndCrowdSystem } from './entities/traffic-crowds.js';
import { PoliceDispatchSystem } from './systems/police-dispatch.js';
import { CombatAndDestructionSystem } from './systems/combat-weapons.js';
import { MissionDirector } from './systems/missions-story.js';
import { CrewAndTurfSystem } from './systems/crew-turf.js';
import { AudioAndRadioEngine } from './audio/radio-sfx.js';
import { HudAndMinimap } from './ui/hud-minimap.js';

export class CalaSolaraGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // PostFX outputs gamma-encoded ACES filmic

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.3, 1200);

    // Core visual & world systems
    this.postfx = new BloomPostProcessor(this.renderer, window.innerWidth, window.innerHeight);
    this.textures = createPbrTextureLibrary();
    this.atmosphere = new AtmosphereAndVfxSystem(this.scene, this.textures, this.postfx);
    this.cityWorld = new CityWorld(this.scene, this.textures);
    const districtFx = buildDistrictLandmarks(this.scene, this.cityWorld, this.textures);
    this.atmosphere.registerDistrictEffects(districtFx.emissiveMaterials, districtFx.animatedProps);

    // Audio, entities & gameplay systems
    this.audio = new AudioAndRadioEngine();
    this.vehicleSystem = new VehicleSystem(this.scene, this.cityWorld, this.atmosphere, this.audio);
    this.player = new PlayerController(this.scene, this.cityWorld, this.vehicleSystem);
    this.trafficSystem = new TrafficAndCrowdSystem(this.scene, this.cityWorld, this.vehicleSystem);
    this.policeSystem = new PoliceDispatchSystem(this.scene, this.cityWorld, this.vehicleSystem, this.atmosphere, this.audio);
    this.combatSystem = new CombatAndDestructionSystem(
      this.scene, this.cityWorld, this.vehicleSystem, this.policeSystem, this.trafficSystem, this.atmosphere, this.audio
    );
    this.crewTurf = new CrewAndTurfSystem(this.scene, this.cityWorld, this.vehicleSystem, this.policeSystem, this.atmosphere);
    this.missions = new MissionDirector(this.scene, this.cityWorld, this.combatSystem, this.policeSystem, this.crewTurf);

    // Spawn hero starting vehicles at Safehouse Marina & Palmera Strip
    this.heroCar = this.vehicleSystem.spawnVehicle('supercar', 168, 30, 0.45, { color: 0x00d9e8, role: 'player' });
    this.heroMoto = this.vehicleSystem.spawnVehicle('moto', 173, 25, 0.9, { color: 0xff3355, role: 'civilian' });
    this.vehicleSystem.spawnVehicle('boat', WORLD_CONFIG.marinaBoatPos.x, WORLD_CONFIG.marinaBoatPos.z, Math.PI * 0.5, { color: 0xf7fafc, role: 'civilian' });

    // Input & camera state
    this.mode = 'title'; // 'title' | 'play'
    this.camYaw = 0;
    this.camPitch = 0.24;
    this.camPos = new THREE.Vector3(160, 12, 52);
    this.camLook = new THREE.Vector3(160, 2, 24);
    this.cameraOverride = null;
    this.flyoverAngle = 0;
    this.input = { keys: {}, mouseLeft: false, mouseRight: false };

    this.hud = new HudAndMinimap(this);
    this.bindEvents();

    // Check URL scene preset for live gameplay states / inspection
    const params = new URLSearchParams(window.location.search);
    const sceneParam = params.get('scene');
    if (sceneParam) {
      this.enterLiveScenario(sceneParam);
    }

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    window.__CALA_SOLARA__ = this;
  }

  startPlay(enterDefaultCar = true) {
    this.mode = 'play';
    this.cameraOverride = null;
    this.audio.unlock();
    this.hud.setTitleVisible(false);
    if (enterDefaultCar) {
      this.player.enterVehicle(this.heroCar);
      this.camYaw = this.heroCar.yaw;
    } else {
      this.camYaw = this.player.yaw;
    }
    this.hud.showRadioBanner(this.audio.currentStation.name);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.postfx.resize(w, h);
    });

    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      if (this.mode !== 'play') {
        if (e.code === 'Enter' || e.code === 'Space') this.startPlay();
        return;
      }
      this.audio.unlock();

      if (e.code === 'KeyM' || e.code === 'Tab') {
        e.preventDefault();
        this.hud.toggleHub();
        return;
      }
      if (this.hud.hubOpen) {
        if (e.code === 'Escape') this.hud.toggleHub(false);
        return;
      }

      if (e.code === 'KeyF') this.handleVehicleInteract();
      else if (e.code === 'KeyQ') this.crewTurf.triggerAbility(this.player, (t) => this.hud.showToast(t));
      else if (e.code === 'KeyC') {
        const m = this.crewTurf.cycleCrew();
        this.hud.showToast(`ACTIVE CREW: ${m.name} (${m.role})`);
      } else if (e.code === 'KeyR') {
        const st = this.audio.cycleStation();
        this.hud.showRadioBanner(st.name);
      } else if (e.code === 'KeyN') {
        const muted = this.audio.toggleMute();
        this.hud.showToast(muted ? 'AUDIO MUTED' : 'AUDIO UNMUTED');
      } else if (e.code === 'KeyT') {
        const name = this.atmosphere.cyclePreset();
        this.hud.showToast(`TIME OF DAY: ${name}`);
      } else if (e.code === 'AltLeft' || e.code === 'KeyV') {
        this.player.startDodgeRoll(this.camYaw);
      } else if (e.code >= 'Digit1' && e.code <= 'Digit5') {
        this.player.selectWeapon(Number(e.code.slice(5)) - 1);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.mode !== 'play' || this.hud.hubOpen) return;
      this.audio.unlock();
      if (e.button === 0) this.input.mouseLeft = true;
      if (e.button === 2) this.input.mouseRight = true;
      if (document.pointerLockElement !== this.canvas && this.canvas.requestPointerLock) {
        this.canvas.requestPointerLock();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.input.mouseLeft = false;
      if (e.button === 2) this.input.mouseRight = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      if (this.mode !== 'play' || this.hud.hubOpen) return;
      if (document.pointerLockElement === this.canvas || this.input.mouseRight || this.input.mouseLeft) {
        this.camYaw -= e.movementX * 0.0032;
        this.camPitch = THREE.MathUtils.clamp(this.camPitch + e.movementY * 0.0026, -0.18, 0.72);
      }
    });
  }

  handleVehicleInteract() {
    if (this.player.vehicle) {
      this.player.exitVehicle();
      return;
    }
    const near = this.player.findNearestVehicle(6.8);
    if (near) {
      const wasCiv = near.role === 'civilian';
      this.player.enterVehicle(near);
      this.camYaw = near.yaw;
      if (wasCiv) {
        this.policeSystem.addHeat(35, 'GRAND THEFT AUTO');
        this.hud.showToast(`STOLEN: ${near.spec.name.toUpperCase()}`);
      }
    }
  }

  // Live playable scenarios used both for rapid QA playtesting and authentic browser captures
  enterLiveScenario(name) {
    this.mode = 'play';
    this.hud.setTitleVisible(false);
    this.hud.toggleHub(false);
    this.cameraOverride = null;

    if (name === 'cover-chase') {
      // Scenario 1: Golden-Hour Oceanfront Boulevard Drift Pursuit (heading east toward mission & bridge!)
      this.atmosphere.applyPreset('golden');
      this.missions.startMission(0, false);
      this.missions.stageIndex = 1;
      this.missions.setupStage(false);
      this.missions.commsTimer = 0;

      const x = -114;
      const z = boulevardZAtX(x) + 1.2;
      const dx = 18;
      const dz = boulevardZAtX(x + dx) - boulevardZAtX(x);
      const roadYaw = Math.atan2(dx, dz);

      this.heroCar.pos.set(x, 0.35, z);
      this.heroCar.yaw = roadYaw + 0.22; // Dynamic drift slip angle!
      this.heroCar.vel.set(Math.sin(roadYaw) * 35, 0, Math.cos(roadYaw) * 35);
      this.heroCar.speed = 35;
      this.heroCar.nitro = 84;
      this.heroCar.root.position.copy(this.heroCar.pos);
      this.heroCar.root.rotation.y = this.heroCar.yaw;
      this.heroCar.bodyPivot.rotation.z = -0.075;
      for (const cone of this.heroCar.nitroCones) cone.material.opacity = 0.72;
      this.player.enterVehicle(this.heroCar);

      // Soft billowing drift smoke & twin dark rubber skidmarks behind rear tires
      for (let i = 0; i < 10; i++) {
        const back = new THREE.Vector3((i % 2 ? -0.92 : 0.92), 0.14, -2.5 - i * 1.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heroCar.yaw).add(this.heroCar.pos);
        this.atmosphere.spawnSkidMark(back, roadYaw);
        this.atmosphere.spawnSprite(back.clone().add(new THREE.Vector3(0, 0.35, 0)), new THREE.Vector3(-1.2, 0.9, 0), {
          color: 0xeaeef5, size: 1.3 + (i * 0.14), grow: 1.4, life: 3.5, opacity: 0.34,
        });
      }

      // 3★ CSPD PIT & Flank pursuit visibly closing in + ahead roadblock with flares & oncoming convertible!
      this.policeSystem.setWantedLevel(3, 'OCEANFRONT PURSUIT');
      const copFlank = this.vehicleSystem.spawnVehicle('police', x - 3.5, z - 5.2, roadYaw + 0.16, { sirenOn: true, role: 'police' });
      const copAhead = this.vehicleSystem.spawnVehicle('police', x + 22, boulevardZAtX(x + 22) + 4.4, roadYaw + Math.PI - 0.18, { sirenOn: true, role: 'police' });
      this.policeSystem.units.push({ vehicle: copFlank, tactic: 'PIT', swatsDismounted: false }, { vehicle: copAhead, tactic: 'PURSUIT', swatsDismounted: false });
      this.policeSystem.deployRoadblockAndSpikes(x + 42, boulevardZAtX(x + 42), roadYaw + Math.PI, false);
      this.vehicleSystem.spawnVehicle('convertible', x + 13, boulevardZAtX(x + 13) - 4.8, roadYaw, { color: 0xff5a87, role: 'civilian' });

      // Dramatic low 3/4 rear golden-hour chase camera: neon hotels left, turquoise beach right, flanking cop + roadblock ahead!
      const camPos = new THREE.Vector3(x - 10.8, 3.65, z + 6.2);
      const camLook = new THREE.Vector3(x + 24, 3.2, boulevardZAtX(x + 24) - 2.0);
      this.cameraOverride = { pos: camPos, look: camLook, fov: 62 };
    } else if (name === 'onfoot-combat') {
      // Scenario 2: Bright Sunlit Noon Fiesta Plaza Firefight & Carjacking (clear unobstructed line-of-fire!)
      this.atmosphere.applyPreset('day');
      this.missions.startMission(1, false);
      this.missions.commsTimer = 0;
      this.player.cash = 18400;
      this.player.ammo[1].mag = 21;

      const pc = WORLD_CONFIG.plazaCenter;
      if (this.player.vehicle) this.player.exitVehicle();
      this.player.selectWeapon(1); // Viper SMG
      this.player.pos.set(pc.x - 10.5, 0.36, pc.z + 20.5);

      // Clear any stray strolling pedestrians right next to Camila's elbow
      for (const ped of this.trafficSystem.pedestrians) {
        if (ped.pos.distanceTo(this.player.pos) < 16) {
          ped.pos.set(pc.x - 28, 0.36, pc.z - 22);
          ped.rig.root.position.copy(ped.pos);
        }
      }

      // Position 3 clearly visible cartel gunmen ~15-19m away on the sunlit cobblestone plaza!
      const enemyCoords = [
        [pc.x + 6.5, pc.z + 11.5],
        [pc.x + 12.5, pc.z + 16.5],
        [pc.x + 3.5, pc.z + 5.0],
      ];
      enemyCoords.forEach(([ex, ez], idx) => {
        const h = this.missions.hostiles[idx];
        if (!h) return;
        h.pos.set(ex, 0.36, ez);
        h.rig.root.position.copy(h.pos);
        h.rig.root.rotation.y = Math.atan2(this.player.pos.x - ex, this.player.pos.z - ez);
        h.rig.animatePose(0.5 + idx, 0, true, 0.016);
      });

      const leadTarget = this.missions.hostiles[0];
      this.player.yaw = Math.atan2(leadTarget.pos.x - this.player.pos.x, leadTarget.pos.z - this.player.pos.z);
      this.player.aiming = true;
      this.player.rig.root.position.copy(this.player.pos);
      this.player.rig.root.rotation.y = this.player.yaw;
      this.player.rig.animatePose(0, 0, true, 0.016);
      this.player.rig.root.updateMatrixWorld(true);

      // Active Mateo Crew Ally returning fire beside Camila
      const ally = this.crewTurf.spawnEnforcerAlly(new THREE.Vector3(pc.x - 13.8, 0.36, pc.z + 17.5), this.player.yaw, 30);
      ally.rig.animatePose(0, 0, true, 0.016);
      ally.rig.root.updateMatrixWorld(true);

      // Gleaming parked orange Caldera V8 Muscle Coupe fully framed on the right foreground triggering [F] STEAL!
      this.vehicleSystem.spawnVehicle('muscle', pc.x - 6.2, pc.z + 23.2, 1.05, { color: 0xff6b35, role: 'civilian' });

      // Arriving CSPD cruiser with flashing red/blue lightbar in the background plaza archway
      this.policeSystem.setWantedLevel(2, 'PLAZA SHOOTOUT');
      const cop = this.vehicleSystem.spawnVehicle('police', pc.x + 21, pc.z + 16, -1.65, { sirenOn: true, role: 'police' });
      this.policeSystem.units.push({ vehicle: cop, tactic: 'PURSUIT', swatsDismounted: false });

      // Over-the-shoulder ADS camera aimed straight through center crosshair onto leadTarget!
      const targetAimPt = leadTarget.pos.clone().add(new THREE.Vector3(0, 1.25, 0));
      const fwd = new THREE.Vector3(Math.sin(this.player.yaw), 0, Math.cos(this.player.yaw));
      const right = new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
      const camPos = this.player.pos.clone().addScaledVector(fwd, -5.2).addScaledVector(right, 1.45).add(new THREE.Vector3(0, 2.15, 0));
      this.cameraOverride = { pos: camPos, look: targetAimPt, fov: 56 };

      // Exact barrel-to-target muzzle flash, single aligned tracer streak & vivid hit sparks!
      const muzzle = this.player.rig.getMuzzleWorldPos();
      this.atmosphere.spawnMuzzleFlash(muzzle, targetAimPt.clone().sub(muzzle).normalize(), 0xffe49e);
      this.atmosphere.spawnTracer(muzzle, targetAimPt, 0xffe69c, 2.5);
      this.atmosphere.spawnImpactSparks(targetAimPt, 14, 0xffc857);
      const secondTarget = this.missions.hostiles[1].pos.clone().add(new THREE.Vector3(0, 1.25, 0));
      const allyMuzzle = ally.rig.getMuzzleWorldPos();
      this.atmosphere.spawnMuzzleFlash(allyMuzzle, secondTarget.clone().sub(allyMuzzle).normalize(), 0xffd07a);
      this.atmosphere.spawnTracer(allyMuzzle, secondTarget, 0xffd07a, 2.5);
    } else if (name === 'bridge-lockdown') {
      // Scenario 3: Neon Dusk 5★ Puente del Sol Lockdown — driving DIRECTLY EAST toward Faro Lighthouse & GPS route!
      this.atmosphere.applyPreset('dusk');
      this.missions.startMission(6, false); // Mission 7 -> Faro Lighthouse (422, 150)
      this.missions.commsTimer = 0;
      this.player.cash = 42600;
      this.player.selectWeapon(3); // Caldera Carbine

      const pCar = this.cityWorld.getBridgePoint(0.36);
      const pAhead = this.cityWorld.getBridgePoint(0.68);
      const bridgeYaw = Math.atan2(pAhead.x - pCar.x, pAhead.z - pCar.z);

      this.heroCar.pos.set(pCar.x, pCar.y, pCar.z);
      this.heroCar.yaw = bridgeYaw;
      this.heroCar.vel.set(Math.sin(bridgeYaw) * 39, 0, Math.cos(bridgeYaw) * 39);
      this.heroCar.speed = 39;
      this.heroCar.nitro = 94;
      this.heroCar.root.position.copy(this.heroCar.pos);
      this.heroCar.root.rotation.y = bridgeYaw;
      for (const cone of this.heroCar.nitroCones) cone.material.opacity = 0.78;
      this.player.enterVehicle(this.heroCar);

      // 5★ Air-1 Lockdown + close-up SWAT BearCat roadblock & spikes + blazing fiery orange+dark-smoke cruiser explosion!
      this.policeSystem.setWantedLevel(5, 'PUENTE DEL SOL');
      const pRb = this.cityWorld.getBridgePoint(0.46);
      this.policeSystem.deployRoadblockAndSpikes(pRb.x, pRb.z, bridgeYaw + Math.PI, true);

      const pBoom = this.cityWorld.getBridgePoint(0.435);
      const rightX = Math.cos(bridgeYaw);
      const rightZ = -Math.sin(bridgeYaw);
      const wreck = this.vehicleSystem.spawnVehicle('police', pBoom.x - rightX * 4.4, pBoom.z - rightZ * 4.4, bridgeYaw + 0.65, { role: 'police' });
      this.vehicleSystem.damageVehicle(wreck, 999);
      this.atmosphere.spawnExplosion(wreck.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), 1.55);

      // Air-1 Helicopter hovering clearly below HUD banner with soft volumetric searchlight cone sweeping onto hero car!
      const ch = this.policeSystem.ensureAirOne();
      const pAir = this.cityWorld.getBridgePoint(0.48);
      this.policeSystem.airOnePos.set(pAir.x - rightX * 11, pAir.y + 13.0, pAir.z - rightZ * 11);
      ch.root.position.copy(this.policeSystem.airOnePos);
      ch.root.lookAt(pCar.x + 10, pAir.y + 9, pCar.z + 2);
      this.policeSystem.aimSearchlightAt(this.heroCar.pos.clone().add(new THREE.Vector3(7, 0.2, 0.4)));

      const pBehind = this.cityWorld.getBridgePoint(0.31);
      const chaser = this.vehicleSystem.spawnVehicle('police', pBehind.x + rightX * 3.8, pBehind.z + rightZ * 3.8, bridgeYaw, { sirenOn: true, role: 'police' });
      this.policeSystem.units.push({ vehicle: chaser, tactic: 'PURSUIT', swatsDismounted: false });

      const camPos = new THREE.Vector3(pCar.x - Math.sin(bridgeYaw) * 10.5 + rightX * 2.5, pCar.y + 4.1, pCar.z - Math.cos(bridgeYaw) * 10.5 + rightZ * 2.5);
      const camLook = new THREE.Vector3(pAhead.x, pAhead.y + 4.2, pAhead.z);
      this.cameraOverride = { pos: camPos, look: camLook, fov: 64 };
    } else if (name === 'world-hub') {
      // Scenario 4: Sunlit Coastal Morning Marina Promenade Vista (Left 58% frames Camila + GT-R + Moto + Yachts + Puente del Sol Bridge + Lighthouse!)
      this.atmosphere.applyPreset('morning');
      this.missions.startMission(2, false);
      this.missions.commsTimer = 0;
      this.policeSystem.clearHeat();
      this.player.cash = 26950;

      if (this.player.vehicle) this.player.exitVehicle();
      this.player.pos.set(174.2, 0.36, 46.5);
      this.player.yaw = 0.55;
      this.player.aiming = false;
      this.player.rig.root.position.copy(this.player.pos);
      this.player.rig.root.rotation.y = this.player.yaw;
      this.player.rig.animatePose(0, 0, false, 0.016);

      // Stagger Lagoon Cyan Solara GT-R & Red Veloce 900R sport bike clearly in foreground looking SE toward Puente del Sol & Faro Lighthouse!
      this.heroCar.pos.set(169.5, 0.36, 48.0);
      this.heroCar.yaw = 0.72;
      this.heroCar.root.position.copy(this.heroCar.pos);
      this.heroCar.root.rotation.y = this.heroCar.yaw;
      for (const cone of this.heroCar.nitroCones) cone.material.opacity = 0;

      if (this.heroMoto) {
        this.heroMoto.pos.set(177.2, 0.36, 44.2);
        this.heroMoto.yaw = 1.05;
        this.heroMoto.root.position.copy(this.heroMoto.pos);
        this.heroMoto.root.rotation.y = this.heroMoto.yaw;
      }

      for (const ped of this.trafficSystem.pedestrians) {
        if (ped.pos.distanceTo(this.player.pos) < 22) {
          ped.pos.set(184, 0.36, -12);
          ped.rig.root.position.copy(ped.pos);
        }
      }

      // Camera frames Camila + GT-R + Moto on foreground left, yachts + turquoise bay + Puente del Sol twin-tower bridge + Monte Faro across center-left!
      this.cameraOverride = {
        pos: new THREE.Vector3(161.5, 4.4, 37.0),
        look: new THREE.Vector3(245, 9.5, 118),
        fov: 58,
      };
      this.hud.hubTab = 'overview';
      this.hud.toggleHub(true);
    }

    // Step atmosphere & HUD once (freezing particle decay so muzzle flashes & fireballs remain crisp!)
    this.atmosphere.update(0.016, this.player.pos, true);
    this.vehicleSystem.updateSirensAndCollisions(0.016);
    this.hud.update(0.016);
  }

  updateCamera(dt) {
    if (this.cameraOverride) {
      this.camera.fov = this.cameraOverride.fov || 62;
      this.camera.updateProjectionMatrix();
      this.camera.position.copy(this.cameraOverride.pos);
      this.camera.lookAt(this.cameraOverride.look);
      return;
    }

    if (this.mode === 'title') {
      // Sweeping golden-hour flyover over Palmera Strip hotels, ocean & Puente del Sol!
      this.flyoverAngle += dt * 0.11;
      const cx = -30 + Math.cos(this.flyoverAngle) * 145;
      const cz = 148 + Math.sin(this.flyoverAngle * 0.8) * 58;
      this.camera.position.set(cx, 38 + Math.sin(this.flyoverAngle * 1.4) * 8, cz);
      this.camera.lookAt(20, 12, 35);
      return;
    }

    const p = this.player;
    if (p.vehicle) {
      // Smooth dynamic chase cam with subtle speed FOV kick
      const v = p.vehicle;
      if (!this.input.mouseRight) {
        let diff = v.yaw - this.camYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.camYaw += diff * Math.min(1, dt * 4.2);
      }
      const dist = v.type === 'boat' ? 11.5 : (v.type === 'swat' ? 10.5 : 8.6);
      const height = v.type === 'swat' ? 4.4 : 3.2;
      const desiredPos = new THREE.Vector3(
        v.pos.x - Math.sin(this.camYaw) * dist,
        v.pos.y + height + this.camPitch * 3.5,
        v.pos.z - Math.cos(this.camYaw) * dist
      );
      const desiredLook = new THREE.Vector3(
        v.pos.x + Math.sin(v.yaw) * 6,
        v.pos.y + 1.4,
        v.pos.z + Math.cos(v.yaw) * 6
      );
      this.camPos.lerp(desiredPos, Math.min(1, dt * 9));
      this.camLook.lerp(desiredLook, Math.min(1, dt * 11));
      const targetFov = 62 + Math.min(12, v.speed * 0.25);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, dt * 6));
      this.camera.updateProjectionMatrix();
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);
    } else {
      // Crisp third-person / over-the-shoulder ADS camera
      const ads = p.aiming;
      const dist = ads ? 3.8 : 6.2;
      const shoulder = ads ? 1.15 : 0.65;
      const fwdX = Math.sin(this.camYaw);
      const fwdZ = Math.cos(this.camYaw);
      const rightX = Math.cos(this.camYaw);
      const rightZ = -Math.sin(this.camYaw);

      const desiredPos = new THREE.Vector3(
        p.pos.x - fwdX * dist + rightX * shoulder,
        p.pos.y + (ads ? 1.95 : 2.5) + this.camPitch * 2.2,
        p.pos.z - fwdZ * dist + rightZ * shoulder
      );
      const desiredLook = new THREE.Vector3(
        p.pos.x + fwdX * 16 + rightX * (shoulder * 0.25),
        p.pos.y + 1.4 - this.camPitch * 6.5,
        p.pos.z + fwdZ * 16 + rightZ * (shoulder * 0.25)
      );
      this.camPos.lerp(desiredPos, Math.min(1, dt * 14));
      this.camLook.lerp(desiredLook, Math.min(1, dt * 16));
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, ads ? 50 : 62, Math.min(1, dt * 10));
      this.camera.updateProjectionMatrix();
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);
    }
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.mode === 'play' && !this.hud.hubOpen && !this.cameraOverride) {
      if (this.player.vehicle) {
        const throttle = (this.input.keys.KeyW || this.input.keys.ArrowUp ? 1 : 0) - (this.input.keys.KeyS || this.input.keys.ArrowDown ? 1 : 0);
        const steer = (this.input.keys.KeyA || this.input.keys.ArrowLeft ? 1 : 0) - (this.input.keys.KeyD || this.input.keys.ArrowRight ? 1 : 0);
        const handbrake = !!this.input.keys.Space;
        const nitro = !!(this.input.keys.ShiftLeft || this.input.keys.ShiftRight);
        this.vehicleSystem.updateDrivingPhysics(this.player.vehicle, { throttle, steer, handbrake, nitro }, dt);
        this.player.pos.copy(this.player.vehicle.pos);
        this.player.yaw = this.player.vehicle.yaw;
      } else {
        this.player.updateOnFoot(this.input, this.camYaw, dt);
      }

      if (this.input.mouseLeft) {
        this.combatSystem.firePlayerWeapon(this.player, this.camera, (kind) => {
          if (kind === 'hostile') this.hud.showToast('HOSTILE DOWN (+$250)');
        });
      }

      this.trafficSystem.update(dt, this.player.pos, this.player.vehicle);
      this.policeSystem.update(dt, this.player, this.combatSystem);
      this.combatSystem.update(dt, this.player);
      this.vehicleSystem.updateSirensAndCollisions(dt);
      this.missions.update(dt, this.player, this.atmosphere, (t) => this.hud.showToast(t));
      this.crewTurf.update(dt, this.player, this.missions.hostiles, (t) => this.hud.showToast(t));
      this.audio.update(dt, this.player.vehicle, this.policeSystem.wantedLevel);

      // Respawn at Safehouse if wasted
      if (this.player.hp <= 0) {
        this.player.hp = 100;
        this.player.armor = 50;
        this.player.cash = Math.max(0, this.player.cash - 500);
        if (this.player.vehicle) this.player.exitVehicle();
        this.player.pos.set(WORLD_CONFIG.safehousePos.x, 0.35, WORLD_CONFIG.safehousePos.z);
        this.policeSystem.clearHeat();
        this.hud.showToast('RECOVERED AT SAFEHOUSE MARINA (-$500)');
      }

      this.hud.update(dt);
    } else if (this.cameraOverride) {
      // Gentle live animation during showcase scenes (waves, rotors, sirens, beacons)
      this.vehicleSystem.updateSirensAndCollisions(dt);
      if (this.policeSystem.airOne && this.policeSystem.airOne.root.visible) {
        this.policeSystem.airOne.mainRotor.rotation.y += dt * 24;
        this.policeSystem.airOne.tailRotor.rotation.x += dt * 32;
      }
      this.hud.update(dt);
    }

    this.atmosphere.update(dt, this.mode === 'title' ? new THREE.Vector3(0, 0, 40) : this.player.pos, !!this.cameraOverride);
    this.updateCamera(dt);
    this.postfx.render(this.scene, this.camera);
  }
}

new CalaSolaraGame();

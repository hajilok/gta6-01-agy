// Cala Solara — Main 3D Open-World Engine, Camera, Controls & District Showcase Loader
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

const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),M=Math;

export class CalaSolaraGame {
  constructor() {
    this.canvas=document.getElementById('game-canvas');const W=innerWidth,H=innerHeight;
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(M.min(devicePixelRatio||1,2));this.renderer.setSize(W,H);
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(62,W/H,0.3,1200);
    this.postfx=new BloomPostProcessor(this.renderer,W,H);this.textures=createPbrTextureLibrary();
    this.atmosphere=new AtmosphereAndVfxSystem(this.scene,this.renderer,this.textures,this.postfx);
    this.cityWorld=new CityWorld(this.scene,this.textures);
    const fx=buildDistrictLandmarks(this.scene,this.cityWorld,this.textures);
    this.atmosphere.registerDistrictEffects(fx.emissiveMaterials,fx.animatedProps);
    this.audio=new AudioAndRadioEngine();
    this.vehicleSystem=new VehicleSystem(this.scene,this.cityWorld,this.atmosphere,this.audio);
    this.player=new PlayerController(this.scene,this.cityWorld,this.vehicleSystem);
    this.trafficSystem=new TrafficAndCrowdSystem(this.scene,this.cityWorld,this.vehicleSystem);
    this.policeSystem=new PoliceDispatchSystem(this.scene,this.cityWorld,this.vehicleSystem,this.atmosphere,this.audio);
    this.combatSystem=new CombatAndDestructionSystem(this.scene,this.cityWorld,this.vehicleSystem,this.policeSystem,this.trafficSystem,this.atmosphere,this.audio);
    this.crewTurf=new CrewAndTurfSystem(this.scene,this.cityWorld,this.vehicleSystem,this.policeSystem,this.atmosphere);
    this.missions=new MissionDirector(this.scene,this.cityWorld,this.combatSystem,this.policeSystem,this.crewTurf);
    this.heroCar=this.vehicleSystem.spawnVehicle('supercar',168,30,0.45,{color:0x00d9e8,role:'player'});
    this.heroMoto=this.vehicleSystem.spawnVehicle('moto',173,25,0.9,{color:0xff3355,role:'civilian'});
    this.vehicleSystem.spawnVehicle('boat',WORLD_CONFIG.marinaBoatPos.x,WORLD_CONFIG.marinaBoatPos.z,M.PI*0.5,{color:0xf7fafc,role:'civilian'});
    this.mode='title';this.camYaw=0;this.camPitch=0.24;this.camPos=V3(160,12,52);this.camLook=V3(160,2,24);
    this.cameraOverride=null;this.flyoverAngle=0;this.input={keys:{},mouseLeft:false,mouseRight:false};
    this.hud=new HudAndMinimap(this);this.bindEvents();
    const sc=new URLSearchParams(location.search).get('scene');if(sc)this.loadShowcaseDistrict(sc);
    this.lastTime=performance.now();this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
    window.__CALA_SOLARA__=this;
  }

  startPlay(enterCar = true) {
    this.mode='play';this.cameraOverride=null;this.audio.unlock();this.hud.setTitleVisible(false);
    if(enterCar){this.player.enterVehicle(this.heroCar);this.camYaw=this.heroCar.yaw;}else this.camYaw=this.player.yaw;
    this.hud.showRadioBanner(this.audio.currentStation.name);
  }

  bindEvents() {
    addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.postfx.resize(innerWidth,innerHeight);});
    addEventListener('keydown',e=>{
      this.input.keys[e.code]=true;
      if(this.mode!=='play'){if(e.code==='Enter'||e.code==='Space')this.startPlay(true);return;}
      this.audio.unlock();
      if(e.code==='KeyM'||e.code==='Tab'){e.preventDefault();this.hud.toggleHub();return;}
      if(this.hud.hubOpen){if(e.code==='Escape')this.hud.toggleHub(false);return;}
      const c=e.code,ts=t=>this.hud.showToast(t);
      if(c==='KeyF')this.handleVehicleInteract();
      else if(c==='KeyQ')this.crewTurf.triggerAbility(this.player,ts);
      else if(c==='KeyC'){const m=this.crewTurf.cycleCrew();ts(`ACTIVE CREW: ${m.name} (${m.role})`);}
      else if(c==='KeyR')this.hud.showRadioBanner(this.audio.cycleStation().name);
      else if(c==='KeyN')ts(this.audio.toggleMute()?'AUDIO MUTED':'AUDIO UNMUTED');
      else if(c==='KeyT')ts(`TIME OF DAY: ${this.atmosphere.cyclePreset()}`);
      else if(c==='AltLeft'||c==='KeyV')this.player.startDodgeRoll(this.camYaw);
      else if(c>='Digit1'&&c<='Digit5')this.player.selectWeapon(+c.slice(5)-1);
    });
    addEventListener('keyup',e=>{this.input.keys[e.code]=false;});
    this.canvas.addEventListener('mousedown',e=>{
      if(this.mode!=='play'||this.hud.hubOpen)return;this.audio.unlock();
      if(e.button===0)this.input.mouseLeft=true;if(e.button===2)this.input.mouseRight=true;
      if(document.pointerLockElement!==this.canvas&&this.canvas.requestPointerLock)this.canvas.requestPointerLock();
    });
    addEventListener('mouseup',e=>{if(e.button===0)this.input.mouseLeft=false;if(e.button===2)this.input.mouseRight=false;});
    addEventListener('contextmenu',e=>e.preventDefault());
    addEventListener('mousemove',e=>{
      if(this.mode!=='play'||this.hud.hubOpen)return;
      if(document.pointerLockElement===this.canvas||this.input.mouseRight||this.input.mouseLeft){this.camYaw-=e.movementX*0.0032;this.camPitch=THREE.MathUtils.clamp(this.camPitch+e.movementY*0.0026,-0.18,0.72);}
    });
  }

  handleVehicleInteract() {
    if(this.player.vehicle){this.player.exitVehicle();return;}
    const n=this.player.findNearestVehicle(6.8);
    if(n){const civ=n.role==='civilian';this.player.enterVehicle(n);this.camYaw=n.yaw;if(civ){this.policeSystem.addHeat(35,'VEHICLE THEFT');this.hud.showToast(`STOLEN: ${n.spec.name.toUpperCase()}`);}}
  }

  loadShowcaseDistrict(name) {
    const p=this.player,hc=this.heroCar,vs=this.vehicleSystem,ps=this.policeSystem,at=this.atmosphere,ms=this.missions;
    this.mode='play';this.hud.setTitleVisible(false);this.hud.toggleHub(false);this.cameraOverride=null;
    const boost=(o,g)=>{for(const c of hc.nitroCones)c.material.opacity=o;if(hc.nitroGlow)hc.nitroGlow.intensity=g;};
    const cop=(x,z,y,t='PURSUIT')=>ps.units.push({vehicle:vs.spawnVehicle('police',x,z,y,{sirenOn:true,role:'police'}),tactic:t,swatsDismounted:false});
    if(name==='cover-chase'){
      at.applyPreset('golden');ms.startMission(0,false);ms.stageIndex=1;ms.setupStage(false);ms.commsTimer=0;
      const x=-114,z=boulevardZAtX(x)+1.2,ry=M.atan2(18,boulevardZAtX(x+18)-boulevardZAtX(x));
      hc.pos.set(x,0.35,z);hc.yaw=ry+0.22;hc.vel.set(M.sin(ry)*35,0,M.cos(ry)*35);hc.speed=35;hc.nitro=84;
      hc.root.position.copy(hc.pos);hc.root.rotation.y=hc.yaw;hc.bodyPivot.rotation.z=-0.075;boost(0.65,3.5);p.enterVehicle(hc);
      for(let i=0;i<8;i++){const bk=V3(i%2?-0.92:0.92,0.14,-2.5-i*0.95).applyAxisAngle(V3(0,1,0),hc.yaw).add(hc.pos);at.spawnSkidMark(bk,ry);at.spawnSprite(bk.clone().add(V3(0,0.35,0)),V3(-1,0.7,0),{color:0xf4e0ca,size:1.15+i*0.14,grow:1,life:3.5,opacity:0.32});}
      ps.setWantedLevel(3,'OCEANFRONT PURSUIT');cop(x-3.2,z-5.2,ry+0.14,'PIT');cop(x+22,boulevardZAtX(x+22)+4.4,ry+M.PI-0.18);
      ps.deployRoadblockAndSpikes(x+44,boulevardZAtX(x+44),ry+M.PI,false);
      vs.spawnVehicle('convertible',x+13,boulevardZAtX(x+13)-4.8,ry,{color:0xff5a87,role:'civilian'});vs.spawnVehicle('suv',x+31,boulevardZAtX(x+31)-5.2,ry,{color:0xf2f4f8,role:'civilian'});
      this.cameraOverride={pos:V3(x-10.6,3.65,z+6),look:V3(x+24,3.4,boulevardZAtX(x+24)-2.4),fov:62};
    }else if(name==='onfoot-combat'){
      at.applyPreset('day');ms.startMission(1,false);ms.commsTimer=0;p.cash=18400;p.ammo[1].mag=21;
      const pc=WORLD_CONFIG.plazaCenter;if(p.vehicle)p.exitVehicle();p.selectWeapon(1);p.pos.set(pc.x-10.2,0.34,pc.z+20.5);
      for(const pd of this.trafficSystem.pedestrians)if(pd.pos.distanceTo(p.pos)<16){pd.pos.set(pc.x-28,0.34,pc.z-22);pd.rig.root.position.copy(pd.pos);}
      [[2.5,11.2],[8.5,16],[1.5,4.8]].forEach(([ox,oz],i)=>{const h=ms.hostiles[i];if(!h)return;h.pos.set(pc.x+ox,0.34,pc.z+oz);h.rig.root.position.copy(h.pos);h.rig.root.rotation.y=M.atan2(p.pos.x-h.pos.x,p.pos.z-h.pos.z);h.rig.animatePose(0.5+i,0,true,0.016);});
      const lead=ms.hostiles[0];p.yaw=M.atan2(lead.pos.x-p.pos.x,lead.pos.z-p.pos.z);p.aiming=true;
      p.rig.root.position.copy(p.pos);p.rig.root.rotation.y=p.yaw;p.rig.animatePose(0,0,true,0.016);p.rig.root.updateMatrixWorld(true);
      const al=this.crewTurf.spawnEnforcerAlly(V3(pc.x-12.2,0.34,pc.z+16.2),p.yaw,30);al.rig.animatePose(0,0,true,0.016);al.rig.root.updateMatrixWorld(true);
      vs.spawnVehicle('muscle',pc.x-5.6,pc.z+23,1.05,{color:0xff6b35,role:'civilian'});ps.setWantedLevel(2,'PLAZA SHOOTOUT');cop(pc.x+19,pc.z+14.5,-1.65);
      const aim=lead.pos.clone().add(V3(0,1.25,0)),fwd=V3(M.sin(p.yaw),0,M.cos(p.yaw)),rt=V3(M.cos(p.yaw),0,-M.sin(p.yaw));
      this.cameraOverride={pos:p.pos.clone().addScaledVector(fwd,-5.6).addScaledVector(rt,0.85).add(V3(0,2.2,0)),look:aim,fov:56};
      const m1=p.rig.getMuzzleWorldPos(),m2=al.rig.getMuzzleWorldPos(),t2=ms.hostiles[1].pos.clone().add(V3(0,1.25,0));
      at.spawnMuzzleFlash(m1,aim.clone().sub(m1).normalize(),0xffe49e);at.spawnTracer(m1,aim,0xffe08a,2.5);at.spawnImpactSparks(aim,14,0xffb845);
      at.spawnMuzzleFlash(m2,t2.clone().sub(m2).normalize(),0xffd07a);at.spawnTracer(m2,t2,0xffd07a,2.5);
    }else if(name==='bridge-lockdown'){
      at.applyPreset('dusk');ms.startMission(6,false);ms.commsTimer=9;p.cash=42600;p.selectWeapon(3);
      const bp=t=>this.cityWorld.getBridgePoint(t),pC=bp(0.64),pA=bp(0.28),by=M.atan2(pA.x-pC.x,pA.z-pC.z),rx=M.cos(by),rz=-M.sin(by);
      hc.pos.set(pC.x,pC.y+0.08,pC.z);hc.yaw=by;hc.vel.set(M.sin(by)*40,0,M.cos(by)*40);hc.speed=40;hc.nitro=94;hc.root.position.copy(hc.pos);hc.root.rotation.y=by;boost(0.68,3.8);p.enterVehicle(hc);
      ps.setWantedLevel(5,'PUENTE DEL SOL');const pRb=bp(0.51),pBm=bp(0.55),pAir=bp(0.52),pBh=bp(0.69);
      ps.deployRoadblockAndSpikes(pRb.x,pRb.z,by+M.PI,true);
      const wk=vs.spawnVehicle('police',pBm.x+rx*4.2,pBm.z+rz*4.2,by-0.65,{role:'police'});vs.damageVehicle(wk,999);at.spawnExplosion(wk.pos.clone().add(V3(0,0.85,0)),1.45);
      const ch=ps.ensureAirOne();ps.airOnePos.set(pAir.x-rx*10,pAir.y+13,pAir.z-rz*10);ch.root.position.copy(ps.airOnePos);ch.root.lookAt(pC.x-10,pAir.y+9,pC.z);ps.aimSearchlightAt(hc.pos.clone().add(V3(-8,0.2,-1)));
      cop(pBh.x-rx*3.6,pBh.z-rz*3.6,by);
      this.cameraOverride={pos:V3(pC.x-M.sin(by)*10.4-rx*2.2,pC.y+4,pC.z-M.cos(by)*10.4-rz*2.2),look:V3(pA.x-50,pA.y+11.5,pA.z-25),fov:64};
    }else if(name==='world-hub'){
      at.applyPreset('morning');ms.completedIds=new Set(['m1','m2','m3']);ms.startMission(3,false);ms.commsTimer=0;ps.clearHeat();
      p.cash=26950;this.crewTurf.relicsCollected=5;this.crewTurf.districts[0].control=65;this.crewTurf.districts[2].control=70;this.crewTurf.districts[3].control=75;hc.turboLevel=3;
      if(p.vehicle)p.exitVehicle();p.pos.set(168.8,0.36,31.2);p.yaw=-0.35;p.aiming=false;p.rig.root.position.copy(p.pos);p.rig.root.rotation.y=p.yaw;p.rig.animatePose(0,0,false,0.016);
      hc.pos.set(162.8,0.36,29.8);hc.yaw=0.72;hc.root.position.copy(hc.pos);hc.root.rotation.y=0.72;boost(0,0);
      if(this.heroMoto){this.heroMoto.pos.set(166.2,0.36,26.6);this.heroMoto.yaw=0.45;this.heroMoto.root.position.copy(this.heroMoto.pos);this.heroMoto.root.rotation.y=0.45;}
      this.cameraOverride={pos:V3(169.5,5.2,52.5),look:V3(167.5,5.4,10),fov:62};this.hud.hubTab='overview';this.hud.toggleHub(true);
    }
    at.update(0.016,p.pos,true);vs.updateSirensAndCollisions(0.016);this.hud.update(0.016);
  }

  updateCamera(dt) {
    if(this.cameraOverride){this.camera.fov=this.cameraOverride.fov||62;this.camera.updateProjectionMatrix();this.camera.position.copy(this.cameraOverride.pos);this.camera.lookAt(this.cameraOverride.look);return;}
    if(this.mode==='title'){this.flyoverAngle+=dt*0.11;this.camera.position.set(-30+M.cos(this.flyoverAngle)*145,38+M.sin(this.flyoverAngle*1.4)*8,148+M.sin(this.flyoverAngle*0.8)*58);this.camera.lookAt(20,12,35);return;}
    const p=this.player;
    if(p.vehicle){
      const v=p.vehicle;if(!this.input.mouseRight){let d=v.yaw-this.camYaw;while(d>M.PI)d-=6.283;while(d<-M.PI)d+=6.283;this.camYaw+=d*M.min(1,dt*4.2);}
      const dst=v.type==='boat'?11.5:(v.type==='swat'?10.5:8.6),h=v.type==='swat'?4.4:3.2;
      this.camPos.lerp(V3(v.pos.x-M.sin(this.camYaw)*dst,v.pos.y+h+this.camPitch*3.5,v.pos.z-M.cos(this.camYaw)*dst),M.min(1,dt*9));
      this.camLook.lerp(V3(v.pos.x+M.sin(v.yaw)*6,v.pos.y+1.4,v.pos.z+M.cos(v.yaw)*6),M.min(1,dt*11));
      this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,62+M.min(12,v.speed*0.25),M.min(1,dt*6));
    }else{
      const a=p.aiming,dst=a?3.8:6.2,sh=a?-0.95:-0.55,fx=M.sin(this.camYaw),fz=M.cos(this.camYaw),rx=M.cos(this.camYaw),rz=-M.sin(this.camYaw);
      this.camPos.lerp(V3(p.pos.x-fx*dst+rx*sh,p.pos.y+(a?1.95:2.5)+this.camPitch*2.2,p.pos.z-fz*dst+rz*sh),M.min(1,dt*14));
      this.camLook.lerp(V3(p.pos.x+fx*16+rx*sh*0.25,p.pos.y+1.4-this.camPitch*6.5,p.pos.z+fz*16+rz*sh*0.25),M.min(1,dt*16));
      this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,a?50:62,M.min(1,dt*10));
    }
    this.camera.updateProjectionMatrix();this.camera.position.copy(this.camPos);this.camera.lookAt(this.camLook);
  }

  loop(now) {
    requestAnimationFrame(this.loop);const dt=M.min(0.05,(now-this.lastTime)/1000);this.lastTime=now;
    const p=this.player,K=this.input.keys,ts=t=>this.hud.showToast(t);
    if(this.mode==='play'&&!this.hud.hubOpen&&!this.cameraOverride){
      if(p.vehicle){
        const th=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0),st=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0);
        this.vehicleSystem.updateDrivingPhysics(p.vehicle,{throttle:th,steer:st,handbrake:!!K.Space,nitro:!!(K.ShiftLeft||K.ShiftRight)},dt);
        p.pos.copy(p.vehicle.pos);p.yaw=p.vehicle.yaw;
      }else p.updateOnFoot(this.input,this.camYaw,dt);
      if(this.input.mouseLeft)this.combatSystem.firePlayerWeapon(p,this.camera,k=>{if(k==='hostile')ts('HOSTILE DOWN (+$250)');});
      this.trafficSystem.update(dt,p.pos,p.vehicle);this.policeSystem.update(dt,p);this.combatSystem.update(dt,p);
      this.vehicleSystem.updateSirensAndCollisions(dt);this.missions.update(dt,p,this.atmosphere,ts);
      this.crewTurf.update(dt,p,this.missions.hostiles,ts);this.audio.update(dt,p.vehicle,this.policeSystem.wantedLevel);
      if(p.hp<=0){p.hp=100;p.armor=50;p.cash=M.max(0,p.cash-500);if(p.vehicle)p.exitVehicle();p.pos.set(WORLD_CONFIG.safehousePos.x,0.35,WORLD_CONFIG.safehousePos.z);this.policeSystem.clearHeat();ts('RECOVERED AT SAFEHOUSE MARINA (-$500)');}
      this.hud.update(dt);
    }else if(this.cameraOverride){
      this.vehicleSystem.updateSirensAndCollisions(dt);
      if(this.policeSystem.airOne&&this.policeSystem.airOne.root.visible){this.policeSystem.airOne.mainRotor.rotation.y+=dt*24;this.policeSystem.airOne.tailRotor.rotation.x+=dt*32;}
      this.hud.update(dt);
    }
    this.atmosphere.update(dt,this.mode==='title'?V3(0,0,40):p.pos,!!this.cameraOverride);
    this.updateCamera(dt);this.postfx.render(this.scene,this.camera);
  }
}

new CalaSolaraGame();

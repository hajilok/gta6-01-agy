// Cala Solara — Main 3D Open-World Engine Orchestrator, Camera Rig, Controls & Showcase Director
import * as THREE from 'three';
import { WORLD_CONFIG as W } from './config.js';
import { BloomPostProcessor } from './render/postfx.js';
import { createPbrTextureLibrary } from './render/materials.js';
import { VfxParticleSystem } from './render/vfx.js';
import { VolcanicTerrain, boulevardZAtX as bZ } from './world/terrain.js';
import { RoadAndBridgeNetwork } from './world/roads-bridge.js';
import { buildDistrictLandmarks } from './world/districts.js';
import { AtmosphereController } from './world/atmosphere.js';
import { VehiclePhysicsSystem } from './entities/vehicle-physics.js';
import { PlayerController } from './entities/player.js';
import { TrafficAiSystem } from './entities/traffic.js';
import { PedestrianCrowdSystem } from './entities/pedestrians.js';
import { PoliceDispatchSystem } from './systems/police-dispatch.js';
import { CombatAndWeaponsSystem } from './systems/combat.js';
import { StoryCampaignDirector } from './systems/missions.js';
import { CrewRosterSystem } from './systems/crew.js';
import { TurfAndActivitiesSystem } from './systems/turf-activities.js';
import { ProceduralSfxEngine } from './audio/sfx-engine.js';
import { FmRadioSynthesizer } from './audio/radio-stations.js';
import { HudController } from './ui/hud.js';
import { CommandHubOverlay } from './ui/command-hub.js';

export class CalaSolaraGame {
  constructor(){
    const cv=this.canvas=document.getElementById('game-canvas'),w=innerWidth,h=innerHeight,rn=this.renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
    rn.setPixelRatio(Math.min(devicePixelRatio||1,2));rn.setSize(w,h);rn.shadowMap.enabled=true;rn.shadowMap.type=THREE.PCFSoftShadowMap;rn.outputColorSpace=THREE.LinearSRGBColorSpace;
    const sc=new THREE.Scene(),pf=new BloomPostProcessor(rn,w,h),tx=createPbrTextureLibrary(),vf=new VfxParticleSystem(sc,tx),at=new AtmosphereController(sc,rn,pf),tr=new VolcanicTerrain(sc,tx),cw=new RoadAndBridgeNetwork(sc,tr,tx),fx=buildDistrictLandmarks(sc,cw,tx);at.registerDistrictEffects(fx.emissiveMaterials,fx.animatedProps);
    const sx=new ProceduralSfxEngine(),vs=new VehiclePhysicsSystem(sc,cw,vf,sx),tf=new TrafficAiSystem(sc,cw,vs),pd=new PedestrianCrowdSystem(sc,cw),ps=new PoliceDispatchSystem(sc,cw,vs,vf,sx),cb=new CombatAndWeaponsSystem(sc,cw,vs,ps,tf,pd,vf,sx),ta=new TurfAndActivitiesSystem(sc,cw,vs);
    Object.assign(this,{scene:sc,postfx:pf,textures:tx,vfx:vf,atmosphere:at,terrain:tr,cityWorld:cw,sfx:sx,vehicleSystem:vs,trafficSystem:tf,pedSystem:pd,policeSystem:ps,combatSystem:cb,turfActivities:ta,camera:new THREE.PerspectiveCamera(62,w/h,.3,1200),radio:new FmRadioSynthesizer(sx),player:new PlayerController(sc,cw,vs),crewSystem:new CrewRosterSystem(sc,cw,vs,ps,vf),missions:new StoryCampaignDirector(sc,cw,cb,ps,ta),heroCar:vs.spawnVehicle('supercar',168,30,.45,{color:0x00d4e6,role:'player'}),heroMoto:vs.spawnVehicle('moto',173,25,.9,{color:0xff2e50}),marinaBoat:vs.spawnVehicle('boat',W.marinaBoatPos.x,W.marinaBoatPos.z,1.5708,{color:0xf7fafc}),mode:'title',camYaw:0,camPitch:.24,camPos:v3(160,12,52),camLook:v3(160,2,24),cameraOverride:null,flyoverAngle:0,shakeTimer:0,input:{keys:{},mouseLeft:false,mouseRight:false}});
    this.hud=new HudController(this);this.hub=new CommandHubOverlay(this,this.hud);this.bindEvents();
    const q=new URLSearchParams(location.search).get('scene');if(q)this.loadShowcaseDistrict(q);
    this.lastTime=performance.now();this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);window.__CALA_SOLARA__=this;
  }
  startPlay(c=true){const t=this;t.mode='play';t.cameraOverride=null;t.sfx.unlock();t.hub.setTitleVisible(false);if(c){t.player.enterVehicle(t.heroCar);t.camYaw=t.heroCar.yaw;}else t.camYaw=t.player.yaw;t.hud.showRadioBanner(t.radio.currentStation.name);}
  bindEvents(){
    const t=this,on=addEventListener,K=t.input,cv=t.canvas;
    on('resize',()=>{t.camera.aspect=innerWidth/innerHeight;t.camera.updateProjectionMatrix();t.renderer.setSize(innerWidth,innerHeight);t.postfx.resize(innerWidth,innerHeight);});
    on('keydown',e=>{const c=e.code;K.keys[c]=true;if(t.mode!=='play'){if(c==='Enter'||c==='Space')t.startPlay(true);return;}t.sfx.unlock();if(c==='KeyM'||c==='Tab'){e.preventDefault();t.hub.toggleHub();return;}if(t.hub.hubOpen){if(c==='Escape')t.hub.toggleHub(false);return;}const ts=m=>t.hud.showToast(m),p=t.player;if(c==='KeyF')t.handleVehicleInteract();else if(c==='KeyQ')t.crewSystem.triggerAbility(p,ts);else if(c==='KeyC'){const m=t.crewSystem.cycleCrew();ts(`ACTIVE CREW: ${m.name} (${m.role})`);}else if(c==='KeyR'){if(p.vehicle)t.hud.showRadioBanner(t.radio.cycleStation().name);else if(p.reloadWeapon())ts('RELOADED '+p.currentWeapon.name.toUpperCase());}else if(c==='KeyN')ts(t.sfx.toggleMute()?'AUDIO MUTED':'AUDIO UNMUTED');else if(c==='KeyT')ts('TIME OF DAY: '+t.atmosphere.cyclePreset());else if(c==='AltLeft'||c==='KeyV')p.startDodgeRoll(t.camYaw);else if(c>='Digit1'&&c<='Digit5')p.selectWeapon(+c[5]-1);});
    on('keyup',e=>{K.keys[e.code]=false;});on('contextmenu',e=>e.preventDefault());
    cv.addEventListener('mousedown',e=>{if(t.mode!=='play'||t.hub.hubOpen)return;t.sfx.unlock();if(!e.button)K.mouseLeft=true;if(e.button===2)K.mouseRight=true;if(document.pointerLockElement!==cv)cv.requestPointerLock?.();});
    on('mouseup',e=>{if(!e.button)K.mouseLeft=false;if(e.button===2)K.mouseRight=false;});
    on('mousemove',e=>{if(t.mode==='play'&&!t.hub.hubOpen&&(document.pointerLockElement===cv||K.mouseRight||K.mouseLeft)){t.camYaw-=e.movementX*.0032;t.camPitch=THREE.MathUtils.clamp(t.camPitch+e.movementY*.0026,-.18,.72);}});
  }
  handleVehicleInteract(){const p=this.player;if(p.vehicle){p.exitVehicle();return;}const n=p.findNearestVehicle(6.8);if(!n)return;const c=n.role==='civilian';p.enterVehicle(n);this.camYaw=n.yaw;if(c){this.policeSystem.addHeat(35,'VEHICLE THEFT');this.hud.showToast('STOLEN: '+n.spec.name.toUpperCase());}}
  loadShowcaseDistrict(name){
    const t=this,{player:p,heroCar:hc,vehicleSystem:vs,policeSystem:ps,atmosphere:at,missions:ms,vfx,hub}=t,{sin,cos,atan2,PI}=Math,up=v3(0,1,0);t.mode='play';hub.setTitleVisible(false);hub.toggleHub(false);t.cameraOverride=null;
    const bst=(o,g)=>{hc.nitroCones.forEach(c=>{c.material.opacity=o;});if(hc.nitroGlow)hc.nitroGlow.intensity=g;},pose=(v,x,y,z,yw,s=0)=>{v.pos.set(x,y,z);v.yaw=yw;v.speed=s;v.root.position.copy(v.pos);v.root.rotation.y=yw;},shot=(m,q,c)=>{vfx.spawnMuzzleFlash(m,q.clone().sub(m).normalize(),c);vfx.spawnTracer(m,q,c,2.5);},sync=(r,pt,yw,ph=0,aim=true,cr=false)=>{r.root.position.copy(pt);r.root.rotation.y=yw;r.animatePose(ph,0,aim,.016,0,cr);r.root.updateMatrixWorld(true);};
    if(name==='cover-chase'){
      at.applyPreset('golden');ms.startMission(0,false);ms.stageIndex=1;ms.setupStage(false);ms.commsTimer=0;const x=-126,z=bZ(x)+1.4,ry=atan2(18,bZ(x+18)-bZ(x));
      pose(hc,x,.35,z,ry+.24,39);hc.vel.set(sin(ry)*39,0,cos(ry)*39);hc.nitro=88;hc.bodyPivot.rotation.z=-.07;bst(.76,4.8);p.enterVehicle(hc);
      for(let i=0;i<8;i++){const bk=v3(i%2?-.92:.92,.14,-2.5-i*.92).applyAxisAngle(up,hc.yaw).add(hc.pos);vfx.spawnSkidMark(bk,ry);vfx.spawnSprite(v3(bk.x,bk.y+.36,bk.z),v3(-1,.7,0),{color:0xf8ebdc,size:1.15+i*.12,grow:.9,life:3.5,opacity:.34});}
      ps.setWantedLevel(3,'OCEANFRONT PURSUIT');ps.addUnit('police',x+7.8,bZ(x+7.8)-4.4,ry+.14,'PIT');ps.addUnit('police',x+19.5,bZ(x+19.5)+4.1,ry+PI-.18,'RAM');ps.deployRoadblockAndSpikes(x+29,bZ(x+29),ry+PI,false);vs.spawnVehicle('convertible',x+15.2,bZ(x+15.2)-4.7,ry,{color:0xff4f82});vs.spawnVehicle('muscle',x+23.8,bZ(x+23.8)-4.9,ry,{color:0xffb830});
      [[4,13.4,1.4],[9,15.6,-1.3],[15,13.8,1.8],[21,16.5,-1.6],[27,14.2,2],[33,15.8,-1.1],[11,-12.8,.4],[22,-13.2,-.5]].forEach(([dx,dz,yw],i)=>{const pd=t.pedSystem.pedestrians[i];if(pd){pd.pos.set(x+dx,.48,bZ(x+dx)+dz);sync(pd.rig,pd.pos,yw,i*1.1,false);}});
      t.cameraOverride={pos:v3(x-10.2,4.35,z+4.1),look:v3(x+30,5,bZ(x+30)-1.6),fov:62};
    }else if(name==='onfoot-combat'){
      at.applyPreset('day');ms.startMission(1,false);ms.commsTimer=0;p.cash=18400;p.ammo[1].mag=21;const pc=W.plazaCenter;if(p.vehicle)p.exitVehicle();p.selectWeapon(1);p.pos.set(pc.x-4.2,.34,pc.z+18.2);
      for(const pd of t.pedSystem.pedestrians)if(pd.pos.distanceTo(p.pos)<16){pd.pos.set(pc.x-28,.34,pc.z-22);pd.rig.root.position.copy(pd.pos);}
      [[1.5,6.4],[7.2,9],[-2.8,5.2]].forEach(([a,b],i)=>{const h=ms.hostiles[i];if(h){h.pos.set(pc.x+a,.34,pc.z+b);sync(h.rig,h.pos,atan2(p.pos.x-h.pos.x,p.pos.z-h.pos.z),.5+i);}});
      const ld=ms.hostiles[0];p.yaw=atan2(ld.pos.x-p.pos.x,ld.pos.z-p.pos.z);p.aiming=true;sync(p.rig,p.pos,p.yaw,.2,true,true);const al=t.crewSystem.spawnEnforcerAlly(v3(pc.x-8,.34,pc.z+14.4),p.yaw+.14,30);sync(al.rig,al.pos,al.yaw,.4,true,false);
      vs.spawnVehicle('muscle',pc.x+1,pc.z+16.2,.64,{color:0xff642e});ps.setWantedLevel(2,'PLAZA SHOOTOUT');ps.addUnit('police',pc.x+10.6,pc.z+5.8,-2.05,'RAM');
      const aim=v3(ld.pos.x,ld.pos.y+1.25,ld.pos.z),fwd=v3(sin(p.yaw),0,cos(p.yaw)),rt=v3(cos(p.yaw),0,-sin(p.yaw));t.cameraOverride={pos:p.pos.clone().addScaledVector(fwd,-5.2).addScaledVector(rt,.72).add(v3(0,2.2,0)),look:v3(aim.x+1.2,aim.y+.2,aim.z-.5),fov:58};
      shot(p.rig.getMuzzleWorldPos(),aim,0xff7b1c);vfx.spawnImpactSparks(aim,18,0xffb845);shot(al.rig.getMuzzleWorldPos(),v3(ms.hostiles[1].pos.x,ms.hostiles[1].pos.y+1.25,ms.hostiles[1].pos.z),0xff8c24);vfx.spawnExplosion(v3(pc.x-4.4,1,pc.z+6.4),.92);vfx.spawnWaterSpray(v3(pc.x,5.2,pc.z),2);t.combatSystem.hitMarkerTimer=2;
    }else if(name==='bridge-lockdown'){
      at.applyPreset('dusk');ms.startMission(7,false);ms.commsTimer=9;p.cash=42600;p.selectWeapon(3);const bp=u=>t.cityWorld.getBridgePoint(u),pC=bp(.64),pA=bp(.28),by=atan2(pA.x-pC.x,pA.z-pC.z),rx=cos(by),rz=-sin(by);
      pose(hc,pC.x,pC.y+.08,pC.z,by,44);hc.vel.set(sin(by)*44,0,cos(by)*44);hc.nitro=94;bst(.76,4.8);p.enterVehicle(hc);ps.setWantedLevel(5,'PUENTE DEL SOL');const pRb=bp(.51),pBm=bp(.55),pAir=bp(.56),pBh=bp(.69);
      ps.deployRoadblockAndSpikes(pRb.x,pRb.z,by+PI,true);const wk=vs.spawnVehicle('police',pBm.x+rx*4.2,pBm.z+rz*4.2,by-.65,{role:'police'});vs.damageVehicle(wk,999);vfx.spawnExplosion(v3(wk.pos.x,wk.pos.y+.9,wk.pos.z),1.45);
      const ch=ps.ensureAirOne();ps.airOnePos.set(pAir.x-rx*1.8,pAir.y+14.5,pAir.z-rz*1.8);ch.root.position.copy(ps.airOnePos);ch.root.lookAt(pC.x-10,pAir.y+8,pC.z+6);ps.aimSearchlightAt(v3(hc.pos.x-1.2,hc.pos.y+.1,hc.pos.z));ps.addUnit('police',pBh.x-rx*3.6,pBh.z-rz*3.6,by,'RAM');
      t.cameraOverride={pos:v3(pC.x-sin(by)*10.4+rx*3.2,pC.y+4.4,pC.z-cos(by)*10.4+rz*3.2),look:v3(pA.x-36,pA.y+9.8,pA.z-25),fov:64};
    }else if(name==='world-hub'){
      at.applyPreset('morning');ms.completedIds=new Set(['m1','m2','m3','m4']);ms.startMission(4,false);ms.commsTimer=0;ps.clearHeat();p.cash=34250;t.turfActivities.relicsCollected=6;[75,20,70,85].forEach((c,i)=>{t.turfActivities.districts[i].control=c;});
      hc.turboLevel=3;hub.saves.saveSlot(1,t);if(p.vehicle)p.exitVehicle();p.pos.set(162.4,.36,28.4);p.yaw=-.35;p.aiming=false;sync(p.rig,p.pos,p.yaw,0,false);pose(hc,155.8,.36,27.6,.72);bst(0,0);const lc=vs.spawnVehicle('muscle',150.5,12.8,.08,{color:0xff3b62});lc.pos.y=lc.root.position.y=1.98;
      if(t.heroMoto)pose(t.heroMoto,160.8,.36,23.6,.48);if(t.marinaBoat)pose(t.marinaBoat,218,.38,32,1.35);t.cameraOverride={pos:v3(147,7.2,54),look:v3(183,4.6,17),fov:62};hub.hubTab='overview';hub.toggleHub(true);
    }
    at.update(.016,p.pos,true);vfx.update(.016,true);vs.updateSirensAndCollisions(.016);t.hud.update(.016,hub.hubOpen);
  }
  updateCamera(dt){
    const t=this,cam=t.camera,co=t.cameraOverride,{sin,cos,min,PI}=Math;if(co){cam.fov=co.fov||62;cam.updateProjectionMatrix();cam.position.copy(co.pos);cam.lookAt(co.look);return;}
    if(t.mode==='title'){const a=t.flyoverAngle+=dt*.11;cam.position.set(-30+cos(a)*145,38+sin(a*1.4)*8,148+sin(a*.8)*58);cam.lookAt(20,12,35);return;}
    const p=t.player,y=t.camYaw;
    if(p.vehicle){const v=p.vehicle;if(!t.input.mouseRight){let d=v.yaw-y;while(d>PI)d-=6.283;while(d<-PI)d+=6.283;t.camYaw+=d*min(1,dt*4.2);}const ds=v.type==='boat'?11.5:(v.type==='swat'?10.5:8.6),h=v.type==='swat'?4.4:3.2;t.camPos.lerp(v3(v.pos.x-sin(t.camYaw)*ds,v.pos.y+h+t.camPitch*3.5,v.pos.z-cos(t.camYaw)*ds),min(1,dt*9));t.camLook.lerp(v3(v.pos.x+sin(v.yaw)*6,v.pos.y+1.4,v.pos.z+cos(v.yaw)*6),min(1,dt*11));cam.fov=THREE.MathUtils.lerp(cam.fov,62+min(12,v.speed*.25),min(1,dt*6));}
    else{const a=p.aiming,ds=a?3.8:6,sh=a?-.95:-.55,fx=sin(y),fz=cos(y),rx=cos(y),rz=-sin(y);t.camPos.lerp(v3(p.pos.x-fx*ds+rx*sh,p.pos.y+(a?1.92:2.45)+t.camPitch*2.2-(p.crouching?.3:0),p.pos.z-fz*ds+rz*sh),min(1,dt*14));t.camLook.lerp(v3(p.pos.x+fx*16+rx*sh*.25,p.pos.y+1.4-(t.camPitch-t.combatSystem.recoilKick)*6.5,p.pos.z+fz*16+rz*sh*.25),min(1,dt*16));cam.fov=THREE.MathUtils.lerp(cam.fov,a?50:62,min(1,dt*10));}
    cam.updateProjectionMatrix();cam.position.copy(t.camPos);if(t.shakeTimer>0){t.shakeTimer=Math.max(0,t.shakeTimer-dt);const k=t.shakeTimer*.4;cam.position.x+=(Math.random()-.5)*k;cam.position.y+=(Math.random()-.5)*k;}cam.lookAt(t.camLook);
  }
  loop(now){
    const t=this;requestAnimationFrame(t.loop);const dt=Math.min(.05,(now-t.lastTime)/1000);t.lastTime=now;const{player:p,vehicleSystem:vs,policeSystem:ps,hub,hud}=t,K=t.input.keys,ts=m=>hud.showToast(m);
    if(t.mode==='play'&&!hub.hubOpen&&!t.cameraOverride){
      if(p.vehicle){const nt=!!(K.ShiftLeft||K.ShiftRight);if(nt&&p.vehicle.nitro>5)t.shakeTimer=Math.max(t.shakeTimer,.08);vs.updateDrivingPhysics(p.vehicle,{throttle:(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0),steer:(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0),handbrake:!!K.Space,nitro:nt},dt);p.pos.copy(p.vehicle.pos);p.yaw=p.vehicle.yaw;}else p.updateOnFoot(t.input,t.camYaw,dt);
      if(t.input.mouseLeft)t.combatSystem.firePlayerWeapon(p,t.camera,k=>{if(k==='hostile')ts('HOSTILE DOWN (+$250)');});
      t.trafficSystem.update(dt,p.pos,p.vehicle);t.pedSystem.update(dt);ps.update(dt,p);t.combatSystem.update(dt,p);vs.updateSirensAndCollisions(dt);t.missions.update(dt,p,t.vfx,ts);t.crewSystem.update(dt,p,t.missions.hostiles);t.turfActivities.update(dt,p,ts);t.sfx.update(dt,p.vehicle,ps.wantedLevel);t.radio.update(dt,p.vehicle);
      if(p.hp<=0){p.hp=100;p.armor=50;p.cash=Math.max(0,p.cash-500);if(p.vehicle)p.exitVehicle();p.pos.set(W.safehousePos.x,.35,W.safehousePos.z);ps.clearHeat();ts('RECOVERED AT SAFEHOUSE MARINA (-$500)');}
      hud.update(dt,false);
    }else if(t.cameraOverride){vs.updateSirensAndCollisions(dt);if(ps.airOne?.root.visible){ps.airOne.mainRotor.rotation.y+=dt*24;ps.airOne.tailRotor.rotation.x+=dt*32;}hud.update(dt,hub.hubOpen);}
    t.atmosphere.update(dt,t.mode==='title'?v3(0,0,40):p.pos,!!t.cameraOverride);t.vfx.update(dt,!!t.cameraOverride);t.updateCamera(dt);t.postfx.render(t.scene,t.camera);
  }
}
function v3(x=0,y=0,z=0){return new THREE.Vector3(x,y,z);}
new CalaSolaraGame();

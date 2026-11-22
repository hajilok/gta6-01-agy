// Cala Solara — Tactical 5-Star CSPD Police Dispatch (PIT Flankers, Roadblocks/Spikes, SWAT Dismount, Sculpted Air-1)
import * as THREE from 'three';
import { WANTED_TIERS } from '../config.js';
import { addBox as B, addCyl as C, addExtrude as E, addSphere as S, glowMat, physMat, stdMat } from '../render/mesh-utils.js';
import { createStylizedCharacterRig } from '../entities/characters.js';

const M=Math,HPI=M.PI*0.5,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function createVolumetricSearchlightMaterial() {
  return new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{uColor:{value:new THREE.Color(0x9ed8ff)},uOpacity:{value:0.3}},
    vertexShader:`varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 uColor;uniform float uOpacity;varying vec2 vUv;varying vec3 vN,vV;void main(){gl_FragColor=vec4(uColor,pow(abs(dot(normalize(vN),normalize(vV))),2.1)*smoothstep(0.,.22,vUv.y)*smoothstep(1.,.08,vUv.y)*uOpacity);}`,
  });
}

function buildAirOneChopperMesh() {
  const r=new THREE.Group(),dk=physMat(0x162030,{roughness:0.3,metalness:0.65}),wh=stdMat(0xf2f6fc,0.28),gl=physMat(0x102a42,{roughness:0.08,metalness:0.9,transparent:true,opacity:0.88}),rm=stdMat(0x10141c,0.5);
  E(r,[[-3.1,-0.7],[2,-0.8],[3.3,-0.35],[2.4,0.72],[0.2,1.05],[-2.2,0.88],[-3.1,0.25]],2.1,dk,0.1);
  B(r,1.95,0.92,1.85,gl,0,0.15,2.05,false).rotation.x=0.32;B(r,2.24,0.28,4.1,wh,0,-0.25,0.05,false);
  for(const sx of[-0.62,0.62])C(r,0.34,0.38,2.1,10,dk,sx,1.02,-0.4,false).rotation.x=HPI;
  C(r,0.24,0.45,5.4,8,dk,0,0.35,-4.6,false).rotation.x=HPI;B(r,0.18,1.85,1.05,dk,0,0.92,-7.1,false);B(r,2.4,0.12,0.55,dk,0,0.42,-5.8,false);
  for(const sx of[-1.15,1.15]){C(r,0.07,0.07,4.4,6,rm,sx,-1.55,0.3,false).rotation.x=HPI;for(const sz of[1.2,-0.8])C(r,0.05,0.05,0.95,5,rm,sx*0.82,-1.1,sz,false).rotation.z=sx*-0.25;}
  const mr=new THREE.Group();mr.position.set(0,1.48,0.2);B(mr,11.4,0.06,0.3,rm,0,0,0,false);B(mr,0.3,0.06,11.4,rm,0,0,0,false);
  const dc=new THREE.Mesh(new THREE.RingGeometry(0.6,5.7,28),new THREE.MeshBasicMaterial({color:0xc8d8ea,transparent:true,opacity:0.16,side:THREE.DoubleSide,depthWrite:false}));dc.rotation.x=-HPI;mr.add(dc);r.add(mr);
  const tr=new THREE.Group();tr.position.set(0.22,1.05,-7.1);B(tr,0.06,1.65,0.18,rm,0,0,0,false);r.add(tr);
  S(r,0.22,8,8,glowMat(0xff142c,4.5),0,-0.95,-0.8);
  const cG=new THREE.CylinderGeometry(0.55,7.6,38,22,1,true);cG.translate(0,-19,0);
  const cm=new THREE.Mesh(cG,createVolumetricSearchlightMaterial());cm.position.set(0,-0.9,2.2);r.add(cm);
  const gs=new THREE.PointLight(0x9ee0ff,2.2,24);r.add(gs);
  return {root:r,mainRotor:mr,tailRotor:tr,coneMesh:cm,groundSpot:gs};
}

export class PoliceDispatchSystem {
  constructor(scene, cityWorld, vehicleSystem, atmosphere, audio) {
    this.scene=scene;this.cityWorld=cityWorld;this.vehicleSystem=vehicleSystem;this.atmosphere=atmosphere;this.audio=audio;
    this.wantedLevel=0;this.heatScore=0;this.evasionTimer=0;this.radarJammedTimer=0;this.dispatchBanner='';this.dispatchTimer=0;
    this.units=[];this.officers=[];this.roadblocks=[];this.airOne=null;this.airOnePos=V3(240,32,114);
    this.airOneFireCd=0;this.spawnTimer=0;this.roadblockCd=0;
  }

  getTier() { return WANTED_TIERS[M.min(5,M.max(0,this.wantedLevel))]; }

  addHeat(amt, r = '') {
    this.heatScore=M.min(520,this.heatScore+amt);
    const n=this.heatScore>=420?5:this.heatScore>=300?4:this.heatScore>=190?3:this.heatScore>=95?2:this.heatScore>=25?1:0;
    if(n>this.wantedLevel){this.wantedLevel=n;this.evasionTimer=0;this.dispatchBanner=`CSPD DISPATCH: ${this.getTier().label}${r?' — '+r:''}`;this.dispatchTimer=5.5;}
  }

  setWantedLevel(s, r = '') {
    this.wantedLevel=M.max(0,M.min(5,s));this.heatScore=[0,40,120,220,330,460][this.wantedLevel];this.evasionTimer=0;
    if(this.wantedLevel>0){this.dispatchBanner=`CSPD DISPATCH: ${this.getTier().label}${r?' — '+r:''}`;this.dispatchTimer=5.5;}else this.clearHeat();
  }

  jamRadar(d = 12) { this.radarJammedTimer=d;if(this.wantedLevel>1)this.setWantedLevel(this.wantedLevel-1,'RADAR SCRAMBLED');else this.clearHeat();for(const rb of this.roadblocks)rb.spikesActive=false; }
  clearHeat() { this.wantedLevel=this.heatScore=this.evasionTimer=0;this.dispatchBanner='';for(const u of this.units)u.vehicle.sirenOn=false;if(this.airOne)this.airOne.root.visible=false; }

  spawnOfficer(x, z, swat = false) {
    const rig=createStylizedCharacterRig({jacket:swat?0x161d29:0x1c3459,shirt:swat?0x222938:0x2b4875,pants:0x141b26,skin:0xd9a17a,hair:0x1c1818,hat:swat?'swat':'police',sunglasses:true,weaponId:swat?'carbine':'pistol'});
    const y=M.max(0.25,this.cityWorld.getTerrainHeight(x,z));rig.root.position.set(x,y,z);this.scene.add(rig.root);
    const o={rig,pos:V3(x,y,z),yaw:0,hp:swat?115:65,isSwat:swat,alive:true,fireCd:0.7,walkCycle:0};this.officers.push(o);return o;
  }

  deployRoadblockAndSpikes(x, z, yaw, swat = false) {
    if(this.roadblocks.length>=2)this.scene.remove(this.roadblocks.shift().group);
    const g=new THREE.Group(),y=M.max(0.25,this.cityWorld.getTerrainHeight(x,z));g.position.set(x,y,z);g.rotation.y=yaw;
    const bM=stdMat(0xe63b45,0.55),wM=stdMat(0xf4f6fa,0.5),fM=glowMat(0xff741c,4.2),sM=stdMat(0xcfd8e3,0.25,0.92);
    for(const sx of[-4.2,4.2]){B(g,3.8,1.15,0.45,bM,sx,0.6,0);B(g,3.84,0.35,0.48,wM,sx,0.72,0,false);}
    for(const sx of[-5.8,-1.8,1.8,5.8])C(g,0.14,0.16,0.38,8,fM,sx,0.2,1.8,false);
    B(g,5.6,0.08,0.65,sM,0,0.05,1.1,false);for(let sx=-2.4;sx<=2.4;sx+=0.48){const t=new THREE.Mesh(new THREE.ConeGeometry(0.08,0.26,4),sM);t.position.set(sx,0.18,1.1);g.add(t);}
    const bm=C(g,0.42,0.42,1.2,10,stdMat(0xd92b2b,0.45,0.35),-6.4,0.6,-0.5);this.scene.add(g);
    const rx=M.cos(yaw),rz=-M.sin(yaw);
    this.units.push({vehicle:this.vehicleSystem.spawnVehicle(swat?'swat':'police',x+rx*3.8,z+rz*3.8,yaw+1.15,{sirenOn:true,role:'police',tactic:'ROADBLOCK'}),tactic:'ROADBLOCK',swatsDismounted:true});
    this.spawnOfficer(x-rx*3.6,z-rz*3.6,swat);this.spawnOfficer(x+rx*1.4,z+rz*1.4,swat);
    const rb={group:g,pos:V3(x,y,z),yaw,spikesActive:true,barrelMesh:bm,barrelPos:V3(-6.4,0.6,-0.5).applyAxisAngle(V3(0,1,0),yaw).add(V3(x,y,z)),barrelAlive:true};
    this.roadblocks.push(rb);return rb;
  }

  deploySwatSquad(sv) {
    for(const[ox,oz]of[[-2.6,-1.5],[2.6,-1.5],[0,-3.8]]){const p=V3(ox,0,oz).applyAxisAngle(V3(0,1,0),sv.yaw).add(sv.pos);this.spawnOfficer(p.x,p.z,true);}
    this.dispatchBanner='CSPD SWAT DISMOUNTED — ENGAGING HOSTILE';this.dispatchTimer=4.2;
  }

  ensureAirOne() { if(!this.airOne){this.airOne=buildAirOneChopperMesh();this.scene.add(this.airOne.root);}this.airOne.root.visible=true;return this.airOne; }

  aimSearchlightAt(tp) {
    if(!this.airOne)return;const ch=this.airOne;ch.root.updateMatrixWorld(true);
    const lt=ch.root.worldToLocal(tp.clone()),d=V3().subVectors(lt,ch.coneMesh.position),len=M.max(8,d.length());d.normalize();
    ch.coneMesh.quaternion.setFromUnitVectors(V3(0,-1,0),d);ch.coneMesh.scale.set(1,len/38,1);ch.groundSpot.position.copy(lt).add(V3(0,3.2,0));
  }

  updateAirOneChopper(dt, tp, player) {
    if(this.wantedLevel<5||this.radarJammedTimer>0){if(this.airOne)this.airOne.root.visible=false;return;}
    const ch=this.ensureAirOne(),a=performance.now()*0.00055;
    this.airOnePos.lerp(V3(tp.x+M.cos(a)*26,M.max(tp.y+22,26),tp.z+M.sin(a)*22),M.min(1,dt*1.8));
    ch.root.position.copy(this.airOnePos);ch.root.lookAt(tp.x,this.airOnePos.y-4,tp.z);ch.mainRotor.rotation.y+=dt*24;ch.tailRotor.rotation.x+=dt*32;
    this.aimSearchlightAt(tp);
    if((this.airOneFireCd-=dt)<=0&&this.airOnePos.distanceTo(tp)<65){
      this.airOneFireCd=2.4;const m=V3((M.random()-0.5)*4,0.6,(M.random()-0.5)*4);
      this.atmosphere.spawnTracer(this.airOnePos.clone().add(V3(0,-1.2,0)),tp.clone().add(m),0xffd27a,0.14);
      if(m.length()<2.1){if(player.vehicle)this.vehicleSystem.damageVehicle(player.vehicle,6);else player.takeDamage(5);}
    }
  }

  update(dt, player) {
    if(this.dispatchTimer>0)this.dispatchTimer=M.max(0,this.dispatchTimer-dt);
    if(this.radarJammedTimer>0)this.radarJammedTimer=M.max(0,this.radarJammedTimer-dt);
    if(this.wantedLevel<=0)return;
    const p=player.pos,tr=this.getTier(),act=this.units.filter(u=>!u.vehicle.destroyed&&u.vehicle.role!=='player');
    if((this.spawnTimer-=dt)<=0&&act.length<tr.maxUnits){
      this.spawnTimer=4.2;const a=M.random()*6.28,sx=p.x+M.cos(a)*72,sz=p.z+M.sin(a)*72;
      if(!this.cityWorld.isWater(sx,sz)){const sw=this.wantedLevel>=4&&!act.some(u=>u.vehicle.type==='swat');this.units.push({vehicle:this.vehicleSystem.spawnVehicle(sw?'swat':'police',sx,sz,M.atan2(p.x-sx,p.z-sz),{sirenOn:true,role:'police'}),tactic:sw?'SWAT':(this.wantedLevel>=2&&act.length%2?'PIT':'PURSUIT'),swatsDismounted:false});}
    }
    if(this.wantedLevel>=3&&(this.roadblockCd-=dt)<=0&&player.vehicle&&player.vehicle.speed>10){
      const fx=p.x+M.sin(player.yaw)*68,fz=p.z+M.cos(player.yaw)*68;
      if(!this.cityWorld.isWater(fx,fz)){this.deployRoadblockAndSpikes(fx,fz,player.yaw+M.PI,this.wantedLevel>=4);this.roadblockCd=24;}
    }
    if(player.vehicle&&!player.vehicle.tiresPopped&&player.vehicle.type!=='boat')for(const rb of this.roadblocks)if(rb.spikesActive&&M.hypot(p.x-rb.pos.x,p.z-rb.pos.z)<4.5){player.vehicle.tiresPopped=true;this.atmosphere.spawnImpactSparks(p.clone().add(V3(0,0.3,0)),14,0xffe49e);this.dispatchBanner='SPIKE STRIP HIT — TIRES PUNCTURED!';this.dispatchTimer=4;}
    let seen=false;
    for(const u of this.units){
      const v=u.vehicle;if(v.destroyed||v===player.vehicle)continue;
      const d=M.hypot(p.x-v.pos.x,p.z-v.pos.z);if(d<62&&this.radarJammedTimer<=0)seen=true;
      if(u.tactic==='ROADBLOCK'){this.vehicleSystem.updateDrivingPhysics(v,{throttle:0,steer:0,handbrake:true},dt);continue;}
      if(u.tactic==='SWAT'&&d<24&&!u.swatsDismounted){u.swatsDismounted=true;this.deploySwatSquad(v);}
      const pit=u.tactic==='PIT'&&player.vehicle&&d<38,ax=pit?p.x-M.sin(player.yaw)*3.8+M.cos(player.yaw)*2.4:p.x,az=pit?p.z-M.cos(player.yaw)*3.8-M.sin(player.yaw)*2.4:p.z;
      let err=M.atan2(ax-v.pos.x,az-v.pos.z)-v.yaw;while(err>M.PI)err-=6.283;while(err<-M.PI)err+=6.283;
      const stp=u.tactic==='SWAT'&&u.swatsDismounted&&d<18;
      this.vehicleSystem.updateDrivingPhysics(v,{throttle:stp?-0.6:(M.abs(err)>1.2?0.35:0.94),steer:THREE.MathUtils.clamp(err*1.8,-1,1),handbrake:stp,nitro:d>30},dt);
    }
    for(const o of this.officers){
      if(!o.alive)continue;const dx=p.x-o.pos.x,dz=p.z-o.pos.z,d=M.hypot(dx,dz);if(d<52&&this.radarJammedTimer<=0)seen=true;
      o.yaw=M.atan2(dx,dz);const sp=d>18&&d<85?(o.isSwat?5.2:4.5):0;
      if(sp>0){const nx=o.pos.x+(dx/d)*sp*dt,nz=o.pos.z+(dz/d)*sp*dt;if(!this.cityWorld.isWater(nx,nz)){o.pos.x=nx;o.pos.z=nz;}}
      o.pos.y=M.max(0.2,this.cityWorld.getTerrainHeight(o.pos.x,o.pos.z));o.walkCycle+=sp*dt*1.7;o.rig.root.position.copy(o.pos);o.rig.root.rotation.y=o.yaw;o.rig.animatePose(o.walkCycle,sp,d<42,dt);
      if((o.fireCd-=dt)<=0&&d<42&&this.radarJammedTimer<=0){
        o.fireCd=o.isSwat?0.72:1.15;const m=o.rig.getMuzzleWorldPos(),aim=p.clone().add(V3((M.random()-0.5)*1.4,1.15,(M.random()-0.5)*1.4));
        this.atmosphere.spawnMuzzleFlash(m,aim.clone().sub(m).normalize(),0xffd07a);this.atmosphere.spawnTracer(m,aim,0xffb366,0.09);
        if(M.random()<(o.isSwat?0.34:0.2)){if(player.vehicle)this.vehicleSystem.damageVehicle(player.vehicle,5);else player.takeDamage(5);}
      }
    }
    this.updateAirOneChopper(dt,p,player);
    if(!seen&&this.wantedLevel<5){if((this.evasionTimer+=dt)>=14)this.clearHeat();}else if(seen)this.evasionTimer=M.max(0,this.evasionTimer-dt*2);
  }
}

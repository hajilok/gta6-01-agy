// Cala Solara — 5-Star CSPD Tactical Dispatch, RAM/PIT/Box-In, Spike Roadblocks, SWAT APC & Air-1 Chopper
import * as THREE from 'three';
import { WANTED_TIERS } from '../config.js';
import { addBox as B, addCyl as C, addExtrude as E, addSphere as S, clearcoatMat as CC, glassMat as GL, glowMat as GW, stdMat as M } from '../render/mesh-utils.js';
import { createCharacterRig } from '../entities/characters.js';

export class PoliceDispatchSystem {
  constructor(sc,cw,vs,vf,au){Object.assign(this,{scene:sc,cityWorld:cw,vehicleSystem:vs,vfx:vf,audio:au,wantedLevel:0,heatScore:0,evasionTimer:0,radarJammedTimer:0,dispatchTimer:0,airOneFireCd:0,spawnTimer:0,roadblockCd:0,dispatchBanner:'',units:[],officers:[],roadblocks:[],airOne:null,airOnePos:v3(240,30,114)});}
  getTier(){return WANTED_TIERS[Math.min(5,Math.max(0,this.wantedLevel))];}
  addUnit(t,x,z,y,tc='PATROL',d=0){const u={vehicle:this.vehicleSystem.spawnVehicle(t,x,z,y,{sirenOn:1,role:'police',tactic:tc}),tactic:tc,swatsDismounted:!!d,stuckTimer:0,reverseTimer:0};this.units.push(u);return u;}
  banner(r){this.dispatchBanner=`CSPD DISPATCH: ${this.getTier().label}${r?' — '+r:''}`;this.dispatchTimer=5.5;}
  addHeat(a,r=''){const t=this;t.heatScore=Math.min(520,t.heatScore+a);const n=t.heatScore>=420?5:t.heatScore>=300?4:t.heatScore>=190?3:t.heatScore>=95?2:t.heatScore>=25?1:0;if(n>t.wantedLevel){t.wantedLevel=n;t.evasionTimer=0;t.banner(r);t.audio?.playDispatchChirp?.();}}
  setWantedLevel(s,r=''){const t=this;t.wantedLevel=Math.max(0,Math.min(5,s));t.heatScore=[0,40,120,220,330,460][t.wantedLevel];t.evasionTimer=0;if(t.wantedLevel>0)t.banner(r);else t.clearHeat();}
  jamRadar(d=12){const t=this;t.radarJammedTimer=d;if(t.wantedLevel>1)t.setWantedLevel(t.wantedLevel-1,'RADAR SCRAMBLED');else t.clearHeat();for(const b of t.roadblocks)b.spikesActive=false;}
  clearHeat(){const t=this;t.wantedLevel=t.heatScore=t.evasionTimer=0;t.dispatchBanner='';for(const u of t.units)u.vehicle.sirenOn=false;if(t.airOne)t.airOne.root.visible=false;}
  spawnOfficer(x,z,sw=0){const t=this,rig=createCharacterRig({jacket:sw?0x161d29:0x1c3459,shirt:sw?0x222938:0x2b4875,pants:0x141b26,skin:0xd9a17a,hair:0x1c1818,hat:sw?'swat':'police',sunglasses:true,vest:true,weaponId:sw?'carbine':'pistol'}),y=Math.max(.25,t.cityWorld.getTerrainHeight(x,z));rig.root.position.set(x,y,z);t.scene.add(rig.root);const o={rig,pos:v3(x,y,z),yaw:0,hp:sw?115:65,isSwat:!!sw,alive:true,fireCd:.7,walkCycle:0};t.officers.push(o);return o;}
  deployRoadblockAndSpikes(x,z,yw,sw=0){
    const t=this,{scene:sc,cityWorld:cw,vfx}=t;if(t.roadblocks.length>=2)sc.remove(t.roadblocks.shift().group);
    const g=new THREE.Group(),y=Math.max(.25,cw.getTerrainHeight(x,z)),rm=M(0xe83642,.5),wm=M(0xf5f7fb,.45),fm=GW(0xff6b1c,4.4),sm=M(0xd6e0ec,.22,.92);g.position.set(x,y,z);g.rotation.y=yw;
    for(const k of[-4.2,4.2]){B(g,3.8,1.15,.46,rm,k,.6,0);B(g,3.85,.35,.5,wm,k,.72,0,0);}
    for(const k of[-5.8,-1.9,1.9,5.8]){C(g,.14,.16,.4,8,fm,k,.2,1.85,0);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:vfx.textures.flareGlowMap,color:0xff7824,opacity:.85,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sp.position.set(k,.45,1.85);sp.scale.set(2.1,2.1,1);g.add(sp);}
    B(g,5.8,.08,.68,sm,0,.05,1.15,0);for(let k=-2.5;k<=2.5;k+=.46){const m=new THREE.Mesh(new THREE.ConeGeometry(.08,.28,4),sm);m.position.set(k,.19,1.15);g.add(m);}
    const bm=C(g,.44,.44,1.25,10,M(0xdc2626,.42,.38),-6.4,.62,-.5),rx=Math.cos(yw),rz=-Math.sin(yw);sc.add(g);
    t.addUnit(sw?'swat':'police',x+rx*3.8,z+rz*3.8,yw+1.12,'ROADBLOCK',1);t.spawnOfficer(x-rx*3.6,z-rz*3.6,sw);t.spawnOfficer(x+rx*1.4,z+rz*1.4,sw);
    const rb={group:g,pos:v3(x,y,z),yaw:yw,spikesActive:true,barrelMesh:bm,barrelPos:v3(-6.4,.62,-.5).applyAxisAngle(v3(0,1,0),yw).add(v3(x,y,z)),barrelAlive:true};t.roadblocks.push(rb);return rb;
  }
  deploySwatSquad(sv){for(const[a,b]of[[-2.6,-1.5],[2.6,-1.5],[0,-3.8]]){const p=v3(a,0,b).applyAxisAngle(v3(0,1,0),sv.yaw).add(sv.pos);this.spawnOfficer(p.x,p.z,1);}this.dispatchBanner='CSPD SWAT DISMOUNTED — ENGAGING HOSTILE';this.dispatchTimer=4.2;}
  ensureAirOne(){if(!this.airOne){this.airOne=chopper();this.scene.add(this.airOne.root);}this.airOne.root.visible=true;return this.airOne;}
  aimSearchlightAt(tp){const ch=this.airOne;if(!ch)return;ch.root.updateMatrixWorld(true);const lt=ch.root.worldToLocal(tp.clone()),d=v3().subVectors(lt,ch.beamGroup.position),ln=Math.max(8,d.length());d.normalize();ch.beamGroup.quaternion.setFromUnitVectors(v3(0,-1,0),d);ch.beamGroup.scale.set(1,ln/42,1);ch.groundSpot.position.copy(lt).add(v3(0,3.6,0));ch.groundPool.position.copy(lt).add(v3(0,.16,0));}
  updateAirOneChopper(dt,tp,pl){
    const t=this;if(t.wantedLevel<5||t.radarJammedTimer>0){if(t.airOne)t.airOne.root.visible=false;return;}
    const ch=t.ensureAirOne(),a=performance.now()*.00055;t.airOnePos.lerp(v3(tp.x+Math.cos(a)*26,Math.max(tp.y+20,26),tp.z+Math.sin(a)*22),Math.min(1,dt*1.8));
    ch.root.position.copy(t.airOnePos);ch.root.lookAt(tp.x,t.airOnePos.y-4,tp.z);ch.mainRotor.rotation.y+=dt*24;ch.tailRotor.rotation.x+=dt*32;t.aimSearchlightAt(tp);
    if((t.airOneFireCd-=dt)<=0&&t.airOnePos.distanceTo(tp)<65){t.airOneFireCd=2.4;const j=v3((Math.random()-.5)*4,.6,(Math.random()-.5)*4);t.vfx.spawnTracer(v3(t.airOnePos.x,t.airOnePos.y-1.2,t.airOnePos.z),tp.clone().add(j),0xffd27a,.14);if(j.length()<2.1){if(pl.vehicle)t.vehicleSystem.damageVehicle(pl.vehicle,6);else pl.takeDamage(5);}}
  }
  probeBlocked(x,z,y,d){const a=x+Math.sin(y)*d,b=z+Math.cos(y)*d;return this.cityWorld.colliders.some(c=>a+1.4>c.minX&&a-1.4<c.maxX&&b+1.4>c.minZ&&b-1.4<c.maxZ);}
  update(dt,pl){
    const t=this,{sin,cos,abs,max,hypot,atan2,random,PI}=Math;if(t.dispatchTimer>0)t.dispatchTimer=max(0,t.dispatchTimer-dt);if(t.radarJammedTimer>0)t.radarJammedTimer=max(0,t.radarJammedTimer-dt);if(t.wantedLevel<=0)return;
    const{cityWorld:cw,vehicleSystem:vs,vfx}=t,p=pl.pos,wl=t.wantedLevel,act=t.units.filter(u=>!u.vehicle.destroyed&&u.vehicle.role!=='player');
    if((t.spawnTimer-=dt)<=0&&act.length<t.getTier().maxUnits){t.spawnTimer=4.2;const a=random()*6.28,sx=p.x+cos(a)*72,sz=p.z+sin(a)*72;if(!cw.isWater(sx,sz)){const sw=wl>=4&&!act.some(u=>u.vehicle.type==='swat');t.addUnit(sw?'swat':'police',sx,sz,atan2(p.x-sx,p.z-sz),sw?'SWAT':(wl>=2?['RAM','PIT','BOX'][act.length%3]:'PATROL'));}}
    if(wl>=3&&(t.roadblockCd-=dt)<=0&&pl.vehicle&&pl.vehicle.speed>10){const fx=p.x+sin(pl.yaw)*68,fz=p.z+cos(pl.yaw)*68;if(!cw.isWater(fx,fz)){t.deployRoadblockAndSpikes(fx,fz,pl.yaw+PI,wl>=4);t.roadblockCd=24;}}
    if(pl.vehicle&&!pl.vehicle.tiresPopped&&pl.vehicle.type!=='boat')for(const rb of t.roadblocks)if(rb.spikesActive&&hypot(p.x-rb.pos.x,p.z-rb.pos.z)<4.5){pl.vehicle.tiresPopped=true;vfx.spawnImpactSparks(v3(p.x,p.y+.3,p.z),14,0xffe49e);t.dispatchBanner='SPIKE STRIP HIT — TIRES PUNCTURED!';t.dispatchTimer=4;}
    let seen=0;
    for(const u of t.units){
      const v=u.vehicle;if(v.destroyed||v===pl.vehicle)continue;const d=hypot(p.x-v.pos.x,p.z-v.pos.z);if(d<62&&t.radarJammedTimer<=0)seen=1;
      if(u.tactic==='ROADBLOCK'){vs.updateDrivingPhysics(v,{throttle:0,steer:0,handbrake:1},dt);continue;}
      if(u.tactic==='SWAT'&&d<24&&!u.swatsDismounted){u.swatsDismounted=true;t.deploySwatSquad(v);}
      let ax=p.x,az=p.z;if(pl.vehicle&&d<42){const sy=sin(pl.yaw),cy=cos(pl.yaw);if(u.tactic==='PIT'){ax-=sy*3.8-cy*2.4;az-=cy*3.8+sy*2.4;}else if(u.tactic==='BOX'){ax+=sy*9.5;az+=cy*9.5;}else if(u.tactic==='RAM'){ax+=sy*2.5;az+=cy*2.5;}}
      if(u.reverseTimer>0){u.reverseTimer-=dt;vs.updateDrivingPhysics(v,{throttle:-.8,steer:.9},dt);continue;}
      if(v.speed<1.2&&d>15){if((u.stuckTimer=(u.stuckTimer||0)+dt)>1.4){u.reverseTimer=.85;u.stuckTimer=0;}}else u.stuckTimer=0;
      let e=atan2(ax-v.pos.x,az-v.pos.z)-v.yaw;while(e>PI)e-=6.283;while(e<-PI)e+=6.283;
      if(t.probeBlocked(v.pos.x,v.pos.z,v.yaw,9))e=t.probeBlocked(v.pos.x,v.pos.z,v.yaw+.55,10)?-1:1;
      const stp=u.tactic==='SWAT'&&u.swatsDismounted&&d<18;vs.updateDrivingPhysics(v,{throttle:stp?-.6:(abs(e)>1.2?.35:.95),steer:THREE.MathUtils.clamp(e*1.8,-1,1),handbrake:stp,nitro:d>30},dt);
    }
    for(const o of t.officers){
      if(!o.alive)continue;const dx=p.x-o.pos.x,dz=p.z-o.pos.z,d=hypot(dx,dz);if(d<52&&t.radarJammedTimer<=0)seen=1;
      o.yaw=atan2(dx,dz);const sp=d>18&&d<85?(o.isSwat?5.2:4.5):0;if(sp>0){const nx=o.pos.x+(dx/d)*sp*dt,nz=o.pos.z+(dz/d)*sp*dt;if(!cw.isWater(nx,nz)){o.pos.x=nx;o.pos.z=nz;}}
      o.pos.y=max(.2,cw.getTerrainHeight(o.pos.x,o.pos.z));o.walkCycle+=sp*dt*1.7;o.rig.root.position.copy(o.pos);o.rig.root.rotation.y=o.yaw;o.rig.animatePose(o.walkCycle,sp,d<42,dt);
      if((o.fireCd-=dt)<=0&&d<42&&t.radarJammedTimer<=0){o.fireCd=o.isSwat?.72:1.15;const m=o.rig.getMuzzleWorldPos(),aim=v3(p.x+(random()-.5)*1.4,p.y+1.15,p.z+(random()-.5)*1.4);vfx.spawnMuzzleFlash(m,aim.clone().sub(m).normalize(),0xffd07a);vfx.spawnTracer(m,aim,0xff9830,.11);if(random()<(o.isSwat?.34:.2)){if(pl.vehicle)vs.damageVehicle(pl.vehicle,5);else pl.takeDamage(5);}}
    }
    t.updateAirOneChopper(dt,p,pl);if(!seen&&wl<5){if((t.evasionTimer+=dt)>=14)t.clearHeat();}else if(seen)t.evasionTimer=max(0,t.evasionTimer-dt*2);
  }
}
const v3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),H=1.5708;
const beamMat=(c,o)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{C:{value:new THREE.Color(c)},O:{value:o}},vertexShader:`varying vec2 u;varying vec3 n,v;void main(){u=uv;vec4 m=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-m.xyz);gl_Position=projectionMatrix*m;}`,fragmentShader:`uniform vec3 C;uniform float O;varying vec2 u;varying vec3 n,v;void main(){gl_FragColor=vec4(C,clamp(pow(abs(dot(normalize(n),normalize(v))),2.)*smoothstep(0.,.32,u.y)*smoothstep(1.,.15,u.y)*O,0.,.65));}`});
function spotTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,4,64,64,62);[[0,'220,248,255,.9'],[.38,'150,224,255,.46'],[.75,'100,195,255,.12'],[1,'100,195,255,0']].forEach(([s,q])=>r.addColorStop(s,`rgba(${q})`));g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
function chopper(){
  const r=new THREE.Group(),dk=CC(0x162234,{roughness:.26,metalness:.64}),wh=M(0xf4f7fc,.25),gl=GL(0x0f2a44),rm=M(0x10141c,.5);
  E(r,[[-3.2,-.7],[2.1,-.82],[3.4,-.35],[2.4,.74],[.2,1.08],[-2.2,.88],[-3.2,.25]],2.15,dk,.1);B(r,2,.96,1.92,gl,0,.16,2.08,0).rotation.x=.34;[[2.3,.28,4.2,wh,0,-.24,.06,0],[.18,1.9,1.08,dk,0,.94,-7.2,0],[2.45,.12,.58,dk,0,.44,-5.8,0]].forEach(q=>B(r,...q));
  for(const k of[-.64,.64])C(r,.35,.4,2.2,10,dk,k,1.04,-.4,0).rotation.x=H;C(r,.24,.46,5.5,8,dk,0,.36,-4.6,0).rotation.x=H;
  for(const k of[-1.18,1.18]){C(r,.07,.07,4.5,6,rm,k,-1.56,.3,0).rotation.x=H;for(const z of[1.2,-.8])C(r,.05,.05,.96,5,rm,k*.82,-1.1,z,0).rotation.z=k*-.25;}
  const mr=new THREE.Group(),tr=new THREE.Group(),bg=new THREE.Group();mr.position.set(0,1.5,.2);tr.position.set(.22,1.05,-7.2);bg.position.set(0,-.88,2.25);B(mr,11.6,.06,.3,rm,0,0,0,0);B(mr,.3,.06,11.6,rm,0,0,0,0);B(tr,.06,1.7,.18,rm,0,0,0,0);
  const dc=new THREE.Mesh(new THREE.RingGeometry(.6,5.8,28),new THREE.MeshBasicMaterial({color:0xcce0f5,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}));dc.rotation.x=-H;mr.add(dc);S(r,.24,8,8,GW(0xff142c,4.5),0,-.95,-.8);S(r,.38,10,8,GW(0xdcf6ff,4.8),0,-.85,2.25);
  const oG=new THREE.CylinderGeometry(.36,3.6,42,24,1,true),iG=new THREE.CylinderGeometry(.18,1.45,42,16,1,true);oG.translate(0,-21,0);iG.translate(0,-21,0);bg.add(new THREE.Mesh(oG,beamMat(0x8edcff,.14)),new THREE.Mesh(iG,beamMat(0xeaf9ff,.24)));
  const gs=new THREE.PointLight(0xa8e8ff,12,26),sp=new THREE.PlaneGeometry(11,11);sp.rotateX(-H);const gp=new THREE.Mesh(sp,new THREE.MeshBasicMaterial({map:spotTex(),opacity:.48,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  r.add(mr,tr,bg,gs,gp);return{root:r,mainRotor:mr,tailRotor:tr,beamGroup:bg,groundSpot:gs,groundPool:gp};
}

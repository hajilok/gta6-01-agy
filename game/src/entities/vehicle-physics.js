// Cala Solara — Vehicle Driving Physics, Wall-Slide Collisions, Spinning Alloys & Siren Strobe Rig
import * as THREE from 'three';
import { VEHICLE_CATALOG } from '../config.js';
import { buildSculptedVehicleMesh } from './vehicle-meshes.js';

export class VehiclePhysicsSystem {
  constructor(sc,cw,vf,au){Object.assign(this,{scene:sc,cityWorld:cw,vfx:vf,audio:au,vehicles:[],nextId:1});}
  spawnVehicle(type,x,z,yaw=0,o={}){const t=this,sp=VEHICLE_CATALOG[type]||VEHICLE_CATALOG.supercar,paint=o.color??sp.colors[t.nextId%sp.colors.length],pt=buildSculptedVehicleMesh(type,paint),y=type==='boat'?.25:t.cityWorld.getTerrainHeight(x,z);pt.root.position.set(x,y,z);pt.root.rotation.y=yaw;t.scene.add(pt.root);const v={id:t.nextId++,type,spec:sp,...pt,pos:v3(x,y,z),vel:v3(),yaw,speed:0,steerAngle:0,hp:sp.maxHp,maxHp:sp.maxHp,nitro:100,drifting:false,sirenOn:!!o.sirenOn,role:o.role||'civilian',tactic:o.tactic||'PATROL',tiresPopped:false,destroyed:false,smokeTimer:0,skidTimer:0,sirenPhase:Math.random()*6.28,airborne:false,airTime:0,colorHex:paint,turboLevel:1,armorLevel:1};t.vehicles.push(v);return v;}
  setPaint(v,h){v.colorHex=h;v.paintMat.color.setHex(h);}
  repairVehicle(v){v.hp=v.maxHp*(1+(v.armorLevel-1)*.35);v.tiresPopped=v.destroyed=false;v.nitro=100;}
  damageVehicle(v,a){if(!v||v.destroyed)return false;v.hp-=a;this.vfx.spawnImpactSparks(v.pos.clone().add(v3((Math.random()-.5)*1.4,1.1,(Math.random()-.5)*1.8)),5,0xffcc66);if(v.hp<=0){v.hp=0;v.destroyed=true;v.sirenOn=false;Object.assign(v.paintMat,{roughness:.95,metalness:.1});v.paintMat.color.setHex(0x1f1d1d);if(v.sirenLightRed)v.sirenLightRed.intensity=0;if(v.sirenLightBlue)v.sirenLightBlue.intensity=0;v.sirenSprites?.forEach(s=>{s.visible=false;});this.vfx.spawnExplosion(v.pos,v.type==='swat'?1.45:1.2);this.audio?.playExplosion();return true;}return false;}
  updateDrivingPhysics(v,ctrl,dt){
    const t=this,{pos,vel,spec:sp}=v,{sin,cos,abs,min,max,hypot}=Math,{clamp,lerp}=THREE.MathUtils;if(v.destroyed){vel.multiplyScalar(max(0,1-dt*3.5));pos.addScaledVector(vel,dt);v.root.position.copy(pos);return;}
    const bt=v.type==='boat',sy=sin(v.yaw),cy=cos(v.yaw),th=ctrl.throttle||0,st=ctrl.steer||0,hb=!!ctrl.handbrake,nos=!!ctrl.nitro&&v.nitro>4&&th>.1;let fs=vel.x*sy+vel.z*cy,ls=vel.x*cy-vel.z*sy;
    const maxS=sp.maxSpeed*(1+(v.turboLevel-1)*.14)*(nos?1.34:1)*(v.tiresPopped?.58:1);if(th>0)fs+=th*sp.accel*(nos?1.65:1)*dt;else if(th<0)fs+=th*(fs>1.5?sp.brake:sp.accel*.58)*dt;else fs*=max(0,1-dt*(bt?.9:1.25));
    if(hb&&!bt)fs*=max(0,1-dt*1.9);fs=clamp(fs,-sp.reverseSpeed,maxS);const sf=min(1,abs(fs)/7.5);v.yaw+=(st+(v.tiresPopped?sin(performance.now()*.018)*.35:0))*sp.steerRate*sf*(hb?1.42:1)*(fs>=-.2?1:-1)*dt;
    ls*=max(0,1-(hb?sp.driftGrip:sp.grip)*dt);v.drifting=!bt&&(hb||abs(ls)>5.5)&&abs(fs)>10;vel.set(sin(v.yaw)*fs+cos(v.yaw)*ls,vel.y,cos(v.yaw)*fs-sin(v.yaw)*ls);v.speed=hypot(vel.x,vel.z);
    v.nitro=nos?max(0,v.nitro-28*dt):min(100,v.nitro+(v.drifting?18:6.5)*dt);v.nitroCones.forEach(c=>{c.material.opacity=nos?.72:0;});if(v.nitroGlow)v.nitroGlow.intensity=nos?4.2:0;if(v.tailLightMat)v.tailLightMat.emissiveIntensity=(th<-.1||hb)?5:2.9;
    const cw=t.cityWorld,nx=pos.x+vel.x*dt,nz=pos.z+vel.z*dt,up=v3(0,1,0);
    if(bt){if(cw.isWater(nx,nz)){pos.x=nx;pos.z=nz;}else vel.multiplyScalar(-.2);pos.y=.25+sin(performance.now()*.004+v.id)*.14;if(v.speed>5&&(v.smokeTimer-=dt)<=0){v.smokeTimer=.08;t.vfx.spawnWaterSpray(v3(0,.2,-sp.length*.45).applyAxisAngle(up,v.yaw).add(pos),1.5);}}
    else{
      const cx=clamp(nx,-375,485),cz=clamp(nz,-250,245);if(cw.getTerrainHeight(cx,cz)<-.45)vel.multiplyScalar(-.25);else{pos.x=cx;pos.z=cz;}
      const ty=max(.12,cw.getTerrainHeight(pos.x,pos.z));if(pos.y>ty+.28){vel.y-=24*dt;pos.y+=vel.y*dt;v.airborne=true;v.airTime+=dt;if(pos.y<=ty){pos.y=ty;vel.y=0;v.airborne=false;}}else{vel.y=clamp(((ty-pos.y)/max(dt,.016))*.65,0,13.5);pos.y=ty;v.airborne=false;v.airTime=0;}
      const hr=max(sp.width,sp.length)*.36;
      for(const c of cw.colliders)if(pos.y<=c.maxY&&pos.x+hr>c.minX&&pos.x-hr<c.maxX&&pos.z+hr>c.minZ&&pos.z-hr<c.maxZ){
        const pL=abs(pos.x+hr-c.minX),pR=abs(c.maxX-(pos.x-hr)),pT=abs(pos.z+hr-c.minZ),pB=abs(c.maxZ-(pos.z-hr)),mn=min(pL,pR,pT,pB);let nX=0,nZ=0;if(mn===pL){pos.x=c.minX-hr;nX=-1;}else if(mn===pR){pos.x=c.maxX+hr;nX=1;}else if(mn===pT){pos.z=c.minZ-hr;nZ=-1;}else{pos.z=c.maxZ+hr;nZ=1;}
        const vn=vel.x*nX+vel.z*nZ;if(vn<0){if(-vn>15)t.damageVehicle(v,(-vn-13)*.42);vel.x=(vel.x-vn*nX)*.78;vel.z=(vel.z-vn*nZ)*.78;}
      }
    }
    v.root.position.copy(pos);v.root.rotation.y=v.yaw;const a=min(1,dt*10);v.bodyPivot.rotation.z=lerp(v.bodyPivot.rotation.z,v.type==='moto'?-st*.36*sf:clamp(-ls*.015-st*.045*sf,-.14,.14),a);v.bodyPivot.rotation.x=lerp(v.bodyPivot.rotation.x,clamp((th<0?.055:-th*.035)*(nos?1.5:1),-.09,.09),a);v.steerAngle=lerp(v.steerAngle,st*.42,min(1,dt*12));
    v.wheels.forEach((wh,i)=>{if((v.wheels.length===4&&i<2)||(v.wheels.length===2&&!i))wh.rotation.y=v.steerAngle;(wh.spinGroup||wh.children[0]).rotation.x+=fs*dt*2.2;});
    if(v.drifting&&!v.airborne&&(v.skidTimer-=dt)<=0){v.skidTimer=.055;for(const k of[-sp.width*.38,sp.width*.38]){const wp=v3(k,.06,-sp.length*.32).applyAxisAngle(up,v.yaw).add(pos);t.vfx.spawnTireSmoke(wp,vel);t.vfx.spawnSkidMark(wp,v.yaw);}}
    if(!bt&&(v.smokeTimer-=dt)<=0){const r=v.hp/v.maxHp;if(r<.45){v.smokeTimer=.12;t.vfx.spawnEngineSmoke(v3(0,1.05,sp.length*.32).applyAxisAngle(up,v.yaw).add(pos),r<.2);}else if(v.tiresPopped&&v.speed>9){v.smokeTimer=.14;t.vfx.spawnImpactSparks(v3(sp.width*.42,.16,-sp.length*.3).applyAxisAngle(up,v.yaw).add(pos),3,0xffae38);}}
  }
  updateSirensAndCollisions(dt){
    const vs=this.vehicles;
    for(const v of vs)if(v.sirenMaterials.length>=2){const on=v.sirenOn&&!v.destroyed;v.sirenPhase+=on?dt*11:0;const alt=Math.sin(v.sirenPhase)>0;v.sirenMaterials[0].emissiveIntensity=on?(alt?6.5:.6):.2;v.sirenMaterials[1].emissiveIntensity=on?(alt?.6:6.5):.2;(v.sirenSprites||[]).forEach((s,i)=>{s.visible=on;if(on)s.material.opacity=((i%2===0)?alt:!alt)?(i>=2?.42:.92):.14;});if(v.sirenLightRed)v.sirenLightRed.intensity=on?(alt?13:.5):0;if(v.sirenLightBlue)v.sirenLightBlue.intensity=on?(alt?.5:13):0;}
    for(let i=0;i<vs.length;i++)for(let j=i+1;j<vs.length;j++){const a=vs[i],b=vs[j];if(Math.abs(a.pos.y-b.pos.y)>2.6)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,mD=(a.spec.width+b.spec.width)*.62,d2=dx*dx+dz*dz;if(d2>.001&&d2<mD*mD){const d=Math.sqrt(d2),nx=dx/d,nz=dz/d,ov=(mD-d)*.52;a.pos.x-=nx*ov;a.pos.z-=nz*ov;b.pos.x+=nx*ov;b.pos.z+=nz*ov;const imp=-((b.vel.x-a.vel.x)*nx+(b.vel.z-a.vel.z)*nz);if(imp>0){const tm=a.spec.mass+b.spec.mass;a.vel.x-=nx*imp*1.15*b.spec.mass/tm;a.vel.z-=nz*imp*1.15*b.spec.mass/tm;b.vel.x+=nx*imp*1.15*a.spec.mass/tm;b.vel.z+=nz*imp*1.15*a.spec.mass/tm;if(imp>9){this.damageVehicle(a,imp*.72);this.damageVehicle(b,imp*.72);}}}}
  }
}
function v3(x=0,y=0,z=0){return new THREE.Vector3(x,y,z);}

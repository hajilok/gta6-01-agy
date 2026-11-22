// Cala Solara — Glossy Beveled Extruded 9-Class Vehicles, Drift Physics & Destruction
import * as THREE from 'three';
import { VEHICLE_CATALOG } from '../config.js';
import { addBox as B, addCyl as C, addExtrude as E, glowMat, physMat, stdMat } from '../render/mesh-utils.js';

const M=Math,HPI=M.PI*0.5,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const HULLS={
  supercar:[[-2.42,0.36],[2.42,0.36],[2.44,0.96],[1.55,1.06],[0.68,1.38],[-0.45,1.38],[-1.35,0.98],[-2.35,0.72]],
  muscle:[[-2.38,0.38],[2.38,0.38],[2.42,1.04],[1.62,1.12],[0.92,1.46],[-0.42,1.46],[-1.18,1.08],[-2.36,0.96]],
  convertible:[[-2.26,0.36],[2.26,0.36],[2.3,0.94],[1.55,1],[-1.55,0.96],[-2.26,0.78]],
  suv:[[-2.46,0.44],[2.46,0.44],[2.48,1.72],[1.85,1.82],[-0.85,1.82],[-1.45,1.24],[-2.44,1.14]],
  van:[[-2.6,0.44],[2.6,0.44],[2.62,2.04],[-1.65,2.04],[-2.35,1.32],[-2.58,1.14]],
  police:[[-2.44,0.38],[2.44,0.38],[2.48,1.06],[1.65,1.12],[0.95,1.5],[-0.48,1.5],[-1.18,1.1],[-2.42,0.96]],
  swat:[[-3,0.52],[2.95,0.52],[3,2.38],[-1.45,2.38],[-2.15,1.72],[-2.95,1.48]],
};

function makePlateTex(tx='SOL-604'){
  const c=document.createElement('canvas');c.width=128;c.height=48;const g=c.getContext('2d');
  g.fillStyle='#f6f2e4';g.fillRect(0,0,128,48);g.fillStyle='#ff6b4a';g.fillRect(0,0,128,11);
  g.fillStyle='#182438';g.font='900 24px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(tx,64,30);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function buildWheel(r,w){
  const g=new THREE.Group(),rm=stdMat(0xe2eaf5,0.16,0.94);
  C(g,r,r,w,16,stdMat(0x161920,0.85,0.08)).rotation.z=HPI;C(g,r*0.66,r*0.66,w+0.03,12,rm,0,0,0,false).rotation.z=HPI;
  for(let i=0;i<5;i++)B(g,w+0.05,r*1.16,r*0.13,rm,0,0,0,false).rotation.x=(i/5)*M.PI;
  B(g,w*0.45,r*0.4,r*0.3,stdMat(0xe63242,0.32,0.5),0,r*0.1,-r*0.24,false);return g;
}

export function buildSculptedVehicleMesh(type, paintHex) {
  const sp=VEHICLE_CATALOG[type]||VEHICLE_CATALOG.supercar,root=new THREE.Group(),bp=new THREE.Group();root.add(bp);
  const paintMat=type==='swat'?stdMat(paintHex??sp.colors[0],0.55,0.45):physMat(paintHex??sp.colors[0]);
  const tm=stdMat(0x151a22,0.52,0.48),gm=physMat(0x0d1b2c,{roughness:0.08,metalness:0.85,transparent:true,opacity:0.88}),cm=stdMat(0xe2eaf5,0.14,0.96);
  const hm=glowMat(0xfff4d6,3.2),tlm=glowMat(0xff2036,3),am=glowMat(0xff9b28,2.2);
  const wheels=[],sirenMaterials=[],nitroCones=[],{width:w,length:l}=sp;
  let sirenLightRed=null,sirenLightBlue=null,nitroGlow=null;
  const ret=()=>({root,bodyPivot:bp,paintMat,tailLightMat:tlm,wheels,sirenMaterials,sirenLightRed,sirenLightBlue,nitroCones,nitroGlow});
  if(type==='boat'){
    E(bp,[[-l*0.48,0.15],[l*0.36,0.15],[l*0.54,0.92],[l*0.22,1.02],[-l*0.48,0.95]],w*0.92,paintMat,0.08);
    B(bp,w*0.72,0.55,1.25,gm,0,1.25,0.55,false).rotation.x=-0.5;B(bp,0.75,0.85,0.75,tm,0,0.78,-l*0.46,false);return ret();
  }
  if(type==='moto'){
    const fw=buildWheel(0.36,0.2),rw=buildWheel(0.38,0.26);fw.position.set(0,0.36,0.84);rw.position.set(0,0.38,-0.82);root.add(fw,rw);wheels.push(fw,rw);
    E(bp,[[-0.9,0.55],[0.25,0.52],[0.95,0.86],[0.55,1.18],[-0.1,0.96],[-0.88,0.98]],0.44,paintMat,0.05);
    B(bp,0.4,0.28,0.48,gm,0,1.16,0.64,false).rotation.x=-0.62;B(bp,0.34,0.14,0.1,hm,0,0.9,1.04,false);B(bp,0.28,0.1,0.08,tlm,0,0.96,-0.92,false);return ret();
  }
  const wR=type==='swat'?0.52:(type==='suv'||type==='van'?0.44:0.39),wW=type==='supercar'||type==='muscle'?0.35:0.3,aZ=l*0.31,tX=w*0.46;
  E(bp,HULLS[type]||HULLS.supercar,w*0.92,paintMat,type==='swat'?0.04:0.08);
  B(bp,w*0.94,0.2,l*0.94,tm,0,wR*0.78,0,false);B(bp,w*1.02,0.11,0.44,tm,0,wR*0.72,l*0.48,false);
  for(const sx of[-1,1]){B(bp,0.14,0.2,l*0.5,tm,sx*w*0.49,wR*0.78,0,false);for(const sz of[aZ,-aZ])C(bp,wR+0.1,wR+0.1,0.38,12,tm,sx*(tX-0.06),wR+0.04,sz,false).rotation.z=HPI;}
  if(type==='convertible'){
    B(bp,w*0.78,0.48,0.12,gm,0,1.16,0.55,false).rotation.x=-0.62;B(bp,w*0.76,0.24,l*0.36,tm,0,0.95,-0.22,false);
    for(const sx of[-0.42,0.42])B(bp,0.52,0.56,0.44,stdMat(0x8f342c,0.65),sx,1.12,-0.46,false);
  }else B(bp,w*0.88,{swat:0.58,van:0.68,suv:0.5}[type]||0.36,l*({van:0.52,swat:0.56}[type]||0.44),gm,0,{swat:1.88,van:1.62,suv:1.46}[type]||1.2,type==='supercar'?-0.18:-0.12,false);
  if(type==='supercar'){
    B(bp,w*0.96,0.07,0.36,tm,0,1.22,-l*0.44);for(const sx of[-0.58,0.58])B(bp,0.08,0.3,0.22,tm,sx,1.08,-l*0.44,false);
    for(let k=0;k<4;k++)B(bp,w*0.52,0.04,0.16,tm,0,1.16-k*0.03,-0.95-k*0.26,false);
  }else if(type==='muscle'){
    for(const sx of[-0.22,0.22])B(bp,0.18,0.04,l*0.92,stdMat(0xf7f7f2,0.3),sx,1.07,0,false);B(bp,0.66,0.16,0.85,tm,0,1.12,1.2,false);
  }else if(type==='police'){
    const wm=physMat(0xf4f7fc),rM=glowMat(0xff142c,4.5),bM=glowMat(0x1680ff,4.5);sirenMaterials.push(rM,bM);
    B(bp,w+0.04,0.62,l*0.42,wm,0,0.72,-0.1,false);B(bp,w*0.78,0.1,l*0.34,wm,0,1.54,-0.18,false);B(bp,w*0.66,0.46,0.3,tm,0,0.72,l*0.52,false);
    B(bp,0.68,0.16,0.26,rM,-0.36,1.66,-0.18,false);B(bp,0.68,0.16,0.26,bM,0.36,1.66,-0.18,false);
    sirenLightRed=new THREE.PointLight(0xff2238,0,22);sirenLightRed.position.set(-0.6,2.1,-0.18);
    sirenLightBlue=new THREE.PointLight(0x1e88ff,0,22);sirenLightBlue.position.set(0.6,2.1,-0.18);bp.add(sirenLightRed,sirenLightBlue);
  }else if(type==='swat'){
    const rM=glowMat(0xff2238,4.5),bM=glowMat(0x2694ff,4.5);sirenMaterials.push(rM,bM);
    B(bp,w*0.92,0.65,0.55,tm,0,0.92,l*0.52,false);C(bp,0.66,0.76,0.42,10,tm,0,2.58,-0.4,false);
    B(bp,0.55,0.18,0.25,bM,-0.7,2.48,1.35,false);B(bp,0.55,0.18,0.25,rM,0.7,2.48,1.35,false);
    sirenLightBlue=new THREE.PointLight(0x2694ff,0,22);sirenLightBlue.position.set(0,2.9,1.35);bp.add(sirenLightBlue);
  }
  const rY={swat:1.25,suv:1.05,van:1.05}[type]||0.78,fZ=l*0.515,rZ=-l*0.515;
  for(const sx of[-1,1]){B(bp,0.46,0.14,0.12,hm,sx*w*0.34,rY-0.04,fZ,false);B(bp,0.22,0.1,0.14,paintMat,sx*w*0.53,rY+0.24,0.45,false);}
  B(bp,w*0.88,0.26,0.12,tm,0,rY,rZ,false);
  for(const sx of[-w*0.31,0,w*0.31])B(bp,sx?w*0.24:w*0.26,0.11,0.1,tlm,sx,rY+0.02,rZ-0.04,false);
  for(const sx of[-w*0.41,w*0.41])B(bp,0.12,0.07,0.1,am,sx,rY-0.05,rZ-0.04,false);
  B(bp,w*0.88,0.24,0.18,tm,0,wR*0.86,rZ,false);for(const fx of[-0.36,-0.12,0.12,0.36])B(bp,0.05,0.22,0.22,tm,fx,wR*0.84,rZ-0.04,false);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.56,0.22),new THREE.MeshBasicMaterial({map:makePlateTex(type==='police'?'CSPD-09':'SOL-604')}));
  pl.rotation.y=M.PI;pl.position.set(0,rY-0.22,rZ-0.07);bp.add(pl);
  const jO=new THREE.MeshBasicMaterial({color:0xff8a2b,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),jC=new THREE.MeshBasicMaterial({color:0x80e8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  for(const sx of[-0.56,-0.4,0.4,0.56])C(bp,0.055,0.055,0.24,8,cm,sx,wR*0.84,rZ-0.06,false).rotation.x=HPI;
  for(const sx of[-0.48,0.48])for(const[rad,len,dz,mat]of[[0.11,0.56,0.34,jO],[0.06,0.36,0.24,jC]]){const cn=new THREE.Mesh(new THREE.ConeGeometry(rad,len,8),mat);cn.rotation.x=-HPI;cn.position.set(sx,wR*0.84,rZ-dz);bp.add(cn);nitroCones.push(cn);}
  nitroGlow=new THREE.PointLight(0xff8c2b,0,10);nitroGlow.position.set(0,wR*0.85,rZ-0.35);bp.add(nitroGlow);
  for(const[wx,wz]of[[-tX,aZ],[tX,aZ],[-tX,-aZ],[tX,-aZ]]){const wh=buildWheel(wR,wW);wh.position.set(wx,wR,wz);root.add(wh);wheels.push(wh);}
  return ret();
}

export class VehicleSystem {
  constructor(scene, cityWorld, atmosphere, audio) { this.scene=scene;this.cityWorld=cityWorld;this.atmosphere=atmosphere;this.audio=audio;this.vehicles=[];this.nextId=1; }

  spawnVehicle(type, x, z, yaw = 0, opts = {}) {
    const sp=VEHICLE_CATALOG[type]||VEHICLE_CATALOG.supercar,paint=opts.color??sp.colors[this.nextId%sp.colors.length],parts=buildSculptedVehicleMesh(type,paint);
    const y=type==='boat'?0.25:this.cityWorld.getTerrainHeight(x,z);parts.root.position.set(x,y,z);parts.root.rotation.y=yaw;this.scene.add(parts.root);
    const v={id:this.nextId++,type,spec:sp,...parts,pos:V3(x,y,z),vel:V3(),yaw,speed:0,steerAngle:0,hp:sp.maxHp,maxHp:sp.maxHp,nitro:100,drifting:false,sirenOn:!!opts.sirenOn,role:opts.role||'civilian',tactic:opts.tactic||'PATROL',tiresPopped:false,destroyed:false,smokeTimer:0,skidTimer:0,sirenPhase:M.random()*6.28,airborne:false,airTime:0,colorHex:paint,turboLevel:1,armorLevel:1};
    this.vehicles.push(v);return v;
  }

  setPaint(v, hex) { v.colorHex=hex;v.paintMat.color.setHex(hex); }
  repairVehicle(v) { v.hp=v.maxHp*(1+(v.armorLevel-1)*0.35);v.tiresPopped=v.destroyed=false;v.nitro=100; }

  damageVehicle(v, amt) {
    if(!v||v.destroyed)return false;
    v.hp-=amt;this.atmosphere.spawnImpactSparks(v.pos.clone().add(V3((M.random()-0.5)*1.4,1.1,(M.random()-0.5)*1.8)),5,0xffcc66);
    if(v.hp<=0){
      v.hp=0;v.destroyed=true;v.sirenOn=false;v.paintMat.color.setHex(0x1f1d1d);v.paintMat.roughness=0.95;v.paintMat.metalness=0.1;
      if(v.sirenLightRed)v.sirenLightRed.intensity=0;if(v.sirenLightBlue)v.sirenLightBlue.intensity=0;
      this.atmosphere.spawnExplosion(v.pos,v.type==='swat'?1.4:1.15);if(this.audio)this.audio.playExplosion();return true;
    }
    return false;
  }

  updateDrivingPhysics(v, ctrl, dt) {
    if(v.destroyed){v.vel.multiplyScalar(M.max(0,1-dt*3.5));v.pos.addScaledVector(v.vel,dt);v.root.position.copy(v.pos);return;}
    const sp=v.spec,bt=v.type==='boat',sy=M.sin(v.yaw),cy=M.cos(v.yaw);let fs=v.vel.x*sy+v.vel.z*cy,ls=v.vel.x*cy-v.vel.z*sy;
    const th=ctrl.throttle||0,st=ctrl.steer||0,hb=!!ctrl.handbrake,nos=!!ctrl.nitro&&v.nitro>4&&th>0.1;
    const maxS=sp.maxSpeed*(1+(v.turboLevel-1)*0.14)*(nos?1.34:1)*(v.tiresPopped?0.58:1);
    if(th>0)fs+=th*sp.accel*(nos?1.65:1)*dt;else if(th<0)fs+=th*(fs>1.5?sp.brake:sp.accel*0.58)*dt;else fs*=M.max(0,1-dt*(bt?0.9:1.25));
    if(hb&&!bt)fs*=M.max(0,1-dt*1.9);fs=M.max(-sp.reverseSpeed,M.min(maxS,fs));
    const sf=M.min(1,M.abs(fs)/7.5);
    v.yaw+=(st+(v.tiresPopped?M.sin(performance.now()*0.018)*0.35:0))*sp.steerRate*sf*(hb?1.42:1)*(fs>=-0.2?1:-1)*dt;
    ls*=M.max(0,1-(hb?sp.driftGrip:sp.grip)*dt);v.drifting=!bt&&(hb||M.abs(ls)>5.5)&&M.abs(fs)>10;
    v.vel.set(M.sin(v.yaw)*fs+M.cos(v.yaw)*ls,v.vel.y,M.cos(v.yaw)*fs-M.sin(v.yaw)*ls);v.speed=M.hypot(v.vel.x,v.vel.z);
    if(nos){v.nitro=M.max(0,v.nitro-28*dt);for(const c of v.nitroCones)c.material.opacity=0.65;if(v.nitroGlow)v.nitroGlow.intensity=3.5;}
    else{v.nitro=M.min(100,v.nitro+(v.drifting?18:6.5)*dt);for(const c of v.nitroCones)c.material.opacity=0;if(v.nitroGlow)v.nitroGlow.intensity=0;}
    if(v.tailLightMat)v.tailLightMat.emissiveIntensity=(th<-0.1||hb)?4.8:2.6;
    const nx=v.pos.x+v.vel.x*dt,nz=v.pos.z+v.vel.z*dt;
    if(bt){if(this.cityWorld.isWater(nx,nz)){v.pos.x=nx;v.pos.z=nz;}else v.vel.multiplyScalar(-0.25);v.pos.y=0.25+M.sin(performance.now()*0.004+v.id)*0.14;}
    else{
      const cx=M.max(-375,M.min(485,nx)),cz=M.max(-250,M.min(245,nz));
      if(this.cityWorld.getTerrainHeight(cx,cz)<-0.45)v.vel.multiplyScalar(-0.35);else{v.pos.x=cx;v.pos.z=cz;}
      const ty=M.max(0.12,this.cityWorld.getTerrainHeight(v.pos.x,v.pos.z));
      if(v.pos.y>ty+0.28){v.vel.y-=24*dt;v.pos.y+=v.vel.y*dt;v.airborne=true;v.airTime+=dt;if(v.pos.y<=ty){v.pos.y=ty;v.vel.y=0;v.airborne=false;}}
      else{v.vel.y=M.max(0,M.min(13.5,((ty-v.pos.y)/M.max(dt,0.016))*0.65));v.pos.y=ty;v.airborne=false;v.airTime=0;}
      const hr=M.max(sp.width,sp.length)*0.36;
      for(const c of this.cityWorld.colliders)if(v.pos.y<=c.maxY&&v.pos.x+hr>c.minX&&v.pos.x-hr<c.maxX&&v.pos.z+hr>c.minZ&&v.pos.z-hr<c.maxZ){
        const pL=M.abs(v.pos.x+hr-c.minX),pR=M.abs(c.maxX-(v.pos.x-hr)),pT=M.abs(v.pos.z+hr-c.minZ),pB=M.abs(c.maxZ-(v.pos.z-hr)),mn=M.min(pL,pR,pT,pB);
        if(mn===pL)v.pos.x=c.minX-hr;else if(mn===pR)v.pos.x=c.maxX+hr;else if(mn===pT)v.pos.z=c.minZ-hr;else v.pos.z=c.maxZ+hr;
        if(v.speed>14)this.damageVehicle(v,(v.speed-12)*0.45);v.vel.multiplyScalar(-0.28);
      }
    }
    v.root.position.copy(v.pos);v.root.rotation.y=v.yaw;
    v.bodyPivot.rotation.z=THREE.MathUtils.lerp(v.bodyPivot.rotation.z,v.type==='moto'?-st*0.36*sf:THREE.MathUtils.clamp(-ls*0.015-st*0.045*sf,-0.14,0.14),M.min(1,dt*10));
    v.bodyPivot.rotation.x=THREE.MathUtils.lerp(v.bodyPivot.rotation.x,THREE.MathUtils.clamp((th<0?0.055:-th*0.035)*(nos?1.5:1),-0.09,0.09),M.min(1,dt*10));
    v.steerAngle=THREE.MathUtils.lerp(v.steerAngle,st*0.42,M.min(1,dt*12));
    v.wheels.forEach((wh,i)=>{if((v.wheels.length===4&&i<2)||(v.wheels.length===2&&!i))wh.rotation.y=v.steerAngle;wh.children[0].rotation.x+=fs*dt*2.2;});
    if(v.drifting&&!v.airborne&&(v.skidTimer-=dt)<=0){v.skidTimer=0.055;for(const sx of[-sp.width*0.38,sp.width*0.38]){const wp=V3(sx,0.06,-sp.length*0.32).applyAxisAngle(V3(0,1,0),v.yaw).add(v.pos);this.atmosphere.spawnTireSmoke(wp,v.vel);this.atmosphere.spawnSkidMark(wp,v.yaw);}}
  }

  updateSirensAndCollisions(dt) {
    for(const v of this.vehicles)if(v.sirenMaterials.length>=2){
      if(v.sirenOn&&!v.destroyed){v.sirenPhase+=dt*11;const a=M.sin(v.sirenPhase)>0;v.sirenMaterials[0].emissiveIntensity=a?6.5:0.6;v.sirenMaterials[1].emissiveIntensity=a?0.6:6.5;if(v.sirenLightRed)v.sirenLightRed.intensity=a?7.5:0.4;if(v.sirenLightBlue)v.sirenLightBlue.intensity=a?0.4:7.5;}
      else{v.sirenMaterials[0].emissiveIntensity=v.sirenMaterials[1].emissiveIntensity=0.2;if(v.sirenLightRed)v.sirenLightRed.intensity=0;if(v.sirenLightBlue)v.sirenLightBlue.intensity=0;}
    }
    for(let i=0;i<this.vehicles.length;i++)for(let j=i+1;j<this.vehicles.length;j++){
      const a=this.vehicles[i],b=this.vehicles[j];if(M.abs(a.pos.y-b.pos.y)>2.6)continue;
      const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,mD=(a.spec.width+b.spec.width)*0.62,d2=dx*dx+dz*dz;
      if(d2>0.001&&d2<mD*mD){
        const d=M.sqrt(d2),nx=dx/d,nz=dz/d,ov=(mD-d)*0.52;a.pos.x-=nx*ov;a.pos.z-=nz*ov;b.pos.x+=nx*ov;b.pos.z+=nz*ov;
        const imp=-((b.vel.x-a.vel.x)*nx+(b.vel.z-a.vel.z)*nz);
        if(imp>0){const tm=a.spec.mass+b.spec.mass;a.vel.x-=nx*imp*1.15*b.spec.mass/tm;a.vel.z-=nz*imp*1.15*b.spec.mass/tm;b.vel.x+=nx*imp*1.15*a.spec.mass/tm;b.vel.z+=nz*imp*1.15*a.spec.mass/tm;if(imp>9){this.damageVehicle(a,imp*0.75);this.damageVehicle(b,imp*0.75);}}
      }
    }
  }
}

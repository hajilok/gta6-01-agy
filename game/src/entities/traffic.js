// Cala Solara — Autonomous Multi-Loop Yielding Traffic AI System
import * as THREE from 'three';
import { boulevardZAtX as bZ } from '../world/terrain.js';

export class TrafficAiSystem {
  constructor(sc,cw,vs){Object.assign(this,{scene:sc,cityWorld:cw,vehicleSystem:vs,trafficAgents:[],panicTimer:0,panicOrigin:new THREE.Vector3()});this.spawnInitialTraffic();}
  triggerPanic(o){this.panicTimer=7;this.panicOrigin.copy(o);}
  spawnInitialTraffic(){
    const cls=['convertible','muscle','suv','supercar','van','moto'];let n=0;
    LOOPS.forEach((lp,li)=>{const cnt=li?5:7;for(let k=0;k<cnt;k++){const wi=((k/cnt)*lp.length)|0,[cx,cz]=lp[wi],[nx,nz]=lp[(wi+1)%lp.length],ty=cls[n++%6],v=this.vehicleSystem.spawnVehicle(ty,cx,cz,Math.atan2(nx-cx,nz-cz),{role:'civilian'});this.trafficAgents.push({vehicle:v,loopIndex:li,wpIndex:(wi+1)%lp.length,cruiseSpeed:ty==='supercar'?20:(ty==='van'?14:17)});}});
  }
  update(dt,pp,pv){
    const t=this,{sin,cos,abs,max,hypot,atan2,PI}=Math;if(t.panicTimer>0)t.panicTimer=max(0,t.panicTimer-dt);
    for(const a of t.trafficAgents){
      const v=a.vehicle;if(v.role!=='civilian'||v.destroyed||v===pv)continue;
      const lp=LOOPS[a.loopIndex],[wx,wz]=lp[a.wpIndex],dx=wx-v.pos.x,dz=wz-v.pos.z;if(hypot(dx,dz)<14)a.wpIndex=(a.wpIndex+1)%lp.length;
      let err=atan2(dx,dz)-v.yaw;while(err>PI)err-=6.283;while(err<-PI)err+=6.283;
      const fx=sin(v.yaw),fz=cos(v.yaw);let blk=false;
      for(const o of t.vehicleSystem.vehicles)if(o!==v){const ox=o.pos.x-v.pos.x,oz=o.pos.z-v.pos.z,fd=ox*fx+oz*fz;if(fd>1.5&&fd<13.5&&abs(ox*fz-oz*fx)<3.1){blk=true;break;}}
      if(!pv){const px=pp.x-v.pos.x,pz=pp.z-v.pos.z,fd=px*fx+pz*fz;if(fd>1&&fd<10&&abs(px*fz-pz*fx)<2.6)blk=true;}
      const ts=t.panicTimer>0&&v.pos.distanceTo(t.panicOrigin)<55?a.cruiseSpeed*1.45:(blk?0:a.cruiseSpeed);
      t.vehicleSystem.updateDrivingPhysics(v,{throttle:blk?-.8:(v.speed<ts?.62:.05),steer:THREE.MathUtils.clamp(err*1.55,-1,1),handbrake:blk},dt);
    }
  }
}
const LOOPS=[[[-275,bZ(-275)+4.2],[-170,bZ(-170)+4.2],[-60,bZ(-60)+4.2],[45,bZ(45)+4.2],[122,bZ(122)+4.2],[132,48],[45,48],[-45,48],[-145,48],[-275,48]],[[-145,-185],[45,-185],[132,-180],[132,-24],[45,-24],[-45,-24],[-145,-24]],[[-275,-108],[192,-108],[192,48],[-45,48],[-45,-108]],[[45,bZ(45)+4],[120,96],[235,114],[350,132],[382,122],[350,132],[235,114],[120,96],[132,-24],[45,-24]]];

// Cala Solara — Autonomous Yielding Traffic Vehicles & Living Boardwalk/Plaza Pedestrians
import * as THREE from 'three';
import { boulevardZAtX } from '../world/city-world.js';
import { createStylizedCharacterRig } from './characters.js';

const M=Math,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const LOOPS=[
  [[-275,boulevardZAtX(-275)+4.2],[-170,boulevardZAtX(-170)+4.2],[-60,boulevardZAtX(-60)+4.2],[45,boulevardZAtX(45)+4.2],[122,boulevardZAtX(122)+4.2],[132,48],[45,48],[-45,48],[-145,48],[-275,48]],
  [[-145,-185],[45,-185],[132,-180],[132,-24],[45,-24],[-45,-24],[-145,-24]],
  [[-275,-108],[192,-108],[192,48],[-45,48],[-45,-108]],
  [[45,boulevardZAtX(45)+4],[120,96],[235,114],[350,132],[382,122],[350,132],[235,114],[120,96],[132,-24],[45,-24]],
];

export class TrafficAndCrowdSystem {
  constructor(scene, cityWorld, vehicleSystem) {
    this.scene=scene;this.cityWorld=cityWorld;this.vehicleSystem=vehicleSystem;
    this.trafficAgents=[];this.pedestrians=[];this.panicTimer=0;this.panicOrigin=V3();
    this.spawnInitialTraffic();this.spawnInitialCrowds();
  }

  triggerPanic(o) { this.panicTimer=7;this.panicOrigin.copy(o); }

  spawnInitialTraffic() {
    const ty=['convertible','muscle','suv','supercar','van','moto'];let idx=0;
    LOOPS.forEach((lp,li)=>{const cnt=li?5:7;for(let k=0;k<cnt;k++){const wi=M.floor((k/cnt)*lp.length),[cx,cz]=lp[wi],[nx,nz]=lp[(wi+1)%lp.length],t=ty[idx++%6];const v=this.vehicleSystem.spawnVehicle(t,cx,cz,M.atan2(nx-cx,nz-cz),{role:'civilian'});this.trafficAgents.push({vehicle:v,loopIndex:li,wpIndex:(wi+1)%lp.length,cruiseSpeed:t==='supercar'?20:(t==='van'?14:17)});}});
  }

  spawnInitialCrowds() {
    const jk=[0xff6b8b,0x00c2d1,0xffb347,0x5bd48a,0x7b6dff,0xf2f4f8,0xe86b42],pn=[0x1f2a3d,0x3b4454,0xe8dfd1,0x26384d,0x4a382c],sk=[0xe4b28a,0xc78962,0x996042,0xf0c7a5];
    const zones=[...Array.from({length:18},(_,i)=>[-210+i*16,boulevardZAtX(-210+i*16)+13.5+(i%3)*2.2]),...Array.from({length:10},(_,i)=>[-220+M.cos(i*.6283)*24,-20+M.sin(i*.6283)*22]),[-34,-58],[34,-58],[-34,-86],[34,-86],[180,18],[182,36],[180,-4],[142,36]];
    zones.forEach(([zx,zz],i)=>{const rig=createStylizedCharacterRig({jacket:jk[i%7],shirt:0xf7f5ef,pants:pn[i%5],skin:sk[i%4],hair:i%3?0x181518:0x3d281c,sunglasses:!(i%2)});const y=M.max(.2,this.cityWorld.getTerrainHeight(zx,zz));rig.root.position.set(zx,y,zz);this.scene.add(rig.root);this.pedestrians.push({rig,pos:V3(zx,y,zz),home:V3(zx,y,zz),yaw:(i*1.37)%6.28,speed:1.8+(i%4)*.35,walkCycle:i*.9,alive:true});});
  }

  update(dt, pPos, pVeh) {
    if(this.panicTimer>0)this.panicTimer=M.max(0,this.panicTimer-dt);
    for(const a of this.trafficAgents){
      const v=a.vehicle;if(v.role!=='civilian'||v.destroyed||v===pVeh)continue;
      const lp=LOOPS[a.loopIndex],[wx,wz]=lp[a.wpIndex],dx=wx-v.pos.x,dz=wz-v.pos.z;if(M.hypot(dx,dz)<14)a.wpIndex=(a.wpIndex+1)%lp.length;
      let err=M.atan2(dx,dz)-v.yaw;while(err>M.PI)err-=6.283;while(err<-M.PI)err+=6.283;
      const fx=M.sin(v.yaw),fz=M.cos(v.yaw);let blk=false;
      for(const o of this.vehicleSystem.vehicles)if(o!==v){const ox=o.pos.x-v.pos.x,oz=o.pos.z-v.pos.z,fd=ox*fx+oz*fz;if(fd>1.5&&fd<13.5&&M.abs(ox*fz-oz*fx)<3.1){blk=true;break;}}
      if(!pVeh){const px=pPos.x-v.pos.x,pz=pPos.z-v.pos.z,fd=px*fx+pz*fz;if(fd>1&&fd<10&&M.abs(px*fz-pz*fx)<2.6)blk=true;}
      const ts=this.panicTimer>0&&v.pos.distanceTo(this.panicOrigin)<55?a.cruiseSpeed*1.45:(blk?0:a.cruiseSpeed);
      this.vehicleSystem.updateDrivingPhysics(v,{throttle:blk?-.8:(v.speed<ts?.62:.05),steer:THREE.MathUtils.clamp(err*1.55,-1,1),handbrake:blk},dt);
    }
    for(const p of this.pedestrians){
      if(!p.alive)continue;let spd=p.speed;
      if(this.panicTimer>0&&p.pos.distanceTo(this.panicOrigin)<42){p.yaw=M.atan2(p.pos.x-this.panicOrigin.x,p.pos.z-this.panicOrigin.z);spd=5.4;}
      else if(M.hypot(p.pos.x-p.home.x,p.pos.z-p.home.z)>22)p.yaw=M.atan2(p.home.x-p.pos.x,p.home.z-p.pos.z);
      else p.yaw+=M.sin(p.walkCycle*.25)*.28*dt;
      const nx=p.pos.x+M.sin(p.yaw)*spd*dt,nz=p.pos.z+M.cos(p.yaw)*spd*dt;
      if(!this.cityWorld.isWater(nx,nz)&&!this.cityWorld.colliders.some(c=>nx+.5>c.minX&&nx-.5<c.maxX&&nz+.5>c.minZ&&nz-.5<c.maxZ)){p.pos.x=nx;p.pos.z=nz;}else p.yaw+=2.1;
      p.pos.y=M.max(.2,this.cityWorld.getTerrainHeight(p.pos.x,p.pos.z));p.walkCycle+=spd*dt*1.8;p.rig.root.position.copy(p.pos);p.rig.root.rotation.y=p.yaw;p.rig.animatePose(p.walkCycle,spd,false,dt);
    }
  }
}

// Cala Solara — Living Boardwalk, Plaza & Marina Pedestrian Crowd System
import * as THREE from 'three';
import { boulevardZAtX as bZ } from '../world/terrain.js';
import { createCharacterRig } from './characters.js';

export class PedestrianCrowdSystem {
  constructor(sc,cw){Object.assign(this,{scene:sc,cityWorld:cw,pedestrians:[],panicTimer:0,panicOrigin:new THREE.Vector3()});this.spawnInitialCrowds();}
  triggerPanic(o){this.panicTimer=7;this.panicOrigin.copy(o);}
  spawnInitialCrowds(){
    const jk=[0xff5c84,0x00c2d4,0xffb347,0x4fd688,0x7b6dff,0xf2f4f8,0xe86b42],pn=[0x1f2a3d,0x3b4454,0xe8dfd1,0x26384d,0x4a382c],sk=[0xe4b28a,0xc78962,0x996042,0xf0c7a5];
    const z=[...Array.from({length:18},(_,i)=>[-210+i*16,bZ(-210+i*16)+13.5+(i%3)*2.2]),...Array.from({length:10},(_,i)=>[-220+Math.cos(i*.6283)*24,-20+Math.sin(i*.6283)*22]),[-34,-58],[34,-58],[-34,-86],[34,-86],[176,26],[182,36],[184,14],[142,36],[216,22],[224,54]];
    z.forEach(([x,q],i)=>{
      const rig=createCharacterRig({jacket:jk[i%7],shirt:0xf7f5ef,pants:pn[i%5],skin:sk[i%4],hair:i%3?0x181518:0x3d281c,sunglasses:!(i%2),ponytail:!(i%4)}),y=Math.max(.2,this.cityWorld.getTerrainHeight(x,q));
      rig.root.position.set(x,y,q);this.scene.add(rig.root);
      this.pedestrians.push({rig,pos:new THREE.Vector3(x,y,q),home:new THREE.Vector3(x,y,q),yaw:(i*1.37)%6.28,speed:1.8+(i%4)*.35,walkCycle:i*.9,alive:true});
    });
  }
  update(dt){
    const t=this,cw=t.cityWorld,{sin,cos,max,hypot,atan2}=Math;if(t.panicTimer>0)t.panicTimer=max(0,t.panicTimer-dt);
    for(const p of t.pedestrians){
      if(!p.alive)continue;let sp=p.speed;
      if(t.panicTimer>0&&p.pos.distanceTo(t.panicOrigin)<42){p.yaw=atan2(p.pos.x-t.panicOrigin.x,p.pos.z-t.panicOrigin.z);sp=5.5;}
      else if(hypot(p.pos.x-p.home.x,p.pos.z-p.home.z)>22)p.yaw=atan2(p.home.x-p.pos.x,p.home.z-p.pos.z);
      else p.yaw+=sin(p.walkCycle*.25)*.28*dt;
      const nx=p.pos.x+sin(p.yaw)*sp*dt,nz=p.pos.z+cos(p.yaw)*sp*dt;
      if(!cw.isWater(nx,nz)&&!cw.colliders.some(c=>nx+.5>c.minX&&nx-.5<c.maxX&&nz+.5>c.minZ&&nz-.5<c.maxZ)){p.pos.x=nx;p.pos.z=nz;}else p.yaw+=2.1;
      p.pos.y=max(.2,cw.getTerrainHeight(p.pos.x,p.pos.z));p.walkCycle+=sp*dt*1.8;p.rig.root.position.copy(p.pos);p.rig.root.rotation.y=p.yaw;p.rig.animatePose(p.walkCycle,sp,false,dt);
    }
  }
}

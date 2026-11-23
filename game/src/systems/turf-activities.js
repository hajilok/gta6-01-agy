// Cala Solara — 6-District Turf Economy, AI Street Circuit Races, Golden Relics & Stunt Bonuses
import * as THREE from 'three';
import { DISTRICTS } from '../config.js';
import { boulevardZAtX as bZ } from '../world/terrain.js';

export class TurfAndActivitiesSystem {
  constructor(sc,cw,vs){Object.assign(this,{scene:sc,cityWorld:cw,vehicleSystem:vs,districts:DISTRICTS.map(d=>({...d,center:{...d.center}})),incomeTimer:30,relics:[],relicsCollected:0,raceActive:false,raceGateIndex:0,raceOpponents:[],raceGateMesh:null});this.spawnGoldenRelics();}
  addDistrictControl(id,a){const d=this.districts.find(x=>x.id===id);if(d)d.control=Math.min(100,d.control+a);}
  getDistrictAt(x,z){let b=this.districts[0],bd=Infinity;for(const d of this.districts){const q=Math.hypot(x-d.center.x,z-d.center.z);if(q<bd){bd=q;b=d;}}return b;}
  spawnGoldenRelics(){
    const m=new THREE.MeshStandardMaterial({color:0xffd24c,emissive:0xffa624,emissiveIntensity:1.7,roughness:.16,metalness:.94});
    for(const[x,z]of RELICS){const y=Math.max(.3,this.cityWorld.getTerrainHeight(x,z))+1.25,q=new THREE.Mesh(new THREE.OctahedronGeometry(.68,0),m);q.position.set(x,y,z);this.scene.add(q);this.relics.push({mesh:q,pos:new THREE.Vector3(x,y,z),collected:false});}
  }
  startStreetRace(pl,ts){
    const t=this,[sx,sz]=GATES[0],[nx,nz]=GATES[1],yw=Math.atan2(nx-sx,nz-sz);t.raceActive=true;t.raceGateIndex=0;
    for(const o of t.raceOpponents)t.scene.remove(o.vehicle.root);
    t.raceOpponents=[0xff4068,0xffbe3b,0x7648ff].map((c,i)=>({vehicle:t.vehicleSystem.spawnVehicle(i?'muscle':'supercar',sx-Math.sin(yw)*(7+i*5)+Math.cos(yw)*((i-1)*3.5),sz-Math.cos(yw)*(7+i*5)-Math.sin(yw)*((i-1)*3.5),yw,{color:c,role:'racer'}),gateIndex:1}));
    if(!t.raceGateMesh){t.raceGateMesh=new THREE.Mesh(new THREE.TorusGeometry(6.4,.34,8,24,Math.PI),new THREE.MeshStandardMaterial({color:0x00f0ff,emissive:0x00d9ff,emissiveIntensity:3}));t.scene.add(t.raceGateMesh);}
    t.positionRaceGate();ts?.('PALMERA STREET CIRCUIT STARTED — Beat 3 AI Rivals ($4,500)!');
  }
  positionRaceGate(){
    const t=this,g=t.raceGateMesh;if(!g)return;const[px,pz]=GATES[t.raceGateIndex],[nx,nz]=GATES[(t.raceGateIndex+1)%GATES.length];
    g.position.set(px,Math.max(.3,t.cityWorld.getTerrainHeight(px,pz)),pz);g.rotation.y=Math.atan2(nx-px,nz-pz);g.visible=t.raceActive;
  }
  update(dt,pl,ts){
    const t=this;
    if((t.incomeTimer-=dt)<=0){t.incomeTimer=30;const p=Math.round(t.districts.reduce((a,d)=>a+d.income*d.control/100,0));if(p>0){pl.cash+=p;ts?.('TERRITORY INCOME: +$'+p.toLocaleString());}}
    for(const r of t.relics)if(!r.collected){r.mesh.rotation.y+=dt*2.2;if(pl.pos.distanceTo(r.pos)<3.6){r.collected=true;r.mesh.visible=false;t.relicsCollected++;pl.cash+=1200;ts?.(`GOLDEN RELIC ${t.relicsCollected}/${t.relics.length} (+$1,200)`);}}
    if(pl.vehicle&&!pl.vehicle.airborne&&pl.vehicle.airTime>.75){const b=Math.round(pl.vehicle.airTime*700);pl.cash+=b;ts?.(`STUNT JUMP BONUS (+$${b})`);}
    if(t.raceActive){
      const[gx,gz]=GATES[t.raceGateIndex];
      if(Math.hypot(pl.pos.x-gx,pl.pos.z-gz)<12){if(++t.raceGateIndex>=GATES.length){t.raceActive=false;t.raceGateMesh.visible=false;pl.cash+=4500;t.addDistrictControl('palmera',15);ts?.('STREET CIRCUIT WON! +$4,500!');}else t.positionRaceGate();}
      for(const o of t.raceOpponents){const v=o.vehicle;if(v.destroyed)continue;const[rx,rz]=GATES[o.gateIndex%GATES.length];if(Math.hypot(v.pos.x-rx,v.pos.z-rz)<14)o.gateIndex=(o.gateIndex+1)%GATES.length;let e=Math.atan2(rx-v.pos.x,rz-v.pos.z)-v.yaw;while(e>Math.PI)e-=6.283;while(e<-Math.PI)e+=6.283;t.vehicleSystem.updateDrivingPhysics(v,{throttle:.92,steer:THREE.MathUtils.clamp(e*1.6,-1,1),nitro:Math.abs(e)<.2},dt);}
    }
  }
}
const GATES=[[-165,bZ(-165)],[-70,bZ(-70)],[35,bZ(35)],[120,96],[132,-24],[-45,-24],[-145,48]];
const RELICS=[[-175,bZ(-175)+14],[-55,bZ(-55)+14],[45,bZ(45)+14],[-245,-45],[0,-52],[-95,-108],[90,-108],[168,-110],[228,22],[235,114],[382,166],[428,148]];

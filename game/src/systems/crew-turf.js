// Cala Solara — Active 3-Member Crew System, 6-District Turf Control, AI Street Races & Golden Relics
import * as THREE from 'three';
import { CREW_ROSTER, DISTRICTS } from '../config.js';
import { boulevardZAtX } from '../world/city-world.js';
import { createStylizedCharacterRig } from '../entities/characters.js';

const M=Math,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const GATES=[[-165,boulevardZAtX(-165)],[-70,boulevardZAtX(-70)],[35,boulevardZAtX(35)],[120,96],[132,-24],[-45,-24],[-145,48]];

export class CrewAndTurfSystem {
  constructor(scene, cityWorld, vehicleSystem, policeSystem, atmosphere) {
    this.scene=scene;this.cityWorld=cityWorld;this.vehicleSystem=vehicleSystem;this.policeSystem=policeSystem;this.atmosphere=atmosphere;
    this.districts=DISTRICTS.map(d=>({...d}));this.crew=CREW_ROSTER.map(c=>({...c,level:1,cdLeft:0}));
    this.activeCrewIndex=0;this.incomeTimer=30;this.ally=null;this.allyTimer=0;
    this.relics=[];this.relicsCollected=0;this.raceActive=false;this.raceGateIdx=0;this.raceOpponents=[];this.raceGateMesh=null;
    this.spawnGoldenRelics();
  }

  get activeMember() { return this.crew[this.activeCrewIndex]; }
  cycleCrew() { this.activeCrewIndex=(this.activeCrewIndex+1)%this.crew.length;return this.activeMember; }
  upgradeCrew(id, pl) { const m=this.crew.find(c=>c.id===id);if(!m||pl.cash<m.upgradeCost*m.level)return false;pl.cash-=m.upgradeCost*m.level;m.level++;m.cooldown=M.max(10,m.cooldown-3);return true; }
  addDistrictControl(id, amt) { const d=this.districts.find(x=>x.id===id);if(d)d.control=M.min(100,d.control+amt); }
  getDistrictAt(x, z) { let b=this.districts[0],bd=1e9;for(const d of this.districts){const k=M.hypot(x-d.center.x,z-d.center.z);if(k<bd){bd=k;b=d;}}return b; }

  spawnEnforcerAlly(pos, yaw = 0, dur = 22) {
    if(this.ally)this.scene.remove(this.ally.rig.root);
    const rig=createStylizedCharacterRig({jacket:0x2c3e58,shirt:0x1a202c,pants:0x1a1e28,skin:0xc98c64,hair:0x181515,sunglasses:true,weaponId:'carbine'});
    const y=M.max(.25,this.cityWorld.getTerrainHeight(pos.x,pos.z));rig.root.position.set(pos.x,y,pos.z);rig.root.rotation.y=yaw;this.scene.add(rig.root);
    this.ally={rig,pos:V3(pos.x,y,pos.z),yaw,fireCd:.35,walkCycle:0};this.allyTimer=dur;return this.ally;
  }

  triggerAbility(pl, ts) {
    const m=this.activeMember;if(m.cdLeft>0){if(ts)ts(`${m.name} recharging (${M.ceil(m.cdLeft)}s)`);return false;}
    m.cdLeft=m.cooldown;
    if(m.id==='mateo'){this.spawnEnforcerAlly(V3(2.4,0,-1.2).applyAxisAngle(V3(0,1,0),pl.yaw).add(pl.pos),pl.yaw,20+m.level*5);pl.armor=M.min(pl.maxArmor,pl.armor+55+m.level*10);if(ts)ts('MATEO DEPLOYED — Covering Fire + Armor Restored!');}
    else if(m.id==='nadia'){this.policeSystem.jamRadar(12+m.level*3);if(ts)ts('NADIA HACK ACTIVE — CSPD Radar Jammed & Spikes Disabled!');}
    else if(pl.vehicle){this.vehicleSystem.repairVehicle(pl.vehicle);if(ts)ts('TOMAS TUNE — Repaired & Nitro 100%!');}
    else{const dp=pl.pos.clone().add(V3(M.sin(pl.yaw)*6,0,M.cos(pl.yaw)*6));this.vehicleSystem.spawnVehicle('supercar',dp.x,dp.z,pl.yaw,{color:0x00d9e8,role:'civilian'});if(ts)ts('TOMAS DELIVERED — Tuned Solara GT-R Ready!');}
    return true;
  }

  spawnGoldenRelics() {
    const mt=new THREE.MeshStandardMaterial({color:0xffd24c,emissive:0xffa624,emissiveIntensity:1.6,roughness:.18,metalness:.92});
    [[-175,boulevardZAtX(-175)+14],[-55,boulevardZAtX(-55)+14],[45,boulevardZAtX(45)+14],[-245,-45],[0,-52],[-95,-108],[90,-108],[168,-110],[228,22],[235,114],[382,166],[428,148]].forEach(([rx,rz])=>{
      const y=M.max(.3,this.cityWorld.getTerrainHeight(rx,rz))+1.2,m=new THREE.Mesh(new THREE.OctahedronGeometry(.68,0),mt);m.position.set(rx,y,rz);this.scene.add(m);this.relics.push({mesh:m,pos:V3(rx,y,rz),collected:false});
    });
  }

  startStreetRace(pl, ts) {
    this.raceActive=true;this.raceGateIdx=0;const[sx,sz]=GATES[0],[nx,nz]=GATES[1],yaw=M.atan2(nx-sx,nz-sz);
    for(const r of this.raceOpponents)this.scene.remove(r.vehicle.root);
    this.raceOpponents=[0xff496e,0xffbe3b,0x7b4dff].map((col,i)=>({vehicle:this.vehicleSystem.spawnVehicle(i?'muscle':'supercar',sx-M.sin(yaw)*(7+i*5)+M.cos(yaw)*((i-1)*3.5),sz-M.cos(yaw)*(7+i*5)-M.sin(yaw)*((i-1)*3.5),yaw,{color:col,role:'racer'}),gateIdx:1}));
    if(!this.raceGateMesh){this.raceGateMesh=new THREE.Mesh(new THREE.TorusGeometry(6.2,.32,8,24,M.PI),new THREE.MeshStandardMaterial({color:0x00f0ff,emissive:0x00d9ff,emissiveIntensity:3.2}));this.scene.add(this.raceGateMesh);}
    this.positionRaceGate();if(ts)ts('PALMERA STREET CIRCUIT STARTED — Beat 3 Rivals ($4,500 Prize)!');
  }

  positionRaceGate() { if(!this.raceGateMesh)return;const[px,pz]=GATES[this.raceGateIdx],[nx,nz]=GATES[(this.raceGateIdx+1)%GATES.length];this.raceGateMesh.position.set(px,M.max(.3,this.cityWorld.getTerrainHeight(px,pz)),pz);this.raceGateMesh.rotation.y=M.atan2(nx-px,nz-pz);this.raceGateMesh.visible=this.raceActive; }

  update(dt, pl, hostiles, ts) {
    for(const c of this.crew)if(c.cdLeft>0)c.cdLeft=M.max(0,c.cdLeft-dt);
    if((this.incomeTimer-=dt)<=0){this.incomeTimer=30;const tot=M.round(this.districts.reduce((a,d)=>a+d.income*(d.control/100),0));if(tot>0){pl.cash+=tot;if(ts)ts(`TERRITORY INCOME: +$${tot.toLocaleString()}`);}}
    if(this.ally){
      if((this.allyTimer-=dt)<=0){this.scene.remove(this.ally.rig.root);this.ally=null;}
      else{
        const a=this.ally,dx=pl.pos.x+2.8-a.pos.x,dz=pl.pos.z-2-a.pos.z,d=M.hypot(dx,dz),sp=d>3.5?6.2:0;
        if(sp>0){a.pos.x+=(dx/d)*sp*dt;a.pos.z+=(dz/d)*sp*dt;a.yaw=M.atan2(dx,dz);}a.pos.y=M.max(.25,this.cityWorld.getTerrainHeight(a.pos.x,a.pos.z));
        let bE=null,bd=42;for(const h of hostiles)if(h.alive&&a.pos.distanceTo(h.pos)<bd){bd=a.pos.distanceTo(h.pos);bE=h;}
        if(bE){a.yaw=M.atan2(bE.pos.x-a.pos.x,bE.pos.z-a.pos.z);if((a.fireCd-=dt)<=0){a.fireCd=.55;const m=a.rig.getMuzzleWorldPos(),hp=bE.pos.clone().add(V3(0,1.15,0));this.atmosphere.spawnMuzzleFlash(m,hp.clone().sub(m).normalize(),0xffe49e);this.atmosphere.spawnTracer(m,hp,0xffd07a,.09);if((bE.hp-=24)<=0){bE.alive=false;bE.rig.root.rotation.x=M.PI*.5;pl.cash+=250;}}}
        a.walkCycle+=sp*dt*1.8;a.rig.root.position.copy(a.pos);a.rig.root.rotation.y=a.yaw;a.rig.animatePose(a.walkCycle,sp,!!bE,dt);
      }
    }
    for(const r of this.relics)if(!r.collected){r.mesh.rotation.y+=dt*2.2;if(pl.pos.distanceTo(r.pos)<3.6){r.collected=true;r.mesh.visible=false;this.relicsCollected++;pl.cash+=1200;if(ts)ts(`GOLDEN RELIC ${this.relicsCollected}/${this.relics.length} (+$1,200)`);}}
    if(pl.vehicle&&!pl.vehicle.airborne&&pl.vehicle.airTime>.75){const b=M.round(pl.vehicle.airTime*700);pl.cash+=b;if(ts)ts(`STUNT BONUS (+$${b})`);}
    if(this.raceActive){
      const[gx,gz]=GATES[this.raceGateIdx];
      if(M.hypot(pl.pos.x-gx,pl.pos.z-gz)<12){if(++this.raceGateIdx>=GATES.length){this.raceActive=false;this.raceGateMesh.visible=false;pl.cash+=4500;this.addDistrictControl('palmera',15);if(ts)ts('STREET CIRCUIT WON! +$4,500!');}else this.positionRaceGate();}
      for(const op of this.raceOpponents){const v=op.vehicle;if(v.destroyed)continue;const[rx,rz]=GATES[op.gateIdx%GATES.length];if(M.hypot(v.pos.x-rx,v.pos.z-rz)<14)op.gateIdx=(op.gateIdx+1)%GATES.length;let e=M.atan2(rx-v.pos.x,rz-v.pos.z)-v.yaw;while(e>M.PI)e-=6.283;while(e<-M.PI)e+=6.283;this.vehicleSystem.updateDrivingPhysics(v,{throttle:.92,steer:THREE.MathUtils.clamp(e*1.6,-1,1),nitro:M.abs(e)<.2},dt);}
    }
  }
}

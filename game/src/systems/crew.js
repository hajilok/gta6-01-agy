// Cala Solara — Switchable 3-Specialist Crew Roster & Active Field Support System
import * as THREE from 'three';
import { CREW_ROSTER } from '../config.js';
import { createCharacterRig } from '../entities/characters.js';

export class CrewRosterSystem {
  constructor(sc,cw,vs,ps,vfx){Object.assign(this,{scene:sc,cityWorld:cw,vehicleSystem:vs,policeSystem:ps,vfx,crew:CREW_ROSTER.map(m=>({...m,level:1,cdLeft:0})),activeCrewIndex:0,ally:null,allyTimer:0});}
  get activeMember(){return this.crew[this.activeCrewIndex];}
  cycleCrew(){this.activeCrewIndex=(this.activeCrewIndex+1)%this.crew.length;return this.activeMember;}
  upgradeCrew(id,pl){const m=this.crew.find(c=>c.id===id);if(!m||pl.cash<m.upgradeCost*m.level)return false;pl.cash-=m.upgradeCost*m.level;m.level++;m.cooldown=Math.max(10,m.cooldown-3);return true;}
  spawnEnforcerAlly(pos,yw=0,dur=22){
    const t=this;if(t.ally)t.scene.remove(t.ally.rig.root);
    const rig=createCharacterRig({jacket:0x263852,shirt:0x1a202c,pants:0x181d27,skin:0xc98c64,hair:0x181515,sunglasses:true,vest:true,weaponId:'carbine'}),y=Math.max(.25,t.cityWorld.getTerrainHeight(pos.x,pos.z));
    rig.root.position.set(pos.x,y,pos.z);rig.root.rotation.y=yw;t.scene.add(rig.root);
    t.ally={rig,pos:new THREE.Vector3(pos.x,y,pos.z),yaw:yw,fireCd:.35,walkCycle:0};t.allyTimer=dur;return t.ally;
  }
  triggerAbility(pl,ts){
    const t=this,m=t.activeMember;if(m.cdLeft>0){ts?.(`${m.name} recharging (${Math.ceil(m.cdLeft)}s)`);return false;}
    m.cdLeft=m.cooldown;
    if(m.id==='mateo'){t.spawnEnforcerAlly(new THREE.Vector3(2.4,0,-1.2).applyAxisAngle(new THREE.Vector3(0,1,0),pl.yaw).add(pl.pos),pl.yaw,20+m.level*5);pl.armor=Math.min(pl.maxArmor,pl.armor+55+m.level*10);ts?.('MATEO DEPLOYED — Covering Fire + Armor Restored!');}
    else if(m.id==='nadia'){t.policeSystem.jamRadar(12+m.level*3);ts?.('NADIA HACK ACTIVE — CSPD Radar Jammed & Spikes Disabled!');}
    else if(pl.vehicle){t.vehicleSystem.repairVehicle(pl.vehicle);ts?.('TOMAS TUNE — Chassis Repaired & Nitro 100%!');}
    else{const x=pl.pos.x+Math.sin(pl.yaw)*6,z=pl.pos.z+Math.cos(pl.yaw)*6;t.vehicleSystem.spawnVehicle('supercar',x,z,pl.yaw,{color:0x00d4e6,role:'civilian'});ts?.('TOMAS DELIVERED — Tuned Solara Apex V12 Ready!');}
    return true;
  }
  update(dt,pl,hs){
    const t=this;for(const c of t.crew)if(c.cdLeft>0)c.cdLeft=Math.max(0,c.cdLeft-dt);
    if(!t.ally)return;if((t.allyTimer-=dt)<=0){t.scene.remove(t.ally.rig.root);t.ally=null;return;}
    const a=t.ally,dx=pl.pos.x+2.8-a.pos.x,dz=pl.pos.z-2-a.pos.z,d=Math.hypot(dx,dz),sp=d>3.5?6.2:0;
    if(sp>0){a.pos.x+=(dx/d)*sp*dt;a.pos.z+=(dz/d)*sp*dt;a.yaw=Math.atan2(dx,dz);}
    a.pos.y=Math.max(.25,t.cityWorld.getTerrainHeight(a.pos.x,a.pos.z));
    let b=null,bd=44;for(const h of hs)if(h.alive&&a.pos.distanceTo(h.pos)<bd){bd=a.pos.distanceTo(h.pos);b=h;}
    if(b){a.yaw=Math.atan2(b.pos.x-a.pos.x,b.pos.z-a.pos.z);if((a.fireCd-=dt)<=0){a.fireCd=.55;const m=a.rig.getMuzzleWorldPos(),hp=new THREE.Vector3(b.pos.x,b.pos.y+1.15,b.pos.z);t.vfx.spawnMuzzleFlash(m,hp.clone().sub(m).normalize(),0xffe49e);t.vfx.spawnTracer(m,hp,0xff8c24,.11);if((b.hp-=24)<=0){b.alive=false;b.rig.root.rotation.x=1.5708;pl.cash+=250;}}}
    a.walkCycle+=sp*dt*1.8;a.rig.root.position.copy(a.pos);a.rig.root.rotation.y=a.yaw;a.rig.animatePose(a.walkCycle,sp,!!b,dt);
  }
}

// Cala Solara — Protagonist Controller (Wall-Sliding Movement, Crouch, Dodge Roll, Reload & Hijack)
import * as THREE from 'three';
import { WEAPON_CATALOG } from '../config.js';
import { createCharacterRig } from './characters.js';

export class PlayerController {
  constructor(sc,cw,vs){
    const rig=createCharacterRig({jacket:0xd93456,shirt:0xf8f4ec,pants:0x1b2334,skin:0xdca178,hair:0x181316,sunglasses:true,weaponId:'smg',ponytail:true}),pos=new THREE.Vector3(164,.35,32);
    rig.root.position.copy(pos);sc.add(rig.root);
    Object.assign(this,{scene:sc,cityWorld:cw,vehicleSystem:vs,rig,pos,vel:new THREE.Vector3(),yaw:0,hp:100,maxHp:100,armor:75,maxArmor:100,cash:14850,vehicle:null,aiming:false,crouching:false,walkCycle:0,rollTimer:0,rollDir:new THREE.Vector3(),weaponIndex:1,ammo:WEAPON_CATALOG.map(w=>({mag:w.mag,reserve:w.reserve}))});
  }
  get currentWeapon(){return WEAPON_CATALOG[this.weaponIndex];}
  selectWeapon(i){const n=WEAPON_CATALOG.length;this.weaponIndex=((i%n)+n)%n;this.rig.setWeapon(WEAPON_CATALOG[this.weaponIndex].id);}
  reloadWeapon(){const w=this.currentWeapon,s=this.ammo[this.weaponIndex],n=w.mag-s.mag;if(n<=0||s.reserve<=0)return false;const k=Math.min(n,s.reserve);s.mag+=k;s.reserve-=k;return true;}
  enterVehicle(v){if(!v||v.destroyed)return false;this.vehicle=v;v.role='player';this.pos.copy(v.pos);this.yaw=v.yaw;this.rig.root.visible=false;return true;}
  exitVehicle(){const t=this,v=t.vehicle;if(!v)return null;t.pos.copy(v.pos).add(new THREE.Vector3(-v.spec.width*.78-.65,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),v.yaw));t.pos.y=Math.max(.25,t.cityWorld.getTerrainHeight(t.pos.x,t.pos.z));t.yaw=v.yaw;t.rig.root.position.copy(t.pos);t.rig.root.rotation.y=t.yaw;t.rig.root.visible=true;t.vehicle=null;return v;}
  findNearestVehicle(m=6.5){let b=null,bd=m;for(const v of this.vehicleSystem.vehicles)if(!v.destroyed){const d=Math.hypot(v.pos.x-this.pos.x,v.pos.z-this.pos.z);if(d<bd){bd=d;b=v;}}return b;}
  takeDamage(a){if(this.rollTimer>0)return;let r=a;if(this.armor>0){const ab=Math.min(this.armor,r*.65);this.armor-=ab;r-=ab;}this.hp=Math.max(0,this.hp-r);}
  startDodgeRoll(cy){if(this.vehicle||this.rollTimer>0)return;this.rollTimer=.42;const y=this.yaw||cy;this.rollDir.set(Math.sin(y),0,Math.cos(y)).normalize();}
  isWalkable(x,z){return!this.cityWorld.isWater(x,z)&&!this.cityWorld.colliders.some(c=>this.pos.y<=c.maxY&&x+.52>c.minX&&x-.52<c.maxX&&z+.52>c.minZ&&z-.52<c.maxZ);}
  updateOnFoot(inp,cy,dt){
    const t=this;if(t.vehicle){t.pos.copy(t.vehicle.pos);t.yaw=t.vehicle.yaw;return;}
    const K=inp.keys,mx=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0),mz=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);
    t.aiming=!!(inp.mouseRight||inp.mouseLeft);t.crouching=!!(K.ControlLeft||K.KeyX);
    let vx=Math.sin(cy)*mz+Math.cos(cy)*mx,vz=Math.cos(cy)*mz-Math.sin(cy)*mx,ln=Math.hypot(vx,vz),sp=0;
    if(t.rollTimer>0){t.rollTimer=Math.max(0,t.rollTimer-dt);vx=t.rollDir.x;vz=t.rollDir.z;sp=13.5;}
    else if(ln>.01){vx/=ln;vz/=ln;sp=t.crouching?3.8:(t.aiming?5.2:((K.ShiftLeft||K.ShiftRight)?10.6:6.8));}
    const nx=t.pos.x+vx*sp*dt,nz=t.pos.z+vz*sp*dt;
    if(t.isWalkable(nx,t.pos.z))t.pos.x=nx;if(t.isWalkable(t.pos.x,nz))t.pos.z=nz;
    t.pos.y=Math.max(.2,t.cityWorld.getTerrainHeight(t.pos.x,t.pos.z));
    if(t.aiming)t.yaw=cy;else if(ln>.01){let d=Math.atan2(vx,vz)-t.yaw;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;t.yaw+=d*Math.min(1,dt*12);}
    t.walkCycle+=sp*dt*1.65;t.rig.root.position.copy(t.pos);t.rig.root.rotation.y=t.yaw;
    t.rig.animatePose(t.walkCycle,sp,t.aiming,dt,t.rollTimer>0?1-t.rollTimer/.42:0,t.crouching);
  }
}

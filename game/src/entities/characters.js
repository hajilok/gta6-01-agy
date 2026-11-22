// Cala Solara — Contoured Capsule Character Rigs, Weapons & Player Controller
import * as THREE from 'three';
import { WEAPON_CATALOG } from '../config.js';
import { addBox as B, addCap as P, addCyl as C, addSphere as S, stdMat } from '../render/mesh-utils.js';

const M=Math,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

export function buildWeaponMesh(id) {
  const g=new THREE.Group(),mt=stdMat(0x202632,.32,.8),gr=stdMat(0x3b2c22,.8),ac=stdMat(0xd9a441,.3,.85);let mz=.5;
  if(id==='pistol'){B(g,.07,.09,.34,mt,0,.04,.12,false);B(g,.06,.16,.08,gr,0,-.05,.01,false).rotation.x=.25;mz=.32;}
  else if(id==='smg'){B(g,.085,.13,.46,mt,0,.04,.16,false);C(g,.022,.022,.24,6,mt,0,.05,.48,false).rotation.x=1.57;B(g,.05,.24,.065,mt,0,-.1,.2,false).rotation.x=.18;mz=.62;}
  else if(id==='shotgun'){B(g,.08,.12,.32,gr,0,.01,-.08,false);B(g,.095,.13,.42,mt,0,.04,.2,false);C(g,.03,.03,.56,8,mt,0,.07,.55,false).rotation.x=1.57;mz=.86;}
  else if(id==='launcher'){C(g,.072,.072,.72,10,mt,0,.06,.28,false).rotation.x=1.57;C(g,.11,.11,.18,10,ac,0,.02,.2,false).rotation.x=1.57;mz=.68;}
  else{B(g,.08,.12,.28,mt,0,.02,-.08,false);B(g,.09,.14,.46,mt,0,.04,.22,false);C(g,.022,.022,.42,6,mt,0,.06,.62,false).rotation.x=1.57;B(g,.055,.22,.08,ac,0,-.1,.28,false).rotation.x=.22;mz=.85;}
  const muzzleAnchor=new THREE.Object3D();muzzleAnchor.position.set(0,.06,mz);g.add(muzzleAnchor);return{mesh:g,muzzleAnchor};
}

export function createStylizedCharacterRig({ jacket = 0xff4c6b, shirt = 0xf5f2eb, pants = 0x222938, skin = 0xdba078, hair = 0x1c1718, hat = null, sunglasses = true, weaponId = null, ponytail = false } = {}) {
  const root=new THREE.Group(),body=new THREE.Group(),jm=stdMat(jacket,.62),sm=stdMat(shirt,.7),pm=stdMat(pants,.76),sk=stdMat(skin,.58),hm=stdMat(hair,.72),bm=stdMat(0x171a20,.48);root.add(body);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(.13,.94,0);rightLeg.position.set(-.13,.94,0);
  for(const lg of[leftLeg,rightLeg]){P(lg,.085,.26,pm,0,-.22,0);P(lg,.068,.26,pm,0,-.58,0);B(lg,.14,.13,.23,bm,0,-.81,.04,false);}
  const torso=new THREE.Group();torso.position.set(0,1.24,0);
  C(torso,.21,.17,.6,10,sm).scale.set(1.12,1,.68);C(torso,.23,.19,.62,10,jm,0,0,-.025).scale.set(1.14,1,.64);C(torso,.19,.19,.08,10,bm,0,-.29,0,false).scale.set(1.14,1,.74);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(.28,1.48,0);rightArm.position.set(-.28,1.48,0);
  for(const ar of[leftArm,rightArm]){S(ar,.085,8,8,jm,0,0,0,true);P(ar,.068,.22,jm,0,-.17,0);P(ar,.056,.22,sk,0,-.45,.03);}
  const head=new THREE.Group();head.position.set(0,1.72,0);C(head,.058,.068,.14,8,sk,0,-.14,0,false);S(head,.142,12,10,sk,0,0,0,true).scale.set(.92,1.08,.96);
  const ht=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8,0,6.28,0,1.82),hm);ht.position.set(0,.02,-.015);head.add(ht);S(head,.115,8,8,hm,0,-.02,-.1).scale.set(1.05,1.2,.65);
  if(ponytail)P(head,.048,.22,hm,0,-.12,-.17,false).rotation.x=.35;
  if(sunglasses)B(head,.22,.055,.06,stdMat(0x0b1220,.1,.9),0,.02,.115,false);
  if(hat==='police'){C(head,.16,.15,.1,10,stdMat(0x16243d,.6),0,.17,0,false);B(head,.2,.03,.16,bm,0,.13,.12,false);}else if(hat==='swat')S(head,.18,10,8,stdMat(0x161b24,.45,.4),0,.07,0);
  body.add(leftLeg,rightLeg,torso,leftArm,rightArm,head);
  const ws=new THREE.Group();ws.position.set(0,-.56,.14);rightArm.add(ws);let wp=null;
  const setWeapon=id=>{if(wp)ws.remove(wp.mesh);wp=id?buildWeaponMesh(id):null;if(wp)ws.add(wp.mesh);};if(weaponId)setWeapon(weaponId);
  const getMuzzleWorldPos=(t=V3())=>wp?wp.muzzleAnchor.getWorldPosition(t):root.position.clone().add(V3(0,1.38,0));
  const animatePose=(wc,spd,aim,dt,roll=0)=>{
    if(roll>0){body.rotation.x=roll*6.283;body.position.y=M.sin(roll*M.PI)*.32;return;}
    body.rotation.x=body.position.y=0;const sw=M.sin(wc)*M.min(1,spd/5.5)*.68;leftLeg.rotation.x=sw;rightLeg.rotation.x=-sw;
    if(aim&&wp){rightArm.rotation.set(-1.46,.08,0);leftArm.rotation.set(-1.32,-.48,0);ws.rotation.x=1.46;torso.rotation.y=-.14;}
    else{rightArm.rotation.set(-sw*.6,0,0);leftArm.rotation.set(sw*.6,0,0);ws.rotation.x=.25;torso.rotation.y=0;}
  };
  return{root,body,leftLeg,rightLeg,leftArm,rightArm,head,setWeapon,getMuzzleWorldPos,animatePose};
}

export class PlayerController {
  constructor(scene, cityWorld, vehicleSystem) {
    this.scene=scene;this.cityWorld=cityWorld;this.vehicleSystem=vehicleSystem;
    this.rig=createStylizedCharacterRig({jacket:0xe63c5e,shirt:0xf7f3ea,pants:0x1d2536,skin:0xdca178,hair:0x181316,sunglasses:true,weaponId:'smg',ponytail:true});
    scene.add(this.rig.root);this.pos=V3(164,.35,32);this.vel=V3();this.yaw=0;
    this.hp=this.maxHp=100;this.armor=75;this.maxArmor=100;this.cash=14850;
    this.vehicle=null;this.aiming=false;this.walkCycle=0;this.rollTimer=0;this.rollDir=V3();
    this.weaponIndex=1;this.ammo=WEAPON_CATALOG.map(w=>({mag:w.mag,reserve:w.reserve}));this.rig.root.position.copy(this.pos);
  }

  get currentWeapon() { return WEAPON_CATALOG[this.weaponIndex]; }
  selectWeapon(i) { this.weaponIndex=((i%WEAPON_CATALOG.length)+WEAPON_CATALOG.length)%WEAPON_CATALOG.length;this.rig.setWeapon(WEAPON_CATALOG[this.weaponIndex].id); }
  enterVehicle(v) { if(!v||v.destroyed)return false;this.vehicle=v;v.role='player';this.pos.copy(v.pos);this.yaw=v.yaw;this.rig.root.visible=false;return true; }
  exitVehicle() { if(!this.vehicle)return null;const v=this.vehicle;this.pos.copy(v.pos).add(V3(-v.spec.width*.78-.65,0,0).applyAxisAngle(V3(0,1,0),v.yaw));this.pos.y=M.max(.25,this.cityWorld.getTerrainHeight(this.pos.x,this.pos.z));this.yaw=v.yaw;this.rig.root.position.copy(this.pos);this.rig.root.rotation.y=this.yaw;this.rig.root.visible=true;this.vehicle=null;return v; }
  findNearestVehicle(maxD = 6.2) { let b=null,bd=maxD;for(const v of this.vehicleSystem.vehicles)if(!v.destroyed){const d=M.hypot(v.pos.x-this.pos.x,v.pos.z-this.pos.z);if(d<bd){bd=d;b=v;}}return b; }
  takeDamage(a) { if(this.rollTimer>0)return;let r=a;if(this.armor>0){const ab=M.min(this.armor,r*.65);this.armor-=ab;r-=ab;}this.hp=M.max(0,this.hp-r); }
  startDodgeRoll(cy) { if(this.vehicle||this.rollTimer>0)return;this.rollTimer=.42;this.rollDir.set(M.sin(this.yaw||cy),0,M.cos(this.yaw||cy)).normalize(); }

  updateOnFoot(inp, cy, dt) {
    if(this.vehicle){this.pos.copy(this.vehicle.pos);this.yaw=this.vehicle.yaw;return;}
    const K=inp.keys,mx=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0),mz=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0);
    this.aiming=!!(inp.mouseRight||inp.mouseLeft);
    let vx=M.sin(cy)*mz+M.cos(cy)*mx,vz=M.cos(cy)*mz-M.sin(cy)*mx,l=M.hypot(vx,vz),spd=0;
    if(this.rollTimer>0){this.rollTimer=M.max(0,this.rollTimer-dt);vx=this.rollDir.x;vz=this.rollDir.z;spd=13.5;}
    else if(l>.01){vx/=l;vz/=l;spd=this.aiming?5.2:((K.ShiftLeft||K.ShiftRight)?10.6:6.8);}
    const nx=this.pos.x+vx*spd*dt,nz=this.pos.z+vz*spd*dt;
    if(!this.cityWorld.isWater(nx,nz)&&!this.cityWorld.colliders.some(c=>this.pos.y<=c.maxY&&nx+.55>c.minX&&nx-.55<c.maxX&&nz+.55>c.minZ&&nz-.55<c.maxZ)){this.pos.x=nx;this.pos.z=nz;}
    this.pos.y=M.max(.2,this.cityWorld.getTerrainHeight(this.pos.x,this.pos.z));
    if(this.aiming)this.yaw=cy;else if(l>.01){let d=M.atan2(vx,vz)-this.yaw;while(d>M.PI)d-=6.283;while(d<-M.PI)d+=6.283;this.yaw+=d*M.min(1,dt*12);}
    this.walkCycle+=spd*dt*1.65;this.rig.root.position.copy(this.pos);this.rig.root.rotation.y=this.yaw;
    this.rig.animatePose(this.walkCycle,spd,this.aiming,dt,this.rollTimer>0?1-this.rollTimer/.42:0);
  }
}

// Cala Solara — Full-Spectrum Combat, Barrel-Locked Aiming, Vehicle Destruction & Grenade Explosives
import * as THREE from 'three';

const M=Math,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

export class CombatAndDestructionSystem {
  constructor(scene, cityWorld, vehicleSystem, policeSystem, trafficSystem, atmosphere, audio) {
    this.scene=scene;this.cityWorld=cityWorld;this.vehicleSystem=vehicleSystem;this.policeSystem=policeSystem;
    this.trafficSystem=trafficSystem;this.atmosphere=atmosphere;this.audio=audio;
    this.fireCd=this.recoilKick=0;this.hostiles=[];this.grenades=[];
  }

  setHostiles(l) { this.hostiles=l; }
  raySphereDist(o, dir, c, r) { const oc=V3().subVectors(o,c),b=oc.dot(dir),d=b*b-(oc.dot(oc)-r*r);if(d<0)return -1;const t=-b-M.sqrt(d);return t>.5?t:-1; }

  getCrosshairAimPoint(cam, maxR = 95) {
    const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),cam);
    const o=ray.ray.origin,dir=ray.ray.direction;let bD=maxR,bH=null;
    const chk=(k,t,pt,r)=>{const d=this.raySphereDist(o,dir,pt,r);if(d>0&&d<bD){bD=d;bH={kind:k,target:t,point:o.clone().addScaledVector(dir,d)};}};
    for(const h of this.hostiles)if(h.alive)chk('hostile',h,h.pos.clone().add(V3(0,1.15,0)),.95);
    for(const f of this.policeSystem.officers)if(f.alive)chk('officer',f,f.pos.clone().add(V3(0,1.15,0)),.95);
    for(const v of this.vehicleSystem.vehicles)if(v.role!=='player')chk('vehicle',v,v.pos.clone().add(V3(0,1,0)),M.max(v.spec.width,v.spec.length)*.44);
    for(const rb of this.policeSystem.roadblocks)if(rb.barrelAlive)chk('barrel',rb,rb.barrelPos,1.05);
    return{hit:bH,point:bH?bH.point:o.clone().addScaledVector(dir,maxR),dir:dir.clone()};
  }

  firePlayerWeapon(pl, cam, onKill) {
    if(this.fireCd>0)return false;const w=pl.currentWeapon,am=pl.ammo[pl.weaponIndex];
    if(am.mag<=0){if(am.reserve>0){const t=M.min(w.mag,am.reserve);am.mag=t;am.reserve-=t;}else return false;}
    am.mag--;this.fireCd=w.fireRate;this.recoilKick=w.explosive?.08:.025;
    const mz=pl.vehicle?pl.pos.clone().add(V3(0,1.35,0)):pl.rig.getMuzzleWorldPos(),aim=this.getCrosshairAimPoint(cam,w.range),fd=V3().subVectors(aim.point,mz).normalize();
    this.atmosphere.spawnMuzzleFlash(mz,fd,w.color);if(this.audio)this.audio.playGunshot(w.id);this.trafficSystem.triggerPanic(pl.pos);
    if(w.explosive){
      const m=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),new THREE.MeshStandardMaterial({color:0xff7a2f,emissive:0xff5514,emissiveIntensity:3.5}));
      m.position.copy(mz);this.scene.add(m);this.grenades.push({mesh:m,pos:mz.clone(),vel:fd.multiplyScalar(42).add(V3(0,5.5,0)),life:2.2,onKill});
      this.policeSystem.addHeat(45,'EXPLOSIVE DISCHARGE');return true;
    }
    for(let p=0;p<w.pellets;p++){
      const end=aim.point.clone().addScaledVector(V3((M.random()-.5)*w.spread*2,(M.random()-.5)*w.spread*2,(M.random()-.5)*w.spread*2),mz.distanceTo(aim.point));
      this.atmosphere.spawnTracer(mz,end,w.color,.09);
      if(aim.hit&&!p)this.applyDirectHit(aim.hit,w.damage*w.pellets,pl,onKill);else if(!aim.hit&&!p)this.atmosphere.spawnImpactSparks(end,4,0xffd27a);
    }
    return true;
  }

  applyDirectHit(h, dmg, pl, onKill) {
    this.atmosphere.spawnImpactSparks(h.point,7,0xffc857);
    if(h.kind==='hostile'){if((h.target.hp-=dmg)<=0&&h.target.alive){h.target.alive=false;h.target.rig.root.rotation.x=M.PI*.5;h.target.rig.root.position.y-=.7;pl.cash+=250;if(onKill)onKill('hostile',h.target);}}
    else if(h.kind==='officer'){h.target.hp-=dmg;this.policeSystem.addHeat(38,'OFFICER UNDER FIRE');if(h.target.hp<=0&&h.target.alive){h.target.alive=false;h.target.rig.root.rotation.x=M.PI*.5;this.policeSystem.addHeat(65,'CSPD UNIT DOWN');}}
    else if(h.kind==='vehicle'){const b=this.vehicleSystem.damageVehicle(h.target,dmg*1.15);this.policeSystem.addHeat(b?85:20,b?'VEHICLE DESTROYED':'PROPERTY DAMAGE');if(b&&onKill)onKill('vehicle',h.target);}
    else if(h.kind==='barrel'){h.target.barrelAlive=false;h.target.barrelMesh.visible=false;this.detonateExplosion(h.target.barrelPos,11,pl,onKill);}
  }

  detonateExplosion(c, r, pl, onKill) {
    this.atmosphere.spawnExplosion(c,1.35);if(this.audio)this.audio.playExplosion();this.policeSystem.addHeat(75,'EXPLOSION REPORTED');
    for(const h of this.hostiles)if(h.alive&&h.pos.distanceTo(c)<r){h.hp=0;h.alive=false;h.rig.root.rotation.x=M.PI*.5;pl.cash+=250;if(onKill)onKill('hostile',h);}
    for(const o of this.policeSystem.officers)if(o.alive&&o.pos.distanceTo(c)<r){o.hp=0;o.alive=false;o.rig.root.rotation.x=M.PI*.5;}
    for(const v of this.vehicleSystem.vehicles)if(!v.destroyed&&v.pos.distanceTo(c)<r+2)this.vehicleSystem.damageVehicle(v,190);
  }

  update(dt, pl) {
    if(this.fireCd>0)this.fireCd=M.max(0,this.fireCd-dt);if(this.recoilKick>0)this.recoilKick=M.max(0,this.recoilKick-dt*.25);
    for(let i=this.grenades.length-1;i>=0;i--){const g=this.grenades[i];g.life-=dt;g.vel.y-=20*dt;g.pos.addScaledVector(g.vel,dt);g.mesh.position.copy(g.pos);if(g.life<=0||g.pos.y<=this.cityWorld.getTerrainHeight(g.pos.x,g.pos.z)+.25){this.scene.remove(g.mesh);this.detonateExplosion(g.pos,11.5,pl,g.onKill);this.grenades.splice(i,1);}}
  }
}

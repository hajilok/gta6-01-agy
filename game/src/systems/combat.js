// Cala Solara — Full-Spectrum Combat, Multi-Pellet Shotgun Raycasts, Grenades & Destructible Barrels
import * as THREE from 'three';

export class CombatAndWeaponsSystem {
  constructor(sc,cw,vs,ps,tf,pd,vf,au){Object.assign(this,{scene:sc,cityWorld:cw,vehicleSystem:vs,policeSystem:ps,trafficSystem:tf,pedSystem:pd,vfx:vf,audio:au,fireCooldown:0,recoilKick:0,hitMarkerTimer:0,hostiles:[],grenades:[]});}
  setHostiles(l){this.hostiles=l;}
  raySphereDistance(o,dir,c,r){const oc=v3().subVectors(o,c),b=oc.dot(dir),d=b*b-(oc.dot(oc)-r*r);if(d<0)return -1;const t=-b-Math.sqrt(d);return t>.5?t:-1;}
  castAimRay(o,dir,maxR=95){
    let bD=maxR,bH=null;const chk=(k,t,x,y,z,r)=>{const d=this.raySphereDistance(o,dir,v3(x,y,z),r);if(d>0&&d<bD){bD=d;bH={kind:k,target:t,point:o.clone().addScaledVector(dir,d)};}};
    for(const h of this.hostiles)if(h.alive)chk('hostile',h,h.pos.x,h.pos.y+1.15,h.pos.z,.96);
    for(const f of this.policeSystem.officers)if(f.alive)chk('officer',f,f.pos.x,f.pos.y+1.15,f.pos.z,.96);
    for(const v of this.vehicleSystem.vehicles)if(v.role!=='player')chk('vehicle',v,v.pos.x,v.pos.y+1,v.pos.z,Math.max(v.spec.width,v.spec.length)*.44);
    for(const rb of this.policeSystem.roadblocks)if(rb.barrelAlive)chk('barrel',rb,rb.barrelPos.x,rb.barrelPos.y,rb.barrelPos.z,1.08);
    return{hit:bH,point:bH?bH.point:o.clone().addScaledVector(dir,maxR)};
  }
  getCrosshairAimPoint(cam,maxR=95){const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),cam);return{...this.castAimRay(ray.ray.origin,ray.ray.direction,maxR),origin:ray.ray.origin.clone(),dir:ray.ray.direction.clone()};}
  firePlayerWeapon(pl,cam,onKill){
    const t=this;if(t.fireCooldown>0)return false;const w=pl.currentWeapon,am=pl.ammo[pl.weaponIndex];if(am.mag<=0&&!pl.reloadWeapon())return false;
    am.mag--;t.fireCooldown=w.fireRate;t.recoilKick=w.explosive?.085:.026;
    const mz=pl.vehicle?v3(pl.pos.x,pl.pos.y+1.38,pl.pos.z):pl.rig.getMuzzleWorldPos(),aim=t.getCrosshairAimPoint(cam,w.range),fd=v3().subVectors(aim.point,mz).normalize();
    t.vfx.spawnMuzzleFlash(mz,fd,w.color);t.audio?.playGunshot(w.id);t.trafficSystem?.triggerPanic(pl.pos);t.pedSystem?.triggerPanic(pl.pos);
    if(w.explosive){const m=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),new THREE.MeshStandardMaterial({color:0xff7a2f,emissive:0xff5514,emissiveIntensity:3.4}));m.position.copy(mz);t.scene.add(m);t.grenades.push({mesh:m,pos:mz.clone(),vel:fd.multiplyScalar(42).add(v3(0,5.5,0)),life:2.2,onKill});t.policeSystem.addHeat(45,'EXPLOSIVE DISCHARGE');return true;}
    const rn=()=>Math.random()-.5;
    for(let p=0;p<w.pellets;p++){const pd=aim.dir.clone().add(v3(rn()*w.spread*2,rn()*w.spread*2,rn()*w.spread*2)).normalize(),res=w.pellets>1?t.castAimRay(aim.origin,pd,w.range):aim;t.vfx.spawnTracer(mz,res.point,w.color,.12);if(res.hit)t.applyDirectHit(res.hit,w.damage,pl,onKill);else if(!p)t.vfx.spawnImpactSparks(res.point,4,0xffd27a);}
    return true;
  }
  applyDirectHit(h,dmg,pl,onKill){
    const t=this,x=h.target;t.hitMarkerTimer=.16;t.vfx.spawnImpactSparks(h.point,7,0xffc857);
    if(h.kind==='hostile'){if((x.hp-=dmg)<=0&&x.alive){x.alive=false;x.rig.root.rotation.x=1.5708;x.rig.root.position.y-=.65;pl.cash+=250;onKill?.('hostile',x);}}
    else if(h.kind==='officer'){x.hp-=dmg;t.policeSystem.addHeat(38,'OFFICER UNDER FIRE');if(x.hp<=0&&x.alive){x.alive=false;x.rig.root.rotation.x=1.5708;t.policeSystem.addHeat(65,'CSPD UNIT DOWN');}}
    else if(h.kind==='vehicle'){const b=t.vehicleSystem.damageVehicle(x,dmg*1.15);t.policeSystem.addHeat(b?85:20,b?'VEHICLE DESTROYED':'PROPERTY DAMAGE');if(b)onKill?.('vehicle',x);}
    else if(h.kind==='barrel'){x.barrelAlive=false;x.barrelMesh.visible=false;t.detonateExplosion(x.barrelPos,11.5,pl,onKill);}
  }
  detonateExplosion(c,r,pl,onKill){
    const t=this;t.vfx.spawnExplosion(c,1.4);t.audio?.playExplosion();t.policeSystem.addHeat(75,'EXPLOSION REPORTED');
    for(const h of t.hostiles)if(h.alive&&h.pos.distanceTo(c)<r){h.hp=0;h.alive=false;h.rig.root.rotation.x=1.5708;pl.cash+=250;onKill?.('hostile',h);}
    for(const o of t.policeSystem.officers)if(o.alive&&o.pos.distanceTo(c)<r){o.hp=0;o.alive=false;o.rig.root.rotation.x=1.5708;}
    for(const v of t.vehicleSystem.vehicles)if(!v.destroyed&&v.pos.distanceTo(c)<r+2)t.vehicleSystem.damageVehicle(v,195);
  }
  update(dt,pl){
    const t=this,M=Math.max;if(t.fireCooldown>0)t.fireCooldown=M(0,t.fireCooldown-dt);if(t.recoilKick>0)t.recoilKick=M(0,t.recoilKick-dt*.25);if(t.hitMarkerTimer>0)t.hitMarkerTimer=M(0,t.hitMarkerTimer-dt);
    for(let i=t.grenades.length-1;i>=0;i--){const g=t.grenades[i];g.life-=dt;g.vel.y-=20*dt;g.pos.addScaledVector(g.vel,dt);g.mesh.position.copy(g.pos);if(g.life<=0||g.pos.y<=t.cityWorld.getTerrainHeight(g.pos.x,g.pos.z)+.25){t.scene.remove(g.mesh);t.detonateExplosion(g.pos,11.5,pl,g.onKill);t.grenades.splice(i,1);}}
  }
}
const v3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

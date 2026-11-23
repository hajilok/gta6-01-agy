// Cala Solara — Layered Particle VFX, Drift Smoke, Skidmarks, High-Vis Tracers & Explosions
import * as THREE from 'three';

export class VfxParticleSystem {
  constructor(scene,textures){
    Object.assign(this,{scene,textures,particles:[],skidMarks:[],tracers:[],flashLights:[],skidMat:new THREE.MeshBasicMaterial({color:0x0e1016,transparent:true,opacity:.62,depthWrite:false}),skidGeo:new THREE.PlaneGeometry(.46,1.45)});
    this.skidGeo.rotateX(-1.5708);
  }
  spawnSprite(pos,vel,{color=0xf0e4d6,size=1.2,grow=2.2,life=.75,opacity=.5,additive=0,gravity=0,useStar=0,useFlare=0}={}){
    if(this.particles.length>280){const o=this.particles.shift();this.scene.remove(o.mesh);o.mesh.material.dispose();}
    const t=this.textures,map=useStar?t.starFlashMap:(useFlare?t.flareGlowMap:t.softParticleMap);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map,color,transparent:true,opacity,depthWrite:false,rotation:Math.random()*6.283,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending}));
    sp.position.copy(pos);sp.scale.set(size,size,1);this.scene.add(sp);this.particles.push({mesh:sp,vel:vel.clone(),life,maxLife:life,size,grow,baseOpacity:opacity,gravity});
  }
  spawnTireSmoke(p,cv){this.spawnSprite(p,v3(rn(1.8)-cv.x*.06,.95+Math.random()*.9,rn(1.8)-cv.z*.06),{color:0xf7eee2,size:.95+Math.random()*.45,grow:2.9,life:.72,opacity:.42});}
  spawnSkidMark(p,yaw){if(this.skidMarks.length>200)this.scene.remove(this.skidMarks.shift());const m=new THREE.Mesh(this.skidGeo,this.skidMat);m.position.set(p.x,p.y+.045,p.z);m.rotation.y=yaw;this.scene.add(m);this.skidMarks.push(m);}
  spawnMuzzleFlash(p,dir,c=0xffe090){this.spawnSprite(p,dir.clone().multiplyScalar(1.5),{color:c,size:.85,grow:.4,life:.09,opacity:.95,additive:1,useStar:1});this.spawnSprite(p,v3(),{color:0xffa838,size:1.15,grow:.2,life:.07,opacity:.58,additive:1,useFlare:1});this.spawnFlashLight(p,c,5.5,14,.08);}
  spawnTracer(a,b,color=0xff7b1c,life=.12){
    const d=a.distanceTo(b);if(d<.25)return;const g=new THREE.Group(),oG=new THREE.CylinderGeometry(.042,.06,d,6),cG=new THREE.CylinderGeometry(.016,.024,d,5);oG.rotateX(1.5708);cG.rotateX(1.5708);
    const oM=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.86,depthWrite:false}),cM=new THREE.MeshBasicMaterial({color:0xfff4c2,transparent:true,opacity:.96,blending:THREE.AdditiveBlending,depthWrite:false});
    g.add(new THREE.Mesh(oG,oM),new THREE.Mesh(cG,cM));g.position.copy(a).add(b).multiplyScalar(.5);g.lookAt(b);this.scene.add(g);this.tracers.push({mesh:g,mats:[oM,cM],geos:[oG,cG],life,maxLife:life});
  }
  spawnImpactSparks(p,n=8,c=0xffbe48){for(let i=0;i<n;i++)this.spawnSprite(p,v3(rn(10.5),2.5+Math.random()*6.5,rn(10.5)),{color:c,size:.42,grow:-.15,life:.34,opacity:1,additive:1,gravity:15,useStar:1});}
  spawnEngineSmoke(p,b=false){this.spawnSprite(p,v3(rn(.9),2.2+Math.random(),rn(.9)),{color:b?0x262426:0x62666e,size:.9,grow:2.2,life:.85,opacity:.56});if(b)this.spawnSprite(p,v3(rn(.7),2.6,rn(.7)),{color:0xff6e1a,size:.85,grow:.6,life:.32,opacity:.92,additive:1,useFlare:1});}
  spawnWaterSpray(p,s=1.2){this.spawnSprite(p,v3(rn(s),1.4+Math.random()*1.6,rn(s)),{color:0xdcf8ff,size:.75,grow:1.9,life:.55,opacity:.52,gravity:4.5});}
  spawnExplosion(p,r=1){
    this.spawnSprite(p.clone().add(v3(0,1.4,0)),v3(0,.8,0),{color:0xfff0b8,size:4*r,grow:2.8*r,life:.32,opacity:.96,additive:1,useFlare:1});
    for(let i=0;i<12;i++)this.spawnSprite(p.clone().add(v3(rn(2.6),1.8+Math.random()*2.6,rn(2.6))),v3(rn(2.4),3.6+Math.random()*3.4,rn(2.4)),{color:i%2?0x1b1c22:0x332d2b,size:(2.2+Math.random()*1.3)*r,grow:4*r,life:1.6,opacity:.82});
    for(let i=0;i<10;i++)this.spawnSprite(p.clone().add(v3(rn(1.8),.8+Math.random()*1.5,rn(1.8))),v3(rn(2.8),2.6+Math.random()*3,rn(2.8)),{color:i<4?0xff4512:0xff9a1f,size:(1.9+Math.random()*1.1)*r,grow:2.8*r,life:.65,opacity:.92,additive:1});
    this.spawnImpactSparks(p.clone().add(v3(0,1.6,0)),18,0xffba38);this.spawnFlashLight(p.clone().add(v3(0,2.4,0)),0xff6e1c,16,42,.5);
  }
  spawnFlashLight(p,c,i,d,l){if(this.flashLights.length>7)this.scene.remove(this.flashLights.shift().light);const L=new THREE.PointLight(c,i,d);L.position.copy(p);this.scene.add(L);this.flashLights.push({light:L,life:l,maxLife:l,baseIntensity:i});}
  update(dt,freeze=false){
    if(freeze)return;
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];if((p.life-=dt)<=0){this.scene.remove(p.mesh);p.mesh.material.dispose();this.particles.splice(i,1);continue;}p.vel.y-=p.gravity*dt;p.mesh.position.addScaledVector(p.vel,dt);const t=1-p.life/p.maxLife,s=Math.max(.05,p.size+p.grow*t);p.mesh.scale.set(s,s,1);p.mesh.material.opacity=p.baseOpacity*(1-t);}
    for(let i=this.tracers.length-1;i>=0;i--){const q=this.tracers[i];if((q.life-=dt)<=0){this.scene.remove(q.mesh);q.geos.forEach(g=>g.dispose());q.mats.forEach(m=>m.dispose());this.tracers.splice(i,1);}else{const k=q.life/q.maxLife;q.mats[0].opacity=k*.86;q.mats[1].opacity=k*.96;}}
    for(let i=this.flashLights.length-1;i>=0;i--){const f=this.flashLights[i];if((f.life-=dt)<=0){this.scene.remove(f.light);this.flashLights.splice(i,1);}else f.light.intensity=f.baseIntensity*(f.life/f.maxLife);}
  }
}
const v3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),rn=s=>(Math.random()-.5)*s;

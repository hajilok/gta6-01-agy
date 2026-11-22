// Cala Solara — Dynamic Atmosphere, HDR PMREM Sky Reflections, Follow-Cam Shadows & Layered VFX
import * as THREE from 'three';
import { createOceanMaterial, createSkyDomeMaterial, createSkyEnvMap } from '../render/materials.js';

const M=Math,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const mkP=(name,sunDir,sunColor,sunIntensity,hemiSky,hemiGround,hemiIntensity,fogColor,fogDensity,skyTop,skyMid,skyHorizon,shallowWater,deepWater,emissiveScale,starAlpha,g)=>({name,sunDir,sunColor,sunIntensity,hemiSky,hemiGround,hemiIntensity,fogColor,fogDensity,skyTop,skyMid,skyHorizon,shallowWater,deepWater,emissiveScale,starAlpha,grade:{threshold:g[0],bloomStrength:g[1],exposure:g[2],vignette:g[3],warmTint:g[4]}});

export const TIME_PRESETS={
  golden:mkP('Golden Hour',[.64,.29,.71],0xffc684,3.1,0x8db6f0,0x52423a,.62,0xf09c72,.00115,0x1e3f7a,0xdc7668,0xffc17d,0x1bd1c8,0x0b3a63,1.05,0,[.76,.68,1.12,.13,[1.05,1,.94]]),
  day:mkP('Sunlit Noon',[-.48,.72,.5],0xfff4dd,3.2,0x8cc8ff,0x62584c,.66,0xb9dcf2,.0009,0x1e6ec7,0x5ea9e8,0xd7eefc,0x20e0d4,0x0c4a7d,.3,0,[.85,.42,1.06,.09,[1.02,1.01,.98]]),
  dusk:mkP('Neon Dusk',[-.72,.15,-.45],0xff7b63,2.1,0x5362a6,0x29223c,.62,0x3b2f59,.00125,0x0d1536,0x612f70,0xf0726e,0x158f9c,0x091d3b,1.75,.72,[.68,.86,1.14,.16,[1.03,.97,1.06]]),
  morning:mkP('Coastal Morning',[.68,.52,-.52],0xffe9c2,3.05,0x9cd4ff,0x605649,.68,0xcbe4f2,.00095,0x2467b8,0x76b8e8,0xffe2be,0x1fded4,0x0d4c80,.45,0,[.82,.46,1.08,.09,[1.03,1.01,.97]]),
};
export const PRESET_ORDER=['golden','day','dusk','morning'];

export class AtmosphereAndVfxSystem {
  constructor(scene, renderer, textures, postfx) {
    this.scene=scene;this.renderer=renderer;this.textures=textures;this.postfx=postfx;
    this.emissiveRefs=[];this.animatedProps=[];this.currentPreset='golden';this.elapsed=0;
    this.skyMat=createSkyDomeMaterial();this.skyMesh=new THREE.Mesh(new THREE.SphereGeometry(950,32,20),this.skyMat);scene.add(this.skyMesh);
    this.oceanMat=createOceanMaterial();this.oceanMesh=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400,120,120),this.oceanMat);
    this.oceanMesh.rotation.x=-M.PI*.5;this.oceanMesh.position.set(120,0,80);scene.add(this.oceanMesh);
    this.hemiLight=new THREE.HemisphereLight(0x8db6f0,0x52423a,.62);scene.add(this.hemiLight);
    this.sunLight=new THREE.DirectionalLight(0xffc684,3.1);this.sunLight.castShadow=true;this.sunLight.shadow.mapSize.set(2048,2048);
    Object.assign(this.sunLight.shadow.camera,{left:-76,right:76,top:76,bottom:-76,near:10,far:280});
    this.sunLight.shadow.bias=-.00045;this.sunLight.shadow.normalBias=.045;scene.add(this.sunLight,this.sunLight.target);
    this.sunDir=V3(.64,.29,.71).normalize();this.scene.fog=new THREE.FogExp2(0xf09c72,.00115);
    this.particles=[];this.skidMarks=[];this.tracers=[];this.flashLights=[];
    this.skidMat=new THREE.MeshBasicMaterial({color:0x16181e,transparent:true,opacity:.45,depthWrite:false});
    this.skidGeo=new THREE.PlaneGeometry(.44,1.35);this.skidGeo.rotateX(-M.PI*.5);
    this.scene.environment=createSkyEnvMap(this.renderer,TIME_PRESETS.golden);this.applyPreset('golden');
  }

  registerDistrictEffects(em, an) { this.emissiveRefs=em;this.animatedProps=an;this.applyPreset(this.currentPreset); }

  applyPreset(key) {
    const p=TIME_PRESETS[key]||TIME_PRESETS.golden;this.currentPreset=key;this.sunDir.set(...p.sunDir).normalize();
    this.sunLight.color.setHex(p.sunColor);this.sunLight.intensity=p.sunIntensity;
    this.hemiLight.color.setHex(p.hemiSky);this.hemiLight.groundColor.setHex(p.hemiGround);this.hemiLight.intensity=p.hemiIntensity;
    this.scene.fog.color.setHex(p.fogColor);this.scene.fog.density=p.fogDensity;
    const su=this.skyMat.uniforms,ou=this.oceanMat.uniforms;
    su.uTopColor.value.setHex(p.skyTop);su.uMidColor.value.setHex(p.skyMid);su.uHorizonColor.value.setHex(p.skyHorizon);su.uSunDir.value.copy(this.sunDir);su.uSunColor.value.setHex(p.sunColor);su.uStarAlpha.value=p.starAlpha;
    ou.uSunDir.value.copy(this.sunDir);ou.uSunColor.value.setHex(p.sunColor);ou.uShallowColor.value.setHex(p.shallowWater);ou.uDeepColor.value.setHex(p.deepWater);ou.uHorizonColor.value.setHex(p.skyHorizon);ou.uFogColor.value.setHex(p.fogColor);ou.uFogDensity.value=p.fogDensity;
    for(const r of this.emissiveRefs)r.mat.emissiveIntensity=r.alwaysBright?r.base*M.max(.88,p.emissiveScale):r.base*p.emissiveScale;
    if(this.postfx)this.postfx.setGrade(p.grade);
  }

  cyclePreset() { const n=PRESET_ORDER[(PRESET_ORDER.indexOf(this.currentPreset)+1)%4];this.applyPreset(n);return TIME_PRESETS[n].name; }

  spawnSprite(pos, vel, { color = 0xebd9c8, size = 1.2, grow = 2.2, life = 0.75, opacity = 0.5, additive = false, gravity = 0, useStar = false } = {}) {
    if(this.particles.length>260){const o=this.particles.shift();this.scene.remove(o.mesh);o.mesh.material.dispose();}
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:useStar?this.textures.starFlashMap:this.textures.softParticleMap,color,transparent:true,opacity,depthWrite:false,rotation:M.random()*6.28,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending}));
    sp.position.copy(pos);sp.scale.set(size,size,1);this.scene.add(sp);
    this.particles.push({mesh:sp,vel:vel.clone(),life,maxLife:life,size,grow,baseOpacity:opacity,gravity});
  }

  spawnTireSmoke(p, cv) { this.spawnSprite(p,V3((M.random()-.5)*2-cv.x*.08,1+M.random(),(M.random()-.5)*2-cv.z*.08),{color:0xf2dfc8,size:.9+M.random()*.4,grow:2.8,life:.7,opacity:.34}); }
  spawnSkidMark(p, yaw) { if(this.skidMarks.length>180)this.scene.remove(this.skidMarks.shift());const m=new THREE.Mesh(this.skidGeo,this.skidMat);m.position.set(p.x,p.y+.04,p.z);m.rotation.y=yaw;this.scene.add(m);this.skidMarks.push(m); }
  spawnMuzzleFlash(p, dir, c = 0xffe08a) { this.spawnSprite(p,dir.clone().multiplyScalar(1.5),{color:c,size:.95,grow:.5,life:.09,opacity:.98,additive:true,useStar:true});this.spawnFlashLight(p,c,5,14,.08); }

  spawnTracer(a, b, color = 0xffe08a, life = 0.08) {
    const d=a.distanceTo(b);if(d<.25)return;
    const g=new THREE.CylinderGeometry(.014,.022,d,5);g.rotateX(M.PI*.5);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.88,blending:THREE.AdditiveBlending,depthWrite:false}));
    m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);this.scene.add(m);this.tracers.push({mesh:m,life,maxLife:life});
  }

  spawnImpactSparks(p, n = 8, color = 0xffb845) { for(let i=0;i<n;i++)this.spawnSprite(p,V3((M.random()-.5)*10,2.5+M.random()*6,(M.random()-.5)*10),{color,size:.36,grow:-.15,life:.3,opacity:1,additive:true,gravity:15,useStar:true}); }

  spawnExplosion(p, r = 1) {
    for(let i=0;i<12;i++)this.spawnSprite(p.clone().add(V3((M.random()-.5)*2.8,1.4+M.random()*2.6,(M.random()-.5)*2.8)),V3((M.random()-.5)*2.5,3.8+M.random()*3.5,(M.random()-.5)*2.5),{color:i%2?0x1b1c22:0x2f2b2c,size:(2.4+M.random()*1.4)*r,grow:4.5*r,life:1.6,opacity:.86});
    for(let i=0;i<8;i++)this.spawnSprite(p.clone().add(V3((M.random()-.5)*1.8,.7+M.random()*1.4,(M.random()-.5)*1.8)),V3((M.random()-.5)*3,2.8+M.random()*3,(M.random()-.5)*3),{color:i<3?0xff4514:0xff8c1a,size:(1.9+M.random()*1.2)*r,grow:3.4*r,life:.65,opacity:.92});
    this.spawnImpactSparks(p.clone().add(V3(0,1.5,0)),14,0xffaa2b);this.spawnFlashLight(p.clone().add(V3(0,2.2,0)),0xff6a1a,11,36,.45);
  }

  spawnFlashLight(p, color, intensity, dist, life) { if(this.flashLights.length>6)this.scene.remove(this.flashLights.shift().light);const l=new THREE.PointLight(color,intensity,dist);l.position.copy(p);this.scene.add(l);this.flashLights.push({light:l,life,maxLife:life,baseIntensity:intensity}); }

  update(dt, focus, freeze = false) {
    this.elapsed+=dt;this.oceanMat.uniforms.uTime.value=this.skyMat.uniforms.uTime.value=this.elapsed;
    if(focus){this.skyMesh.position.set(focus.x,0,focus.z);this.sunLight.target.position.set(focus.x,0,focus.z);this.sunLight.position.set(focus.x+this.sunDir.x*125,this.sunDir.y*125,focus.z+this.sunDir.z*125);}
    for(const pr of this.animatedProps){if(pr.type==='rotateY')pr.obj.rotation.y+=pr.speed*dt;else if(pr.type==='sway'){pr.obj.rotation.z=M.sin(this.elapsed*1.6+pr.phase)*.055;pr.obj.rotation.x=M.cos(this.elapsed*1.3+pr.phase)*.038;}}
    if(freeze)return;
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];if((p.life-=dt)<=0){this.scene.remove(p.mesh);p.mesh.material.dispose();this.particles.splice(i,1);continue;}p.vel.y-=p.gravity*dt;p.mesh.position.addScaledVector(p.vel,dt);const t=1-p.life/p.maxLife,sz=M.max(.05,p.size+p.grow*t);p.mesh.scale.set(sz,sz,1);p.mesh.material.opacity=p.baseOpacity*(1-t);}
    for(let i=this.tracers.length-1;i>=0;i--){const tr=this.tracers[i];if((tr.life-=dt)<=0){this.scene.remove(tr.mesh);tr.mesh.geometry.dispose();tr.mesh.material.dispose();this.tracers.splice(i,1);}else tr.mesh.material.opacity=(tr.life/tr.maxLife)*.88;}
    for(let i=this.flashLights.length-1;i>=0;i--){const fl=this.flashLights[i];if((fl.life-=dt)<=0){this.scene.remove(fl.light);this.flashLights.splice(i,1);}else fl.light.intensity=fl.baseIntensity*(fl.life/fl.maxLife);}
  }
}

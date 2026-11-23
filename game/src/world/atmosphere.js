// Cala Solara — 4-Preset Dynamic Atmosphere, Cached HDR PMREM Reflections & Balanced Sun Shadows
import * as THREE from 'three';
import { createOceanMaterial, createSkyDomeMaterial, createSkyEnvMap } from '../render/materials.js';

export const PRESET_ORDER=['golden','day','dusk','morning'];
export const TIME_PRESETS={
  golden:makePreset('Golden Hour',[.62,.28,.72],0xffbe6e,3.25,0x7cb0f2,0x3b3332,.56,0xe8946c,.00048,0x153572,0xd86264,0xffb66c,0x00e8de,0x062c60,1.15,0,[.88,.44,1.04,.1,[1.04,1,.94]]),
  day:makePreset('Sunlit Afternoon',[-.52,.58,.62],0xffe8c6,2.85,0x7cbcf8,0x52463a,.58,0x9acced,.0004,0x125ab4,0x4b9ae0,0xc4e4fa,0x00e0d6,0x083d74,.32,0,[.96,.22,.96,.07,[1.02,1,.96]]),
  dusk:makePreset('Neon Dusk',[-.72,.15,-.48],0xff7862,2.3,0x5468b4,0x1e1a32,.58,0x261f48,.00034,0x080e2c,0x52246a,0xee646c,0x0e9aa8,0x071834,1.85,.85,[.78,.58,1.1,.13,[1.02,.98,1.06]]),
  morning:makePreset('Coastal Morning',[.58,.54,.6],0xffe6c6,3.05,0x88caff,0x4c4840,.62,0xb8dcf4,.00042,0x1860b6,0x62b0ea,0xffdfbe,0x08e8dc,0x09447a,.48,0,[.94,.24,.98,.07,[1.01,1.01,.98]]),
};
export class AtmosphereController {
  constructor(sc,rn,pf){
    const sm=createSkyDomeMaterial(),sk=new THREE.Mesh(new THREE.SphereGeometry(960,32,20),sm),om=createOceanMaterial(),oc=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400,120,120),om),hl=new THREE.HemisphereLight(0x7cb0f2,0x3b3332,.56),sl=new THREE.DirectionalLight(0xffbe6e,3.25);
    oc.rotation.x=-1.5708;oc.position.set(120,0,80);sl.castShadow=true;sl.shadow.mapSize.set(2048,2048);Object.assign(sl.shadow.camera,{left:-68,right:68,top:68,bottom:-68,near:10,far:280});sl.shadow.bias=-.0003;sl.shadow.normalBias=.022;sc.add(sk,oc,hl,sl,sl.target);sc.fog=new THREE.FogExp2(0xe8946c,.00048);
    Object.assign(this,{scene:sc,renderer:rn,postfx:pf,emissiveRefs:[],animatedProps:[],envMaps:{},currentPreset:'golden',elapsed:0,skyMat:sm,skyMesh:sk,oceanMat:om,oceanMesh:oc,hemiLight:hl,sunLight:sl,sunDir:new THREE.Vector3(.62,.28,.72).normalize()});this.applyPreset('golden');
  }
  registerDistrictEffects(em,ap){this.emissiveRefs=em;this.animatedProps=ap;this.applyPreset(this.currentPreset);}
  applyPreset(k){
    const t=this,p=TIME_PRESETS[k]||TIME_PRESETS.golden,su=t.skyMat.uniforms,ou=t.oceanMat.uniforms;t.currentPreset=k;t.sunDir.set(...p.sunDir).normalize();
    t.sunLight.color.setHex(p.sunColor);t.sunLight.intensity=p.sunIntensity;t.hemiLight.color.setHex(p.hemiSky);t.hemiLight.groundColor.setHex(p.hemiGround);t.hemiLight.intensity=p.hemiIntensity;t.scene.fog.color.setHex(p.fogColor);t.scene.fog.density=p.fogDensity;
    if(!t.envMaps[k])t.envMaps[k]=createSkyEnvMap(t.renderer,p);t.scene.environment=t.envMaps[k];
    su.uTopColor.value.setHex(p.skyTop);su.uMidColor.value.setHex(p.skyMid);su.uHorizonColor.value.setHex(p.skyHorizon);su.uSunDir.value.copy(t.sunDir);su.uSunColor.value.setHex(p.sunColor);su.uStarAlpha.value=p.starAlpha;
    ou.uSunDir.value.copy(t.sunDir);ou.uSunColor.value.setHex(p.sunColor);ou.uShallowColor.value.setHex(p.shallowWater);ou.uDeepColor.value.setHex(p.deepWater);ou.uHorizonColor.value.setHex(p.skyHorizon);ou.uFogColor.value.setHex(p.fogColor);ou.uFogDensity.value=p.fogDensity;
    for(const r of t.emissiveRefs)r.mat.emissiveIntensity=r.alwaysBright?r.base*Math.max(.85,Math.min(1.3,p.emissiveScale)):r.base*p.emissiveScale;t.postfx?.setGrade(p.grade);
  }
  cyclePreset(){const n=PRESET_ORDER[(PRESET_ORDER.indexOf(this.currentPreset)+1)%4];this.applyPreset(n);return TIME_PRESETS[n].name;}
  update(dt,f,fr=false){const t=this;t.elapsed+=dt;t.oceanMat.uniforms.uTime.value=t.skyMat.uniforms.uTime.value=t.elapsed;if(f){t.skyMesh.position.set(f.x,0,f.z);t.sunLight.target.position.set(f.x,0,f.z);t.sunLight.position.set(f.x+t.sunDir.x*125,t.sunDir.y*125,f.z+t.sunDir.z*125);}if(fr)return;for(const a of t.animatedProps){if(a.type==='rotateY')a.obj.rotation.y+=a.speed*dt;else if(a.type==='sway'){a.obj.rotation.z=Math.sin(t.elapsed*1.6+a.phase)*.052;a.obj.rotation.x=Math.cos(t.elapsed*1.3+a.phase)*.036;}}}
}
function makePreset(name,sunDir,sunColor,sunIntensity,hemiSky,hemiGround,hemiIntensity,fogColor,fogDensity,skyTop,skyMid,skyHorizon,shallowWater,deepWater,emissiveScale,starAlpha,g){return{name,sunDir,sunColor,sunIntensity,hemiSky,hemiGround,hemiIntensity,fogColor,fogDensity,skyTop,skyMid,skyHorizon,shallowWater,deepWater,emissiveScale,starAlpha,grade:{threshold:g[0],bloomStrength:g[1],exposure:g[2],vignette:g[3],warmTint:g[4]}};}

// Custom Lightweight HDR Bloom + ACES Filmic Color Grading Post-Processor
import * as THREE from 'three';

const V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const BR=`uniform sampler2D tScene;uniform float uThreshold,uKnee;varying vec2 vUv;void main(){vec3 c=texture2D(tScene,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722)),s=clamp((l-uThreshold+uKnee)/(2.*uKnee+.0001),0.,1.);s*=s;gl_FragColor=vec4(min(c*max(max(l-uThreshold,0.)/max(l,.0001),s*.42)*max(s,step(uThreshold,l)),vec3(6.)),1.);}`;
const BL=`uniform sampler2D tInput;uniform vec2 uDir;varying vec2 vUv;void main(){vec3 a=texture2D(tInput,vUv).rgb*.22702703;a+=(texture2D(tInput,vUv+uDir*1.3846154).rgb+texture2D(tInput,vUv-uDir*1.3846154).rgb)*.31621622;a+=(texture2D(tInput,vUv+uDir*3.2307692).rgb+texture2D(tInput,vUv-uDir*3.2307692).rgb)*.07027027;gl_FragColor=vec4(a,1.);}`;
const CP=`uniform sampler2D tScene,tBloom;uniform float uBloomStrength,uExposure,uVignette;uniform vec3 uWarmTint;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec3 m=aces((texture2D(tScene,vUv).rgb+texture2D(tBloom,vUv).rgb*uBloomStrength)*uExposure*uWarmTint);m=mix(vec3(dot(m,vec3(.299,.587,.114))),m,1.12);vec2 p=(vUv-.5)*2.;m*=clamp(1.-dot(p,p)*uVignette,.65,1.);gl_FragColor=vec4(pow(clamp(m,0.,1.),vec3(1./2.2)),1.);}`;

export class BloomPostProcessor {
  constructor(renderer, width, height) {
    this.renderer=renderer;this.enabled=true;const gl=renderer.getContext(),is2=renderer.capabilities.isWebGL2;
    this.targetType=(is2?(gl.getExtension('EXT_color_buffer_float')||gl.getExtension('EXT_color_buffer_half_float')):gl.getExtension('OES_texture_half_float'))?THREE.HalfFloatType:THREE.UnsignedByteType;
    this.orthoCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const sh=(f,u)=>new THREE.ShaderMaterial({vertexShader:V,fragmentShader:f,uniforms:u,depthTest:false,depthWrite:false});
    this.brightMat=sh(BR,{tScene:{value:null},uThreshold:{value:.72},uKnee:{value:.32}});
    this.blurMat=sh(BL,{tInput:{value:null},uDir:{value:new THREE.Vector2(1/512,0)}});
    this.compMat=sh(CP,{tScene:{value:null},tBloom:{value:null},uBloomStrength:{value:.72},uExposure:{value:1.08},uVignette:{value:.14},uWarmTint:{value:new THREE.Vector3(1.03,1,.96)}});
    this.quadScene=new THREE.Scene();this.quadMesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.compMat);this.quadScene.add(this.quadMesh);
    this.resize(width,height);
  }

  setGrade({ threshold, bloomStrength, exposure, vignette, warmTint }) {
    if(threshold!==undefined)this.brightMat.uniforms.uThreshold.value=threshold;
    if(bloomStrength!==undefined)this.compMat.uniforms.uBloomStrength.value=bloomStrength;
    if(exposure!==undefined)this.compMat.uniforms.uExposure.value=exposure;
    if(vignette!==undefined)this.compMat.uniforms.uVignette.value=vignette;
    if(warmTint)this.compMat.uniforms.uWarmTint.value.set(...warmTint);
  }

  resize(w, h) {
    const W=Math.max(2,Math.floor(w)),H=Math.max(2,Math.floor(h)),bw=Math.max(2,Math.floor(W*.35)),bh=Math.max(2,Math.floor(H*.35));
    if(this.sceneRT){this.sceneRT.dispose();this.bloomA.dispose();this.bloomB.dispose();}
    const o={type:this.targetType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat};
    this.sceneRT=new THREE.WebGLRenderTarget(W,H,{...o,depthBuffer:true});this.bloomA=new THREE.WebGLRenderTarget(bw,bh,{...o,depthBuffer:false});this.bloomB=new THREE.WebGLRenderTarget(bw,bh,{...o,depthBuffer:false});
    this.bloomW=bw;this.bloomH=bh;
  }

  render(scene, camera) {
    const r=this.renderer;if(!this.enabled){r.setRenderTarget(null);r.render(scene,camera);return;}
    r.setRenderTarget(this.sceneRT);r.clear();r.render(scene,camera);
    this.quadMesh.material=this.brightMat;this.brightMat.uniforms.tScene.value=this.sceneRT.texture;r.setRenderTarget(this.bloomA);r.render(this.quadScene,this.orthoCam);
    this.quadMesh.material=this.blurMat;
    for(const sp of[1,2.1]){
      this.blurMat.uniforms.tInput.value=this.bloomA.texture;this.blurMat.uniforms.uDir.value.set(sp/this.bloomW,0);r.setRenderTarget(this.bloomB);r.render(this.quadScene,this.orthoCam);
      this.blurMat.uniforms.tInput.value=this.bloomB.texture;this.blurMat.uniforms.uDir.value.set(0,sp/this.bloomH);r.setRenderTarget(this.bloomA);r.render(this.quadScene,this.orthoCam);
    }
    this.quadMesh.material=this.compMat;this.compMat.uniforms.tScene.value=this.sceneRT.texture;this.compMat.uniforms.tBloom.value=this.bloomA.texture;
    r.setRenderTarget(null);r.render(this.quadScene,this.orthoCam);
  }
}

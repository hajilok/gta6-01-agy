// Cala Solara — 6-District Architecture, Readable Neon Blade Signs, Arched Palms, Fiesta Plaza & Marina
import * as THREE from 'three';
import { WORLD_CONFIG } from '../config.js';
import { createNeonSignTexture } from '../render/materials.js';
import { addBox as B, addCyl as C, addSphere as S, glowMat, stdMat } from '../render/mesh-utils.js';
import { boulevardZAtX, coastZAtX } from './city-world.js';

const M=Math,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

export function buildDistrictLandmarks(scene, cityWorld, textures) {
  const emissiveMaterials=[],animatedProps=[];
  buildArtDecoStrip(scene,cityWorld,textures,emissiveMaterials);
  buildSkylineCore(scene,cityWorld,textures,emissiveMaterials);
  buildOldTownPlaza(scene,cityWorld,textures,emissiveMaterials);
  buildHarborMarina(scene,cityWorld,textures,emissiveMaterials);
  buildMonteFaroIsland(scene,cityWorld,emissiveMaterials,animatedProps);
  buildPalmGrovesAndBeach(scene,cityWorld,animatedProps);
  return {emissiveMaterials,animatedProps};
}

function buildArtDecoStrip(sc, cw, tx, em) {
  const aw=[0xff5277,0x00c9d8,0xffaa33,0x3bd48a],dm=stdMat(0x243040,0.42,0.65),cr=stdMat(0xfff7ee,0.6);
  [[-175,30,22,28,0xfbe5d8,'HOTEL CORAL','BEACH RESORT','#ff4f8b'],[-115,34,24,36,0xe6f6f2,'SOLARA CLUB','ROOFTOP LOUNGE','#00e6ff'],[-55,28,22,27,0xfff0d4,'PALMERA','OCEANFRONT','#ffae38'],[5,34,24,42,0xeee8ff,'AZUL BAY','GRAND CASINO','#c46bff'],[75,30,22,32,0xffe4ec,'MIRAMAR','SUITES & SPA','#ff5d73']].forEach(([x,w,d,h,tint,neon,sub,glow],i)=>{
    const z=boulevardZAtX(x)-25,g=new THREE.Group();g.position.set(x,0.3,z);
    const wm=stdMat(tint,0.62,0.08,{map:tx.decoMap,emissive:0xffffff,emissiveMap:tx.decoEmissive,emissiveIntensity:0.9});em.push({mat:wm,base:0.9});
    B(g,w,h,d,wm,0,h*0.5,0);B(g,w*0.64,6.5,d*0.64,wm,0,h+3.25,0);B(g,w+1.2,1,d+1.2,cr,0,h+0.1,0);
    for(const px of[-w*0.45,0,w*0.45])B(g,1.2,h,0.9,cr,px,h*0.5,d*0.5+0.35);
    for(let f=1;f<M.floor(h/6.5);f++){B(g,w*0.84,0.5,2.5,cr,0,f*6.2,d*0.5+1.1);B(g,w*0.84,0.85,0.15,dm,0,f*6.2+0.58,d*0.5+2.25,false);}
    B(g,w*0.92,0.42,4.4,stdMat(aw[i%4],0.72),0,4.3,d*0.5+2.1).rotation.x=0.24;
    const st=createNeonSignTexture(neon,'#0f1426',glow,sub),sm=stdMat(0xffffff,0.2,0.1,{map:st,emissiveMap:st,emissive:0xffffff,emissiveIntensity:2.3});em.push({mat:sm,base:2.3,alwaysBright:true});
    B(g,w*0.78,4.6,0.7,sm,0,h+2.6,d*0.5+0.6,false);B(g,0.6,3.8,12,sm,-w*0.5-0.5,11.5,d*0.5+4.8,false).rotation.y=0.28;B(g,0.35,0.35,4.5,dm,-w*0.5,11.5,d*0.5+1.5,false);
    const tm=glowMat(glow,2.6);em.push({mat:tm,base:2.6,alwaysBright:true});B(g,w+0.7,0.45,d+0.7,tm,0,h-0.4,0,false);
    sc.add(g);cw.addCollider(x,z,w+1.5,d+3.5,h);cw.buildingFootprints.push({x,z,w,d,color:'#ff96b5'});
  });
  const gs=glowMat(0x2bff88,3.2),rs=glowMat(0xff3348,2.6);
  for(const gx of[-145,-45,45]){
    const gz=boulevardZAtX(gx);C(sc,0.22,0.28,9.2,8,dm,gx,4.6,gz-11.2,false);C(sc,0.22,0.28,9.2,8,dm,gx,4.6,gz+11.2,false);B(sc,0.45,0.45,22.8,dm,gx,8.8,gz,false);
    for(const sz of[-4.5,4.5]){B(sc,0.7,1.9,0.75,dm,gx,8.2,gz+sz,false);S(sc,0.22,6,6,sz<0?gs:rs,gx-0.36,7.8,gz+sz);S(sc,0.22,6,6,sz<0?gs:rs,gx+0.36,7.8,gz+sz);}
  }
}

function buildSkylineCore(sc, cw, tx, em) {
  const sm=stdMat(0x2f3b4d,0.34,0.75);
  [[-95,-150,32,30,78,0x9cd2eb,'#00e6ff',1],[-95,-66,30,28,62,0xd9c7a8,'#ffae42',0],[-95,12,28,24,46,0xaad4e6,'#ff5d8f',0],[0,-152,36,34,106,0xbce6ff,'#ffd066',1],[90,-150,30,28,86,0xa6d0e8,'#5bf59c',0],[90,-66,32,28,72,0xe3d1b8,'#ff7052',1],[90,14,30,26,58,0x9ec8e2,'#45d9ff',0],[0,14,32,26,64,0xc2d8e8,'#ff6ba3',0]].forEach(([x,z,w,d,h,tint,acc,pad])=>{
    const g=new THREE.Group();g.position.set(x,0.3,z);
    const gm=stdMat(tint,0.2,0.72,{map:tx.skyMap,emissive:0xffffff,emissiveMap:tx.skyEmissive,emissiveIntensity:1.05});em.push({mat:gm,base:1.05});
    B(g,w+3.5,9,d+3.5,sm,0,4.5,0);B(g,w,h*0.72,d,gm,0,9+h*0.36,0);B(g,w*0.74,h*0.28,d*0.74,gm,0,9+h*0.86,0);
    const gl=glowMat(acc,2.7);em.push({mat:gl,base:2.7,alwaysBright:true});B(g,w*0.77,1.2,d*0.77,gl,0,9+h-0.6,0,false);
    if(pad){C(g,7.2,7.6,0.7,18,sm,0,9+h+0.35,0,false);const rg=new THREE.Mesh(new THREE.RingGeometry(4.8,5.6,18),gl);rg.rotation.x=-M.PI*0.5;rg.position.y=9+h+0.76;g.add(rg);}
    else C(g,0.22,0.95,18,8,sm,0,9+h+9,0,false);
    sc.add(g);cw.addCollider(x,z,w+3.5,d+3.5,h+9);cw.buildingFootprints.push({x,z,w:w+3,d:d+3,color:'#6fd3ff'});
  });
  const pk=new THREE.Group(),st=stdMat(0xe6dac5,0.72);pk.position.set(0,0.35,-68);
  C(pk,11,12,1.2,22,st,0,0.6,0,false);C(pk,9.8,9.8,0.9,22,stdMat(0x1bd1d8,0.12,0.25),0,0.85,0,false);C(pk,0.4,2.2,16,4,st,0,8.5,0);
  sc.add(pk);cw.addCollider(0,-68,20,20,16,'fountain');
}

function buildOldTownPlaza(sc, cw, tx, em) {
  const pc=WORLD_CONFIG.plazaCenter,pm=stdMat(0xf4e4cb,0.75),im=stdMat(0x20252e,0.45,0.7);
  [[-42,-28,22,28,16,0xe89b6b,0xa6462e],[-42,24,22,30,14,0xf0be7a,0xb24e32],[42,-26,22,30,17,0xdf8262,0x993e28],[42,26,22,26,15,0xf2c88c,0xad4a30],[-16,-46,32,18,19,0xe6a172,0xa8432b],[20,-46,28,18,16,0xf4ce94,0xb55235],[-18,46,28,18,14,0xe38f68,0x9e3f28],[10,-126,42,26,18,0xe9a977,0xa8462c]].forEach(([ox,oz,w,d,h,t,rf])=>{
    const x=pc.x+ox,z=pc.z+oz,g=new THREE.Group();g.position.set(x,0.3,z);
    const m=stdMat(t,0.82,0.04,{map:tx.oldTownMap,emissive:0xffffff,emissiveMap:tx.oldTownEmissive,emissiveIntensity:0.72});em.push({mat:m,base:0.72});
    B(g,w,h,d,m,0,h*0.5,0);B(g,w+1.8,1.2,d+1.8,stdMat(rf,0.82),0,h+0.5,0);B(g,w*0.82,1.8,d*0.82,stdMat(rf,0.85),0,h+1.8,0);
    for(let px=-w*0.38;px<=w*0.38;px+=6.2)C(g,0.4,0.46,5.2,8,pm,px,2.6,d*0.5+1.1);
    sc.add(g);cw.addCollider(x,z,w+1.4,d+2.2,h);cw.buildingFootprints.push({x,z,w,d,color:'#f0a763'});
  });
  const fg=new THREE.Group(),ms=stdMat(0x1f7ca3,0.3,0.18),tg=stdMat(0xe8b24c,0.4),wm=stdMat(0x88f4ff,0.08,0.1,{transparent:true,opacity:0.74});fg.position.set(pc.x,0.36,pc.z);
  C(fg,6.6,7.1,1.05,16,pm,0,0.52,0);C(fg,6.2,6.2,0.2,16,tg,0,1.08,0,false);C(fg,5.7,5.7,0.82,16,ms,0,0.68,0,false);
  C(fg,1.6,2.3,1.9,14,pm,0,1.7,0);C(fg,3.4,1.4,0.7,16,ms,0,2.9,0);C(fg,0.9,1.2,1.5,12,pm,0,3.8,0);C(fg,1.8,0.7,0.5,14,tg,0,4.7,0);S(fg,0.55,10,8,wm,0,5.3,0);
  for(let k=0;k<6;k++){const a=(k/6)*6.283,ca=M.cos(a),sa=M.sin(a);fg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(ca*0.4,5.1,sa*0.4),V3(ca*2.2,4.4,sa*2.2),V3(ca*4.2,1.1,sa*4.2)]),12,0.12,6,false),wm));}
  sc.add(fg);cw.addCollider(pc.x,pc.z,13,13,5,'plaza-fountain');
  const wd=stdMat(0x7c4f2b,0.85);
  [[-18,14,0.4,0xe64848],[17,15,-0.35,0x1bb5a8],[-19,-15,-0.45,0xf2a72b],[19,-14,0.3,0xd9488b]].forEach(([ox,oz,yaw,col])=>{
    const sg=new THREE.Group();sg.position.set(pc.x+ox,0.36,pc.z+oz);sg.rotation.y=yaw;
    B(sg,5.2,1.25,2.1,wd,0,0.62,0);C(sg,0.1,0.1,3.3,6,wd,-2.3,1.65,-0.8,false);C(sg,0.1,0.1,3.3,6,wd,2.3,1.65,-0.8,false);
    B(sg,5.6,0.22,3,stdMat(col,0.74),0,3.25,0.1).rotation.x=0.16;sc.add(sg);cw.addCollider(pc.x+ox,pc.z+oz,4.8,2.4,2.8,'stall');
  });
  const lm=glowMat(0xffae3d,2.5),fc=[0xff4b78,0x00d9e8,0xffc83b,0x4be88c,0xc46bff];em.push({mat:lm,base:2.5,alwaysBright:true});
  [[[-32,-22],[32,22]],[[-32,22],[32,-22]],[[-32,0],[32,0]]].forEach(([[ax,az],[bx,bz]],si)=>{
    const pA=V3(pc.x+ax,9.6,pc.z+az),pB=V3(pc.x+bx,9.6,pc.z+bz),pts=[];
    for(let k=0;k<=12;k++){const u=k/12,p=V3().lerpVectors(pA,pB,u);p.y-=M.sin(u*M.PI)*1.7;pts.push(p);if(k>0&&k<12){S(sc,0.28,8,8,lm,p.x,p.y-0.22,p.z);const fl=new THREE.Mesh(new THREE.ConeGeometry(0.45,0.72,3),stdMat(fc[(k+si)%5],0.7));fl.position.set(p.x,p.y-0.55,p.z);fl.rotation.z=M.PI;sc.add(fl);}}
    sc.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,0.05,5,false),im));
  });
}

function buildHarborMarina(sc, cw, tx, em) {
  const rd=stdMat(0xd93d32,0.48,0.45),wh=stdMat(0xf2f4f8,0.48);
  for(const cz of[-128,-74]){const cg=new THREE.Group();cg.position.set(206,0.3,cz);for(const dx of[-6,6])for(const dz of[-4.5,4.5])B(cg,1.4,34,1.4,rd,dx,17,dz);B(cg,46,2.4,3.2,rd,10,29,0);B(cg,4.5,3.2,4.2,wh,12,26.2,0,false);sc.add(cg);cw.addCollider(206,cz,14,11,34,'crane');}
  const cC=[0xc93b32,0x266bb8,0xe89b2d,0x268a5c,0x4b5c72];
  [[164,-142,2],[176,-142,1],[164,-124,3],[164,-92,2],[178,-92,1],[164,-56,2]].forEach(([cx,cz,st],i)=>{for(let s=0;s<st;s++)B(sc,4.4,3.6,11.2,stdMat(cC[(i+s)%5],0.65,0.28,{map:tx.containerMap}),cx,2.1+s*3.65,cz);cw.addCollider(cx,cz,4.8,11.6,st*3.8,'container');cw.buildingFootprints.push({x:cx,z:cz,w:5,d:12,color:'#5bf59c'});});
  const sg=new THREE.Group(),st=stdMat(0xf7f2e8,0.55),wd=stdMat(0x9c663b,0.72),gl=stdMat(0x45c8e8,0.1,0.85);sg.position.set(154,0.3,14);
  B(sg,22,9.5,16,st,0,4.75,0);B(sg,24.5,1.1,18.5,wd,0,9.8,0);B(sg,14,5.2,11,gl,-2,12.8,-1);B(sg,9.5,4.8,0.5,stdMat(0x141b28,0.8),0,2.4,8.05,false);
  const gt=createNeonSignTexture('SOLARA CUSTOMS','#0e1628','#00e6ff','SAFEHOUSE & GARAGE'),gm=stdMat(0xffffff,0.2,0.1,{map:gt,emissiveMap:gt,emissive:0xffffff,emissiveIntensity:2.2});em.push({mat:gm,base:2.2,alwaysBright:true});
  B(sg,14,3.2,0.5,gm,0,7.6,8.3,false);B(sg,0.5,3.2,13,gm,11.3,7.6,0,false);sc.add(sg);cw.addCollider(154,14,23,17,15,'safehouse');cw.buildingFootprints.push({x:154,z:14,w:22,d:16,color:'#ffcf6e'});
  const pm=stdMat(0x8f6b49,0.82),hw=stdMat(0xf7f9fc,0.22,0.22),nv=stdMat(0x193658,0.35),sl=stdMat(0xfff8ed,0.65,0,{side:THREE.DoubleSide});
  for(const pz of[-10,22,54]){B(sc,44,0.7,5.2,pm,228,0.85,pz);const y=new THREE.Group();y.position.set(240,0.45,pz+7.4);y.rotation.y=M.PI*0.5;B(y,3.8,1.6,12.5,hw);B(y,3.9,0.35,11.8,nv,0,0.25,0,false);B(y,2.9,1.5,6.2,gl,0,1.45,-1,false);B(y,3.1,0.35,6.8,hw,0,2.3,-1.1,false);sc.add(y);}
  [[-140,220,0.4],[-15,235,-0.6],[110,205,0.8],[285,58,-0.3],[295,-38,0.5]].forEach(([sx,sz,sy])=>{const sb=new THREE.Group();sb.position.set(sx,0.35,sz);sb.rotation.y=sy;B(sb,2.4,1.1,7.8,hw,0,0,0,false);C(sb,0.09,0.12,11.5,6,nv,0,5.8,0,false);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,1.6,0,0,10.8,0,0,2,-4.4],3));g.computeVertexNormals();sb.add(new THREE.Mesh(g,sl));sc.add(sb);});
}

function buildMonteFaroIsland(sc, cw, em, anim) {
  const lh=WORLD_CONFIG.lighthousePos,lg=new THREE.Group();lg.position.set(lh.x,cw.getTerrainHeight(lh.x,lh.z)-0.5,lh.z);
  const wm=stdMat(0xf9f7f2,0.55),rm=stdMat(0xd9383a,0.55),lm=glowMat(0xffd166,3.2);em.push({mat:lm,base:3.2,alwaysBright:true});
  for(let i=0;i<6;i++)C(lg,4.2-(i+1)*0.34,4.2-i*0.34,5.4,16,i%2?rm:wm,0,i*5.4+2.7,0);
  C(lg,2.1,2.1,3.4,14,lm,0,34.1,0,false);const cap=new THREE.Mesh(new THREE.ConeGeometry(2.6,3.2,14),rm);cap.position.y=37.3;lg.add(cap);
  const bG=new THREE.CylinderGeometry(1.4,13,92,18,1,true);bG.translate(0,-46,0);bG.rotateX(M.PI*0.5);
  const pv=new THREE.Group();pv.position.y=34.1;pv.rotation.y=1.1;
  pv.add(new THREE.Mesh(bG,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,vertexShader:`varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec2 vUv;varying vec3 vN,vV;void main(){gl_FragColor=vec4(1.,.88,.58,pow(abs(dot(normalize(vN),normalize(vV))),2.)*smoothstep(0.,.15,vUv.y)*smoothstep(1.,.15,vUv.y)*.18);}`})));
  lg.add(pv);anim.push({type:'rotateY',obj:pv,speed:0.45});sc.add(lg);cw.addCollider(lh.x,lh.z,9,9,36,'lighthouse');
  const vy=cw.getTerrainHeight(382,166);B(sc,20,7.5,14,wm,382,vy+3.2,166);B(sc,12,0.5,6,glowMat(0x1ee6df,0.6),371,vy+0.6,163,false);cw.addCollider(382,166,21,15,10,'villa');
}

function buildPalmGrovesAndBeach(sc, cw, anim) {
  const tr=stdMat(0x7c5b3e,0.9),fr=stdMat(0x2e944b,0.62,0.04,{side:THREE.DoubleSide}),ft=stdMat(0x46ad56,0.65,0.04,{side:THREE.DoubleSide});
  const cc=stdMat(0x4a321e,0.8),pm=stdMat(0x273242,0.42,0.68),bm=glowMat(0xffbe5c,2.3),rm=stdMat(0xefe6d8,0.72),bn=stdMat(0x8a5b36,0.8);
  const palm=(x,z,k=1,ln=0.2,dir=0)=>{
    const y=cw.getTerrainHeight(x,z);if(y<0.08)return;
    const g=new THREE.Group();g.position.set(x,y,z);let cy=0,cx=0;const h=10.6*k;
    for(let s=0;s<5;s++){const sh=h*0.21,tl=ln*(s+0.5)*0.48;C(g,(0.3-s*0.045)*k,(0.34-s*0.045)*k,sh,7,tr,cx+M.sin(tl)*sh*0.5,cy+sh*0.48,0).rotation.z=-tl;cx+=M.sin(tl)*sh*0.92;cy+=M.cos(tl)*sh*0.95;}
    g.rotation.y=dir;const cr=new THREE.Group();cr.position.set(cx,cy,0);
    for(let c=0;c<3;c++)S(cr,0.22*k,6,6,cc,M.cos(c*2.1)*0.35*k,-0.25*k,M.sin(c*2.1)*0.35*k);
    for(let f=0;f<10;f++){const t=f>=5?1:0,fg=new THREE.Group();fg.rotation.y=f*2.4+t*0.4;B(fg,0.68*k,0.07*k,2.4*k,fr,0,(t?0.42:0.08)*k,1.2*k).rotation.x=t?-0.35:-0.08;B(fg,0.48*k,0.05*k,2.2*k,ft,0,(t?0.42:-0.35)*k,3.1*k).rotation.x=t?0.32:0.62;cr.add(fg);}
    g.add(cr);sc.add(g);anim.push({type:'sway',obj:cr,phase:x*0.13+z*0.09});
  };
  const uc=[0xff5277,0x00c9d8,0xffbe3b,0xffffff,0xff7b3d];
  for(let x=-275;x<=115;x+=22){
    const bz=boulevardZAtX(x);palm(x,bz+12.2,0.95+((M.abs(x)*7)%10)*0.025,0.22,(x*0.3)%6.28);if(x%44===0)palm(x+9,bz-12.2,0.88,0.14,1.4);
    C(sc,0.11,0.15,7.6,6,pm,x+11,4.1,bz+10.6);S(sc,0.36,8,8,bm,x+11,7.9,bz+9.8);B(sc,14,0.85,0.35,rm,x+11,0.82,bz+20.8,false);B(sc,2.8,0.55,0.95,bn,x+6,0.68,bz+18.8,false);
    const uz=coastZAtX(x)-9,uy=cw.getTerrainHeight(x+5,uz);
    if(uy>0.12){C(sc,0.06,0.06,2.6,5,tr,x+5,uy+1.3,uz,false);const u=new THREE.Mesh(new THREE.ConeGeometry(2.2,0.82,10),stdMat(uc[M.abs(M.floor(x/22))%5],0.72));u.position.set(x+5,uy+2.5,uz);u.castShadow=true;sc.add(u);}
  }
  const lg=new THREE.Group();lg.position.set(-74,0.35,coastZAtX(-74)-10);
  for(const sx of[-1.4,1.4])for(const sz of[-1.4,1.4])B(lg,0.24,3.2,0.24,rm,sx,1.6,sz);
  B(lg,3.6,2.4,3.2,stdMat(0x00d9e8,0.55),0,4.2,0);B(lg,4.2,0.45,3.8,stdMat(0xff5277,0.6),0,5.6,0);sc.add(lg);
  [[140,12],[186,6],[190,52],[136,38],[198,44],[-22,-55],[22,-55],[-22,-82],[22,-82],[-242,-36],[-198,-36],[-242,-2],[-198,-2],[372,134],[412,144],[394,166],[420,162]].forEach(([px,pz],i)=>palm(px,pz,0.92+(i%3)*0.1,0.16,i*1.1));
}

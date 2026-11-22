// Cala Solara — Procedural PBR Textures, HDR Sky Reflection Map, Ocean Surf & Sky Dome Shaders
import * as THREE from 'three';

const mkC=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')];};
const mkT=(c,rx=1,ry=1,s=true)=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=8;if(s)t.colorSpace=THREE.SRGBColorSpace;return t;};
const R=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};

export function createSkyEnvMap(renderer, p) {
  const[c,g]=mkC(256,128),hx=n=>'#'+n.toString(16).padStart(6,'0'),gr=g.createLinearGradient(0,0,0,128);
  [[0,hx(p.skyTop)],[.38,hx(p.skyMid)],[.5,hx(p.skyHorizon)],[.54,hx(p.sunColor)],[.68,hx(p.hemiGround)],[1,'#181c24']].forEach(([s,col])=>gr.addColorStop(s,col));
  R(g,gr,0,0,256,128);const sr=g.createRadialGradient(170,56,2,170,56,36);
  sr.addColorStop(0,'#fff');sr.addColorStop(.35,hx(p.sunColor));sr.addColorStop(1,'rgba(255,200,140,0)');R(g,sr,120,16,100,80);
  const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;
  const pm=new THREE.PMREMGenerator(renderer),rt=pm.fromEquirectangular(t);t.dispose();pm.dispose();return rt.texture;
}

export function createPbrTextureLibrary() {
  const[aA,ca]=mkC(512,512),[aR,cr]=mkC(512,512);R(ca,'#444b57',0,0,512,512);
  const rg=cr.createLinearGradient(0,0,512,0);[[0,'#b5b5b5'],[.24,'#444'],[.5,'#888'],[.76,'#444'],[1,'#b5b5b5']].forEach(([s,col])=>rg.addColorStop(s,col));R(cr,rg,0,0,512,512);
  for(let i=0;i<6000;i++){const v=56+((i*47)%34);R(ca,`rgb(${v},${v+3},${v+8})`,(i*97)%512,(i*193)%512,2,2);}
  R(ca,'rgba(246,244,236,.92)',14,0,10,512);ca.fillRect(488,0,10,512);R(ca,'rgba(255,200,66,.95)',247,0,6,512);ca.fillRect(259,0,6,512);
  ca.fillStyle='rgba(242,245,250,.78)';for(let y=18;y<512;y+=92){ca.fillRect(132,y,7,46);ca.fillRect(373,y,7,46);}
  const[tC,ct]=mkC(256,256);R(ct,'#ddd0ba',0,0,256,256);
  for(let y=0;y<256;y+=32)for(let x=0;x<256;x+=32){const s=212+(((x*13+y*29)>>3)%20);R(ct,`rgb(${s},${s-10},${s-24})`,x+1,y+1,30,30);}
  ct.strokeStyle='rgba(92,76,58,.28)';ct.lineWidth=2;for(let i=0;i<=256;i+=32){ct.beginPath();ct.moveTo(i,0);ct.lineTo(i,256);ct.moveTo(0,i);ct.lineTo(256,i);ct.stroke();}
  const[cC,cc]=mkC(256,256),cp=['#d6ad84','#c7976d','#dfc09a','#b58662','#cf9c74'];R(cc,'#947860',0,0,256,256);
  for(let r=0;r<16;r++)for(let c=0;c<8;c++)R(cc,cp[(r*7+c*3)%5],((c*32+(r%2)*16)%256)+2,r*16+2,28,12);
  const[sA,sa]=mkC(512,512),[sE,se]=mkC(512,512),rh=512/12;R(sa,'#1d3044',0,0,512,512);R(se,'#000',0,0,512,512);
  for(let r=0;r<12;r++){R(sa,'#3b5068',0,r*rh,512,8);for(let c=0;c<8;c++){const h=(r*37+c*19+r*c*11)%100,g=sa.createLinearGradient(0,r*rh+8,0,(r+1)*rh-2);g.addColorStop(0,'#6ba6cc');g.addColorStop(.5,'#2b5375');g.addColorStop(1,'#1b354d');R(sa,g,c*64+4,r*rh+8,56,rh-10);if(h<52){se.globalAlpha=.48+(h%4)*.12;R(se,['#ffd58a','#fff0cc','#7ee6ff'][h%3],c*64+6,r*rh+11,52,rh-15);R(se,'rgba(18,28,42,.38)',c*64+6,r*rh+11,52,6);se.globalAlpha=1;}}}
  const[dA,da]=mkC(512,512),[dE,de]=mkC(512,512);R(da,'#f4eadc',0,0,512,512);R(de,'#000',0,0,512,512);
  for(let r=0;r<8;r++){const y=r*64;R(da,'#dfd0bc',0,y,512,7);R(da,'#fff9f0',0,y+7,512,3);for(let c=0;c<6;c++){const x=c*85+14,wg=da.createLinearGradient(0,y+16,0,y+54);wg.addColorStop(0,'#36556e');wg.addColorStop(1,'#1d3245');R(da,wg,x,y+16,54,38);da.strokeStyle='#fff4e6';da.lineWidth=3;da.strokeRect(x,y+16,54,38);R(da,'#e7d9c6',x+25,y+16,4,38);if((r*19+c*23)%10<5){const ig=de.createLinearGradient(0,y+20,0,y+50);ig.addColorStop(0,'#ffe4a8');ig.addColorStop(1,'#ff9d4a');de.globalAlpha=.62;R(de,ig,x+4,y+20,46,30);de.globalAlpha=1;}}}
  const[oA,oa]=mkC(512,512),[oE,oe]=mkC(512,512);R(oa,'#e09a68',0,0,512,512);R(oe,'#000',0,0,512,512);
  for(let i=0;i<1600;i++)R(oa,i%2?'rgba(255,235,210,.09)':'rgba(120,56,28,.09)',(i*79)%512,(i*151)%512,6,4);
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){const x=c*102+24,y=r*102+24;oa.fillStyle='#362620';oa.beginPath();oa.arc(x+26,y+20,24,Math.PI,0);oa.lineTo(x+50,y+66);oa.lineTo(x+2,y+66);oa.closePath();oa.fill();oa.strokeStyle='#f7e4c8';oa.lineWidth=4;oa.stroke();if((r+c*2)%3){oe.globalAlpha=.55;R(oe,'#ffc46b',x+8,y+18,36,42);oe.globalAlpha=1;}}
  const[ctC,cg]=mkC(256,128);R(cg,'#d8d8d8',0,0,256,128);for(let x=0;x<256;x+=10){R(cg,'rgba(0,0,0,.22)',x,0,4,128);R(cg,'rgba(255,255,255,.16)',x+4,0,2,128);}
  const[smC,sm]=mkC(128,128);[[64,62,34,.72],[44,58,28,.62],[84,66,26,.58],[58,42,24,.55],[74,46,22,.5],[52,78,24,.52],[78,78,22,.45]].forEach(([x,y,r,a])=>{const g=sm.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.55,`rgba(248,246,242,${a*.45})`);g.addColorStop(1,'rgba(255,255,255,0)');R(sm,g,0,0,128,128);});
  const[stC,st]=mkC(128,128),sg=st.createRadialGradient(64,64,2,64,64,54);sg.addColorStop(0,'rgba(255,255,240,1)');sg.addColorStop(.28,'rgba(255,212,110,.88)');sg.addColorStop(.62,'rgba(255,120,30,.28)');sg.addColorStop(1,'rgba(255,80,0,0)');R(st,sg,0,0,128,128);st.fillStyle='rgba(255,248,215,.92)';
  for(let a=0;a<4;a++){st.save();st.translate(64,64);st.rotate(a*Math.PI/4);st.beginPath();st.moveTo(0,-58);st.lineTo(7,0);st.lineTo(0,58);st.lineTo(-7,0);st.closePath();st.fill();st.restore();}
  return {asphaltMap:mkT(aA),asphaltRoughness:mkT(aR,1,1,false),boardwalkMap:mkT(tC,14,14),cobbleMap:mkT(cC,8,8),skyMap:mkT(sA),skyEmissive:mkT(sE),decoMap:mkT(dA),decoEmissive:mkT(dE),oldTownMap:mkT(oA),oldTownEmissive:mkT(oE),containerMap:mkT(ctC),softParticleMap:mkT(smC),starFlashMap:mkT(stC)};
}

export function createNeonSignTexture(text, bg = '#101628', fg = '#ff4d8d', sub = '') {
  const[c,g]=mkC(512,140);R(g,bg,0,0,512,140);g.strokeStyle=fg;g.lineWidth=8;g.strokeRect(8,8,496,124);
  g.shadowColor=fg;g.shadowBlur=22;g.fillStyle='#fff';g.font='900 54px "Arial Black",Impact,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,sub?54:72);
  if(sub){g.shadowBlur=10;g.fillStyle=fg;g.font='800 24px "Segoe UI",sans-serif';g.fillText(sub,256,104);}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function createOceanMaterial() {
  return new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uSunDir:{value:new THREE.Vector3(.65,.34,.68).normalize()},uSunColor:{value:new THREE.Color(0xffb86b)},uShallowColor:{value:new THREE.Color(0x1bd1c8)},uDeepColor:{value:new THREE.Color(0x0b3963)},uHorizonColor:{value:new THREE.Color(0xff9970)},uFogColor:{value:new THREE.Color(0xf7a476)},uFogDensity:{value:.0012}},
    vertexShader:`uniform float uTime;varying vec3 vW,vN;void main(){vec4 w=modelMatrix*vec4(position,1.);w.y+=sin(w.x*.045+uTime*1.4)*cos(w.z*.038+uTime*1.1)*.25+sin(w.x*.11-w.z*.09+uTime*2.1)*.11;vW=w.xyz;vN=normalize(vec3(-cos(w.x*.045+uTime*1.4)*.06,1.,sin(w.z*.038+uTime*1.1)*.06));gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform float uTime,uFogDensity;uniform vec3 uSunDir,uSunColor,uShallowColor,uDeepColor,uHorizonColor,uFogColor;varying vec3 vW,vN;float cz(float x){float d=x+110.;return 162.-.00052*d*d+14.*sin(x*.011);}void main(){vec3 V=normalize(cameraPosition-vW);float r1=sin(vW.x*.14+vW.z*.09+uTime*1.6),r2=cos(vW.x*.21-vW.z*.17-uTime*2.1);vec3 N=normalize(vN+vec3((r1+r2)*.055,0.,(r2-r1)*.055));float sd=min(vW.x<214.?max(vW.z-cz(vW.x),0.):max(vW.x-214.,0.),max(length(vW.xz-vec2(398.,145.))-118.,0.));vec3 col=mix(uDeepColor,uShallowColor,1.-smoothstep(0.,58.,sd));col=mix(col,uHorizonColor*.88,pow(1.-max(dot(V,N),0.),3.4)*.55);vec3 H=normalize(uSunDir+V);col+=uSunColor*(pow(max(dot(N,H),0.),32.)*.48+pow(max(dot(N,H),0.),180.)*2.1);float fm=(1.-smoothstep(0.,7.5,sd))*(.45+.45*smoothstep(-.15,.75,sin(sd*.9-uTime*2.6+r1*2.)));col=mix(col,vec3(.95,.99,1.),fm);gl_FragColor=vec4(mix(col,uFogColor,clamp(1.-exp(-pow(length(cameraPosition-vW)*uFogDensity,1.55)),0.,.9)),1.);}`,
  });
}

export function createSkyDomeMaterial() {
  return new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{uTopColor:{value:new THREE.Color(0x1f3f7a)},uMidColor:{value:new THREE.Color(0xdf7b6b)},uHorizonColor:{value:new THREE.Color(0xffc07a)},uSunDir:{value:new THREE.Vector3(.65,.25,.68).normalize()},uSunColor:{value:new THREE.Color(0xfff1c4)},uTime:{value:0},uStarAlpha:{value:0}},
    vertexShader:`varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 uTopColor,uMidColor,uHorizonColor,uSunDir,uSunColor;uniform float uTime,uStarAlpha;varying vec3 vD;float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.,1.);vec3 col=mix(mix(uHorizonColor,uMidColor,smoothstep(0.,.24,h)),uTopColor,smoothstep(.22,.85,h));float sa=max(dot(d,normalize(uSunDir)),0.);col+=uSunColor*(pow(sa,8.)*.42+pow(sa,160.)*2.1);if(d.y>.03){vec2 uv=d.xz/(d.y+.22)*1.15+vec2(uTime*.008,0.);float c=n2(uv*2.)*.55+n2(uv*4.3+3.1)*.3+n2(uv*8.6)*.15;col=mix(col,mix(uMidColor*1.15,uSunColor*1.15,pow(sa,2.)*.7+.2),smoothstep(.54,.82,c)*smoothstep(.03,.22,d.y)*(1.-smoothstep(.55,.92,d.y))*.55);}if(uStarAlpha>.01&&d.y>.22){vec2 s=d.xz/(d.y+.15)*200.;col+=vec3(.95,.97,1.)*smoothstep(.22,.03,length(fract(s)-.5))*step(.986,h21(floor(s)))*uStarAlpha*smoothstep(.22,.55,d.y);}gl_FragColor=vec4(col,1.);}`,
  });
}

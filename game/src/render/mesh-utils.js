// Cala Solara — Shared 3D Geometry Builders, Clearcoat PBR Materials & Grounded Contact Shadows
import * as THREE from 'three';

export const stdMat=(color,roughness=.65,metalness=.1,e={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...e});
export const clearcoatMat=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.14,metalness:.68,envMapIntensity:1.85,...o});
export const glassMat=(color=0x0a1c2e,o={})=>new THREE.MeshStandardMaterial({color,roughness:.05,metalness:.88,envMapIntensity:2.1,transparent:true,opacity:.86,...o});
export const glowMat=(color,emissiveIntensity=2.2,e={})=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity,roughness:.22,...e});
export const addBox=(p,w,h,d,m,x=0,y=0,z=0,s=1)=>mt(p,new THREE.BoxGeometry(w,h,d),m,x,y,z,s);
export const addCyl=(p,a,b,h,n,m,x=0,y=0,z=0,s=1)=>mt(p,new THREE.CylinderGeometry(a,b,h,n),m,x,y,z,s);
export const addCap=(p,r,l,m,x=0,y=0,z=0,s=1)=>mt(p,new THREE.CapsuleGeometry(r,l,4,8),m,x,y,z,s);
export const addSphere=(p,r,a,b,m,x=0,y=0,z=0,s=0)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,a,b),m);o.position.set(x,y,z);if(s)o.castShadow=true;p.add(o);return o;};
export const addTorus=(p,r,t,a,b,m,x=0,y=0,z=0,s=0)=>mt(p,new THREE.TorusGeometry(r,t,a,b),m,x,y,z,s);

export function addExtrude(p,pts,depth,m,bv=.05,s=1){
  const q=new THREE.Shape();pts.forEach(([x,y],i)=>(i?q.lineTo(x,y):q.moveTo(x,y)));q.closePath();
  const g=new THREE.ExtrudeGeometry(q,{depth,bevelEnabled:bv>0,bevelThickness:bv,bevelSize:bv,bevelSegments:2});
  g.translate(0,0,-depth*.5);g.rotateY(1.5708);return mt(p,g,m,0,0,0,s);
}

export function addContactShadow(p,w,l,op=.58,y=.045){
  if(!shT){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,14,64,64,60);r.addColorStop(0,'#040810f0');r.addColorStop(.55,'#0408109e');r.addColorStop(1,'#04081000');g.fillStyle=r;g.fillRect(0,0,128,128);shT=new THREE.CanvasTexture(c);}
  const g=new THREE.PlaneGeometry(w,l);g.rotateX(-1.5708);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:shT,transparent:true,opacity:op,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  m.position.y=y;p.add(m);return m;
}
let shT=null;
const mt=(p,g,m,x,y,z,s)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(s)o.castShadow=o.receiveShadow=true;p.add(o);return o;};

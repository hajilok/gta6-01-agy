// Shared 3D Mesh & PBR Material Builders for Sculpted Cala Solara Assets
import * as THREE from 'three';

const put=(p,g,m,x,y,z,sh)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(sh)o.castShadow=o.receiveShadow=true;p.add(o);return o;};
export function stdMat(color, roughness = 0.65, metalness = 0.1, extra = {}) { return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra}); }
export function physMat(color, opts = {}) { return new THREE.MeshStandardMaterial({color,roughness:.16,metalness:.76,envMapIntensity:1.35,...opts}); }
export function glowMat(color, intensity = 2.6, extra = {}) { return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.2,...extra}); }
export function addBox(p, w, h, d, m, x = 0, y = 0, z = 0, sh = true) { return put(p,new THREE.BoxGeometry(w,h,d),m,x,y,z,sh); }
export function addCyl(p, rt, rb, h, s, m, x = 0, y = 0, z = 0, sh = true) { return put(p,new THREE.CylinderGeometry(rt,rb,h,s),m,x,y,z,sh); }
export function addCap(p, r, len, m, x = 0, y = 0, z = 0, sh = true) { return put(p,new THREE.CapsuleGeometry(r,len,3,7),m,x,y,z,sh); }
export function addSphere(p, r, ws, hs, m, x = 0, y = 0, z = 0, sh = false) { const o=new THREE.Mesh(new THREE.SphereGeometry(r,ws,hs),m);o.position.set(x,y,z);if(sh)o.castShadow=true;p.add(o);return o; }
export function addExtrude(p, pts, depth, m, bevel = 0.06, sh = true) {
  const s=new THREE.Shape();pts.forEach(([px,py],i)=>i?s.lineTo(px,py):s.moveTo(px,py));s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});
  g.translate(0,0,-depth*.5);g.rotateY(Math.PI*.5);return put(p,g,m,0,0,0,sh);
}

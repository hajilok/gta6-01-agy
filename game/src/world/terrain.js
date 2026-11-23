// Cala Solara — Organic Crescent Coastline, Terraced Volcanic Peaks & Monte Faro Caldera
import * as THREE from 'three';
import { WORLD_CONFIG as W } from '../config.js';
import { addBox, stdMat } from '../render/mesh-utils.js';

export function coastZAtX(x){const d=x+110;return 162-.00052*d*d+14*Math.sin(x*.011);}
export function boulevardZAtX(x){return coastZAtX(x)-34;}
export class VolcanicTerrain {
  constructor(sc,tx){Object.assign(this,{scene:sc,textures:tx,colliders:[],buildingFootprints:[]});this.buildTerrainMesh();}
  addCollider(cx,cz,sx,sz,sy=20,label='building'){this.colliders.push({minX:cx-sx*.5,maxX:cx+sx*.5,minZ:cz-sz*.5,maxZ:cz+sz*.5,maxY:sy,label});}
  getBaseTerrainHeight(x,z){const{max,min,pow,abs,hypot}=Math,dI=hypot(x-398,z-145);if(dI<126){const n=1-dI/126;return max(.25,(dI<55?8.5+(55-dI)*.14:min(1,n*2.1)*7.8)+sampleVolcanicRidge(x*1.4,z*1.4)*2.2*max(0,n-.35));}const cz=coastZAtX(x);if((x>214&&z<118)||z>cz+14)return -2;if(z>cz-16){const t=(z-(cz-16))/30;return .35*(1-t)-.8*t;}let m=0;if(z<-226)m=max(m,pow(min(1,(-226-z)/145),1.28)*(88+sampleVolcanicRidge(x,z)*104));if(x<-324)m=max(m,pow(min(1,(-324-x)/130),1.35)*(58+sampleVolcanicRidge(x+90,z-40)*76));const pc=W.plazaCenter;return abs(x-pc.x)<=39&&abs(z-pc.z)<=39?.34:.2+m;}
  buildTerrainMesh(){
    const{max,min,pow,hypot,sin,cos}=Math,g=new THREE.PlaneGeometry(1260,1080,160,140);g.rotateX(-1.5708);const pos=g.attributes.position,cols=new Float32Array(pos.count*3),col=new THREE.Color(),tmp=new THREE.Color();
    for(let i=0;i<pos.count;i++){
      const wx=pos.getX(i)+60,wz=pos.getZ(i)-44;pos.setX(i,wx);pos.setZ(i,wz);const cz=coastZAtX(wx),dI=hypot(wx-398,wz-145),nv=sampleVolcanicRidge(wx,wz);let y=.2;
      if(dI<130){const n=1-dI/130;y=-1.6+pow(n,.72)*(12.5+sampleVolcanicRidge(wx*1.4,wz*1.4)*9.5);if(dI<48)y=max(y,11.4+(48-dI)*.16);}else if((wx>212&&wz<120)||wz>cz+12)y=-3.4;else if(wz>cz-18){const t=(wz-(cz-18))/30;y=.35*(1-t)-1.6*t;}else{let m=0;if(wz<-224)m=max(m,pow(min(1,(-224-wz)/148),1.24)*(94+nv*116));if(wx<-324)m=max(m,pow(min(1,(-324-wx)/135),1.32)*(64+sampleVolcanicRidge(wx+80,wz-30)*82));y=.16+m;}
      pos.setY(i,y);if(y<.05)col.setHex(0xb89e78);else if(wz>cz-24&&dI>125)col.setHex(0xf0d5a4);else if(y<1.5)col.setHex(dI<125?0xe4c792:0x3b6e3e);else if(y<34){col.setHex(0x235c36);tmp.setHex(0x477a3c);col.lerp(tmp,min(1,nv*.8));}else if(y<82){col.setHex(0x3a4f38);tmp.setHex(0x6b5645);col.lerp(tmp,min(1,(y-34)/42));}else{col.setHex(0x524640);tmp.setHex(0x3a3236);col.lerp(tmp,min(1,(y-82)/60));}
      const st=sin(y*.42+nv*3.2)*.035+sin(wx*.08)*cos(wz*.08)*.025;cols[i*3]=min(1,max(0,col.r+st));cols[i*3+1]=min(1,max(0,col.g+st*.9));cols[i*3+2]=min(1,max(0,col.b+st*.8));
    }
    g.setAttribute('color',new THREE.BufferAttribute(cols,3));g.computeVertexNormals();const tm=new THREE.Mesh(g,stdMat(0xffffff,.88,.04,{vertexColors:true}));tm.receiveShadow=true;this.scene.add(tm);
    addBox(this.scene,530,.32,345,stdMat(0xffffff,.8,.06,{map:this.textures.boardwalkMap}),-45,.14,-52,0).receiveShadow=true;addBox(this.scene,78,.16,78,stdMat(0xffffff,.78,.06,{map:this.textures.cobbleMap}),W.plazaCenter.x,.26,W.plazaCenter.z,0).receiveShadow=true;
  }
}
function sampleVolcanicRidge(x,z){let v=0,a=.55,f=.0085;for(let i=0;i<4;i++){v+=(1-Math.abs(Math.sin(x*f+Math.cos(z*f*1.13)*1.4)*Math.cos(z*f*.91-Math.sin(x*f*.77)*1.2)))*a;f*=2.07;a*=.48;}return v;}

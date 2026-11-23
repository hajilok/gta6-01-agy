// Cala Solara — Coastal Boulevard, Puente del Sol Bridge & Ramps
import * as THREE from 'three';
import { WORLD_CONFIG as W } from '../config.js';
import { addBox as B, addCyl as C, addSphere as S, glowMat as GW, stdMat as M } from '../render/mesh-utils.js';
import { boulevardZAtX as bZ } from './terrain.js';

export class RoadAndBridgeNetwork {
  constructor(sc,tr,tx){Object.assign(this,{scene:sc,terrain:tr,textures:tx,colliders:tr.colliders,buildingFootprints:tr.buildingFootprints,ramps:[]});this.buildRoadNetwork();this.buildStuntRamps();}
  addCollider(cx,cz,sx,sz,sy=20,lb='building'){this.terrain.addCollider(cx,cz,sx,sz,sy,lb);}
  isOnBridge(x,z){
    const a=W.bridgeStart,b=W.bridgeEnd,vx=b.x-a.x,vz=b.z-a.z,t=((x-a.x)*vx+(z-a.z)*vz)/(vx*vx+vz*vz);
    if(t<-.04||t>1.04)return null;const px=a.x+vx*t,pz=a.z+vz*t;
    if(Math.hypot(x-px,z-pz)<=W.bridgeWidth*.56){const c=Math.max(0,Math.min(1,t));return{t:c,y:Math.sin(c*Math.PI)*W.bridgePeakY+.34,px,pz};}return null;
  }
  getBridgePoint(t){const a=W.bridgeStart,b=W.bridgeEnd,c=Math.max(0,Math.min(1,t));return{x:a.x+(b.x-a.x)*t,y:Math.sin(c*Math.PI)*W.bridgePeakY+.34,z:a.z+(b.z-a.z)*t};}
  getTerrainHeight(x,z){
    const br=this.isOnBridge(x,z);if(br)return br.y;
    for(const r of this.ramps){const dx=x-r.x,dz=z-r.z,cs=Math.cos(-r.yaw),sn=Math.sin(-r.yaw),lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;if(Math.abs(lx)<=r.width*.52&&lz>=-r.length*.5&&lz<=r.length*.5)return .2+((lz+r.length*.5)/r.length)*r.height;}
    return this.terrain.getBaseTerrainHeight(x,z);
  }
  isWater(x,z){return!this.isOnBridge(x,z)&&this.getTerrainHeight(x,z)<.05;}
  makeRoadMaterial(rx,ry){
    const t=this.textures,m=t.asphaltMap.clone(),r=t.asphaltRoughness.clone(),b=t.asphaltBump.clone();m.needsUpdate=r.needsUpdate=b.needsUpdate=true;m.repeat.set(rx,ry);r.repeat.set(rx,ry);b.repeat.set(rx,ry);
    return M(0xffffff,.88,.12,{map:m,roughnessMap:r,bumpMap:b,bumpScale:.04,envMapIntensity:.92});
  }
  buildRibbon(P,U,I,mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.receiveShadow=true;this.scene.add(m);return m;}
  buildRoadNetwork(){
    const t=this,sc=t.scene,sg=28,bP=[],bU=[],bI=[],wP=[],wU=[],wI=[],cm=M(0xd6cfc2,.72,.08),{hypot,atan2,max,round}=Math;
    for(let i=0;i<=sg;i++){
      const u=i/sg,x=-300+428*u,z=bZ(x),dz=(bZ(x+2)-bZ(x-2))/4,iv=1/hypot(1,dz),nx=-dz*iv,nz=iv;
      bP.push(x-nx*9.5,.35,z-nz*9.5,x+nx*9.5,.35,z+nz*9.5);bU.push(0,u*24,1,u*24);wP.push(x+nx*9.5,.48,z+nz*9.5,x+nx*22,.48,z+nz*22);wU.push(0,u*28,1,u*28);
      if(i<sg){const k=i*2;bI.push(k,k+1,k+2,k+1,k+3,k+2);wI.push(k,k+1,k+2,k+1,k+3,k+2);const x2=-300+428*((i+1)/sg),z2=bZ(x2),sl=hypot(x2-x,z2-z)+.3,yw=atan2(x2-x,z2-z);for(const s of[-1,1])B(sc,.55,.26,sl,cm,(x+x2)*.5+nx*s*9.7,.42,(z+z2)*.5+nz*s*9.7,0).rotation.y=yw;}
    }
    t.buildRibbon(bP,bU,bI,t.makeRoadMaterial(1,1));const wt=t.textures.boardwalkMap.clone();wt.needsUpdate=true;wt.repeat.set(1,2);t.buildRibbon(wP,wU,wI,M(0xffffff,.76,.05,{map:wt}));
    const sm=M(0xf5f3ec,.65);for(const x of[-145,-45,45])for(let k=-3;k<=3;k++)B(sc,3.3,.04,1,sm,x,.38,bZ(x)+k*2.2,0);
    for(const[x1,z1,x2,z2,w]of ARTERIALS){const l=hypot(x2-x1,z2-z1),g=new THREE.PlaneGeometry(w,l);g.rotateX(-1.5708);const m=new THREE.Mesh(g,t.makeRoadMaterial(1,max(1,round(l/18))));m.position.set((x1+x2)*.5,.35,(z1+z2)*.5);m.rotation.y=atan2(x2-x1,z2-z1);m.receiveShadow=true;sc.add(m);}
    t.buildPuenteDelSol(t.makeRoadMaterial(1,1));
  }
  buildPuenteDelSol(roadMat){
    const t=this,sc=t.scene,a=W.bridgeStart,b=W.bridgeEnd,bp=u=>t.getBridgePoint(u),{sin,cos,abs,max,hypot,atan2,pow}=Math,yw=atan2(b.x-a.x,b.z-a.z),w=W.bridgeWidth,hw=w*.5,sg=34,rx=cos(yw),rz=-sin(yw),dP=[],dU=[],dI=[];
    for(let i=0;i<=sg;i++){const u=i/sg,p=bp(u);dP.push(p.x-rx*hw,p.y+.06,p.z-rz*hw,p.x+rx*hw,p.y+.06,p.z+rz*hw);dU.push(0,u*14,1,u*14);if(i<sg){const k=i*2;dI.push(k,k+2,k+1,k+1,k+2,k+3);}}
    t.buildRibbon(dP,dU,dI,roadMat);
    const dk=M(0x2d3748,.62,.5),cs=M(0xdc3b32,.36,.58),cb=M(0x222c3c,.34,.78),rm=M(0xd8e0ec,.45,.42),lm=GW(0xffc46a,1.9),bm=GW(0xff2842,3.2);
    for(let i=0;i<sg;i++){
      const p0=bp(i/sg),p1=bp((i+1)/sg),mx=(p0.x+p1.x)*.5,my=(p0.y+p1.y)*.5,mz=(p0.z+p1.z)*.5,sl=hypot(p1.x-p0.x,p1.y-p0.y,p1.z-p0.z),pt=-atan2(p1.y-p0.y,hypot(p1.x-p0.x,p1.z-p0.z));
      rot(B(sc,w+1.4,1.5,sl+.25,dk,mx,my-.82,mz,0),yw,pt);
      for(const s of[-1,1])rot(B(sc,.56,1.06,sl+.18,rm,mx+rx*s*(hw+.26),my+.46,mz+rz*s*(hw+.26),0),yw,pt);
      if(i%5===2)for(const s of[-1,1]){const lx=mx+rx*s*(hw+.44),lz=mz+rz*s*(hw+.44);C(sc,.09,.13,6.2,6,cb,lx,my+3.1,lz,0);S(sc,.26,8,8,lm,lx-rx*s*.85,my+6.1,lz-rz*s*.85);}
    }
    for(const u of[.28,.72]){const p=bp(u),g=new THREE.Group();g.position.set(p.x,0,p.z);g.rotation.y=yw;B(g,w+7.4,10,6.8,dk,0,2,0,0);for(const s of[-1,1]){const x=s*(hw+1.45);B(g,2.5,58,3.2,cs,x,29,0);B(g,3.1,3.5,3.8,cs,x,57,0,0);S(g,.52,8,8,bm,x,59.5,0);}for(const y of[p.y+13.5,p.y+27.5,53])B(g,w+5,2.4,2.4,cs,0,y,0);for(const s of[.52,-.52])B(g,w+1.6,.9,1,cs,0,p.y+20.5,0,0).rotation.z=s;sc.add(g);}
    const cH=u=>u<=.28?4+pow(u/.28,1.85)*52:u>=.72?4+pow((1-u)/.28,1.85)*52:22+pow((u-.5)/.22,2)*34;
    for(const s of[-1,1]){
      const pts=[],ox=rx*s*(hw+1.45),oz=rz*s*(hw+1.45);for(let i=0;i<=44;i++){const u=i/44,p=bp(u);pts.push(new THREE.Vector3(p.x+ox,cH(u),p.z+oz));}
      sc.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.34,6,false),cb));
      for(let i=2;i<43;i++){const u=i/44;if(abs(u-.28)<.03||abs(u-.72)<.03)continue;const p=bp(u),ln=max(1,cH(u)-p.y);C(sc,.075,.075,ln,5,cb,p.x+ox,p.y+ln*.5,p.z+oz,0);}
    }
    const ip=[[350,132],[382,120],[420,132],[434,158],[405,176],[368,158],[350,132]];
    for(let i=0;i<ip.length-1;i++){const[x0,z0]=ip[i],[x1,z1]=ip[i+1],y0=t.getTerrainHeight(x0,z0)+.16,y1=t.getTerrainHeight(x1,z1)+.16;rot(B(sc,11.2,.4,hypot(x1-x0,y1-y0,z1-z0)+2,dk,(x0+x1)*.5,(y0+y1)*.5,(z0+z1)*.5,0),atan2(x1-x0,z1-z0),-atan2(y1-y0,hypot(x1-x0,z1-z0)));}
  }
  buildStuntRamps(){
    const rM=M(0xffa630,.44,.28),sM=GW(0xff2b59,1.8);
    for(const[x,z,y,w,l,h]of[[-12,bZ(-12)-4,1.5708,7.5,13,3.4],[168,-76,0,7.2,12,3.2],[-95,-108,1.5708,7.5,13,3.5]]){
      this.ramps.push({x,z,yaw:y,width:w,length:l,height:h});const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(l,0);sh.lineTo(l,h);sh.closePath();
      const g=new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false});g.translate(-l*.5,0,-w*.5);g.rotateY(-1.5708);
      const m=new THREE.Mesh(g,rM);m.position.set(x,.35,z);m.rotation.y=y;m.castShadow=m.receiveShadow=true;this.scene.add(m);
      B(this.scene,w+.3,.38,.45,sM,x+Math.sin(y)*l*.48,h+.35,z+Math.cos(y)*l*.48,0).rotation.y=y;
    }
  }
}

const ARTERIALS=[[-275,-185,-275,bZ(-275),15],[-145,-195,-145,bZ(-145),16],[-45,-205,-45,bZ(-45),18],[45,-205,45,bZ(45),18],[132,-180,132,98,17],[192,-175,192,68,14],[-280,-185,195,-185,16],[-280,-108,195,-108,16],[-150,-24,195,-24,16],[-280,48,195,48,16]];
const rot=(m,y,x)=>{m.rotation.order='YXZ';m.rotation.y=y;m.rotation.x=x;};

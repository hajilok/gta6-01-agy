// Cala Solara — Organic Crescent Coastline, Ridged Volcanic Mountains, Curved Roads & Puente del Sol Bridge
import * as THREE from 'three';
import { WORLD_CONFIG } from '../config.js';
import { addBox as B, addCyl as C, addSphere as S, glowMat, stdMat } from '../render/mesh-utils.js';

const M=Math;
export const coastZAtX=(x)=>{const d=x+110;return 162-0.00052*d*d+14*M.sin(x*0.011);};
export const boulevardZAtX=(x)=>coastZAtX(x)-34;

function fbm2(x,z){let v=0,a=0.55,f=0.0085;for(let i=0;i<4;i++){v+=(1-M.abs(M.sin(x*f+M.cos(z*f*1.13)*1.4)*M.cos(z*f*0.91-M.sin(x*f*0.77)*1.2)))*a;f*=2.07;a*=0.48;}return v;}

export class CityWorld {
  constructor(scene, textures) {
    this.scene=scene;this.textures=textures;this.colliders=[];this.roadNodes=[];this.buildingFootprints=[];this.ramps=[];
    this.buildVolcanicTerrain();this.buildCoastalRoadsAndBridge();this.buildStuntRamps();
  }

  addCollider(cx, cz, sx, sz, sy = 20, label = 'building') { this.colliders.push({minX:cx-sx*0.5,maxX:cx+sx*0.5,minZ:cz-sz*0.5,maxZ:cz+sz*0.5,maxY:sy,label}); }

  isOnBridge(x, z) {
    const a=WORLD_CONFIG.bridgeStart,b=WORLD_CONFIG.bridgeEnd,vx=b.x-a.x,vz=b.z-a.z,t=((x-a.x)*vx+(z-a.z)*vz)/(vx*vx+vz*vz);
    if(t<-0.04||t>1.04)return null;
    const px=a.x+vx*t,pz=a.z+vz*t;
    if(M.hypot(x-px,z-pz)<=WORLD_CONFIG.bridgeWidth*0.56){const ct=M.max(0,M.min(1,t));return{t:ct,y:M.sin(ct*M.PI)*WORLD_CONFIG.bridgePeakY+0.34,px,pz};}
    return null;
  }

  getBridgePoint(t) { const a=WORLD_CONFIG.bridgeStart,b=WORLD_CONFIG.bridgeEnd,ct=M.max(0,M.min(1,t));return{x:a.x+(b.x-a.x)*t,y:M.sin(ct*M.PI)*WORLD_CONFIG.bridgePeakY+0.34,z:a.z+(b.z-a.z)*t}; }

  getTerrainHeight(x, z) {
    const br=this.isOnBridge(x,z);if(br)return br.y;
    for(const r of this.ramps){const dx=x-r.x,dz=z-r.z,lx=dx*M.cos(-r.yaw)-dz*M.sin(-r.yaw),lz=dx*M.sin(-r.yaw)+dz*M.cos(-r.yaw);if(M.abs(lx)<=r.width*0.52&&lz>=-r.length*0.5&&lz<=r.length*0.5)return 0.2+((lz+r.length*0.5)/r.length)*r.height;}
    const dI=M.hypot(x-398,z-145);
    if(dI<126){const n=1-dI/126;return M.max(0.25,(dI<55?8.5+(55-dI)*0.14:M.min(1,n*2.1)*7.8)+fbm2(x*1.4,z*1.4)*2.2*M.max(0,n-0.35));}
    const cz=coastZAtX(x);if((x>214&&z<118)||z>cz+14)return -2;if(z>cz-16){const t=(z-(cz-16))/30;return 0.35*(1-t)-0.8*t;}
    let m=0;if(z<-228)m=M.max(m,M.pow(M.min(1,(-228-z)/145),1.35)*(58+fbm2(x,z)*78));if(x<-325)m=M.max(m,M.pow(M.min(1,(-325-x)/130),1.4)*(42+fbm2(x+90,z-40)*58));
    const pc=WORLD_CONFIG.plazaCenter;if(M.abs(x-pc.x)<=39&&M.abs(z-pc.z)<=39)return 0.34;
    return 0.2+m;
  }

  isWater(x, z) { return !this.isOnBridge(x,z)&&this.getTerrainHeight(x,z)<0.05; }

  buildVolcanicTerrain() {
    const geo=new THREE.PlaneGeometry(1240,1040,150,130);geo.rotateX(-M.PI/2);
    const pos=geo.attributes.position,cols=new Float32Array(pos.count*3),col=new THREE.Color();
    for(let i=0;i<pos.count;i++){
      const wx=pos.getX(i)+60,wz=pos.getZ(i)-40;pos.setX(i,wx);pos.setZ(i,wz);
      const cz=coastZAtX(wx),dI=M.hypot(wx-398,wz-145);let y=0.2;
      if(dI<130){const n=1-dI/130;y=-1.6+M.pow(n,0.72)*(10.5+fbm2(wx*1.4,wz*1.4)*6.5);if(dI<48)y=M.max(y,10.5+(48-dI)*0.12);}
      else if((wx>212&&wz<120)||wz>cz+12)y=-3.4;
      else if(wz>cz-18){const t=(wz-(cz-18))/30;y=0.35*(1-t)-1.6*t;}
      else{let m=0;if(wz<-226)m=M.max(m,M.pow(M.min(1,(-226-wz)/148),1.32)*(62+fbm2(wx,wz)*84));if(wx<-324)m=M.max(m,M.pow(M.min(1,(-324-wx)/135),1.38)*(46+fbm2(wx+80,wz-30)*64));y=0.16+m;}
      pos.setY(i,y);col.setHex(y<0.05?0xc9b38c:(wz>cz-24&&dI>125?0xebd3a4:(y<1.2?(dI<125?0xe6cb97:0x5c7f4c):(y<24?0x3a6e43:(y<58?0x6e604e:0x4a4347)))));
      const j=M.sin(wx*0.07)*M.cos(wz*0.07)*0.04;cols[i*3]=M.min(1,M.max(0,col.r+j));cols[i*3+1]=M.min(1,M.max(0,col.g+j));cols[i*3+2]=M.min(1,M.max(0,col.b+j));
    }
    geo.setAttribute('color',new THREE.BufferAttribute(cols,3));geo.computeVertexNormals();
    const tm=new THREE.Mesh(geo,stdMat(0xffffff,0.88,0.04,{vertexColors:true}));tm.receiveShadow=true;this.scene.add(tm);
    B(this.scene,530,0.32,345,stdMat(0xffffff,0.8,0.06,{map:this.textures.boardwalkMap}),-45,0.14,-52,false).receiveShadow=true;
    B(this.scene,78,0.16,78,stdMat(0xffffff,0.78,0.05,{map:this.textures.cobbleMap}),WORLD_CONFIG.plazaCenter.x,0.26,WORLD_CONFIG.plazaCenter.z,false).receiveShadow=true;
  }

  buildCoastalRoadsAndBridge() {
    const mkR=(rx,ry)=>{const m=this.textures.asphaltMap.clone();m.needsUpdate=true;m.repeat.set(rx,ry);const r=this.textures.asphaltRoughness.clone();r.needsUpdate=true;r.repeat.set(rx,ry);return stdMat(0xffffff,0.56,0.18,{map:m,roughnessMap:r});};
    const sg=26,bP=[],bU=[],bI=[],wP=[],wU=[],wI=[];
    for(let i=0;i<=sg;i++){
      const t=i/sg,x=-300+428*t,z=boulevardZAtX(x),dz=(boulevardZAtX(x+2)-boulevardZAtX(x-2))/4,iv=1/M.hypot(1,dz),nx=-dz*iv,nz=iv;
      bP.push(x-nx*9.5,0.35,z-nz*9.5,x+nx*9.5,0.35,z+nz*9.5);bU.push(0,t*24,1,t*24);
      wP.push(x+nx*9.5,0.42,z+nz*9.5,x+nx*21.5,0.42,z+nz*21.5);wU.push(0,t*28,1,t*28);
      if(i<sg){const k=i*2;bI.push(k,k+1,k+2,k+1,k+3,k+2);wI.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const rib=(P,U,I,mt)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();const m=new THREE.Mesh(g,mt);m.receiveShadow=true;this.scene.add(m);};
    rib(bP,bU,bI,mkR(1,1));const bt=this.textures.boardwalkMap.clone();bt.needsUpdate=true;bt.repeat.set(1,2);rib(wP,wU,wI,stdMat(0xffffff,0.78,0.05,{map:bt}));
    const sm=stdMat(0xf4f2eb,0.7);for(const cx of[-145,-45,45])for(let k=-3;k<=3;k++)B(this.scene,3.2,0.04,1,sm,cx,0.38,boulevardZAtX(cx)+k*2.2,false);
    [[-275,-185,-275,boulevardZAtX(-275),15],[-145,-195,-145,boulevardZAtX(-145),16],[-45,-205,-45,boulevardZAtX(-45),18],[45,-205,45,boulevardZAtX(45),18],[132,-180,132,98,17],[192,-175,192,68,14],[-280,-185,195,-185,16],[-280,-108,195,-108,16],[-150,-24,195,-24,16],[-280,48,195,48,16]].forEach(([x1,z1,x2,z2,w])=>{
      const l=M.hypot(x2-x1,z2-z1),g=new THREE.PlaneGeometry(w,l);g.rotateX(-M.PI/2);const m=new THREE.Mesh(g,mkR(1,M.max(1,M.round(l/18))));
      m.position.set((x1+x2)*0.5,0.35,(z1+z2)*0.5);m.rotation.y=M.atan2(x2-x1,z2-z1);m.receiveShadow=true;this.scene.add(m);
    });
    this.buildPuenteDelSol(mkR(1,1));
  }

  buildPuenteDelSol(roadMat) {
    const a=WORLD_CONFIG.bridgeStart,b=WORLD_CONFIG.bridgeEnd,yaw=M.atan2(b.x-a.x,b.z-a.z),w=WORLD_CONFIG.bridgeWidth,sg=32,rx=M.cos(yaw),rz=-M.sin(yaw),dP=[],dU=[],dI=[];
    for(let i=0;i<=sg;i++){const t=i/sg,pt=this.getBridgePoint(t);dP.push(pt.x-rx*w*0.5,pt.y+0.06,pt.z-rz*w*0.5,pt.x+rx*w*0.5,pt.y+0.06,pt.z+rz*w*0.5);dU.push(0,t*14,1,t*14);if(i<sg){const k=i*2;dI.push(k,k+2,k+1,k+1,k+2,k+3);}}
    const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(dP,3));dg.setAttribute('uv',new THREE.Float32BufferAttribute(dU,2));dg.setIndex(dI);dg.computeVertexNormals();
    const dm=new THREE.Mesh(dg,roadMat);dm.receiveShadow=true;this.scene.add(dm);
    const um=stdMat(0x3b4454,0.65,0.45),cs=stdMat(0xd94b3d,0.4,0.55),cb=stdMat(0x242c3b,0.38,0.72),rm=stdMat(0xd8dee9,0.48,0.4),lm=glowMat(0xffbe5c,2.4);
    for(let i=0;i<sg;i++){
      const p0=this.getBridgePoint(i/sg),p1=this.getBridgePoint((i+1)/sg),mx=(p0.x+p1.x)*0.5,my=(p0.y+p1.y)*0.5,mz=(p0.z+p1.z)*0.5,sl=M.hypot(p1.x-p0.x,p1.y-p0.y,p1.z-p0.z),pit=-M.atan2(p1.y-p0.y,M.hypot(p1.x-p0.x,p1.z-p0.z));
      const g=B(this.scene,w+1.2,1.4,sl+0.2,um,mx,my-0.78,mz,false);g.rotation.order='YXZ';g.rotation.y=yaw;g.rotation.x=pit;
      for(const s of[-1,1]){const r=B(this.scene,0.55,1.05,sl+0.15,rm,mx+rx*s*(w*0.5+0.25),my+0.45,mz+rz*s*(w*0.5+0.25),false);r.rotation.order='YXZ';r.rotation.y=yaw;r.rotation.x=pit;}
      if(i%4===2)for(const s of[-1,1]){const lx=mx+rx*s*(w*0.5+0.4),lz=mz+rz*s*(w*0.5+0.4);C(this.scene,0.1,0.14,6.2,6,cb,lx,my+3.1,lz,false);S(this.scene,0.36,8,8,lm,lx-rx*s*0.9,my+6.1,lz-rz*s*0.9);}
    }
    const bm=glowMat(0xff2b40,3.2);
    for(const tt of[0.28,0.72]){const pt=this.getBridgePoint(tt),g=new THREE.Group();g.position.set(pt.x,0,pt.z);g.rotation.y=yaw;B(g,w+7,10,6.5,um,0,2,0,false);for(const s of[-1,1]){B(g,2.4,56,3,cs,s*(w*0.5+1.4),28,0);S(g,0.55,8,8,bm,s*(w*0.5+1.4),56.8,0);}for(const cy of[pt.y+13,pt.y+27,52])B(g,w+4.8,2.2,2.4,cs,0,cy,0);this.scene.add(g);}
    const cH=t=>t<=0.28?4+M.pow(t/0.28,1.85)*50:t>=0.72?4+M.pow((1-t)/0.28,1.85)*50:21.5+M.pow((t-0.5)/0.22,2)*32.5;
    for(const s of[-1,1]){
      const pts=[];for(let i=0;i<=40;i++){const t=i/40,bp=this.getBridgePoint(t);pts.push(new THREE.Vector3(bp.x+rx*s*(w*0.5+1.3),cH(t),bp.z+rz*s*(w*0.5+1.3)));}
      this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),44,0.32,6,false),cb));
      for(let i=2;i<39;i+=2){const t=i/40;if(M.abs(t-0.28)<0.03||M.abs(t-0.72)<0.03)continue;const bp=this.getBridgePoint(t),len=M.max(1,cH(t)-bp.y);C(this.scene,0.08,0.08,len,5,cb,bp.x+rx*s*(w*0.5+1.3),bp.y+len*0.5,bp.z+rz*s*(w*0.5+1.3),false);}
    }
    const ip=[[350,132],[382,122],[418,134],[432,156],[405,175],[368,158]];
    for(let i=0;i<ip.length-1;i++){const[x0,z0]=ip[i],[x1,z1]=ip[i+1],y0=this.getTerrainHeight(x0,z0)+0.16,y1=this.getTerrainHeight(x1,z1)+0.16,m=B(this.scene,11,0.4,M.hypot(x1-x0,y1-y0,z1-z0)+2,um,(x0+x1)*0.5,(y0+y1)*0.5,(z0+z1)*0.5,false);m.rotation.order='YXZ';m.rotation.y=M.atan2(x1-x0,z1-z0);m.rotation.x=-M.atan2(y1-y0,M.hypot(x1-x0,z1-z0));}
  }

  buildStuntRamps() {
    const rM=stdMat(0xffa630,0.45,0.25),sM=glowMat(0xff2b59,1.4);
    [[-12,boulevardZAtX(-12)-4,M.PI*0.5,7.5,13,3.4],[168,-76,0,7.2,12,3.2],[-95,-108,M.PI*0.5,7.5,13,3.5]].forEach(([x,z,yaw,width,length,height])=>{
      this.ramps.push({x,z,yaw,width,length,height});const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(length,0);sh.lineTo(length,height);sh.closePath();
      const g=new THREE.ExtrudeGeometry(sh,{depth:width,bevelEnabled:false});g.translate(-length*0.5,0,-width*0.5);g.rotateY(-M.PI*0.5);
      const m=new THREE.Mesh(g,rM);m.position.set(x,0.35,z);m.rotation.y=yaw;m.castShadow=m.receiveShadow=true;this.scene.add(m);
      B(this.scene,width+0.3,0.35,0.45,sM,x+M.sin(yaw)*length*0.48,height+0.35,z+M.cos(yaw)*length*0.48,false).rotation.y=yaw;
    });
  }
}

// Cala Solara — Organic Coastal Vector Map & Road-Following Live GPS Minimap
import { WORLD_CONFIG as W } from '../config.js';
import { boulevardZAtX as bZ, coastZAtX as cZ } from '../world/terrain.js';

export class TacticalMinimapRenderer {
  constructor(g,cv){Object.assign(this,{game:g,canvas:cv,ctx:cv.getContext('2d')});}
  drawOrganicMapBase(c,w,h,pt,rI,bS,rW){
    const{sin,cos,max}=Math,ln=(a,b)=>c.lineTo(a,b);c.fillStyle='#062038';c.fillRect(0,0,w,h);
    for(const[col,o]of[['#0c5876',30],['#14849a',15],['#1eb0b6',5],['#22384c',-1]]){const q=[pt(-365,-255),pt(212+o,-255),pt(212+o,108+o)];for(let x=200;x>=-365;x-=18)q.push(pt(x,cZ(x)+o));fillPoly(c,col,q);}
    for(const[col,sh]of[['#2a4e40',-194],['#38624d',-220]]){const q=[pt(-365,-255),pt(210,-255),pt(210,sh)];for(let x=180;x>=-365;x-=32)q.push(pt(x,sh+sin(x*.022)*16+cos(x*.045)*6));fillPoly(c,col,q);}
    c.strokeStyle='#f2d8a0';c.lineWidth=max(3.2,rW);c.lineCap='round';c.beginPath();for(let x=-335;x<=145;x+=16){const q=pt(x,cZ(x)-5);x===-335?c.moveTo(q.x,q.y):ln(q.x,q.y);}c.stroke();
    const is=pt(398,145);for(const[rs,col]of[[rI*1.28,'#14849a'],[rI,'#2c4c54'],[rI*.66,'#3b6456'],[rI*.34,'#507860']]){const q=[];for(let i=0;i<=28;i++){const a=(i/28)*6.283,r=rs*(1+sin(a*3)*.1+cos(a*5)*.06);q.push({x:is.x+cos(a)*r,y:is.y+sin(a)*r*.85});}fillPoly(c,col,q);}
    c.strokeStyle='#c49a6c';c.lineWidth=max(2.2,rW*.68);for(const z of[-10,22,54]){const a=pt(208,z),b=pt(250,z);c.beginPath();c.moveTo(a.x,a.y);ln(b.x,b.y);c.stroke();}
    c.lineJoin='round';c.strokeStyle='#7e9ab4';c.lineWidth=rW*1.1;c.beginPath();for(let x=-300;x<=128;x+=14){const q=pt(x,bZ(x));x===-300?c.moveTo(q.x,q.y):ln(q.x,q.y);}c.stroke();
    c.strokeStyle='#536e88';c.lineWidth=rW*.68;for(const v of ARTERIAL_CURVES){c.beginPath();const ps=v.map(([x,z])=>pt(x,z));c.moveTo(ps[0].x,ps[0].y);for(let i=1;i<ps.length-1;i++)c.quadraticCurveTo(ps[i].x,ps[i].y,(ps[i].x+ps[i+1].x)*.5,(ps[i].y+ps[i+1].y)*.5);ln(ps[ps.length-1].x,ps[ps.length-1].y);c.stroke();}
    const bs=pt(W.bridgeStart.x,W.bridgeStart.z),be=pt(W.bridgeEnd.x,W.bridgeEnd.z);c.strokeStyle='#ff5a52';c.lineWidth=rW+1.4;c.beginPath();c.moveTo(bs.x,bs.y);ln(be.x,be.y);c.stroke();
    for(const f of this.game.cityWorld.buildingFootprints){const q=pt(f.x,f.z),bw=bS?max(4,f.w*bS):6.4,bd=bS?max(4,f.d*bS):6.4;c.fillStyle=f.color+'88';c.fillRect(q.x-bw*.5,q.y-bd*.5,bw,bd);}
  }
  computeRoadGpsRoute(p,g){const pts=[{x:p.x,z:p.z}];if(p.z>70&&g.x>100&&p.x<120){for(let x=Math.ceil(p.x/30)*30;x<=Math.min(120,g.x);x+=30)pts.push({x,z:bZ(x)});if(g.z<75)pts.push({x:132,z:50});}else if((p.x>125&&g.x<125)||(p.x<125&&g.x>260))pts.push({x:W.bridgeStart.x,z:W.bridgeStart.z});else if(Math.abs(p.x-g.x)>45&&Math.abs(p.z-g.z)>45)pts.push({x:g.x,z:p.z});pts.push({x:g.x,z:g.z});return pts;}
  renderHubOverviewMap(cv){
    if(!cv)return;const c=cv.getContext('2d'),w=cv.width,h=cv.height,pt=(x,z)=>({x:((x+360)/860)*w,y:((z+255)/505)*h});this.drawOrganicMapBase(c,w,h,pt,54,0,3.2);
    for(const d of this.game.turfActivities.districts){const q=pt(d.center.x,d.center.z);c.fillStyle=d.color+'38';c.strokeStyle=d.color;c.lineWidth=2.2;c.beginPath();c.arc(q.x,q.y,25,0,6.283);c.fill();c.stroke();c.fillStyle='#08101c';c.font='900 10.5px sans-serif';c.textAlign='center';c.fillText(d.name.split(' ')[0].toUpperCase(),q.x+1,q.y+4.5);c.fillStyle='#fff';c.fillText(d.name.split(' ')[0].toUpperCase(),q.x,q.y+3.5);}
    const pin=(x,z,col,ch)=>{const p=pt(x,z);drawDot(c,p.x,p.y,8,col,1.8);c.fillStyle='#09101c';c.font='900 9.5px sans-serif';c.textAlign='center';c.fillText(ch,p.x,p.y+3.5);};
    const st=this.game.missions.currentStage.pos;pin(154,14,'#00e6ff','G');pin(st.x,st.z,'#ffcf40','★');pin(-165,bZ(-165),'#ff5a87','R');pin(this.game.player.pos.x,this.game.player.pos.z,'#75ff9e','●');
  }
  renderLiveMinimap(){
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height,g=this.game,p=g.player,sc=.44,toM=(x,z)=>({x:w*.5+(x-p.pos.x)*sc,y:h*.5+(z-p.pos.z)*sc});this.drawOrganicMapBase(c,w,h,toM,124*sc,sc,4.8);
    const rt=this.computeRoadGpsRoute(p.pos,g.missions.currentStage.pos).map(q=>toM(q.x,q.z));c.strokeStyle='#ff4fd8';c.lineWidth=3.4;c.lineCap='round';c.lineJoin='round';c.beginPath();rt.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.stroke();
    const gl=rt[rt.length-1];drawDot(c,Math.max(10,Math.min(w-10,gl.x)),Math.max(10,Math.min(h-10,gl.y)),6.2,'#ffcf40',2);const fl=Math.sin(performance.now()*.012)>0;
    for(const u of g.policeSystem.units){if(u.vehicle.destroyed)continue;const q=toM(u.vehicle.pos.x,u.vehicle.pos.z);if(q.x<-30||q.x>w+30||q.y<-30||q.y>h+30)continue;if(g.policeSystem.wantedLevel>0){const a=Math.atan2(Math.cos(u.vehicle.yaw),Math.sin(u.vehicle.yaw));c.fillStyle=fl?'rgba(255,60,90,.28)':'rgba(55,165,255,.28)';c.beginPath();c.moveTo(q.x,q.y);c.arc(q.x,q.y,28,a-.52,a+.52);c.closePath();c.fill();}drawDot(c,q.x,q.y,4.4,fl?'#ff3858':'#33a3ff');}
    for(const o of g.missions.hostiles)if(o.alive){const q=toM(o.pos.x,o.pos.z);drawDot(c,q.x,q.y,3.6,'#ff5252');}
    if(g.crewSystem.ally){const q=toM(g.crewSystem.ally.pos.x,g.crewSystem.ally.pos.z);drawDot(c,q.x,q.y,4.6,'#48f59b');}
    c.save();c.translate(w*.5,h*.5);c.rotate(-p.yaw+3.1416);c.fillStyle='#fff';c.strokeStyle='#09101c';c.lineWidth=1.6;c.beginPath();c.moveTo(0,-7.8);c.lineTo(6,6.4);c.lineTo(0,3.2);c.lineTo(-6,6.4);c.closePath();c.fill();c.stroke();c.restore();
  }
}
const ARTERIAL_CURVES=[[[-275,-185],[-266,-86],[-274,48],[-275,114]],[[-145,-195],[-138,-82],[-152,48],[-145,130]],[[-45,-205],[-38,-90],[-46,48],[-45,125]],[[45,-205],[52,-85],[44,48],[45,114]],[[132,-180],[140,-64],[128,35],[122,96]],[[192,-175],[198,-72],[188,22],[182,72]],[[-280,-185],[-110,-202],[45,-198],[192,-175]],[[-280,-108],[-115,-118],[55,-102],[194,-108]],[[-150,-24],[-40,-34],[85,-18],[194,-24]],[[-280,48],[-145,58],[0,42],[132,50],[188,52]],[[350,132],[382,116],[424,130],[438,158],[406,180],[366,160],[350,132]]];
function fillPoly(c,col,q){c.fillStyle=col;c.beginPath();q.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
function drawDot(c,x,y,r,col,s=0){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.283);c.fill();if(s){c.strokeStyle='#09101c';c.lineWidth=s;c.stroke();}}

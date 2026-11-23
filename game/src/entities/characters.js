// Cala Solara — Stylized Proportioned Character Rigs, Seamless Articulated Limbs & 5 Detailed Firearms
import * as THREE from 'three';
import { addBox as B, addCap as P, addContactShadow, addCyl as C, addSphere as S, stdMat as M } from '../render/mesh-utils.js';

export function buildWeaponMesh(id){
  const g=new THREE.Group(),mt=M(0x1d2330,.26,.86),gr=M(0x3a2a20,.76),ac=M(0xe0aa42,.26,.88),H=1.57;let mz=.58;
  if(id==='pistol'){B(g,.064,.088,.36,mt,0,.04,.12,0);B(g,.054,.16,.08,gr,0,-.05,.01,0).rotation.x=.25;mz=.38;}
  else if(id==='smg'){B(g,.082,.125,.5,mt,0,.04,.18,0);C(g,.022,.022,.3,8,mt,0,.05,.55,0).rotation.x=H;B(g,.048,.26,.066,mt,0,-.1,.24,0).rotation.x=.18;B(g,.048,.052,.16,ac,0,.115,.16,0);mz=.74;}
  else if(id==='shotgun'){B(g,.078,.11,.32,gr,0,.01,-.08,0);B(g,.09,.12,.42,mt,0,.04,.2,0);C(g,.028,.028,.58,8,mt,0,.07,.58,0).rotation.x=H;mz=.92;}
  else if(id==='launcher'){C(g,.078,.078,.78,10,mt,0,.06,.28,0).rotation.x=H;C(g,.115,.115,.18,10,ac,0,.02,.2,0).rotation.x=H;mz=.76;}
  else{B(g,.078,.11,.3,mt,0,.02,-.09,0);B(g,.09,.13,.5,mt,0,.04,.22,0);C(g,.024,.024,.48,8,mt,0,.06,.67,0).rotation.x=H;B(g,.052,.23,.078,ac,0,-.1,.28,0).rotation.x=.22;mz=.95;}
  const muzzleAnchor=new THREE.Object3D();muzzleAnchor.position.set(0,.06,mz);g.add(muzzleAnchor);return{mesh:g,muzzleAnchor};
}
export function createCharacterRig({jacket=0xd93858,shirt=0xf5f1e8,pants=0x1e2636,skin=0xdba078,hair=0x1a1518,hat=null,sunglasses=true,vest=false,weaponId=null,ponytail=false}={}){
  const G=()=>new THREE.Group(),root=G(),body=G();root.add(body);addContactShadow(root,1.02,1.02,.58,.04);
  const jm=M(jacket,.52,.12),tr=M(0x181e28,.42,.28),sm=M(shirt,.72),pm=M(pants,.74),sk=M(skin,.54),hm=M(hair,.68),bm=M(0x161a22,.42,.18),mm=M(0xdcb04c,.24,.88);
  C(body,.19,.2,.22,10,pm,0,.94,0);
  const mkLeg=k=>{const hip=G(),knee=G();hip.position.set(k*.11,.92,0);C(hip,.105,.088,.46,10,pm,0,-.22,0);S(hip,.088,8,8,pm,0,-.44,.01,1);knee.position.set(0,-.44,0);C(knee,.085,.07,.42,10,pm,0,-.2,0);B(knee,.145,.13,.27,bm,0,-.42,.045,0);B(knee,.152,.035,.28,M(0xf0f2f6,.6),0,-.47,.045,0);hip.add(knee);return{hip,knee};};
  const lL=mkLeg(1),rL=mkLeg(-1),torso=G();torso.position.set(0,1.29,0);
  C(torso,.21,.17,.54,12,sm,0,0,.01);C(torso,.23,.19,.54,12,jm,0,.01,-.035);B(torso,.16,.52,.14,jm,.145,.01,.065);B(torso,.16,.52,.14,jm,-.145,.01,.065);C(torso,.16,.19,.12,12,tr,0,.27,-.02,0);B(torso,.42,.068,.24,tr,0,-.26,0,0);B(torso,.085,.062,.04,mm,0,-.26,.125,0);B(torso,.075,.14,.11,tr,-.22,-.28,.02,0);
  if(vest){B(torso,.44,.44,.27,M(0x1b2330,.6,.24),0,.02,.015);B(torso,.34,.13,.29,M(0x2a3444,.58),0,-.08,.02,0);B(torso,.36,.07,.28,mm,0,.16,.02,0);}
  const leftArm=G(),rightArm=G();leftArm.position.set(.24,1.52,0);rightArm.position.set(-.24,1.52,0);
  const mkArm=a=>{S(a,.082,10,8,jm,0,0,0,1);C(a,.072,.062,.32,10,jm,0,-.16,0);S(a,.062,8,8,jm,0,-.32,0,1);const fa=G();fa.position.set(0,-.32,0);C(fa,.058,.048,.26,8,sk,0,-.13,0);S(fa,.052,8,8,sk,0,-.27,.02,0);a.add(fa);return fa;};
  const lf=mkArm(leftArm),rf=mkArm(rightArm),head=G();head.position.set(0,1.74,0);C(head,.058,.068,.14,10,sk,0,-.13,0,0);S(head,.14,14,12,sk,0,0,0,1).scale.set(.92,1.08,.96);
  const hc=new THREE.Mesh(new THREE.SphereGeometry(.15,14,10,0,6.283,0,1.92),hm);hc.position.set(0,.022,-.016);head.add(hc);S(head,.125,10,8,hm,0,-.015,-.095).scale.set(1.08,1.18,.68);
  if(ponytail){S(head,.052,8,8,tr,0,-.02,-.155);P(head,.056,.18,hm,0,-.11,-.19,0).rotation.x=.52;P(head,.042,.22,hm,0,-.24,-.23,0).rotation.x=.22;}
  if(sunglasses)B(head,.22,.052,.056,M(0x0b1220,.08,.92),0,.02,.115,0);
  if(hat==='police'){C(head,.16,.15,.1,12,M(0x162642,.54),0,.16,0,0);B(head,.2,.03,.16,bm,0,.12,.11,0);B(head,.05,.05,.02,mm,0,.17,.15,0);}
  else if(hat==='swat'){S(head,.178,12,10,M(0x161c26,.4,.44),0,.07,0);B(head,.23,.075,.075,M(0x0b1a28,.08,.92),0,.04,.135,0);}
  body.add(lL.hip,rL.hip,torso,leftArm,rightArm,head);const ws=G();ws.position.set(0,-.27,.06);rf.add(ws);let wp=null;
  const setWeapon=id=>{if(wp)ws.remove(wp.mesh);wp=id?buildWeaponMesh(id):null;if(wp)ws.add(wp.mesh);};if(weaponId)setWeapon(weaponId);
  const getMuzzleWorldPos=(t=new THREE.Vector3())=>wp?wp.muzzleAnchor.getWorldPosition(t):root.position.clone().add(new THREE.Vector3(0,1.4,0));
  const animatePose=(wc,spd,aim,dt,roll=0,cr=false)=>{
    if(roll>0){body.rotation.x=roll*6.283;body.position.y=Math.sin(roll*Math.PI)*.32;return;}
    body.rotation.x=0;const sw=Math.sin(wc)*Math.min(1,spd/5.5)*.64;
    if(aim&&wp){body.position.y=cr?-.22:-.09;torso.rotation.y=-.34;torso.rotation.x=cr?.14:.06;head.rotation.y=.28;lL.hip.rotation.x=cr?-.72:-.38+sw*.38;lL.knee.rotation.x=cr?.96:.42;rL.hip.rotation.x=cr?.36:.28-sw*.38;rL.knee.rotation.x=cr?.66:.32;rightArm.rotation.set(-1.18,.08,-.08);rf.rotation.set(-.34,.04,0);leftArm.rotation.set(-1.02,-.62,-.14);lf.rotation.set(-.58,-.32,0);ws.rotation.set(1.52,-.08,0);}
    else{body.position.y=cr?-.2:0;torso.rotation.set(0,0,0);head.rotation.y=0;lL.hip.rotation.x=cr?-.5:sw;lL.knee.rotation.x=cr?.72:Math.max(0,-sw*.55);rL.hip.rotation.x=cr?.28:-sw;rL.knee.rotation.x=cr?.55:Math.max(0,sw*.55);rightArm.rotation.set(-sw*.56,0,0);rf.rotation.set(-.2,0,0);leftArm.rotation.set(sw*.56,0,0);lf.rotation.set(-.18,0,0);ws.rotation.set(.35,0,0);}
  };
  return{root,body,leftLeg:lL.hip,rightLeg:rL.hip,leftArm,rightArm,head,setWeapon,getMuzzleWorldPos,animatePose};
}

// Cala Solara — 8-Mission Multi-Stage Story Campaign, Character Comms & Objective Beacons
import * as THREE from 'three';
import { boulevardZAtX } from '../world/city-world.js';
import { createStylizedCharacterRig } from '../entities/characters.js';

const M=Math,V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const SPK={TD:['Tomas Delgado','#ffcf40'],NR:['Nadia Reyes','#45d9ff'],MC:['Mateo Cruz','#ff6b4a'],CV:['Camila Vega','#ff5a7d']};
const S=(type,label,x,z,radius,wanted,i,text,enemyCount=0)=>({type,label,pos:{x,z},radius,wanted,enemyCount,comms:{speaker:SPK[i][0],initials:i,color:SPK[i][1],text}});
const C=(id,title,district,reward,controlGain,stages)=>({id,title,district,reward,controlGain,stages});

export const STORY_CAMPAIGN=[
  C('m1','Sunset Run on Avenida del Sol','palmera',3500,25,[
    S('goto','Hit the Palmera Strip drop before CSPD locks the coast',-115,boulevardZAtX(-115),14,2,'TD','CSPD tagged your GT-R off Hotel Coral. Keep the throttle pinned down Avenida del Sol!'),
    S('goto','Shake the 3★ pursuit and reach Solara Customs Marina',148,24,16,3,'NR','Roadblock ahead near Miramar! Trigger [Q] for radar scramble or drift into Puerto Caldera.'),
  ]),
  C('m2','Plaza de la Fiesta Ambush','barrio',4800,30,[
    S('combat','Clear cartel enforcers in Plaza de la Fiesta & steal the V8 Coupe',-220,-20,18,2,'MC','Cartel gunmen boxed in the fountain plaza! Take cover—I am laying down covering fire.',5),
    S('goto','Escape Barrio Viejo in the Caldera V8 to Financial Plaza',0,-45,16,2,'CV','Plaza clear. Grabbing the V8 Coupe and heading east toward the Financial Core!'),
  ]),
  C('m3','Gantry Crane Contraband','puerto',5600,25,[
    S('combat','Eliminate harbor guards under the Puerto Caldera cranes',178,-112,18,2,'NR','Manifest points to the red shipping containers under Crane 01. Clear the yard.',5),
    S('goto','Deliver the manifest to Safehouse Marina',162,24,15,3,'TD','Harbor patrol closing in—bring the manifest straight to Solara Customs!'),
  ]),
  C('m4','Skyline Vault Extraction','core',7200,35,[
    S('goto','Breach Solara Spire Plaza in the Financial Core',0,-110,15,2,'NR','Security grid looped for 90s. Pull up to Solara Spire Plaza now.'),
    S('combat','Neutralize private security at the Obelisk Fountain',0,-70,20,3,'MC','Heavy security rushing from the lobby! Watch your flanks!',6),
    S('goto','Evade CSPD and return to Palmera Boardwalk',-60,boulevardZAtX(-60),16,4,'CV','Bearer bonds secured. Punching south toward the beach strip!'),
  ]),
  C('m5','Bay Speedboat Smuggle','puerto',6400,20,[
    S('goto','Board the Cala WaveRunner at Marina Pier 2',236,24,14,1,'TD','Fuelled the WaveRunner at Pier 2. Take it across the lagoon to Monte Faro!'),
    S('goto','Pilot across the bay to Monte Faro South Cove',342,190,22,2,'NR','Keep it wide open over the chop—signal drop buoy is glowing off Monte Faro.'),
  ]),
  C('m6','Hotel Coral High-Roller Takedown','palmera',8100,30,[
    S('combat','Crash the syndicate meeting outside Hotel Coral',-168,boulevardZAtX(-168)-8,18,3,'CV','Rival bosses are splitting our Palmera Strip cut out front of Hotel Coral. End it.',6),
    S('goto','Outrun SWAT BearCats back to Barrio Viejo Plaza',-220,-20,16,4,'MC','SWAT BearCat rolling in! Hit the alleys into Barrio Viejo!'),
  ]),
  C('m7','Puente del Sol 5★ Lockdown','puente',11500,45,[
    S('goto','Break west across Puente del Sol under 5★ Air-1 lockdown to Solara Spire',45,48,22,5,'NR','Air-1 has a searchlight lock on Puente del Sol! Punch through the SWAT barricade into Downtown!'),
  ]),
  C('m8','Crown of Monte Faro','faro',18000,60,[
    S('combat','Storm the Monte Faro Cliffside Villa compound',388,156,22,4,'CV','Final push. Take the cliffside villa and Cala Solara belongs to our crew.',7),
    S('goto','Claim the Faro Solara Lighthouse overlook',432,152,16,5,'MC','Compound clear! Meet at the lighthouse beacon—we own the bay!'),
  ]),
];

export class MissionDirector {
  constructor(scene, cityWorld, combatSystem, policeSystem, crewTurf) {
    this.scene=scene;this.cityWorld=cityWorld;this.combatSystem=combatSystem;this.policeSystem=policeSystem;this.crewTurf=crewTurf;
    this.activeMissionIndex=this.stageIndex=this.commsTimer=0;this.completedIds=new Set();this.hostiles=[];this.activeComms=null;
    this.beaconGroup=new THREE.Group();
    this.beaconBeam=new THREE.Mesh(new THREE.CylinderGeometry(1,2,44,16,1,true),new THREE.MeshBasicMaterial({color:0xffc44d,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    this.beaconBeam.position.y=22;
    this.beaconRing=new THREE.Mesh(new THREE.RingGeometry(2.6,3.6,24),new THREE.MeshBasicMaterial({color:0xffcf6e,transparent:true,opacity:.85,side:THREE.DoubleSide}));
    this.beaconRing.rotation.x=-M.PI*.5;this.beaconRing.position.y=.25;this.beaconGroup.add(this.beaconBeam,this.beaconRing);scene.add(this.beaconGroup);
    this.startMission(0,false);
  }

  get currentMission() { return STORY_CAMPAIGN[this.activeMissionIndex]||STORY_CAMPAIGN[0]; }
  get currentStage() { return this.currentMission.stages[this.stageIndex]||this.currentMission.stages[0]; }
  clearHostiles() { for(const h of this.hostiles)this.scene.remove(h.rig.root);this.hostiles=[];this.combatSystem.setHostiles(this.hostiles); }
  startMission(i, want = true) { this.activeMissionIndex=((i%STORY_CAMPAIGN.length)+STORY_CAMPAIGN.length)%STORY_CAMPAIGN.length;this.stageIndex=0;this.setupStage(want); }

  setupStage(want = true) {
    this.clearHostiles();const st=this.currentStage;
    this.beaconGroup.position.set(st.pos.x,M.max(.25,this.cityWorld.getTerrainHeight(st.pos.x,st.pos.z)),st.pos.z);
    this.beaconGroup.visible=true;this.beaconBeam.visible=st.type!=='combat';
    if(st.comms){this.activeComms=st.comms;this.commsTimer=8;}if(want&&st.wanted)this.policeSystem.setWantedLevel(M.max(this.policeSystem.wantedLevel,st.wanted));
    if(st.type==='combat'){
      const cnt=st.enemyCount||5;
      for(let i=0;i<cnt;i++){
        const a=(i/cnt)*6.283+.4,d=7+(i%3)*4.5,ex=st.pos.x+M.cos(a)*d,ez=st.pos.z+M.sin(a)*d,ey=M.max(.25,this.cityWorld.getTerrainHeight(ex,ez));
        const rig=createStylizedCharacterRig({jacket:i%2?0x5c2330:0x262936,shirt:0x1a1e28,pants:0x171a22,skin:0xc98f68,hair:0x1a1618,sunglasses:true,weaponId:i%3?'smg':'carbine'});
        rig.root.position.set(ex,ey,ez);this.scene.add(rig.root);this.hostiles.push({rig,pos:V3(ex,ey,ez),yaw:a+M.PI,hp:65,alive:true,fireCd:.9,walkCycle:i});
      }
      this.combatSystem.setHostiles(this.hostiles);
    }
  }

  getObjectiveText() { const st=this.currentStage;return st.type==='combat'?`${st.label} (${this.hostiles.filter(h=>h.alive).length} left)`:st.label; }

  update(dt, pl, atm, ts) {
    if(this.commsTimer>0)this.commsTimer=M.max(0,this.commsTimer-dt);this.beaconRing.rotation.z+=dt*1.8;const st=this.currentStage,p=pl.pos;
    for(const h of this.hostiles){
      if(!h.alive)continue;const dx=p.x-h.pos.x,dz=p.z-h.pos.z,d=M.hypot(dx,dz),sp=d>15&&d<68?4.2:0;h.yaw=M.atan2(dx,dz);
      if(sp>0){const nx=h.pos.x+(dx/d)*sp*dt,nz=h.pos.z+(dz/d)*sp*dt;if(!this.cityWorld.isWater(nx,nz)){h.pos.x=nx;h.pos.z=nz;}}
      h.pos.y=M.max(.25,this.cityWorld.getTerrainHeight(h.pos.x,h.pos.z));h.walkCycle+=sp*dt*1.8;h.rig.root.position.copy(h.pos);h.rig.root.rotation.y=h.yaw;h.rig.animatePose(h.walkCycle,sp,d<44,dt);
      if((h.fireCd-=dt)<=0&&d<44){h.fireCd=1.1+M.random()*.7;const m=h.rig.getMuzzleWorldPos(),aim=p.clone().add(V3((M.random()-.5)*1.8,1.1,(M.random()-.5)*1.8));atm.spawnMuzzleFlash(m,aim.clone().sub(m).normalize(),0xffb35c);atm.spawnTracer(m,aim,0xffaa55,.09);if(M.random()<.24){if(pl.vehicle)pl.vehicle.hp=M.max(10,pl.vehicle.hp-4);else pl.takeDamage(5);}}
    }
    if(st.type==='goto'?M.hypot(p.x-st.pos.x,p.z-st.pos.z)<=st.radius:!this.hostiles.some(h=>h.alive)){
      const m=this.currentMission;
      if(this.stageIndex+1<m.stages.length){this.stageIndex++;this.setupStage(true);if(ts)ts(`STAGE COMPLETE — ${this.currentStage.label}`);}
      else{this.completedIds.add(m.id);pl.cash+=m.reward;this.crewTurf.addDistrictControl(m.district,m.controlGain);if(ts)ts(`MISSION COMPLETE: ${m.title} (+$${m.reward.toLocaleString()})`);this.startMission((this.activeMissionIndex+1)%STORY_CAMPAIGN.length,false);}
    }
  }
}

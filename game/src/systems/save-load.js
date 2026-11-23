// Cala Solara — 3-Slot LocalStorage Save & Campaign Progression Manager
export class SaveSlotManager {
  saveSlot(s,g){
    const p={savedAt:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),cash:g.player.cash,hp:g.player.hp,armor:g.player.armor,pos:{x:g.player.pos.x,z:g.player.pos.z},missionIndex:g.missions.activeMissionIndex,completed:[...g.missions.completedIds],districts:g.turfActivities.districts.map(d=>({id:d.id,control:d.control})),crewLevels:g.crewSystem.crew.map(c=>({id:c.id,level:c.level})),relics:g.turfActivities.relicsCollected,timePreset:g.atmosphere.currentPreset};
    try{localStorage.setItem(KEY+s,JSON.stringify(p));return true;}catch{return false;}
  }
  readSlot(s){try{const r=localStorage.getItem(KEY+s);return r?JSON.parse(r):null;}catch{return null;}}
  loadSlot(s,g){
    const d=this.readSlot(s),p=g.player,m=g.missions,t=g.turfActivities;if(!d)return false;
    p.cash=d.cash??14850;p.hp=d.hp??100;p.armor=d.armor??75;
    if(d.pos){if(p.vehicle)p.exitVehicle();p.pos.set(d.pos.x,Math.max(.25,g.cityWorld.getTerrainHeight(d.pos.x,d.pos.z)),d.pos.z);p.rig.root.position.copy(p.pos);}
    m.completedIds=new Set(d.completed||[]);m.startMission(d.missionIndex||0,false);t.relicsCollected=d.relics??0;
    if(Array.isArray(d.districts))for(const x of d.districts){const q=t.districts.find(k=>k.id===x.id);if(q)q.control=x.control;}
    if(Array.isArray(d.crewLevels))for(const x of d.crewLevels){const q=g.crewSystem.crew.find(k=>k.id===x.id);if(q)q.level=x.level;}
    if(d.timePreset)g.atmosphere.applyPreset(d.timePreset);return true;
  }
  firstPopulatedSlot(){return[1,2,3].find(s=>this.readSlot(s))||null;}
  hasAnySave(){return this.firstPopulatedSlot()!==null;}
}
const KEY='cala_solara_slot_';

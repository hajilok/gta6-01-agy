// Cala Solara — 3-Slot LocalStorage Save & Campaign Progression Persistence System
const KEY='cala_solara_slot_';

export class SaveProgressionSystem {
  saveSlot(slot, g) {
    const p={savedAt:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),cash:g.player.cash,hp:g.player.hp,armor:g.player.armor,pos:{x:g.player.pos.x,z:g.player.pos.z},missionIndex:g.missions.activeMissionIndex,completed:[...g.missions.completedIds],districts:g.crewTurf.districts.map(d=>({id:d.id,control:d.control})),crewLevels:g.crewTurf.crew.map(c=>({id:c.id,level:c.level})),relics:g.crewTurf.relicsCollected,timePreset:g.atmosphere.currentPreset};
    try{localStorage.setItem(KEY+slot,JSON.stringify(p));return true;}catch{return false;}
  }

  readSlot(slot) { try{const r=localStorage.getItem(KEY+slot);return r?JSON.parse(r):null;}catch{return null;} }

  loadSlot(slot, g) {
    const d=this.readSlot(slot);if(!d)return false;
    g.player.cash=d.cash??14850;g.player.hp=d.hp??100;g.player.armor=d.armor??75;
    if(d.pos){if(g.player.vehicle)g.player.exitVehicle();g.player.pos.set(d.pos.x,Math.max(0.25,g.cityWorld.getTerrainHeight(d.pos.x,d.pos.z)),d.pos.z);g.player.rig.root.position.copy(g.player.pos);}
    g.missions.completedIds=new Set(d.completed||[]);g.missions.startMission(d.missionIndex||0,false);g.crewTurf.relicsCollected=d.relics??0;
    if(Array.isArray(d.districts))for(const s of d.districts){const x=g.crewTurf.districts.find(q=>q.id===s.id);if(x)x.control=s.control;}
    if(Array.isArray(d.crewLevels))for(const s of d.crewLevels){const x=g.crewTurf.crew.find(q=>q.id===s.id);if(x)x.level=s.level;}
    if(d.timePreset)g.atmosphere.applyPreset(d.timePreset);
    return true;
  }

  firstPopulatedSlot() { return [1,2,3].find(s=>this.readSlot(s))||null; }
  hasAnySave() { return this.firstPopulatedSlot()!==null; }
}

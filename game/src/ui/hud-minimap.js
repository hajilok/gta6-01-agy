// Cala Solara — Minimal High-Contrast HUD, Organic Minimap, Comms Portraits & Command Hub
import { GARAGE_PAINTS, WEAPON_CATALOG, WORLD_CONFIG } from '../config.js';
import { boulevardZAtX, coastZAtX } from '../world/city-world.js';
import { STORY_CAMPAIGN } from '../systems/missions-story.js';
import { SaveProgressionSystem } from '../systems/save-system.js';

const ROADS=[[-275,-185,-275,115],[-145,-195,-145,130],[-45,-205,-45,125],[45,-205,45,115],[132,-180,132,98],[192,-175,192,68],[-280,-185,195,-185],[-280,-108,195,-108],[-150,-24,195,-24],[-280,48,195,48]];
const $=(id)=>document.getElementById(id),M=Math;
const svgPortrait=(ch,acc)=>`<svg viewBox="0 0 44 44" width="42" height="42" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#142036"/><stop offset="100%" stop-color="${acc}"/></linearGradient></defs><rect width="44" height="44" rx="9" fill="url(#pg)"/><circle cx="22" cy="17" r="7.5" fill="#e2ae86"/><path d="M13 17C13 9,31 9,31 17C29 12,15 12,13 17Z" fill="#18151b"/><rect x="16" y="15" width="12" height="3.2" rx="1.4" fill="#0b1220"/><path d="M9 42C10 31,34 31,35 42Z" fill="#1a2436"/><text x="22" y="40" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffcf6e">${ch}</text></svg>`;

export class HudAndMinimap {
  constructor(game) {
    this.game=game;this.saves=new SaveProgressionSystem();
    this.hubOpen=false;this.hubTab='overview';this.toastTimer=0;this.radioBannerTimer=0;
    this.elHudRoot=$('hud-root');this.elTopLeft=$('hud-top-left');this.elTopRight=$('hud-top-right');
    this.elBottomRight=$('hud-bottom-right');this.elVitals=$('hud-vitals');this.elCrosshair=$('hud-crosshair');
    this.elPrompt=$('hud-prompt');this.elComms=$('hud-comms');this.elRadio=$('hud-radio-banner');
    this.elHub=$('hub-overlay');this.elTitle=$('title-overlay');this.elToast=$('toast-feed');
    this.minimapCanvas=$('minimap-canvas');this.minimapCtx=this.minimapCanvas.getContext('2d');
    this.renderTitleScreen();
  }

  showToast(msg) { this.elToast.innerHTML=`<div class="toast-msg">${msg}</div>`;this.toastTimer=3.4; }
  showRadioBanner(n) { this.elRadio.textContent=`♫ ${n}`;this.elRadio.classList.remove('hidden');this.elRadio.classList.add('glass-pill');this.radioBannerTimer=3.2; }

  renderTitleScreen() {
    const keys=[['WASD','Drive/Move'],['F','Steal/Board'],['LMB/RMB','Fire/Aim'],['SPACE/SHIFT','Drift/Nitro'],['1-5','Weapons'],['Q/C','Crew'],['M','Hub & Save'],['R/T','Radio/Time']];
    this.elTitle.innerHTML=`<div><div class="title-badge">ORIGINAL OPEN-WORLD CRIME • 6 DISTRICTS • HDR 3D</div><div class="title-logo">CALA<br/>SOLARA</div><div class="title-sub">Carve out an empire across a sun-soaked volcanic bay—from Palmera Strip's neon Art-Deco hotels to Puente del Sol's 5-star Air-1 lockdowns.</div><div class="title-actions"><button class="btn-primary" id="btn-play-new">ENTER CALA SOLARA</button>${this.saves.hasAnySave()?'<button class="btn-secondary" id="btn-play-continue">CONTINUE SAVE</button>':''}<button class="btn-secondary" id="btn-cycle-tod">TIME OF DAY</button></div></div><div class="title-footer"><div class="key-row">${keys.map(([k,l])=>`<span class="key-chip"><b>${k}</b> ${l}</span>`).join('')}</div><div>100% Offline Three.js HDR Engine • Camila Vega</div></div>`;
    if($('btn-play-new'))$('btn-play-new').onclick=()=>this.game.startPlay(true);
    if($('btn-play-continue'))$('btn-play-continue').onclick=()=>{const s=this.saves.firstPopulatedSlot();if(s)this.saves.loadSlot(s,this.game);this.game.startPlay(false);};
    if($('btn-cycle-tod'))$('btn-cycle-tod').onclick=()=>this.game.atmosphere.cyclePreset();
  }

  setTitleVisible(v) { this.elTitle.classList.toggle('hidden',!v);this.elHudRoot.classList.toggle('hidden',v||this.hubOpen); }

  toggleHub(force) {
    this.hubOpen=force!==undefined?force:!this.hubOpen;
    this.elHub.classList.toggle('hidden',!this.hubOpen);
    this.elHudRoot.classList.toggle('hidden',this.hubOpen||this.game.mode==='title');
    if(this.hubOpen){if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();this.renderHub();}
  }

  renderHub() {
    const g=this.game,ct=g.crewTurf,ms=g.missions,pl=g.player,ctrl=M.round(ct.districts.reduce((a,d)=>a+d.control,0)/ct.districts.length);
    const tabs=[['overview','Turf'],['missions','Missions'],['crew','Crew'],['garage','Garage'],['saves','Save']];
    let body='';
    if(this.hubTab==='overview'){
      const s1=this.saves.readSlot(1);
      body=`<div class="hub-map-wrap"><canvas id="hub-map-canvas" width="460" height="192"></canvas></div><div class="hub-grid">${ct.districts.map(d=>`<div class="hub-card"><h4><span>${d.name}</span><span style="color:${d.color}">${d.control}%</span></h4><p>Income: $${M.round(d.income*d.control/100)}/cycle</p><div class="hub-bar"><i style="width:${d.control}%;background:${d.color}"></i></div></div>`).join('')}</div><div class="hub-status-strip"><div class="hub-mini"><b>GARAGE RIDE</b><span>Solara GT-R • Lvl ${g.heroCar.turboLevel}</span></div><div class="hub-mini"><b>ACTIVE CREW</b><span>${ct.activeMember.name.split(' ')[0]} • Lvl ${ct.activeMember.level}</span></div><div class="hub-mini"><b>SAVE SLOTS</b><span>${s1?'Slot 1 • '+s1.savedAt:'Auto-Save Ready'}</span></div></div><button class="hub-btn" id="btn-start-race">LAUNCH PALMERA STREET CIRCUIT (3 AI RIVALS — $4,500)</button>`;
    }else if(this.hubTab==='missions'){
      body=`<div class="hub-grid">${STORY_CAMPAIGN.map((m,i)=>`<div class="hub-card" style="${ms.activeMissionIndex===i?'border-color:#ffcf6e':''}"><h4><span>${i+1}. ${m.title}</span><span style="color:${ms.completedIds.has(m.id)?'#75ff9e':'#ffcf6e'}">$${m.reward.toLocaleString()}</span></h4><p>${m.stages[0].label}</p><button class="hub-btn" data-m="${i}">${ms.activeMissionIndex===i?'ACTIVE':'TRACK'}</button></div>`).join('')}</div>`;
    }else if(this.hubTab==='crew'){
      body=`<div class="hub-grid">${ct.crew.map((c,i)=>`<div class="hub-card" style="${i===ct.activeCrewIndex?'border-color:'+c.color:''}"><h4><span>${c.name}</span><span style="color:${c.color}">LVL ${c.level}</span></h4><p>${c.role} — ${c.desc}</p><button class="hub-btn" data-cs="${i}">SET ACTIVE [Q]</button><button class="hub-btn" data-cu="${c.id}">UPGRADE ($${(c.upgradeCost*c.level).toLocaleString()})</button></div>`).join('')}</div>`;
    }else if(this.hubTab==='garage'){
      body=`<div class="hub-card"><h4><span>SOLARA CUSTOMS — PAINT & TUNING</span><span style="color:#75ff9e">$${pl.cash.toLocaleString()}</span></h4><p>Instant respray clears wanted heat, repairs chassis damage, and tunes your ride.</p><div class="swatch-row">${GARAGE_PAINTS.map(p=>`<button class="swatch" title="${p.name}" data-p="${p.hex}" style="background:${p.css}"></button>`).join('')}</div><div class="hub-grid" style="margin-top:10px"><button class="hub-btn" id="btn-gar-rep">REPAIR & CLEAR HEAT ($500)</button><button class="hub-btn" id="btn-gar-tb">TWIN-TURBO TUNE ($1,800)</button></div></div>`;
    }else{
      body=`<div style="display:flex;flex-direction:column;gap:9px">${[1,2,3].map(sl=>{const d=this.saves.readSlot(sl);return`<div class="hub-card"><h4><span>SAVE SLOT ${sl}</span><span style="color:#8ef2ff">${d?d.savedAt:'EMPTY'}</span></h4><p>${d?`Cash: $${Number(d.cash).toLocaleString()} • Missions: ${(d.completed||[]).length}/8 • Relics: ${d.relics||0}/12`:'No saved progress.'}</p><div class="hub-grid"><button class="hub-btn" data-sv="${sl}">SAVE SLOT ${sl}</button><button class="hub-btn" data-ld="${sl}" ${d?'':'disabled style="opacity:.4"'}>LOAD SLOT ${sl}</button></div></div>`;}).join('')}</div>`;
    }
    this.elHub.innerHTML=`<div class="hub-head"><div><div class="hub-title">CALA SOLARA COMMAND HUB</div><div style="font-size:11px;color:#8ef2ff;font-weight:800;letter-spacing:.9px">CONTROL ${ctrl}% • $${pl.cash.toLocaleString()} • MISSIONS ${ms.completedIds.size}/8 • RELICS ${ct.relicsCollected}/${ct.relics.length}</div></div><button class="hub-tab" id="btn-hub-close">CLOSE [M]</button></div><div class="hub-tabs">${tabs.map(([id,lb])=>`<button class="hub-tab ${this.hubTab===id?'active':''}" data-tab="${id}">${lb}</button>`).join('')}</div>${body}`;
    $('btn-hub-close').onclick=()=>this.toggleHub(false);
    const bind=(sel,fn)=>this.elHub.querySelectorAll(sel).forEach(b=>{b.onclick=()=>fn(b);});
    bind('[data-tab]',b=>{this.hubTab=b.dataset.tab;this.renderHub();});
    bind('[data-m]',b=>{ms.startMission(+b.dataset.m,false);this.toggleHub(false);});
    bind('[data-cs]',b=>{ct.activeCrewIndex=+b.dataset.cs;this.renderHub();});
    bind('[data-cu]',b=>{this.showToast(ct.upgradeCrew(b.dataset.cu,pl)?'CREW UPGRADED!':'Insufficient cash');this.renderHub();});
    bind('[data-p]',b=>{const v=pl.vehicle||pl.findNearestVehicle(24);if(v){g.vehicleSystem.setPaint(v,+b.dataset.p);g.policeSystem.clearHeat();this.showToast('SOLARA CUSTOMS RESPRAY!');}});
    bind('[data-sv]',b=>{this.saves.saveSlot(+b.dataset.sv,g);this.showToast(`SAVED SLOT ${b.dataset.sv}`);this.renderHub();});
    bind('[data-ld]',b=>{if(this.saves.loadSlot(+b.dataset.ld,g)){this.showToast(`LOADED SLOT ${b.dataset.ld}`);this.toggleHub(false);}});
    if($('btn-start-race'))$('btn-start-race').onclick=()=>{this.toggleHub(false);ct.startStreetRace(pl,t=>this.showToast(t));};
    if($('btn-gar-rep'))$('btn-gar-rep').onclick=()=>{const v=pl.vehicle||pl.findNearestVehicle(24);if(v&&pl.cash>=500){pl.cash-=500;g.vehicleSystem.repairVehicle(v);g.policeSystem.clearHeat();this.showToast('REPAIRED & HEAT CLEARED');this.renderHub();}};
    if($('btn-gar-tb'))$('btn-gar-tb').onclick=()=>{const v=pl.vehicle||pl.findNearestVehicle(24);if(v&&pl.cash>=1800){pl.cash-=1800;v.turboLevel=M.min(4,v.turboLevel+1);this.showToast(`TWIN-TURBO LEVEL ${v.turboLevel}!`);this.renderHub();}};
    if(this.hubTab==='overview')this.drawOverviewMap();
  }

  _drawMapBase(c, W, H, pt, islR, bSc, rdW) {
    c.fillStyle='#0c2944';c.fillRect(0,0,W,H);
    for(const[col,off]of[['#16728a',16],['#233445',-1]]){
      c.fillStyle=col;c.beginPath();let p=pt(-360,-250);c.moveTo(p.x,p.y);
      p=pt(212+off,-250);c.lineTo(p.x,p.y);p=pt(212+off,112+off);c.lineTo(p.x,p.y);
      for(let x=200;x>=-360;x-=24){p=pt(x,coastZAtX(x)+off);c.lineTo(p.x,p.y);}c.closePath();c.fill();
    }
    c.strokeStyle='#e4c78f';c.lineWidth=4;c.beginPath();
    for(let x=-330;x<=145;x+=20){const q=pt(x,coastZAtX(x)-5);x===-330?c.moveTo(q.x,q.y):c.lineTo(q.x,q.y);}c.stroke();
    const isl=pt(398,145);c.fillStyle='#2b414d';c.beginPath();c.arc(isl.x,isl.y,islR,0,6.283);c.fill();
    c.strokeStyle='#56687c';c.lineWidth=rdW;c.beginPath();
    for(let x=-300;x<=128;x+=18){const q=pt(x,boulevardZAtX(x));x===-300?c.moveTo(q.x,q.y):c.lineTo(q.x,q.y);}c.stroke();
    c.lineWidth=rdW*0.72;ROADS.forEach(([a,b,d,e])=>{const p=pt(a,b),q=pt(d,e);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();});
    const bs=pt(WORLD_CONFIG.bridgeStart.x,WORLD_CONFIG.bridgeStart.z),be=pt(WORLD_CONFIG.bridgeEnd.x,WORLD_CONFIG.bridgeEnd.z);
    c.strokeStyle='#ff6b5c';c.lineWidth=rdW+0.8;c.beginPath();c.moveTo(bs.x,bs.y);c.lineTo(be.x,be.y);c.stroke();
    for(const bf of this.game.cityWorld.buildingFootprints){const q=pt(bf.x,bf.z),bw=bSc?M.max(4,bf.w*bSc):6,bd=bSc?M.max(4,bf.d*bSc):6;c.fillStyle=bf.color+'80';c.fillRect(q.x-bw*0.5,q.y-bd*0.5,bw,bd);}
  }

  drawOverviewMap() {
    const cv=$('hub-map-canvas');if(!cv)return;
    const c=cv.getContext('2d'),W=cv.width,H=cv.height,pt=(x,z)=>({x:((x+360)/860)*W,y:((z+260)/510)*H});
    this._drawMapBase(c,W,H,pt,54,0,2.8);c.strokeStyle='#a6825c';c.lineWidth=2.4;
    for(const pz of[-10,22,54]){const a=pt(210,pz),b=pt(246,pz);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
    for(const d of this.game.crewTurf.districts){
      const q=pt(d.center.x,d.center.z);c.fillStyle=d.color+'2c';c.strokeStyle=d.color;c.lineWidth=1.4;c.beginPath();c.arc(q.x,q.y,22,0,6.283);c.fill();c.stroke();
      c.fillStyle='#fff';c.font='800 8.5px "Segoe UI",sans-serif';c.textAlign='center';c.fillText(d.name.split(' ')[0].toUpperCase(),q.x,q.y+3);
    }
    const pin=(wx,wz,col,ch)=>{const p=pt(wx,wz);c.fillStyle=col;c.beginPath();c.arc(p.x,p.y,6.5,0,6.283);c.fill();c.fillStyle='#09101c';c.font='900 8px sans-serif';c.textAlign='center';c.fillText(ch,p.x,p.y+3);};
    pin(154,14,'#00e6ff','G');pin(this.game.missions.currentStage.pos.x,this.game.missions.currentStage.pos.z,'#ffcf40','★');
    pin(-165,boulevardZAtX(-165),'#ff5a87','R');pin(this.game.player.pos.x,this.game.player.pos.z,'#75ff9e','●');
  }

  drawMinimap() {
    const c=this.minimapCtx,W=this.minimapCanvas.width,H=this.minimapCanvas.height,g=this.game,p=g.player,sc=0.44;
    const toM=(wx,wz)=>({x:W*0.5+(wx-p.pos.x)*sc,y:H*0.5+(wz-p.pos.z)*sc});
    this._drawMapBase(c,W,H,toM,124*sc,sc,4.8);
    const gl=toM(g.missions.currentStage.pos.x,g.missions.currentStage.pos.z);
    c.strokeStyle='#ff4fd8';c.lineWidth=3.2;c.setLineDash([6,4]);c.beginPath();c.moveTo(W*0.5,H*0.5);c.lineTo(gl.x,gl.y);c.stroke();c.setLineDash([]);
    c.fillStyle='#ffcf40';c.beginPath();c.arc(M.max(10,M.min(W-10,gl.x)),M.max(10,M.min(H-10,gl.y)),5.5,0,6.283);c.fill();c.strokeStyle='#09101c';c.lineWidth=1.8;c.stroke();
    const fl=M.sin(performance.now()*0.012)>0;
    for(const u of g.policeSystem.units){
      if(u.vehicle.destroyed)continue;const up=toM(u.vehicle.pos.x,u.vehicle.pos.z);if(up.x<-30||up.x>W+30||up.y<-30||up.y>H+30)continue;
      if(g.policeSystem.wantedLevel>0){const a=M.atan2(M.cos(u.vehicle.yaw),M.sin(u.vehicle.yaw));c.fillStyle=fl?'rgba(255,60,90,.22)':'rgba(55,165,255,.22)';c.beginPath();c.moveTo(up.x,up.y);c.arc(up.x,up.y,26,a-0.5,a+0.5);c.closePath();c.fill();}
      c.fillStyle=fl?'#ff3858':'#33a3ff';c.beginPath();c.arc(up.x,up.y,4,0,6.283);c.fill();
    }
    for(const h of g.missions.hostiles)if(h.alive){const hp=toM(h.pos.x,h.pos.z);c.fillStyle='#ff5252';c.beginPath();c.arc(hp.x,hp.y,3.2,0,6.283);c.fill();}
    if(g.crewTurf.ally){const ap=toM(g.crewTurf.ally.pos.x,g.crewTurf.ally.pos.z);c.fillStyle='#48f59b';c.beginPath();c.arc(ap.x,ap.y,4.2,0,6.283);c.fill();}
    c.save();c.translate(W*0.5,H*0.5);c.rotate(-p.yaw+M.PI);c.fillStyle='#fff';c.strokeStyle='#09101c';c.lineWidth=1.6;
    c.beginPath();c.moveTo(0,-7);c.lineTo(5.5,6);c.lineTo(0,3);c.lineTo(-5.5,6);c.closePath();c.fill();c.stroke();c.restore();
  }

  update(dt) {
    const g=this.game,p=g.player,w=p.currentWeapon,am=p.ammo[p.weaponIndex],dist=g.crewTurf.getDistrictAt(p.pos.x,p.pos.z),stN=g.policeSystem.wantedLevel,fb=M.sin(performance.now()*0.014)>0,st=g.audio.currentStation;
    if(this.toastTimer>0&&(this.toastTimer-=dt)<=0)this.elToast.innerHTML='';
    if(this.radioBannerTimer>0&&(this.radioBannerTimer-=dt)<=0)this.elRadio.classList.add('hidden');
    this.elTopLeft.innerHTML=`<div class="glass-pill mission-bar"><div class="mission-tag">MISSION • ${g.missions.currentMission.title}</div><div class="mission-obj">${g.missions.getObjectiveText()}</div></div><div class="sub-row"><div class="glass-pill district-pill">${dist.name} • ${g.atmosphere.currentPreset.toUpperCase()}</div>${p.vehicle&&st.style!=='off'?`<div class="glass-pill radio-pill">♫ ${st.name}</div>`:''}</div>`;
    let sh='';for(let i=1;i<=5;i++)sh+=`<span class="${i<=stN?(fb&&i%2===0?'star-blue':'star-on'):'star-off'}">★</span>`;
    const pips=WEAPON_CATALOG.map((wp,i)=>`<span class="wp-pip ${i===p.weaponIndex?'on':''}">${wp.slot}</span>`).join('');
    this.elTopRight.innerHTML=`${stN>0?`<div class="glass-pill wanted-row"><div class="wanted-stars">${sh}</div><div class="wanted-label">${g.policeSystem.getTier().code}</div></div>`:''}<div class="glass-pill stats-strip"><div class="cash-val">$${p.cash.toLocaleString()}</div><div class="weapon-badge"><div class="wp-pips">${pips}</div><span>${w.name.toUpperCase()}</span><span class="weapon-ammo">${am.mag}/${am.reserve}</span></div></div>${g.policeSystem.dispatchTimer>0&&g.policeSystem.dispatchBanner?`<div class="dispatch-alert">${g.policeSystem.dispatchBanner}</div>`:''}`;
    this.elVitals.innerHTML=[['HP','v-hp',p.hp],['ARM','v-arm',p.armor],['NOS','v-nos',p.vehicle?p.vehicle.nitro:100]].map(([l,c,v])=>`<div class="vcol"><span>${l}</span><div class="vbar ${c}"><i style="width:${M.max(0,v)}%"></i></div></div>`).join('');
    this.drawMinimap();
    const cr=g.crewTurf.activeMember,mph=p.vehicle?M.round(p.vehicle.speed*2.35):0;
    this.elBottomRight.innerHTML=`${p.vehicle?`<div class="glass-pill speedo-card"><div class="speed-num">${mph}</div><div class="speed-meta">MPH<br/>${p.vehicle.spec.name}</div></div>`:''}<div class="glass-pill crew-card"><span class="crew-dot" style="background:${cr.cdLeft<=0?'#48f59b':'#ffae42'}"></span><span>${cr.name.split(' ')[0].toUpperCase()} • ${cr.cdLeft<=0?'READY':M.ceil(cr.cdLeft)+'s'}</span><span class="crew-key">[Q]</span></div>`;
    this.elCrosshair.classList.toggle('hidden',!!p.vehicle||this.hubOpen);
    const nr=!p.vehicle&&!this.hubOpen?p.findNearestVehicle(6.2):null;
    if(nr){this.elPrompt.textContent=`[F] STEAL ${nr.spec.name.toUpperCase()}`;this.elPrompt.classList.remove('hidden');}else this.elPrompt.classList.add('hidden');
    if(g.missions.commsTimer>0&&g.missions.activeComms&&!this.hubOpen){
      const cm=g.missions.activeComms;this.elComms.innerHTML=`<div class="comms-avatar">${svgPortrait(cm.initials,cm.color)}</div><div><div class="comms-speaker">${cm.speaker}</div><div class="comms-text">${cm.text}</div></div>`;this.elComms.classList.remove('hidden');
    }else this.elComms.classList.add('hidden');
  }
}

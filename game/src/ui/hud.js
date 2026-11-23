// Cala Solara — Live HUD Controller (Wanted Stars, Dispatch, Vitals, Crosshair, Speedo & Comms)
import { WEAPON_CATALOG } from '../config.js';
import { TacticalMinimapRenderer } from './minimap.js';

export class HudController {
  constructor(g){const $=k=>document.getElementById(k);Object.assign(this,{game:g,toastTimer:0,radioBannerTimer:0,r:$('hud-root'),tl:$('hud-mission-panel'),tr:$('hud-wanted-panel'),br:$('hud-speedo-panel'),vt:$('hud-vitals-grid'),xh:$('tactical-crosshair'),pr:$('interact-prompt'),cm:$('story-comms-panel'),rb:$('radio-banner'),ts:$('toast-banner'),minimap:new TacticalMinimapRenderer(g,$('tactical-minimap'))});}
  setHudVisible(v){this.r.classList.toggle('hidden',!v);}
  showToast(m){this.ts.innerHTML=`<div class="tm">${m}</div>`;this.toastTimer=3.4;}
  showRadioBanner(n){this.rb.textContent='♫ '+n;this.rb.classList.remove('hidden');this.rb.classList.add('p');this.radioBannerTimer=3.2;}
  update(dt,hub=false){
    const t=this,g=t.game,p=g.player,w=p.currentWeapon,am=p.ammo[p.weaponIndex],ps=g.policeSystem,ms=g.missions,d=g.turfActivities.getDistrictAt(p.pos.x,p.pos.z),sn=ps.wantedLevel,fb=Math.sin(performance.now()*.014)>0,st=g.radio.currentStation;
    if(t.toastTimer>0&&(t.toastTimer-=dt)<=0)t.ts.innerHTML='';if(t.radioBannerTimer>0&&(t.radioBannerTimer-=dt)<=0)t.rb.classList.add('hidden');
    t.tl.innerHTML=P('mb',`<div class="mt">MISSION ${ms.activeMissionIndex+1}/9 • ${ms.currentMission.title}</div><div class="mo">${ms.getObjectiveText()}</div>`)+`<div class="sr">${P('dp',`${d.name} • ${g.atmosphere.currentPreset.toUpperCase()}`)}${p.vehicle&&st.style!=='off'?P('rp','♫ '+st.name):''}</div>`;
    let sh='';for(let i=1;i<=5;i++)sh+=`<span class="${i<=sn?(fb&&!(i%2)?'sb':'so'):'sf'}">★</span>`;
    const pp=WEAPON_CATALOG.map((q,i)=>`<span class="pi ${i===p.weaponIndex?'on':''}">${q.slot}</span>`).join('');
    t.tr.innerHTML=(sn?P('wr',`<div class="ws">${sh}</div><div class="wl">${ps.getTier().code}</div>`):'')+P('ss',`<div class="cv">$${p.cash.toLocaleString()}</div><div class="wb"><div class="wp">${pp}</div><span>${w.name.toUpperCase()}</span><span class="wa">${am.mag}/${am.reserve}</span></div>`)+(ps.dispatchTimer>0&&ps.dispatchBanner?`<div class="da">${ps.dispatchBanner}</div>`:'');
    t.vt.innerHTML=[['HP','vh',p.hp],['ARM','va',p.armor],['NOS','vn',p.vehicle?p.vehicle.nitro:100]].map(([l,c,v])=>`<div class="vc"><span>${l}</span><div class="vb ${c}"><i style="width:${Math.max(0,v)}%"></i></div></div>`).join('');
    t.minimap.renderLiveMinimap();
    const cr=g.crewSystem.activeMember,mph=p.vehicle?Math.round(p.vehicle.speed*2.35):0;
    t.br.innerHTML=(p.vehicle?P('sc',`<div class="sn">${mph}</div><div class="sm">MPH<br/>${p.vehicle.spec.name}</div>`):'')+P('cc',`<span class="cd" style="background:${cr.cdLeft<=0?'#48f59b':'#ffae42'}"></span><span>${cr.name.split(' ')[0].toUpperCase()} • ${cr.cdLeft<=0?'READY':Math.ceil(cr.cdLeft)+'s'}</span><span class="ck">[Q]</span>`);
    t.xh.classList.toggle('hidden',!!p.vehicle||hub);t.xh.classList.toggle('hit',g.combatSystem.hitMarkerTimer>0);
    const nr=!p.vehicle&&!hub?p.findNearestVehicle(6.8):null;
    if(nr){t.pr.textContent=`[F] STEAL ${nr.spec.name.toUpperCase()}`;t.pr.classList.remove('hidden');}else t.pr.classList.add('hidden');
    if(ms.commsTimer>0&&ms.activeComms&&!hub){const cm=ms.activeComms;t.cm.innerHTML=`<div class="ca">${ava(cm.initials,cm.color)}</div><div><div class="cs">${cm.speaker}</div><div class="ct">${cm.text}</div></div>`;t.cm.classList.remove('hidden');}else t.cm.classList.add('hidden');
  }
}
function P(c,h){return`<div class="p ${c}">${h}</div>`;}
function ava(ch,ac){return`<svg viewBox="0 0 44 44" width="44" height="44"><rect width="44" height="44" rx="9" fill="${ac}"/><circle cx="22" cy="17" r="7.5" fill="#e2ae86"/><path d="M13 17C13 9 31 9 31 17C29 12 15 12 13 17Z" fill="#18151b"/><rect x="16" y="15" width="12" height="3.2" rx="1.4" fill="#0b1220"/><path d="M9 42C10 31 34 31 35 42Z" fill="#1a2436"/><text x="22" y="40" text-anchor="middle" font-size="8" font-weight="900" fill="#ffcf6e">${ch}</text></svg>`;}

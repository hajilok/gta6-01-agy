// Cala Solara — Minimal High-Contrast HUD, Organic Curved-Coastline Minimap, Command Hub & 3-Slot Save System

import { GARAGE_PAINTS, WORLD_CONFIG } from '../config.js';
import { boulevardZAtX, coastZAtX } from '../world/city-world.js';
import { STORY_CAMPAIGN } from '../systems/missions-story.js';

const SAVE_PREFIX = 'cala_solara_slot_';

export class SaveProgressionSystem {
  saveSlot(slotIndex, game) {
    const payload = {
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cash: game.player.cash,
      hp: game.player.hp,
      armor: game.player.armor,
      pos: { x: game.player.pos.x, z: game.player.pos.z },
      missionIndex: game.missions.activeMissionIndex,
      completed: [...game.missions.completedIds],
      districts: game.crewTurf.districts.map((d) => ({ id: d.id, control: d.control })),
      crewLevels: game.crewTurf.crew.map((c) => ({ id: c.id, level: c.level })),
      relics: game.crewTurf.relicsCollected,
      timePreset: game.atmosphere.currentPreset,
    };
    try {
      localStorage.setItem(`${SAVE_PREFIX}${slotIndex}`, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  readSlot(slotIndex) {
    try {
      const raw = localStorage.getItem(`${SAVE_PREFIX}${slotIndex}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  loadSlot(slotIndex, game) {
    const data = this.readSlot(slotIndex);
    if (!data) return false;
    game.player.cash = data.cash ?? 14850;
    game.player.hp = data.hp ?? 100;
    game.player.armor = data.armor ?? 75;
    if (data.pos) {
      if (game.player.vehicle) game.player.exitVehicle();
      game.player.pos.set(data.pos.x, game.cityWorld.getTerrainHeight(data.pos.x, data.pos.z), data.pos.z);
    }
    game.missions.completedIds = new Set(data.completed || []);
    game.missions.startMission(data.missionIndex || 0, false);
    if (Array.isArray(data.districts)) {
      for (const sd of data.districts) {
        const d = game.crewTurf.districts.find((x) => x.id === sd.id);
        if (d) d.control = sd.control;
      }
    }
    if (Array.isArray(data.crewLevels)) {
      for (const sc of data.crewLevels) {
        const c = game.crewTurf.crew.find((x) => x.id === sc.id);
        if (c) c.level = sc.level;
      }
    }
    if (data.timePreset) game.atmosphere.applyPreset(data.timePreset);
    return true;
  }

  hasAnySave() {
    return !!(this.readSlot(1) || this.readSlot(2) || this.readSlot(3));
  }
}

export class HudAndMinimap {
  constructor(game) {
    this.game = game;
    this.saves = new SaveProgressionSystem();
    this.hubOpen = false;
    this.hubTab = 'overview';
    this.toastTimer = 0;

    this.elHudRoot = document.getElementById('hud-root');
    this.elTopLeft = document.getElementById('hud-top-left');
    this.elTopRight = document.getElementById('hud-top-right');
    this.elBottomRight = document.getElementById('hud-bottom-right');
    this.elVitals = document.getElementById('hud-vitals');
    this.elCrosshair = document.getElementById('hud-crosshair');
    this.elPrompt = document.getElementById('hud-prompt');
    this.elComms = document.getElementById('hud-comms');
    this.elRadio = document.getElementById('hud-radio-banner');
    this.elHub = document.getElementById('hub-overlay');
    this.elTitle = document.getElementById('title-overlay');
    this.elToast = document.getElementById('toast-feed');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.radioBannerTimer = 0;

    this.renderTitleScreen();
  }

  showToast(msg) {
    const div = document.createElement('div');
    div.className = 'toast-msg';
    div.textContent = msg;
    this.elToast.innerHTML = '';
    this.elToast.appendChild(div);
    this.toastTimer = 3.4;
  }

  showRadioBanner(stationName) {
    this.elRadio.textContent = `♫ ${stationName}`;
    this.elRadio.classList.remove('hidden');
    this.elRadio.classList.add('glass-pill');
    this.radioBannerTimer = 3.2;
  }

  renderTitleScreen() {
    const hasSave = this.saves.hasAnySave();
    this.elTitle.innerHTML = `
      <div>
        <div class="title-badge">ORIGINAL OPEN-WORLD CRIME • 6 DISTRICTS • HDR 3D</div>
        <div class="title-logo">CALA<br/>SOLARA</div>
        <div class="title-sub">
          Carve out an empire across a sun-soaked volcanic bay—from Palmera Strip's neon Art-Deco hotels to Puente del Sol's 5-star Air-1 lockdowns.
        </div>
        <div class="title-actions">
          <button class="btn-primary" id="btn-play-new">ENTER CALA SOLARA</button>
          ${hasSave ? '<button class="btn-secondary" id="btn-play-continue">CONTINUE SAVE</button>' : ''}
          <button class="btn-secondary" id="btn-cycle-tod">TIME OF DAY</button>
        </div>
      </div>
      <div class="title-footer">
        <div class="key-row">
          <span class="key-chip"><b>WASD</b> Drive / Move</span>
          <span class="key-chip"><b>F</b> Steal / Board</span>
          <span class="key-chip"><b>LMB / RMB</b> Fire / Aim</span>
          <span class="key-chip"><b>SPACE / SHIFT</b> Drift / Nitro</span>
          <span class="key-chip"><b>1-5</b> Weapons</span>
          <span class="key-chip"><b>Q / C</b> Crew Ability</span>
          <span class="key-chip"><b>M</b> Command Hub & Save</span>
          <span class="key-chip"><b>R / T</b> Radio / Time</span>
        </div>
        <div>100% Offline Three.js HDR Engine • Camila Vega</div>
      </div>
    `;
    const btnPlay = document.getElementById('btn-play-new');
    if (btnPlay) btnPlay.onclick = () => this.game.startPlay(true);
    const btnCont = document.getElementById('btn-play-continue');
    if (btnCont) btnCont.onclick = () => {
      const slot = [1, 2, 3].find((s) => this.saves.readSlot(s));
      if (slot) this.saves.loadSlot(slot, this.game);
      this.game.startPlay(false);
    };
    const btnTod = document.getElementById('btn-cycle-tod');
    if (btnTod) btnTod.onclick = () => this.game.atmosphere.cyclePreset();
  }

  setTitleVisible(visible) {
    this.elTitle.classList.toggle('hidden', !visible);
    this.elHudRoot.classList.toggle('hidden', visible);
  }

  toggleHub(forceState) {
    this.hubOpen = forceState !== undefined ? forceState : !this.hubOpen;
    this.elHub.classList.toggle('hidden', !this.hubOpen);
    this.elHudRoot.classList.toggle('hidden', this.hubOpen || this.game.mode === 'title');
    if (this.hubOpen) {
      if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
      this.renderHub();
    }
  }

  renderHub() {
    const g = this.game;
    const totalControl = Math.round(g.crewTurf.districts.reduce((a, d) => a + d.control, 0) / g.crewTurf.districts.length);
    const tabs = [
      ['overview', 'Turf'],
      ['missions', 'Missions'],
      ['crew', 'Crew'],
      ['garage', 'Garage'],
      ['saves', 'Save'],
    ];

    let bodyHtml = '';
    if (this.hubTab === 'overview') {
      bodyHtml = `
        <div class="hub-map-wrap"><canvas id="hub-map-canvas" width="440" height="170"></canvas></div>
        <div class="hub-grid">
          ${g.crewTurf.districts.map((d) => `
            <div class="hub-card">
              <h4><span>${d.name}</span><span style="color:${d.color}">${d.control}%</span></h4>
              <p>Passive cut: $${Math.round(d.income * d.control / 100)}/cycle</p>
              <div class="hub-bar"><i style="width:${d.control}%;background:${d.color}"></i></div>
            </div>
          `).join('')}
        </div>
        <button class="hub-btn" id="btn-start-race">LAUNCH PALMERA STREET CIRCUIT (3 AI RIVALS — $4,500)</button>
      `;
    } else if (this.hubTab === 'missions') {
      bodyHtml = `<div class="hub-grid">` + STORY_CAMPAIGN.map((m, idx) => {
        const done = g.missions.completedIds.has(m.id);
        const active = g.missions.activeMissionIndex === idx;
        return `
          <div class="hub-card" style="${active ? 'border-color:#ffcf6e;' : ''}">
            <h4><span>${idx + 1}. ${m.title}</span><span style="color:${done ? '#75ff9e' : '#ffcf6e'}">$${m.reward.toLocaleString()}</span></h4>
            <p>${m.stages[0].label}</p>
            <button class="hub-btn" data-mission="${idx}">${active ? 'ACTIVE' : (done ? 'REPLAY' : 'TRACK')}</button>
          </div>
        `;
      }).join('') + `</div>`;
    } else if (this.hubTab === 'crew') {
      bodyHtml = `<div class="hub-grid">` + g.crewTurf.crew.map((c, idx) => {
        const cost = c.upgradeCost * c.level;
        return `
          <div class="hub-card" style="${idx === g.crewTurf.activeCrewIndex ? 'border-color:' + c.color : ''}">
            <h4><span>${c.name}</span><span style="color:${c.color}">LVL ${c.level}</span></h4>
            <p>${c.role} — ${c.desc}</p>
            <button class="hub-btn" data-crew-select="${idx}">SET ACTIVE [Q]</button>
            <button class="hub-btn" data-crew-up="${c.id}">UPGRADE ($${cost.toLocaleString()})</button>
          </div>
        `;
      }).join('') + `</div>`;
    } else if (this.hubTab === 'garage') {
      bodyHtml = `
        <div class="hub-card">
          <h4><span>SOLARA CUSTOMS — PAINT & PERFORMANCE</span><span style="color:#75ff9e">$${g.player.cash.toLocaleString()}</span></h4>
          <p>Instant respray clears wanted heat, repairs chassis damage, and customizes your personal ride.</p>
          <div class="swatch-row">
            ${GARAGE_PAINTS.map((p) => `<button class="swatch" title="${p.name}" data-paint="${p.hex}" style="background:${p.css}"></button>`).join('')}
          </div>
          <div class="hub-grid" style="margin-top:10px;">
            <button class="hub-btn" id="btn-gar-repair">REPAIR & CLEAR HEAT ($500)</button>
            <button class="hub-btn" id="btn-gar-turbo">TWIN-TURBO TUNE ($1,800)</button>
          </div>
        </div>
      `;
    } else if (this.hubTab === 'saves') {
      bodyHtml = `<div style="display:flex;flex-direction:column;gap:10px;">` + [1, 2, 3].map((slot) => {
        const data = this.saves.readSlot(slot);
        return `
          <div class="hub-card">
            <h4><span>SAVE SLOT ${slot}</span><span style="color:#8ef2ff">${data ? data.savedAt : 'EMPTY'}</span></h4>
            <p>${data ? `Cash: $${Number(data.cash).toLocaleString()} • Missions: ${(data.completed || []).length}/8 • Relics: ${data.relics || 0}/12` : 'No saved progress in this slot.'}</p>
            <div class="hub-grid">
              <button class="hub-btn" data-save="${slot}">SAVE SLOT ${slot}</button>
              <button class="hub-btn" data-load="${slot}" ${data ? '' : 'disabled style="opacity:.4"'}>LOAD SLOT ${slot}</button>
            </div>
          </div>
        `;
      }).join('') + `</div>`;
    }

    this.elHub.innerHTML = `
      <div class="hub-head">
        <div>
          <div class="hub-title">CALA SOLARA COMMAND HUB</div>
          <div style="font-size:11px;color:#8ef2ff;font-weight:800;letter-spacing:1px;">
            EMPIRE CONTROL ${totalControl}% • $${g.player.cash.toLocaleString()} • RELICS ${g.crewTurf.relicsCollected}/${g.crewTurf.relics.length}
          </div>
        </div>
        <button class="hub-tab" id="btn-hub-close">CLOSE [M]</button>
      </div>
      <div class="hub-tabs">
        ${tabs.map(([id, label]) => `<button class="hub-tab ${this.hubTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}
      </div>
      ${bodyHtml}
    `;

    // Bind interactive Hub buttons
    document.getElementById('btn-hub-close').onclick = () => this.toggleHub(false);
    this.elHub.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.onclick = () => { this.hubTab = btn.dataset.tab; this.renderHub(); };
    });
    const raceBtn = document.getElementById('btn-start-race');
    if (raceBtn) raceBtn.onclick = () => { this.toggleHub(false); g.crewTurf.startStreetRace(g.player, (t) => this.showToast(t)); };

    this.elHub.querySelectorAll('[data-mission]').forEach((btn) => {
      btn.onclick = () => { g.missions.startMission(Number(btn.dataset.mission), false); this.toggleHub(false); };
    });
    this.elHub.querySelectorAll('[data-crew-select]').forEach((btn) => {
      btn.onclick = () => { g.crewTurf.activeCrewIndex = Number(btn.dataset.crewSelect); this.renderHub(); };
    });
    this.elHub.querySelectorAll('[data-crew-up]').forEach((btn) => {
      btn.onclick = () => {
        if (g.crewTurf.upgradeCrew(btn.dataset.crewUp, g.player)) this.showToast('CREW UPGRADED!');
        else this.showToast('Insufficient cash');
        this.renderHub();
      };
    });
    this.elHub.querySelectorAll('[data-paint]').forEach((btn) => {
      btn.onclick = () => {
        const v = g.player.vehicle || g.player.findNearestVehicle(24);
        if (v) {
          g.vehicleSystem.setPaint(v, Number(btn.dataset.paint));
          g.policeSystem.clearHeat();
          this.showToast('SOLARA CUSTOMS RESPRAY — HEAT CLEARED!');
        }
      };
    });
    const repBtn = document.getElementById('btn-gar-repair');
    if (repBtn) repBtn.onclick = () => {
      const v = g.player.vehicle || g.player.findNearestVehicle(24);
      if (v && g.player.cash >= 500) {
        g.player.cash -= 500;
        g.vehicleSystem.repairVehicle(v);
        g.policeSystem.clearHeat();
        this.showToast('VEHICLE REPAIRED & WANTED HEAT CLEARED');
        this.renderHub();
      }
    };
    const turboBtn = document.getElementById('btn-gar-turbo');
    if (turboBtn) turboBtn.onclick = () => {
      const v = g.player.vehicle || g.player.findNearestVehicle(24);
      if (v && g.player.cash >= 1800) {
        g.player.cash -= 1800;
        v.turboLevel = Math.min(4, v.turboLevel + 1);
        this.showToast(`TWIN-TURBO LEVEL ${v.turboLevel} INSTALLED!`);
        this.renderHub();
      }
    };
    this.elHub.querySelectorAll('[data-save]').forEach((btn) => {
      btn.onclick = () => { this.saves.saveSlot(Number(btn.dataset.save), g); this.showToast(`SAVED TO SLOT ${btn.dataset.save}`); this.renderHub(); };
    });
    this.elHub.querySelectorAll('[data-load]').forEach((btn) => {
      btn.onclick = () => { if (this.saves.loadSlot(Number(btn.dataset.load), g)) { this.showToast(`LOADED SLOT ${btn.dataset.load}`); this.toggleHub(false); } };
    });

    if (this.hubTab === 'overview') this.drawOverviewMap();
  }

  drawOverviewMap() {
    const canvas = document.getElementById('hub-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const toX = (wx) => ((wx + 360) / 860) * W;
    const toY = (wz) => ((wz + 260) / 510) * H;

    // Deep coastal bay water
    ctx.fillStyle = '#0c2942';
    ctx.fillRect(0, 0, W, H);

    // Organic peninsula coastline shape extending cleanly to top/left map borders
    ctx.fillStyle = '#25384a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(toX(212), 0);
    ctx.lineTo(toX(212), toY(112));
    for (let x = 200; x >= -360; x -= 20) ctx.lineTo(toX(x), toY(coastZAtX(x)));
    ctx.lineTo(0, toY(coastZAtX(-360)));
    ctx.closePath();
    ctx.fill();

    // Golden beach strip
    ctx.strokeStyle = '#e8cfa0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = -320; x <= 145; x += 20) {
      if (x === -320) ctx.moveTo(toX(x), toY(coastZAtX(x) - 4));
      else ctx.lineTo(toX(x), toY(coastZAtX(x) - 4));
    }
    ctx.stroke();

    // Monte Faro volcanic island
    ctx.fillStyle = '#2e444f';
    ctx.beginPath();
    ctx.arc(toX(398), toY(145), 54, 0, Math.PI * 2);
    ctx.fill();

    // Puente del Sol suspension bridge
    ctx.strokeStyle = '#ff6b5c';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(toX(WORLD_CONFIG.bridgeStart.x), toY(WORLD_CONFIG.bridgeStart.z));
    ctx.lineTo(toX(WORLD_CONFIG.bridgeEnd.x), toY(WORLD_CONFIG.bridgeEnd.z));
    ctx.stroke();

    // District territory rings & labels
    for (const d of this.game.crewTurf.districts) {
      const cx = toX(d.center.x);
      const cy = toY(d.center.z);
      ctx.fillStyle = d.color + '33';
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.name.split(' ')[0].toUpperCase(), cx, cy + 3);
    }

    // Player marker
    const px = toX(this.game.player.pos.x);
    const py = toY(this.game.player.pos.z);
    ctx.fillStyle = '#ffcf6e';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMinimap() {
    const ctx = this.minimapCtx;
    const W = this.minimapCanvas.width;
    const H = this.minimapCanvas.height;
    const g = this.game;
    const p = g.player;
    const scale = 0.44;

    const toM = (wx, wz) => ({
      x: W * 0.5 + (wx - p.pos.x) * scale,
      y: H * 0.5 + (wz - p.pos.z) * scale,
    });

    // 1) Deep bay water background
    ctx.fillStyle = '#0e2d48';
    ctx.fillRect(0, 0, W, H);

    // 2) Turquoise coastal shoal band + curved crescent peninsula land
    ctx.fillStyle = '#19798e';
    ctx.beginPath();
    const sTopL = toM(-360, -250);
    const sTopR = toM(226, -250);
    ctx.moveTo(sTopL.x, sTopL.y);
    ctx.lineTo(sTopR.x, sTopR.y);
    ctx.lineTo(toM(226, 120).x, toM(226, 120).y);
    for (let x = 210; x >= -360; x -= 24) {
      const pt = toM(x, coastZAtX(x) + 18);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fill();

    // Landmass
    ctx.fillStyle = '#253545';
    ctx.beginPath();
    ctx.moveTo(toM(-350, -245).x, toM(-350, -245).y);
    ctx.lineTo(toM(212, -245).x, toM(212, -245).y);
    ctx.lineTo(toM(212, 110).x, toM(212, 110).y);
    for (let x = 200; x >= -350; x -= 24) {
      const pt = toM(x, coastZAtX(x) - 2);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fill();

    // Golden curved beach shoreline
    ctx.strokeStyle = '#dfbe84';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = -320; x <= 145; x += 20) {
      const pt = toM(x, coastZAtX(x) - 6);
      if (x === -320) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Monte Faro Volcanic Island
    const isl = toM(398, 145);
    ctx.fillStyle = '#2c414d';
    ctx.beginPath();
    ctx.arc(isl.x, isl.y, 124 * scale, 0, Math.PI * 2);
    ctx.fill();

    // 3) Curved Avenida del Sol + City Avenues + Puente del Sol Bridge
    ctx.strokeStyle = '#536275';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = -300; x <= 128; x += 16) {
      const pt = toM(x, boulevardZAtX(x));
      if (x === -300) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    ctx.lineWidth = 3.5;
    const roadSegs = [
      [-275, -185, -275, 115], [-145, -195, -145, 130], [-45, -205, -45, 125],
      [45, -205, 45, 115], [132, -180, 132, 98], [192, -175, 192, 68],
      [-280, -185, 195, -185], [-280, -108, 195, -108], [-150, -24, 195, -24], [-280, 48, 195, 48],
    ];
    for (const [x1, z1, x2, z2] of roadSegs) {
      const a = toM(x1, z1);
      const b = toM(x2, z2);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    // Puente del Sol suspension bridge highlight
    const bStart = toM(WORLD_CONFIG.bridgeStart.x, WORLD_CONFIG.bridgeStart.z);
    const bEnd = toM(WORLD_CONFIG.bridgeEnd.x, WORLD_CONFIG.bridgeEnd.z);
    ctx.strokeStyle = '#ff6b5c';
    ctx.lineWidth = 5.5;
    ctx.beginPath(); ctx.moveTo(bStart.x, bStart.y); ctx.lineTo(bEnd.x, bEnd.y); ctx.stroke();

    // 4) Building footprints
    for (const bf of g.cityWorld.buildingFootprints) {
      const pt = toM(bf.x, bf.z);
      const bw = Math.max(4, bf.w * scale);
      const bd = Math.max(4, bf.d * scale);
      ctx.fillStyle = bf.color + '88';
      ctx.fillRect(pt.x - bw * 0.5, pt.y - bd * 0.5, bw, bd);
    }

    // 5) Glowing GPS Route Polyline directly to active Mission Waypoint!
    const st = g.missions.currentStage;
    const goal = toM(st.pos.x, st.pos.z);
    ctx.strokeStyle = '#ff4fd8';
    ctx.lineWidth = 3.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.5);
    ctx.lineTo(goal.x, goal.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mission beacon star dot (clamped to minimap border if far)
    const gx = Math.max(10, Math.min(W - 10, goal.x));
    const gy = Math.max(10, Math.min(H - 10, goal.y));
    ctx.fillStyle = '#ffcf40';
    ctx.beginPath(); ctx.arc(gx, gy, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#09101c'; ctx.lineWidth = 1.8; ctx.stroke();

    // 6) Police Units WITH sweeping red/blue vision cones!
    const flash = Math.sin(performance.now() * 0.012) > 0;
    for (const u of g.policeSystem.units) {
      if (u.vehicle.destroyed) continue;
      const up = toM(u.vehicle.pos.x, u.vehicle.pos.z);
      if (up.x < -30 || up.x > W + 30 || up.y < -30 || up.y > H + 30) continue;

      if (g.policeSystem.wantedLevel > 0) {
        const ang = Math.atan2(Math.cos(u.vehicle.yaw), Math.sin(u.vehicle.yaw));
        ctx.fillStyle = flash ? 'rgba(255,60,90,0.22)' : 'rgba(55,165,255,0.22)';
        ctx.beginPath();
        ctx.moveTo(up.x, up.y);
        ctx.arc(up.x, up.y, 26, ang - 0.5, ang + 0.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = flash ? '#ff3858' : '#33a3ff';
      ctx.beginPath(); ctx.arc(up.x, up.y, 4, 0, Math.PI * 2); ctx.fill();
    }

    // 7) Hostiles & Crew Ally
    for (const h of g.missions.hostiles) {
      if (!h.alive) continue;
      const hp = toM(h.pos.x, h.pos.z);
      ctx.fillStyle = '#ff5252';
      ctx.beginPath(); ctx.arc(hp.x, hp.y, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    if (g.crewTurf.ally) {
      const ap = toM(g.crewTurf.ally.pos.x, g.crewTurf.ally.pos.z);
      ctx.fillStyle = '#48f59b';
      ctx.beginPath(); ctx.arc(ap.x, ap.y, 4.2, 0, Math.PI * 2); ctx.fill();
    }

    // 8) Player directional chevron centered at (W/2, H/2)
    ctx.save();
    ctx.translate(W * 0.5, H * 0.5);
    ctx.rotate(-p.yaw + Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#09101c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5.5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  update(dt) {
    const g = this.game;
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.elToast.innerHTML = '';
    }
    if (this.radioBannerTimer > 0) {
      this.radioBannerTimer -= dt;
      if (this.radioBannerTimer <= 0) this.elRadio.classList.add('hidden');
    }

    const p = g.player;
    const w = p.currentWeapon;
    const ammo = p.ammo[p.weaponIndex];
    const dist = g.crewTurf.getDistrictAt(p.pos.x, p.pos.z);
    const stars = g.policeSystem.wantedLevel;
    const flashBlue = Math.sin(performance.now() * 0.014) > 0;

    // 1) Top-Left: Compact Active Mission Objective & District Pill
    this.elTopLeft.innerHTML = `
      <div class="glass-pill mission-bar">
        <div class="mission-tag">MISSION • ${g.missions.currentMission.title}</div>
        <div class="mission-obj">${g.missions.getObjectiveText()}</div>
      </div>
      <div class="glass-pill district-pill">${dist.name} • ${g.atmosphere.currentPreset.toUpperCase()}</div>
    `;

    // 2) Top-Right: Wanted Stars, Cash, Single-Line Active Weapon & Dispatch Alert
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      const cls = i <= stars ? (flashBlue && i % 2 === 0 ? 'star-blue' : 'star-on') : 'star-off';
      starsHtml += `<span class="${cls}">★</span>`;
    }
    const tier = g.policeSystem.getTier();
    this.elTopRight.innerHTML = `
      ${stars > 0 ? `<div class="glass-pill wanted-row"><div class="wanted-stars">${starsHtml}</div><div class="wanted-label">${tier.code}</div></div>` : ''}
      <div class="glass-pill stats-strip">
        <div class="cash-val">$${p.cash.toLocaleString()}</div>
        <div class="weapon-badge"><span>${w.slot} ${w.name.toUpperCase()}</span><span class="weapon-ammo">${ammo.mag}/${ammo.reserve}</span></div>
      </div>
      ${g.policeSystem.dispatchTimer > 0 && g.policeSystem.dispatchBanner ? `<div class="dispatch-alert">${g.policeSystem.dispatchBanner}</div>` : ''}
    `;

    // 3) Bottom-Left: Vitals bars + Organic Minimap
    const nos = p.vehicle ? p.vehicle.nitro : 100;
    this.elVitals.innerHTML = `
      <div class="vbar v-hp"><i style="width:${Math.max(0, p.hp)}%"></i></div>
      <div class="vbar v-arm"><i style="width:${Math.max(0, p.armor)}%"></i></div>
      <div class="vbar v-nos"><i style="width:${Math.max(0, nos)}%"></i></div>
    `;
    this.drawMinimap();

    // 4) Bottom-Right: Sleek Speedometer (when driving) + Active Crew Ready Pill
    const crew = g.crewTurf.activeMember;
    const crewReady = crew.cdLeft <= 0 ? 'READY' : `${Math.ceil(crew.cdLeft)}s`;
    const mph = p.vehicle ? Math.round(p.vehicle.speed * 2.35) : 0;
    this.elBottomRight.innerHTML = `
      ${p.vehicle ? `
        <div class="glass-pill speedo-card">
          <div class="speed-num">${mph}</div>
          <div class="speed-meta">MPH<br/>${p.vehicle.spec.name}</div>
        </div>
      ` : ''}
      <div class="glass-pill crew-card">
        <span class="crew-dot" style="background:${crew.cdLeft <= 0 ? '#48f59b' : '#ffae42'}"></span>
        <span>${crew.name.split(' ')[0].toUpperCase()} • ${crewReady}</span>
        <span class="crew-key">[Q]</span>
      </div>
    `;

    // 5) Crosshair & Contextual [F] Steal Prompt
    this.elCrosshair.classList.toggle('hidden', !!p.vehicle || this.hubOpen);
    if (!p.vehicle && !this.hubOpen) {
      const near = p.findNearestVehicle(6.2);
      if (near) {
        this.elPrompt.textContent = `[F] STEAL ${near.spec.name.toUpperCase()}`;
        this.elPrompt.classList.remove('hidden');
      } else {
        this.elPrompt.classList.add('hidden');
      }
    } else {
      this.elPrompt.classList.add('hidden');
    }

    // 6) Character Portrait Radio Comms
    if (g.missions.commsTimer > 0 && g.missions.activeComms && !this.hubOpen) {
      const cm = g.missions.activeComms;
      this.elComms.innerHTML = `
        <div class="comms-avatar" style="background:${cm.color}">${cm.initials}</div>
        <div>
          <div class="comms-speaker">${cm.speaker}</div>
          <div class="comms-text">${cm.text}</div>
        </div>
      `;
      this.elComms.classList.remove('hidden');
    } else {
      this.elComms.classList.add('hidden');
    }
  }
}

// Cala Solara — 100% Offline Procedural Web Audio Engine (RPM Engine, Gunshots, Explosions, Sirens & 3 FM Radio Stations)

import { RADIO_STATIONS } from '../config.js';

export class AudioAndRadioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.stationIndex = 0;
    this.beatTimer = 0;
    this.step = 0;

    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.34;
      this.master.connect(this.ctx.destination);

      // Continuous RPM Engine Oscillator
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      const engFilter = this.ctx.createBiquadFilter();
      engFilter.type = 'lowpass';
      engFilter.frequency.value = 260;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc.connect(engFilter);
      engFilter.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engineOsc.start();

      // Continuous Dual-Tone Police Siren
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.master);
      this.sirenOsc.start();
    } catch {
      this.ctx = null;
    }
  }

  get currentStation() {
    return RADIO_STATIONS[this.stationIndex];
  }

  cycleStation() {
    this.stationIndex = (this.stationIndex + 1) % RADIO_STATIONS.length;
    return this.currentStation;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.34, this.ctx.currentTime, 0.04);
    }
    return this.muted;
  }

  playGunshot(weaponId) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = weaponId === 'shotgun' ? 0.22 : (weaponId === 'launcher' ? 0.32 : 0.11);
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.24));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = weaponId === 'shotgun' ? 480 : (weaponId === 'smg' ? 1450 : 980);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(weaponId === 'shotgun' ? 0.65 : 0.42, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    noise.start(now);
  }

  playExplosion() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 0.68);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.95, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  playRadioNote(freq, dur, type = 'sawtooth', vol = 0.08) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1100;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  update(dt, playerVehicle, wantedLevel) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // 1) Engine RPM pitch & gain
    if (playerVehicle && !playerVehicle.destroyed) {
      const spdNorm = Math.min(1.3, playerVehicle.speed / Math.max(10, playerVehicle.spec.maxSpeed));
      const baseHz = playerVehicle.type === 'moto' ? 105 : (playerVehicle.type === 'supercar' ? 78 : 56);
      this.engineOsc.frequency.setTargetAtTime(baseHz + spdNorm * 140, now, 0.06);
      this.engineGain.gain.setTargetAtTime(0.08 + spdNorm * 0.08, now, 0.08);
    } else {
      this.engineGain.gain.setTargetAtTime(0, now, 0.1);
    }

    // 2) Police siren wail when wanted
    if (wantedLevel > 0) {
      const wail = 640 + Math.sin(now * 5.8) * 230;
      this.sirenOsc.frequency.setTargetAtTime(wail, now, 0.04);
      this.sirenGain.gain.setTargetAtTime(0.055, now, 0.12);
    } else {
      this.sirenGain.gain.setTargetAtTime(0, now, 0.12);
    }

    // 3) Procedural 3-Station FM Radio Sequencer (active when driving)
    const st = this.currentStation;
    if (playerVehicle && st.style !== 'off') {
      const stepDur = 60 / st.bpm / 2;
      this.beatTimer -= dt;
      if (this.beatTimer <= 0) {
        this.beatTimer = stepDur;
        const s = this.step++ % 16;
        if (st.style === 'synthwave') {
          const bass = [110, 110, 130.8, 110, 87.3, 87.3, 98, 110];
          this.playRadioNote(bass[s % 8], stepDur * 0.8, 'sawtooth', 0.075);
          if (s % 4 === 2) this.playRadioNote(440 * (s > 8 ? 1.25 : 1), stepDur * 1.1, 'triangle', 0.05);
        } else if (st.style === 'funk') {
          const groove = [146.8, 0, 174.6, 196, 146.8, 0, 220, 196];
          const n = groove[s % 8];
          if (n > 0) this.playRadioNote(n, stepDur * 0.65, 'square', 0.055);
        } else if (st.style === 'chill') {
          if (s % 4 === 0) {
            const chords = [261.6, 220, 174.6, 196];
            this.playRadioNote(chords[(s >> 2) % 4], stepDur * 3.2, 'sine', 0.065);
          }
        }
      }
    }
  }
}

// Cala Solara — Procedural Web Audio Engine (RPM Engine, Gunshots, Explosions, Sirens & 3 FM Radio Stations)
import { RADIO_STATIONS } from '../config.js';

export class AudioAndRadioEngine {
  constructor() { this.ctx=this.master=this.engineOsc=this.engineGain=this.sirenOsc=this.sirenGain=null;this.muted=false;this.stationIndex=this.beatTimer=this.step=0; }

  unlock() {
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    try{
      const c=this.ctx=new AC();this.master=c.createGain();this.master.gain.value=this.muted?0:0.34;this.master.connect(c.destination);
      this.engineOsc=c.createOscillator();this.engineOsc.type='sawtooth';const ef=c.createBiquadFilter();ef.type='lowpass';ef.frequency.value=260;
      this.engineGain=c.createGain();this.engineGain.gain.value=0;this.engineOsc.connect(ef);ef.connect(this.engineGain);this.engineGain.connect(this.master);this.engineOsc.start();
      this.sirenOsc=c.createOscillator();this.sirenOsc.type='triangle';this.sirenGain=c.createGain();this.sirenGain.gain.value=0;
      this.sirenOsc.connect(this.sirenGain);this.sirenGain.connect(this.master);this.sirenOsc.start();
    }catch{this.ctx=null;}
  }

  get currentStation() { return RADIO_STATIONS[this.stationIndex]; }
  cycleStation() { this.stationIndex=(this.stationIndex+1)%RADIO_STATIONS.length;return this.currentStation; }
  toggleMute() { this.muted=!this.muted;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.muted?0:0.34,this.ctx.currentTime,0.04);return this.muted; }

  playGunshot(id) {
    if(!this.ctx||this.muted)return;
    const c=this.ctx,t=c.currentTime,dur=id==='shotgun'?0.22:(id==='launcher'?0.32:0.11),sz=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,sz,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<sz;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(sz*0.24));
    const n=c.createBufferSource();n.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=id==='shotgun'?480:(id==='smg'?1450:980);
    const g=c.createGain();g.gain.setValueAtTime(id==='shotgun'?0.65:0.42,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    n.connect(f);f.connect(g);g.connect(this.master);n.start(t);
  }

  playExplosion() {
    if(!this.ctx||this.muted)return;
    const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(24,t+0.68);
    g.gain.setValueAtTime(0.95,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.72);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+0.75);
  }

  playRadioNote(freq, dur, type = 'sawtooth', vol = 0.08) {
    if(!this.ctx||this.muted)return;
    const c=this.ctx,t=c.currentTime,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);f.type='lowpass';f.frequency.value=1100;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(f);f.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+0.02);
  }

  update(dt, v, stars) {
    if(!this.ctx||this.muted)return;const t=this.ctx.currentTime;
    if(v&&!v.destroyed){const sn=Math.min(1.3,v.speed/Math.max(10,v.spec.maxSpeed));this.engineOsc.frequency.setTargetAtTime((v.type==='moto'?105:72)+sn*140,t,0.06);this.engineGain.gain.setTargetAtTime(0.08+sn*0.08,t,0.08);}
    else this.engineGain.gain.setTargetAtTime(0,t,0.1);
    if(stars>0){this.sirenOsc.frequency.setTargetAtTime(640+Math.sin(t*5.8)*230,t,0.04);this.sirenGain.gain.setTargetAtTime(0.055,t,0.12);}else this.sirenGain.gain.setTargetAtTime(0,t,0.12);
    const st=this.currentStation;
    if(v&&st.style!=='off'&&(this.beatTimer-=dt)<=0){
      const sd=30/st.bpm;this.beatTimer=sd;const s=this.step++%16;
      if(st.style==='synthwave'){this.playRadioNote([110,110,130.8,110,87.3,87.3,98,110][s%8],sd*0.8,'sawtooth',0.075);if(s%4===2)this.playRadioNote(440*(s>8?1.25:1),sd*1.1,'triangle',0.05);}
      else if(st.style==='funk'){const n=[146.8,0,174.6,196,146.8,0,220,196][s%8];if(n)this.playRadioNote(n,sd*0.65,'square',0.055);}
      else if(st.style==='chill'&&s%4===0)this.playRadioNote([261.6,220,174.6,196][(s>>2)%4],sd*3.2,'sine',0.065);
    }
  }
}

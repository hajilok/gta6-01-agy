// Cala Solara — 3-Station Procedural FM Radio Synthesizer (Drums, Basslines & Chords)
import { RADIO_STATIONS } from '../config.js';

export class FmRadioSynthesizer {
  constructor(s){Object.assign(this,{sfx:s,stationIndex:0,beatTimer:0,step:0});}
  get currentStation(){return RADIO_STATIONS[this.stationIndex];}
  cycleStation(){this.stationIndex=(this.stationIndex+1)%RADIO_STATIONS.length;return this.currentStation;}
  playTone(fr,d,ty='sawtooth',v=.07){
    const c=this.sfx.ctx;if(!c||this.sfx.muted)return;const t=c.currentTime,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o.type=ty;o.frequency.setValueAtTime(fr,t);f.type='lowpass';f.frequency.value=1150;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(f);f.connect(g);g.connect(this.sfx.master);o.start(t);o.stop(t+d+.02);
  }
  playKick(){
    const c=this.sfx.ctx;if(!c||this.sfx.muted)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(135,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);
    o.connect(g);g.connect(this.sfx.master);o.start(t);o.stop(t+.15);
  }
  update(dt,v){
    if(!this.sfx.ctx||this.sfx.muted)return;const st=this.currentStation;if(!v||st.style==='off'||(this.beatTimer-=dt)>0)return;
    const sd=30/st.bpm;this.beatTimer=sd;const s=this.step++%16;
    if(st.style==='synthwave'){if(!(s%4))this.playKick();this.playTone([110,110,130.8,110,87.3,87.3,98,110][s%8],sd*.85,'sawtooth',.07);if(s%4===2)this.playTone(s>8?523.25:440,sd*1.05,'triangle',.048);}
    else if(st.style==='funk'){if(!(s%4)||s===10)this.playKick();const n=[146.8,0,174.6,196,146.8,0,220,196][s%8];if(n)this.playTone(n,sd*.65,'square',.052);}
    else if(st.style==='chill'&&!(s%4)){const r=[261.6,220,174.6,196][(s>>2)%4];this.playTone(r,sd*3.1,'sine',.055);this.playTone(r*1.25,sd*2.8,'triangle',.032);}
  }
}

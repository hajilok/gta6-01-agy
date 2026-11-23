// Cala Solara — Procedural Web Audio SFX Engine (RPM Engine, Tire Screech, Gunshots, Explosions & Sirens)
export class ProceduralSfxEngine {
  constructor(){this.ctx=this.master=this.engineOsc=this.engineGain=this.sirenOsc=this.sirenGain=this.screechGain=null;this.muted=false;}
  unlock(){
    const t=this;if(t.ctx){if(t.ctx.state==='suspended')t.ctx.resume().catch(()=>{});return t.ctx;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    try{
      const c=t.ctx=new AC(),G=(v=0)=>{const g=c.createGain();g.gain.value=v;return g;};
      t.master=G(t.muted?0:.36);t.master.connect(c.destination);
      const eo=t.engineOsc=c.createOscillator(),ef=c.createBiquadFilter();eo.type='sawtooth';ef.type='lowpass';ef.frequency.value=280;t.engineGain=G();eo.connect(ef);ef.connect(t.engineGain);t.engineGain.connect(t.master);eo.start();
      const so=t.sirenOsc=c.createOscillator();so.type='triangle';t.sirenGain=G();so.connect(t.sirenGain);t.sirenGain.connect(t.master);so.start();
      const nL=(c.sampleRate*.5)|0,nB=c.createBuffer(1,nL,c.sampleRate),dt=nB.getChannelData(0);for(let i=0;i<nL;i++)dt[i]=Math.random()*2-1;
      const nS=c.createBufferSource(),sf=c.createBiquadFilter();nS.buffer=nB;nS.loop=true;sf.type='bandpass';sf.frequency.value=1750;sf.Q.value=7.5;t.screechGain=G();nS.connect(sf);sf.connect(t.screechGain);t.screechGain.connect(t.master);nS.start();
    }catch{t.ctx=null;}return t.ctx;
  }
  toggleMute(){this.muted=!this.muted;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.36,this.ctx.currentTime,.04);return this.muted;}
  playGunshot(w){
    if(!this.ctx||this.muted)return;const c=this.ctx,t=c.currentTime,d=w==='shotgun'?.24:w==='launcher'?.34:.12,sz=(c.sampleRate*d)|0,b=c.createBuffer(1,sz,c.sampleRate),ch=b.getChannelData(0);
    for(let i=0;i<sz;i++)ch[i]=(Math.random()*2-1)*Math.exp(-i/(sz*.22));
    const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=w==='shotgun'?460:w==='smg'?1480:960;
    g.gain.setValueAtTime(w==='shotgun'?.68:.44,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);
  }
  playExplosion(){
    if(!this.ctx||this.muted)return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(22,t+.72);g.gain.setValueAtTime(.95,t);g.gain.exponentialRampToValueAtTime(.001,t+.75);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.78);
  }
  playDispatchChirp(){
    if(!this.ctx||this.muted)return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
    o.type='square';o.frequency.setValueAtTime(1320,t);o.frequency.setValueAtTime(1760,t+.06);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.15);
  }
  update(dt,v,st){
    const s=this;if(!s.ctx||s.muted)return;const t=s.ctx.currentTime;
    if(v&&!v.destroyed){const n=Math.min(1.35,v.speed/Math.max(10,v.spec.maxSpeed));s.engineOsc.frequency.setTargetAtTime((v.type==='moto'?108:70)+n*145,t,.06);s.engineGain.gain.setTargetAtTime(.08+n*.08,t,.08);s.screechGain.gain.setTargetAtTime(v.drifting?.065:0,t,.05);}
    else{s.engineGain.gain.setTargetAtTime(0,t,.1);s.screechGain.gain.setTargetAtTime(0,t,.08);}
    if(st>0){s.sirenOsc.frequency.setTargetAtTime(640+Math.sin(t*6)*240,t,.04);s.sirenGain.gain.setTargetAtTime(.055,t,.12);}else s.sirenGain.gain.setTargetAtTime(0,t,.12);
  }
}

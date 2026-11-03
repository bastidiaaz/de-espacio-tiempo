type AudioContextCtor = typeof AudioContext;

/** Fully synthesized soundscape: pad, music-box drips, campfire crackle, memory chimes. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private echo: DelayNode | null = null;
  private fireBus: GainNode | null = null;
  private enabled: boolean;
  private disposed = false;
  private readonly timers = new Set<number>();

  constructor(enabled: boolean) {
    this.enabled = enabled;
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** Must be called from a user gesture. */
  start(): void {
    try {
      const Ctor: AudioContextCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext: AudioContextCtor }).webkitAudioContext;
      const actx = (this.ctx = new Ctor());
      const master = (this.master = actx.createGain());
      master.gain.value = 0;
      master.connect(actx.destination);
      master.gain.linearRampToValueAtTime(this.enabled ? 0.4 : 0, actx.currentTime + 5);

      // Pad: A-major-ish chord through a slowly breathing low-pass.
      const lp = actx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      lp.connect(master);
      const lfo = actx.createOscillator();
      const lg = actx.createGain();
      lfo.frequency.value = 0.05;
      lg.gain.value = 300;
      lfo.connect(lg);
      lg.connect(lp.frequency);
      lfo.start();
      [110, 164.81, 207.65, 277.18].forEach((f, i) =>
        [-7, 7].forEach((dt) => {
          const o = actx.createOscillator();
          const g = actx.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          o.detune.value = dt;
          g.gain.value = i === 0 ? 0.06 : 0.035;
          o.connect(g);
          g.connect(lp);
          o.start();
        }),
      );

      // Echo send for chimes.
      const echo = (this.echo = actx.createDelay());
      echo.delayTime.value = 0.45;
      const fb = actx.createGain();
      const wet = actx.createGain();
      fb.gain.value = 0.38;
      wet.gain.value = 0.35;
      echo.connect(fb);
      fb.connect(echo);
      echo.connect(wet);
      wet.connect(master);

      // Campfire: low rumble + random crackles, both through fireBus (distance-scaled).
      const noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const fireBus = (this.fireBus = actx.createGain());
      fireBus.gain.value = 0;
      fireBus.connect(master);
      const rumble = actx.createBufferSource();
      rumble.buffer = noiseBuf;
      rumble.loop = true;
      const rl = actx.createBiquadFilter();
      rl.type = 'lowpass';
      rl.frequency.value = 380;
      const rg = actx.createGain();
      rg.gain.value = 0.25;
      rumble.connect(rl);
      rl.connect(rg);
      rg.connect(fireBus);
      rumble.start();

      const crackle = () => {
        const s = actx.createBufferSource();
        s.buffer = noiseBuf;
        const bp = actx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1800 + Math.random() * 2500;
        bp.Q.value = 2;
        const g = actx.createGain();
        const t = actx.currentTime;
        g.gain.setValueAtTime(0.5 + Math.random() * 0.8, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.03 + Math.random() * 0.05);
        s.connect(bp);
        bp.connect(g);
        g.connect(fireBus);
        s.start(t, Math.random() * 1.5, 0.1);
        this.later(crackle, 40 + Math.random() * 260);
      };
      crackle();

      const pent = [440, 493.88, 554.37, 659.25, 739.99, 880];
      const drip = () => {
        this.chime(pent[(Math.random() * pent.length) | 0], 0.025);
        this.later(drip, 4000 + Math.random() * 6000);
      };
      drip();
    } catch {
      this.ctx = null;
    }
  }

  chime(freq: number, gain = 0.06, when = 0, dur = 2.2): void {
    const { ctx, master, echo } = this;
    if (!ctx || !master || !echo) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    g.connect(echo);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  /** Warm chord when a chapter completes. */
  swell(): void {
    const { ctx, master, echo } = this;
    if (!ctx || !master || !echo) return;
    [220, 277.18, 329.63, 440].forEach((f) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.04, t + 1.6);
      g.gain.linearRampToValueAtTime(0, t + 6);
      o.connect(g);
      g.connect(master);
      g.connect(echo);
      o.start(t);
      o.stop(t + 6.2);
    });
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    const { ctx, master } = this;
    if (!ctx || !master) return;
    ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(on ? 0.4 : 0, ctx.currentTime + 0.4);
  }

  /** 0..1, how loud the campfire is (by distance). */
  setFireLevel(level: number): void {
    if (this.ctx && this.fireBus) this.fireBus.gain.value = level;
  }

  dispose(): void {
    this.disposed = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.ctx?.close();
    this.ctx = null;
  }

  private later(fn: () => void, ms: number): void {
    if (this.disposed) return;
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }

  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) this.ctx.suspend();
    else this.ctx.resume();
  };
}

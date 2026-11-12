/**
 * The wind (AUD-03): the "silence" of the game. Fully synthesized, no samples: a loop of soft
 * noise through two band-pass filters (a low body and a faint whistle), with slow gusts made by
 * LFOs, so there are no timers to clean up. Closing the AudioContext stops everything.
 */

/** Loudest the wind bus gets (level 1, at the top of the mirador). */
export const WIND_MAX_GAIN = 0.5;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/**
 * `length` samples of soft (brown-ish) noise in -1..1 that loop without a click: the start is
 * cross-faded with what would have come after the end. Pure, testable in Node.
 */
export function windNoise(length: number, rand: () => number = Math.random): Float32Array {
  const fade = Math.min(length, Math.max(1, Math.floor(length / 8)));
  const raw = new Float32Array(length + fade);
  let b = 0;
  for (let i = 0; i < raw.length; i++) {
    b = (b + 0.02 * (rand() * 2 - 1)) / 1.02;
    raw[i] = b;
  }
  const out = new Float32Array(length);
  let peak = 1e-9;
  for (let i = 0; i < length; i++) {
    const t = i / fade;
    out[i] = i < fade ? raw[i] * t + raw[length + i] * (1 - t) : raw[i];
    peak = Math.max(peak, Math.abs(out[i]));
  }
  for (let i = 0; i < length; i++) out[i] /= peak;
  return out;
}

/** Gain of the wind bus at a level 0..1. */
export const windGain = (level: number): number => WIND_MAX_GAIN * clamp01(level);
/** Centre (Hz) of the wind's body: it opens up as it blows harder. */
export const windBodyHz = (level: number): number => 260 + 520 * clamp01(level);
/** Gain of the whistle: only a strong wind whistles. */
export const windWhistle = (level: number): number => 0.03 + 0.3 * clamp01(level) ** 2;

export class Wind {
  private readonly ctx: AudioContext;
  private readonly level: GainNode;
  private readonly body: BiquadFilterNode;
  private readonly whistle: GainNode;

  constructor(ctx: AudioContext, out: AudioNode) {
    this.ctx = ctx;
    // Two independent channels: a wide wind for free.
    const buffer = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
    for (let c = 0; c < 2; c++) buffer.getChannelData(c).set(windNoise(buffer.length));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const body = (this.body = ctx.createBiquadFilter());
    body.type = 'bandpass';
    body.frequency.value = windBodyHz(0);
    body.Q.value = 0.5;

    const whistleBand = ctx.createBiquadFilter();
    whistleBand.type = 'bandpass';
    whistleBand.frequency.value = 1100;
    whistleBand.Q.value = 6;
    const whistle = (this.whistle = ctx.createGain());
    whistle.gain.value = windWhistle(0);

    // Gusts: slow LFOs that never line up, on the loudness and on the whistle's pitch.
    const gust = ctx.createGain();
    gust.gain.value = 0.7;
    this.lfo(0.09, 0.2, gust.gain);
    this.lfo(0.23, 0.1, gust.gain);
    this.lfo(0.05, 260, whistleBand.frequency);

    const level = (this.level = ctx.createGain());
    level.gain.value = 0;

    src.connect(body);
    body.connect(gust);
    src.connect(whistleBand);
    whistleBand.connect(whistle);
    whistle.connect(gust);
    gust.connect(level);
    level.connect(out);
    src.start();
  }

  /** 0..1, reached in about `seconds`. */
  setLevel(level: number, seconds: number): void {
    const t = this.ctx.currentTime;
    const tau = Math.max(0.01, seconds / 3);
    this.level.gain.setTargetAtTime(windGain(level), t, tau);
    this.body.frequency.setTargetAtTime(windBodyHz(level), t, tau);
    this.whistle.gain.setTargetAtTime(windWhistle(level), t, tau);
  }

  private lfo(hz: number, depth: number, target: AudioParam): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.value = hz;
    g.gain.value = depth;
    o.connect(g);
    g.connect(target);
    o.start();
  }
}

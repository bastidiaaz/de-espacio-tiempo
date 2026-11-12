/**
 * The sound of the ship's reveal (DIS-08): a low, long chord on the tonic of "Astronauta" that
 * grows slowly while the camera sweeps the wreck, and the distant metallic creak of the hull.
 * Never the song's melody: the chorus is kept for the closing (AUD-01).
 *
 * It goes straight to the master (and the echo), not through the buses of the mix: the sound
 * toggle still rules it, but the `hush` that silences music and wind during the take does not.
 * The plan (which notes, when, how the creak stutters) is pure and testable in Node; the class
 * only turns it into Web Audio nodes.
 */
import { REVEAL, type RevealCue } from './reveal';

/** E♭1: the tonic of "Astronauta" (E♭ major, see docs/aud01-transcripcion.md), two octaves under the voice. */
export const CHORD_ROOT_HZ = 38.89;

export interface ChordVoice {
  freq: number;
  /** Peak gain of the voice. */
  gain: number;
  type: OscillatorType;
  /** Cents: pairs of voices drift against each other, so the chord breathes. */
  detune: number;
  /** Seconds after the chord starts before this voice comes in: it opens upwards as it grows. */
  enter: number;
}

/**
 * Root, fifth and octaves only, no third: neither major nor minor, so it reads as size, not as
 * a mood. The deepest voice is felt more than heard on a phone; the upper ones carry it there.
 */
export const CHORD: readonly ChordVoice[] = [
  { freq: CHORD_ROOT_HZ, gain: 0.3, type: 'sine', detune: 0, enter: 0 },
  { freq: CHORD_ROOT_HZ * 2, gain: 0.26, type: 'triangle', detune: -6, enter: 0 },
  { freq: CHORD_ROOT_HZ * 2, gain: 0.2, type: 'sawtooth', detune: 7, enter: 0.4 },
  { freq: CHORD_ROOT_HZ * 3, gain: 0.17, type: 'triangle', detune: 5, enter: 1.2 },
  { freq: CHORD_ROOT_HZ * 4, gain: 0.13, type: 'sawtooth', detune: -8, enter: 2.2 },
  { freq: CHORD_ROOT_HZ * 6, gain: 0.06, type: 'triangle', detune: 4, enter: 3.4 },
  { freq: CHORD_ROOT_HZ * 8, gain: 0.035, type: 'sine', detune: -3, enter: 4.4 },
];

/** Seconds: the chord grows from its cue to the release, then fades (brief: "se apaga en ~4 s"). */
export const CHORD_TIMES = {
  /** From `chord` to `release`: it never stops growing while the camera is on the ship. */
  swell: REVEAL.releaseAt - REVEAL.chordAt,
  /** Level of the whole chord at its loudest, before the master. */
  peak: 0.7,
  /** At `release` it eases down to this fraction of its peak while the camera returns... */
  releaseTo: 0.6,
  /** ...and after `end` it dies out in about this long. */
  fade: 4,
} as const;

/** One slip of the hull: a short groan that slides in pitch. */
export interface CreakSlip {
  /** Seconds after the creak starts. */
  at: number;
  /** Length of the slip. */
  dur: number;
  /** Pitch of the groan at its start and end (Hz). */
  from: number;
  to: number;
  /** 0..1 loudness. */
  level: number;
}

/**
 * A creak is metal that sticks and slips: a few uneven groans, each sliding a little in pitch,
 * the loudest in the middle. `rnd` is a 0..1 generator, so every creak differs and tests can fix one.
 */
export function creakPlan(rnd: () => number, seconds = 1.9): CreakSlip[] {
  const slips: CreakSlip[] = [];
  const n = 4 + Math.floor(rnd() * 3);
  let at = 0;
  let pitch = 70 + rnd() * 30;
  for (let i = 0; i < n; i++) {
    const dur = (seconds / n) * (0.55 + rnd() * 0.6);
    const next = pitch * (0.82 + rnd() * 0.5);
    const mid = 1 - Math.abs((i + 0.5) / n - 0.5) * 1.2;
    slips.push({ at, dur, from: pitch, to: next, level: Math.max(0.25, mid) * (0.7 + rnd() * 0.3) });
    at += dur + rnd() * 0.12;
    pitch = Math.min(150, Math.max(55, next));
  }
  return slips;
}

/** Runs `fn` after `ms`; the owner cancels what is pending on dispose. */
export type Scheduler = (fn: () => void, ms: number) => void;

/** Resonances of a big hollow hull, far away (Hz, Q, gain). */
const HULL_MODES: readonly (readonly [number, number, number])[] = [
  [212, 9, 1],
  [547, 14, 0.7],
  [1130, 18, 0.4],
];

export class RevealSound {
  private readonly ctx: AudioContext;
  private readonly master: AudioNode;
  private readonly echo: AudioNode;
  private readonly later: Scheduler;
  /** The chord sounding now: its level, its filter and what to stop when it is over. */
  private chord: { gain: GainNode; filter: BiquadFilterNode; oscs: OscillatorNode[] } | null = null;
  /** After the take, until the ship is remembered: the odd loose creak. */
  private loose = false;
  private looseRun = 0;

  constructor(ctx: AudioContext, master: AudioNode, echo: AudioNode, later: Scheduler) {
    this.ctx = ctx;
    this.master = master;
    this.echo = echo;
    this.later = later;
  }

  /** One beat of the take (see `RevealCue`). `start` is the wind dropping, which the mix does. */
  cue(cue: RevealCue): void {
    if (cue === 'chord') this.startChord();
    else if (cue === 'creak') this.creak(1);
    else if (cue === 'release') this.releaseChord();
    else if (cue === 'end') this.endChord();
  }

  /** Cuts everything short (debug jumps away from the take). */
  stop(): void {
    this.killChord(0.3);
    this.setLoose(false);
  }

  /** While on, a faint creak every now and then: the wreck settling after the take. */
  setLoose(on: boolean): void {
    if (on === this.loose) return;
    this.loose = on;
    if (!on) return;
    const run = ++this.looseRun;
    const again = () => {
      if (!this.loose || run !== this.looseRun) return;
      this.creak(0.45);
      this.later(again, 11000 + Math.random() * 9000);
    };
    this.later(again, 6000 + Math.random() * 4000);
  }

  private startChord(): void {
    this.killChord(0.2);
    const { ctx } = this;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.7;
    // Dark at first, opening as it grows: the size arrives little by little.
    filter.frequency.setValueAtTime(130, t);
    filter.frequency.exponentialRampToValueAtTime(950, t + CHORD_TIMES.swell);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(CHORD_TIMES.peak * 0.25, t + CHORD_TIMES.swell * 0.4);
    gain.gain.linearRampToValueAtTime(CHORD_TIMES.peak, t + CHORD_TIMES.swell);
    filter.connect(gain);
    gain.connect(this.master);
    const oscs = CHORD.map((v) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = v.type;
      o.frequency.value = v.freq;
      o.detune.value = v.detune;
      g.gain.setValueAtTime(0, t + v.enter);
      g.gain.linearRampToValueAtTime(v.gain, t + v.enter + 2.5);
      o.connect(g);
      g.connect(filter);
      o.start(t);
      return o;
    });
    this.chord = { gain, filter, oscs };
  }

  private releaseChord(): void {
    const { ctx, chord } = this;
    if (!chord) return;
    const t = ctx.currentTime;
    hold(chord.gain.gain, t);
    chord.gain.gain.setTargetAtTime(CHORD_TIMES.peak * CHORD_TIMES.releaseTo, t, 0.9);
  }

  private endChord(): void {
    const { ctx, chord } = this;
    if (!chord) return;
    const t = ctx.currentTime;
    hold(chord.gain.gain, t);
    hold(chord.filter.frequency, t);
    // A time constant of a third of the fade: practically silent when the fade is over.
    chord.gain.gain.setTargetAtTime(0, t, CHORD_TIMES.fade / 3);
    chord.filter.frequency.setTargetAtTime(160, t, CHORD_TIMES.fade / 3);
    for (const o of chord.oscs) o.stop(t + CHORD_TIMES.fade * 2);
    this.chord = null;
  }

  private killChord(seconds: number): void {
    const { ctx, chord } = this;
    if (!chord) return;
    const t = ctx.currentTime;
    hold(chord.gain.gain, t);
    chord.gain.gain.linearRampToValueAtTime(0, t + seconds);
    for (const o of chord.oscs) o.stop(t + seconds + 0.05);
    this.chord = null;
  }

  /** The hull groans, far away: a rough tone that sticks and slips through the hull's resonances. */
  private creak(level: number): void {
    const { ctx } = this;
    const t = ctx.currentTime + 0.02;
    const slips = creakPlan(Math.random);
    const last = slips[slips.length - 1];
    const end = t + last.at + last.dur + 0.6;

    const out = ctx.createGain();
    out.gain.value = 0.5 * level;
    // Far away: no air in it.
    const far = ctx.createBiquadFilter();
    far.type = 'lowpass';
    far.frequency.value = 1700;
    far.connect(out);
    out.connect(this.master);
    out.connect(this.echo);

    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    o.frequency.setValueAtTime(slips[0].from, t);
    for (const s of slips) {
      const a = t + s.at;
      o.frequency.setValueAtTime(s.from, a);
      o.frequency.exponentialRampToValueAtTime(s.to, a + s.dur);
      env.gain.setValueAtTime(0, a);
      env.gain.linearRampToValueAtTime(s.level, a + s.dur * 0.3);
      env.gain.linearRampToValueAtTime(0, a + s.dur);
    }
    o.connect(env);
    // A slow wobble on the pitch: the groan is never a clean note.
    const wob = ctx.createOscillator();
    const wobGain = ctx.createGain();
    wob.frequency.value = 23;
    wobGain.gain.value = 9;
    wob.connect(wobGain);
    wobGain.connect(o.frequency);
    for (const [freq, q, g] of HULL_MODES) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = q;
      const mg = ctx.createGain();
      mg.gain.value = g;
      env.connect(bp);
      bp.connect(mg);
      mg.connect(far);
    }
    o.start(t);
    wob.start(t);
    o.stop(end);
    wob.stop(end);
  }
}

/** Freezes a parameter at what it is worth now, so a new ramp starts from there without a jump. */
function hold(param: AudioParam, t: number): void {
  if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(t);
  else {
    const v = param.value;
    param.cancelScheduledValues(t);
    param.setValueAtTime(v, t);
  }
}

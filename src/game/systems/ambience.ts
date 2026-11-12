/**
 * Everything AUD-03 and AUD-06 add to the soundscape, kept apart from `audio.ts`: the wind, the
 * layers each chapter adds, and the bus the song (AUD-01) plays through. `mix.ts` decides the
 * gains (pure); this file only owns the Web Audio nodes and follows them.
 *
 * Nothing here replaces the original pad or drips: they keep playing through `pad` and `box`,
 * which this class only turns down for the silence, the edge and the song.
 */
import { LAYERS, type LayerId, type Mix } from './mix';
import { Wind } from './wind';

export interface AmbienceOutputs {
  master: AudioNode;
  /** Echo send shared with the chimes. */
  echo: AudioNode;
  /** The original pad goes through this gain. */
  pad: GainNode;
  /** The original music-box drips go through this gain. */
  box: GainNode;
}

/** Runs `fn` after `ms`; the owner cancels what is pending on dispose. */
export type Scheduler = (fn: () => void, ms: number) => void;

/**
 * Drone layers: [frequency (Hz), gain, tremolo rate (Hz), tremolo depth 0..1]. All in the pad's
 * A major, so they thicken it without changing the chord.
 * - `air` (chapter 1): the pad's root and fifth, an octave up.
 * - `deep` (chapter 3, the ship): a floor under the pad.
 * - `star` (chapter 5): a high, slow twinkle.
 */
const DRONES: Record<string, readonly (readonly [number, number, number, number])[]> = {
  air: [
    [440, 0.013, 0.11, 0.3],
    [659.25, 0.009, 0.07, 0.3],
  ],
  deep: [
    [55, 0.07, 0.04, 0.15],
    [82.41, 0.035, 0.06, 0.15],
  ],
  star: [
    [1318.51, 0.006, 0.23, 0.5],
    [1760, 0.005, 0.31, 0.5],
    [2217.46, 0.003, 0.17, 0.5],
  ],
};

/** `answer` (chapter 2): two soft notes, an octave below the drips, as if something replied. */
const ANSWER_NOTES = [220, 246.94, 277.18, 329.63, 369.99, 440];
/**
 * `phrase` (chapter 4, back at the fire): slow four-note falls. Never the rise-and-fall of the
 * proximity arpeggio (`ARP_NOTES`), which must stay unmistakable, and not the melody of
 * "Astronauta" either: that one is kept for the closing (AUD-01).
 */
const PHRASES: readonly (readonly number[])[] = [
  [369.99, 329.63, 277.18, 246.94],
  [329.63, 277.18, 246.94, 220],
  [440, 369.99, 329.63, 277.18],
  [277.18, 329.63, 246.94, 220],
];
const PHRASE_STEP_S = 0.95;

const pick = <T>(list: readonly T[]): T => list[(Math.random() * list.length) | 0];

export class Ambience {
  /** The song (AUD-01) connects here: it follows the silence and the edge like the rest of the music. */
  readonly song: GainNode;
  private readonly ctx: AudioContext;
  private readonly out: AmbienceOutputs;
  private readonly later: Scheduler;
  private readonly wind: Wind;
  private readonly layers = {} as Record<LayerId, GainNode>;
  /** Where each layer is heading: the note layers don't bother playing into a closed gain. */
  private readonly targets = {} as Record<LayerId, number>;
  /** Last value each gain was sent to, and the wind's. */
  private readonly heading = new Map<AudioParam, number>();
  private windLevel = -1;

  constructor(ctx: AudioContext, out: AmbienceOutputs, later: Scheduler) {
    this.ctx = ctx;
    this.out = out;
    this.later = later;
    this.wind = new Wind(ctx, out.master);
    const song = (this.song = ctx.createGain());
    song.connect(out.master);

    for (const l of LAYERS) {
      const g = (this.layers[l.id] = ctx.createGain());
      g.gain.value = 0;
      g.connect(out.master);
      if (l.kind === 'notes') g.connect(out.echo);
      this.targets[l.id] = 0;
      for (const [freq, gain, rate, depth] of DRONES[l.id] ?? []) this.drone(freq, gain, rate, depth, g);
    }

    const answer = () => {
      if (this.targets.answer > 0.01) {
        const i = (Math.random() * ANSWER_NOTES.length) | 0;
        const j = Math.max(0, Math.min(ANSWER_NOTES.length - 1, i + pick([-2, -1, 1, 2])));
        this.note(ANSWER_NOTES[i], 0.03, 0, this.layers.answer);
        this.note(ANSWER_NOTES[j], 0.024, 0.7, this.layers.answer);
      }
      this.later(answer, 7000 + Math.random() * 6000);
    };
    this.later(answer, 5000);

    const phrase = () => {
      if (this.targets.phrase > 0.01)
        pick(PHRASES).forEach((f, k) => this.note(f, 0.024, k * PHRASE_STEP_S, this.layers.phrase));
      this.later(phrase, 16000 + Math.random() * 10000);
    };
    this.later(phrase, 9000);
  }

  /**
   * Moves the gains towards `mix`, getting there in about `seconds`. Only what changed is
   * rescheduled, so a quick change (the wind of a place) never cuts a slow fade short (a new chapter).
   */
  apply(mix: Mix, seconds: number): void {
    this.move(this.out.pad.gain, mix.pad, seconds);
    this.move(this.out.box.gain, mix.box, seconds);
    this.move(this.song.gain, mix.song, seconds);
    for (const l of LAYERS) {
      this.targets[l.id] = mix.layers[l.id];
      this.move(this.layers[l.id].gain, mix.layers[l.id], seconds);
    }
    if (mix.wind !== this.windLevel) {
      this.windLevel = mix.wind;
      this.wind.setLevel(mix.wind, seconds);
    }
  }

  private move(param: AudioParam, value: number, seconds: number): void {
    if (this.heading.get(param) === value) return;
    this.heading.set(param, value);
    param.setTargetAtTime(value, this.ctx.currentTime, Math.max(0.01, seconds / 3));
  }

  /** A sine that never stops, breathing slowly. */
  private drone(freq: number, gain: number, rate: number, depth: number, out: AudioNode): void {
    const { ctx } = this;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = gain * (1 - depth / 2);
    lfo.frequency.value = rate;
    lg.gain.value = (gain * depth) / 2;
    lfo.connect(lg);
    lg.connect(g.gain);
    o.connect(g);
    g.connect(out);
    o.start();
    lfo.start();
  }

  /** A soft music-box note with a faint octave: rounder and lower than the drips. */
  private note(freq: number, gain: number, when: number, out: AudioNode): void {
    const { ctx } = this;
    const t = ctx.currentTime + when;
    for (const [f, g0] of [
      [freq, gain],
      [freq * 2, gain * 0.15],
    ]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(g0, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 2.7);
    }
  }
}

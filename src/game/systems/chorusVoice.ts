import { melodyLength, voiceMelody, type Melody, type VoicedNote } from './melody';

/** How much of the ambience is left while the chorus plays, and how it leaves and comes back (s). */
export const DUCK = { level: 0.3, fadeOut: 1.5, fadeIn: 4 } as const;

/** Loudness of one note at full accent, and how long a note keeps ringing after it is struck (s). */
const PEAK = 0.1;
const ring = (duration: number): number => Math.min(3.2, Math.max(1.3, duration * 2 + 0.9));
/** Partials of the music-box tone: [frequency ratio, level, share of the ring it lasts]. */
const PARTIALS: readonly (readonly [number, number, number])[] = [
  [1, 1, 1],
  [2, 0.22, 0.6],
  [4, 0.05, 0.25],
];
/** Scheduling starts a little ahead so the first note is not clipped. */
const LEAD = 0.06;

/**
 * The chorus of "Astronauta" as a music-box voice (AUD-01), plus the ducking of everything else.
 *
 * The rest of the soundscape is routed through `ambient` on its way out, so this class can lower
 * it without knowing what is in it; the melody goes out through its own gain and is not ducked.
 * Everything is scheduled on the audio clock: no timers, and a suspended context (hidden tab)
 * pauses melody and ducking together. Closing the context disposes of it all.
 */
export class ChorusVoice {
  /** Connect the ambient mix here instead of to the destination. */
  readonly ambient: GainNode;
  private readonly out: GainNode;
  private readonly notes: VoicedNote[];
  private readonly length: number;
  /** Audio-clock time at which the current take is over (tails included). */
  private endsAt = -1;
  private take: { bus: GainNode; sources: OscillatorNode[] } | null = null;

  constructor(
    private readonly ctx: AudioContext,
    melody: Melody,
    enabled: boolean,
  ) {
    this.notes = voiceMelody(melody);
    this.length = melodyLength(this.notes);

    this.ambient = ctx.createGain();
    this.ambient.connect(ctx.destination);

    const out = (this.out = ctx.createGain());
    out.gain.value = enabled ? 1 : 0;
    out.connect(ctx.destination);
  }

  get playing(): boolean {
    return this.ctx.currentTime < this.endsAt;
  }

  /** Follows the sound toggle. The melody keeps its place while muted. */
  setEnabled(on: boolean): void {
    const g = this.out.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(on ? 1 : 0, now + 0.4);
  }

  /** Plays the chorus once from the top. Does nothing if it is already playing. */
  play(): void {
    if (this.playing) return;
    const { ctx } = this;
    const t0 = ctx.currentTime + LEAD;
    const last = this.notes[this.notes.length - 1];
    const end = t0 + this.length + (last ? ring(last.duration) - last.duration : 0);

    // Its own short echo, like the chimes have, so the voice sits in the same space.
    const bus = ctx.createGain();
    const echo = ctx.createDelay();
    const feedback = ctx.createGain();
    const wet = ctx.createGain();
    echo.delayTime.value = 0.45;
    feedback.gain.value = 0.3;
    wet.gain.value = 0.22;
    bus.connect(this.out);
    bus.connect(echo);
    echo.connect(feedback);
    feedback.connect(echo);
    echo.connect(wet);
    wet.connect(this.out);

    const sources: OscillatorNode[] = [];
    for (const n of this.notes) {
      const t = t0 + n.start;
      const tail = ring(n.duration);
      for (const [ratio, level, share] of PARTIALS) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = n.freq * ratio;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(PEAK * n.accent * level, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + tail * share);
        o.connect(g);
        g.connect(bus);
        o.start(t);
        o.stop(t + tail * share + 0.05);
        sources.push(o);
      }
    }
    this.take = { bus, sources };
    this.endsAt = end;

    const a = this.ambient.gain;
    const now = ctx.currentTime;
    a.cancelScheduledValues(now);
    a.setValueAtTime(a.value, now);
    a.linearRampToValueAtTime(DUCK.level, now + DUCK.fadeOut);
    a.setValueAtTime(DUCK.level, end);
    a.linearRampToValueAtTime(1, end + DUCK.fadeIn);
  }

  /** Cuts the chorus short (debug only: in the game it always plays to the end). */
  stop(): void {
    const { ctx, take } = this;
    if (!take) return;
    const now = ctx.currentTime;
    take.bus.gain.setValueAtTime(take.bus.gain.value, now);
    take.bus.gain.linearRampToValueAtTime(0, now + 0.15);
    for (const o of take.sources) {
      try {
        o.stop(now + 0.2);
      } catch {
        // already stopped
      }
    }
    this.take = null;
    this.endsAt = -1;
    const a = this.ambient.gain;
    a.cancelScheduledValues(now);
    a.setValueAtTime(a.value, now);
    a.linearRampToValueAtTime(1, now + 1);
  }
}

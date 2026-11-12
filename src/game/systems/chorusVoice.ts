import { voiceMelody, type Melody, type VoicedNote } from './melody';

/**
 * Where the chorus goes out and how the rest of the soundscape makes room for it. This is the
 * only thing the voice knows about the mix; `AudioEngine.chorusSeam` decides both.
 */
export interface ChorusSeam {
  /** Node the melody is connected to. It must already follow the sound toggle. */
  output: AudioNode;
  /** `true` when the chorus starts, `false` when its last note has died away (or it is cut). */
  duck(on: boolean): void;
}

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

interface Take {
  bus: GainNode;
  sources: OscillatorNode[];
}

/**
 * The chorus of "Astronauta" as a music-box voice (AUD-01).
 *
 * Every note is scheduled up front on the audio clock and the end is signalled by the last
 * oscillator's `ended` event: no timers, and a suspended context (hidden tab) pauses the melody
 * and its ducking together. Closing the context disposes of it all.
 */
export class ChorusVoice {
  private readonly notes: VoicedNote[];
  /** Audio-clock time at which the current take is over (tails included). */
  private endsAt = -1;
  private take: Take | null = null;

  constructor(
    private readonly ctx: AudioContext,
    melody: Melody,
    private readonly seam: ChorusSeam,
  ) {
    this.notes = voiceMelody(melody);
  }

  get playing(): boolean {
    return this.ctx.currentTime < this.endsAt;
  }

  /** Plays the chorus once from the top. Does nothing if it is already playing. */
  play(): void {
    if (this.playing || !this.notes.length) return;
    const { ctx, seam } = this;
    const t0 = ctx.currentTime + LEAD;

    // Its own short echo, like the chimes have, so the voice sits in the same space.
    const bus = ctx.createGain();
    const echo = ctx.createDelay();
    const feedback = ctx.createGain();
    const wet = ctx.createGain();
    echo.delayTime.value = 0.45;
    feedback.gain.value = 0.3;
    wet.gain.value = 0.22;
    bus.connect(seam.output);
    bus.connect(echo);
    echo.connect(feedback);
    feedback.connect(echo);
    echo.connect(wet);
    wet.connect(seam.output);

    const take: Take = { bus, sources: [] };
    let end = t0;
    let last: OscillatorNode | null = null;
    for (const n of this.notes) {
      const t = t0 + n.start;
      const tail = ring(n.duration);
      for (const [ratio, level, share] of PARTIALS) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const stop = t + tail * share + 0.05;
        o.type = 'sine';
        o.frequency.value = n.freq * ratio;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(PEAK * n.accent * level, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + tail * share);
        o.connect(g);
        g.connect(bus);
        o.start(t);
        o.stop(stop);
        take.sources.push(o);
        if (stop > end) {
          end = stop;
          last = o;
        }
      }
    }
    // The ambience comes back when the last note has rung out, unless this take was cut first.
    if (last) {
      last.onended = () => {
        if (this.take !== take) return;
        this.take = null;
        seam.duck(false);
      };
    }
    this.take = take;
    this.endsAt = end;
    seam.duck(true);
  }

  /** Cuts the chorus short (debug only: in the game it always plays to the end). */
  stop(): void {
    const { ctx, take } = this;
    if (!take) return;
    this.take = null;
    this.endsAt = -1;
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
    this.seam.duck(false);
  }
}

import type { VoicedNote } from './melody';

/** Loudness of one note at full accent. Well under the melody's: the piano stays behind it. */
const PEAK = 0.045;
/** Harmonics of the tone, from the fundamental up: a mellow, felted piano. */
const HARMONICS = [1, 0.42, 0.2, 0.1, 0.05, 0.025];
/** The hammer: time to full level, then a quick drop to `BODY` of it before the slow decay (s). */
const ATTACK = 0.006;
const STRIKE = 0.14;
const BODY = 0.45;
/** How long a string keeps sounding after its note is over (pedal lifted), in seconds. */
const RELEASE = 0.5;
/** Rolls the brightness off so the arpeggio never competes with the music box. */
const CUTOFF_HZ = 1700;

export interface ScheduledVoice {
  sources: OscillatorNode[];
  /** Audio-clock time at which the last of them stops. */
  end: number;
  /** The source that stops last (null if there were no notes). */
  last: OscillatorNode | null;
}

/**
 * A soft piano-like voice, fully synthesized (AUD-01): one oscillator per note with a fixed
 * harmonic spectrum, a hammer-like envelope and a shared low-pass. Everything is scheduled up
 * front on the audio clock, from `t0`, into `destination`; there are no timers.
 */
export function schedulePiano(
  ctx: AudioContext,
  notes: readonly VoicedNote[],
  t0: number,
  destination: AudioNode,
): ScheduledVoice {
  const voice: ScheduledVoice = { sources: [], end: t0, last: null };
  if (!notes.length) return voice;

  const real = new Float32Array([0, ...HARMONICS.map(() => 0)]);
  const imag = new Float32Array([0, ...HARMONICS]);
  const wave = ctx.createPeriodicWave(real, imag);
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = CUTOFF_HZ;
  tone.Q.value = 0.3;
  tone.connect(destination);

  for (const n of notes) {
    const t = t0 + n.start;
    const off = t + n.duration;
    const peak = PEAK * n.accent;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.setPeriodicWave(wave);
    o.frequency.value = n.freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + ATTACK);
    g.gain.exponentialRampToValueAtTime(peak * BODY, t + STRIKE);
    // The string keeps fading while it is held, and is damped when the chord changes.
    g.gain.exponentialRampToValueAtTime(peak * BODY * 0.35, Math.max(off, t + STRIKE + 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, Math.max(off, t + STRIKE + 0.01) + RELEASE);
    o.connect(g);
    g.connect(tone);
    const stop = Math.max(off, t + STRIKE + 0.01) + RELEASE + 0.05;
    o.start(t);
    o.stop(stop);
    voice.sources.push(o);
    if (stop > voice.end) {
      voice.end = stop;
      voice.last = o;
    }
  }
  return voice;
}

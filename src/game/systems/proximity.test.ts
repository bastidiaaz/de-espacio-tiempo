import { describe, expect, it } from 'vitest';
import {
  ARP_NOTES,
  CUE_MAX_GAIN,
  PROXIMITY_FAR,
  PROXIMITY_NEAR,
  cueGain,
  panTowards,
  proximityLevel,
} from './proximity';

describe('proximityLevel', () => {
  it('is silent out of range, full up close, and grows as you approach', () => {
    expect(proximityLevel(PROXIMITY_FAR + 1)).toBe(0);
    expect(proximityLevel(PROXIMITY_NEAR)).toBe(1);
    expect(proximityLevel(1)).toBe(1);
    let prev = -1;
    for (let d = PROXIMITY_FAR; d >= PROXIMITY_NEAR; d -= 2) {
      const l = proximityLevel(d);
      expect(l).toBeGreaterThanOrEqual(prev);
      prev = l;
    }
  });
});

describe('cueGain', () => {
  it('silent at level 0, loudest at 1, and only grows in between', () => {
    expect(cueGain(0)).toBe(0);
    expect(cueGain(1)).toBe(CUE_MAX_GAIN);
    expect(cueGain(2)).toBe(CUE_MAX_GAIN);
    expect(cueGain(0.8)).toBeGreaterThan(cueGain(0.3));
  });
});

describe('ARP_NOTES', () => {
  it('stays on the A major add9 of the pad (A, C#, E, B), with a rest', () => {
    const pitchClass = (f: number) => Math.round(12 * Math.log2(f / 440) + 120) % 12;
    const notes = ARP_NOTES.filter((f): f is number => f !== null);
    expect(new Set(notes.map(pitchClass))).toEqual(new Set([0, 4, 7, 2]));
    expect(ARP_NOTES).toContain(null);
  });
});

describe('panTowards', () => {
  // yaw 0 looks down -Z: +X is to the right.
  it('pans to the side the object is on', () => {
    expect(panTowards(0, 10, 0)).toBeCloseTo(1);
    expect(panTowards(0, -10, 0)).toBeCloseTo(-1);
    expect(panTowards(0, 0, -10)).toBeCloseTo(0);
    expect(panTowards(0, 0, 10)).toBeCloseTo(0);
  });

  it('follows the camera as it turns', () => {
    // Turned 90° left (yaw +π/2 looks down -X): an object at -X is straight ahead, +Z is to the left.
    expect(panTowards(Math.PI / 2, -10, 0)).toBeCloseTo(0);
    expect(panTowards(Math.PI / 2, 0, 10)).toBeCloseTo(-1);
    expect(panTowards(0, 0, 0)).toBe(0);
  });
});

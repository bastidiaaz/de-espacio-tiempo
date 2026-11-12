import { describe, expect, it } from 'vitest';
import { POST, bloomLevels, grainFrame, postQualityFor } from './postConfig';

describe('postConfig', () => {
  it('keeps the glow the same share of the screen at any render height', () => {
    expect(bloomLevels(460)).toBe(3);
    expect(bloomLevels(920)).toBe(4);
    expect(bloomLevels(1840)).toBe(5);
  });

  it('clamps the number of blur levels', () => {
    expect(bloomLevels(0)).toBe(POST.bloom.minLevels);
    expect(bloomLevels(100)).toBe(POST.bloom.minLevels);
    expect(bloomLevels(100000)).toBe(POST.bloom.maxLevels);
  });

  it('steps the grain at its own rate and freezes it with reduced motion', () => {
    const step = 1 / POST.grain.fps;
    expect(grainFrame(step * 0.5, false)).toBe(grainFrame(step * 0.9, false));
    expect(grainFrame(step * 1.5, false)).not.toBe(grainFrame(step * 0.5, false));
    expect(grainFrame(123.4, true)).toBe(grainFrame(0, true));
  });

  it('picks the quality by pointer type', () => {
    expect(postQualityFor(false)).toBe(POST.quality.fine);
    expect(postQualityFor(true)).toBe(POST.quality.coarse);
  });
});

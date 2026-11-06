import { describe, expect, it } from 'vitest';
import { LOOK_LEVELS, parseLevel, snapToLevel, TEXT_LEVELS } from './accessibility';

describe('accessibility levels (ENG-09)', () => {
  it('include the original feel as a level', () => {
    expect(LOOK_LEVELS).toContain(1);
    expect(TEXT_LEVELS).toContain(1);
  });

  it('parses only exact levels', () => {
    expect(parseLevel('0.75', LOOK_LEVELS, 1)).toBe(0.75);
    expect(parseLevel(null, LOOK_LEVELS, 1)).toBe(1);
    expect(parseLevel(' ', LOOK_LEVELS, 1)).toBe(1);
    expect(parseLevel('NaN', LOOK_LEVELS, 1)).toBe(1);
    expect(parseLevel('0.8', LOOK_LEVELS, 1)).toBe(1);
  });

  it('snaps to the nearest level', () => {
    expect(snapToLevel(1.9, LOOK_LEVELS)).toBe(2);
    expect(snapToLevel(-3, LOOK_LEVELS)).toBe(0.5);
    expect(snapToLevel(99, TEXT_LEVELS)).toBe(1.5);
    expect(snapToLevel(Number.NaN, TEXT_LEVELS)).toBe(1);
  });
});

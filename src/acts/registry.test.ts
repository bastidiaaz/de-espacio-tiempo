import { describe, expect, it } from 'vitest';
import { ACTS, actByNumber } from './registry';

describe('act registry', () => {
  it('lists six acts numbered 1..6 with roman labels', () => {
    expect(ACTS.map((a) => a.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(ACTS.map((a) => a.roman)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI']);
  });

  it('has a loader exactly when an act is available', () => {
    for (const a of ACTS) expect(typeof a.load === 'function').toBe(a.available);
  });

  it('only Act I is available, titled Astronauta', () => {
    expect(ACTS.filter((a) => a.available).map((a) => a.number)).toEqual([1]);
    expect(actByNumber(1)?.title).toBe('Astronauta');
    expect(actByNumber(7)).toBeUndefined();
  });
});

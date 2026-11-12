import { describe, expect, it } from 'vitest';
import { BOIL_FRAMES, BOIL_LEVELS, boilCss, boilFilterId } from './boil';

describe('boilCss', () => {
  const css = boilCss();

  it('declares one animation per level, named after the class that uses it', () => {
    for (const level of Object.keys(BOIL_LEVELS)) expect(css).toContain(`@keyframes sk-${level}{`);
  });

  it('references every filter exactly once', () => {
    for (const level of Object.keys(BOIL_LEVELS) as (keyof typeof BOIL_LEVELS)[]) {
      for (let frame = 0; frame < BOIL_FRAMES; frame++) {
        const ref = `url(#${boilFilterId(level, frame)})`;
        expect(css.split(ref).length - 1).toBe(1);
      }
    }
  });

  it('starts at 0% and never declares 100%, so the loop holds the last drawing', () => {
    expect(css).toContain('0%{filter:url(#sk-boil-0)}');
    expect(css).not.toContain('100%{');
  });
});

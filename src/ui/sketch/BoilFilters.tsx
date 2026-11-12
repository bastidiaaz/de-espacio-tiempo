import { BOIL_FRAMES, BOIL_LEVELS, boilCss, boilFilterId, type BoilLevel } from './boil';

const LEVELS = Object.keys(BOIL_LEVELS) as BoilLevel[];
const FRAMES = Array.from({ length: BOIL_FRAMES }, (_, i) => i);
const CSS = boilCss();

/**
 * The SVG filters and keyframes of the boiling line. Render it once per page, anywhere; then any
 * element with the class `sk-boil` or `sk-boil-soft` (styles/sketch.css) boils.
 *
 * Cheap on purpose: one octave of noise, a handful of filters shared by every element, and a new
 * drawing only ~6 times per second (`--boil-cycle`). Under `prefers-reduced-motion` the animation
 * is paused on its first drawing: the line keeps its hand-drawn wobble but stops moving.
 */
export function BoilFilters() {
  return (
    <>
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          {LEVELS.flatMap((level) =>
            FRAMES.map((frame) => (
              // The region is padded so a stroke on the edge of its box isn't clipped when it moves.
              <filter
                key={`${level}-${frame}`}
                id={boilFilterId(level, frame)}
                x="-12%"
                y="-12%"
                width="124%"
                height="124%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.022 0.031"
                  numOctaves="1"
                  seed={3 + frame * 7}
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={BOIL_LEVELS[level]}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            )),
          )}
        </defs>
      </svg>
      <style>{CSS}</style>
    </>
  );
}

/**
 * Post-processing parameters (ART-04), all in one place. No Three.js here, so it stays testable in
 * Node; the passes live in `postFx.ts`.
 *
 * Everything works on the display-encoded (sRGB) image, exactly as it reaches the screen without
 * post-processing, so values are "what you see": 0 is black, 1 is white.
 */

/** `full`: bloom + vignette + grain. `lite`: vignette + grain (one pass). `off`: straight to the screen. */
export type PostQuality = 'full' | 'lite' | 'off';

export const POST_QUALITIES: readonly PostQuality[] = ['full', 'lite', 'off'];

export const POST = {
  /**
   * Quality by pointer type. The way out if a phone can't hold 60 fps: set `coarse` to `lite`
   * (drops the bloom passes) or `off` (zero cost, the original render path).
   */
  quality: { fine: 'full', coarse: 'full' } as Record<'fine' | 'coarse', PostQuality>,
  bloom: {
    /** Brightness (max channel) from which a pixel starts to glow. */
    threshold: 0.6,
    /** Soft transition below the threshold, so the glow doesn't pop in and out. */
    knee: 0.3,
    /** How much of the blurred light is laid back over the image. */
    intensity: 0.5,
    /** 0..1 weight of each wider blur level over the tighter one: higher is a broader, hazier glow. */
    spread: 0.6,
    /**
     * Height in pixels of the smallest blur level. The number of levels follows the render height,
     * so the glow covers the same share of the screen in retro (460 px) and at full resolution.
     */
    smallestLevel: 58,
    minLevels: 2,
    maxLevels: 6,
  },
  vignette: {
    /** Distance from the centre (0) to the corners (1) where the darkening starts and where it is full. */
    start: 0.45,
    end: 1.05,
    /** 0..1 how dark the corners get. */
    strength: 0.3,
  },
  grain: {
    /** Peak-to-peak amplitude over the image. One grain per rendered pixel, so it is chunky in retro. */
    amount: 0.05,
    /** The grain pattern changes this many times per second (film-like, not per frame). */
    fps: 12,
    /** With `prefers-reduced-motion` the grain stands still, and is turned down by this factor. */
    reducedMotionScale: 0.6,
  },
} as const;

export const postQualityFor = (coarsePointer: boolean): PostQuality =>
  coarsePointer ? POST.quality.coarse : POST.quality.fine;

/** Blur levels (each half the size of the previous one, starting at half the render height). */
export function bloomLevels(renderHeight: number): number {
  const { smallestLevel, minLevels, maxLevels } = POST.bloom;
  const levels = Math.round(Math.log2(Math.max(1, renderHeight) / smallestLevel));
  return Math.min(maxLevels, Math.max(minLevels, levels));
}

/** Grain pattern index for a moment in time: steps at `POST.grain.fps`, frozen with reduced motion. */
export const grainFrame = (time: number, reducedMotion: boolean): number =>
  reducedMotion ? 0 : Math.floor(time * POST.grain.fps);

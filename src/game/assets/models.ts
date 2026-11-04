/**
 * Every glTF model the game ships, in `public/models/` (ENG-10, flow in docs/assets.md).
 * `models.test.ts` fails if a file is missing from this list, goes over its budget, or lacks a credit.
 */

/** Triangle ceilings per kind of object. Mobile first: no real-time shadows, one Lambert material. */
export const TRIANGLE_BUDGET = {
  /** Scattered scenery (rocks, plants, debris). Repeated copies must be instanced. */
  prop: 600,
  /** A memory object the player stares at up close. */
  story: 2000,
  /** One-off set piece seen at scale (the ship). */
  hero: 8000,
} as const;

export type ModelKind = keyof typeof TRIANGLE_BUDGET;

export interface ModelEntry {
  /** File name inside `public/models/`. */
  file: string;
  kind: ModelKind;
  /** Where it came from, e.g. `polyfork:field-rock-5e37c6`. CREDITS.md must mention it. */
  source: string;
}

export const MODELS = {
  /** ENG-10 test asset: only placed in `#debug`. */
  testRock: { file: 'field-rock-5e37c6.glb', kind: 'prop', source: 'polyfork:field-rock-5e37c6' },
} as const satisfies Record<string, ModelEntry>;

export type ModelId = keyof typeof MODELS;

/** URL relative to the page, so it works under any `base` (vite.config.ts uses './'). */
export const modelUrl = (id: ModelId): string => `${import.meta.env.BASE_URL}models/${MODELS[id].file}`;

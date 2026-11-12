/**
 * What stands on and beyond the mirador's mountain (ART-08): crags along the crest and, past the
 * cliff, crystal spires that the fog turns into layered silhouettes under the ringed planet.
 * Two instanced meshes in all. Its own generator, derived from the seed.
 */
import * as THREE from 'three';
import { WATER } from '../config';
import { mulberry32 } from '../math/random';
import { TAU } from '../math/util';
import { buildInstanced, pick, pushInstance, tint, type InstanceEntry } from '../three/helpers';
import type { PropKit } from '../world/props';
import type { TerrainField } from '../world/terrain';
import { MIRADOR_HALF_WIDTH } from './hiddenLayout';
import { MOUNTAIN_END, type Mirador } from './mirador';

const SALT = 0x6c1ff5;
const SPIRES = 90;
const CRAGS = 46;

export function buildMiradorWorld(field: TerrainField, kit: PropKit, m: Mirador, seed: number): THREE.Group {
  const rng = mulberry32((seed ^ SALT) >>> 0);
  const group = new THREE.Group();
  const crystal: InstanceEntry[] = [];
  const rock: InstanceEntry[] = [];

  // Beyond the cliff: spires in depth, denser near its toe, a few of them tall enough to reach the horizon.
  for (let i = 0; i < SPIRES; i++) {
    const k = rng();
    const u = MOUNTAIN_END - 4 + k * k * 170;
    const v = (rng() - 0.5) * (240 + (u - MOUNTAIN_END) * 1.6);
    const { x, z } = m.world(u, v);
    const tall = rng() < 0.22;
    const h = tall ? 46 + rng() * 18 : 20 + rng() * 26;
    const w = h * (0.06 + rng() * 0.05);
    pushInstance(
      crystal,
      x,
      Math.max(field.groundAt(x, z), WATER) - 1.5,
      z,
      w,
      h,
      w,
      (rng() - 0.5) * 0.22,
      rng() * TAU,
      (rng() - 0.5) * 0.22,
      tint(rng, pick(rng, kit.palette.crystals)),
    );
  }

  // Along the crest, away from the peak: a jagged skyline that says "not this way".
  const crag = (u: number, v: number, h: number) => {
    const { x, z } = m.world(u, v);
    const w = 1.1 + rng() * 1.6;
    pushInstance(
      rock,
      x,
      field.groundAt(x, z) - 1,
      z,
      w,
      h,
      w,
      (rng() - 0.5) * 0.3,
      rng() * TAU,
      (rng() - 0.5) * 0.3,
      tint(rng, pick(rng, kit.palette.rocks)),
    );
  };
  for (let i = 0; i < CRAGS; i++) {
    const a = (rng() < 0.5 ? -1 : 1) * (0.075 + rng() * (MIRADOR_HALF_WIDTH - 0.045));
    const r = 386 + (rng() - 0.5) * 9;
    crag(Math.cos(a) * r, Math.sin(a) * r, 5 + rng() * 9);
  }
  // And flanking the plateau, where its sides drop.
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++) crag(381 + i * 6 + rng() * 3, side * (15 + rng() * 2.5), 3 + rng() * 5);

  const spire = new THREE.ConeGeometry(1, 1, 5, 1).translate(0, 0.5, 0);
  for (const im of [buildInstanced(spire, kit.mat.crystal, crystal), buildInstanced(spire, kit.mat.rock, rock)])
    if (im) group.add(im);
  return group;
}

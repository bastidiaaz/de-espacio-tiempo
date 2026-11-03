import * as THREE from 'three';
import { WATER } from '../config';
import type { Noise2D } from '../math/noise';
import type { Hash2 } from '../math/random';
import { smoothstep } from '../math/util';
import type { TerrainField } from './terrain';

const HEX = {
  deep: '#4f7f95',
  sand: '#f0c4a4',
  rock: '#8b78ad',
  rock2: '#a68ab5',
  frost: '#f6ecf6',
  lav: '#a993d8',
  lav2: '#c4a6e0',
  grass: '#4cae9c',
  grass2: '#9bd49a',
  bloom: '#f0a6c6',
  scorch: '#4a3d62',
} as const;

/** Per-triangle terrain color by height, slope, moisture noise and the crash trail. */
export class TerrainPalette {
  private readonly c: Record<keyof typeof HEX, THREE.Color>;
  private readonly tmp = new THREE.Color();
  private readonly field: TerrainField;
  private readonly noise: Noise2D;
  private readonly hash2: Hash2;

  constructor(field: TerrainField, noise: Noise2D, hash2: Hash2) {
    this.field = field;
    this.noise = noise;
    this.hash2 = hash2;
    this.c = Object.fromEntries(Object.entries(HEX).map(([k, v]) => [k, new THREE.Color(v)])) as Record<
      keyof typeof HEX,
      THREE.Color
    >;
  }

  color(x: number, y: number, z: number, ny: number, out: THREE.Color): void {
    const C = this.c;
    const m = this.noise(x * 0.012 + 300, z * 0.012 - 200) * 0.5 + 0.5;
    if (y < WATER - 1.2) out.copy(C.deep);
    else if (y < WATER + 0.5) out.copy(C.sand);
    else if (ny < 0.78) out.lerpColors(C.rock, C.rock2, m);
    else if (y > 12.5) out.copy(C.frost);
    else {
      out.lerpColors(C.grass, C.grass2, m);
      if (m > 0.75) out.lerp(C.bloom, (m - 0.75) * 2.2);
      const hi = smoothstep(6, 8.5, y);
      if (hi > 0) {
        this.tmp.lerpColors(C.lav, C.lav2, m);
        out.lerp(this.tmp, hi);
      }
    }
    const tr = this.field.trail(x, z);
    if (tr.t > 0.12) {
      const w = 2.5 + tr.t * 3.5;
      if (tr.d < w) out.lerp(C.scorch, (1 - tr.d / w) * 0.75 * smoothstep(0.12, 0.3, tr.t));
    }
    out.offsetHSL(0, 0, (this.hash2(x, z) - 0.5) * 0.06);
  }
}

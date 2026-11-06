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

/**
 * A patch of ground with its own color (ENG-13: the places of the hidden objects). Full strength
 * within `inner` m of (x, z), fading out by `outer` m, with a wavy edge so it doesn't read as a circle.
 */
export interface TintZone {
  x: number;
  z: number;
  inner: number;
  outer: number;
  color: THREE.Color;
  /** 0..1, how much of the zone's color replaces the ground's. */
  strength: number;
}

/** Per-triangle terrain color by height, slope, moisture noise, the crash trail and tint zones. */
export class TerrainPalette {
  private readonly c: Record<keyof typeof HEX, THREE.Color>;
  private readonly tmp = new THREE.Color();
  private readonly field: TerrainField;
  private readonly noise: Noise2D;
  private readonly hash2: Hash2;
  private readonly tints: readonly TintZone[];

  constructor(field: TerrainField, noise: Noise2D, hash2: Hash2, tints: readonly TintZone[] = []) {
    this.field = field;
    this.noise = noise;
    this.hash2 = hash2;
    this.tints = tints;
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
    for (const t of this.tints) {
      const dx = x - t.x;
      const dz = z - t.z;
      const d = Math.hypot(dx, dz);
      if (d > t.outer + 4) continue;
      const a = Math.atan2(dz, dx);
      const wobble = Math.sin(a * 5 + t.x * 0.1) * 2.5 + Math.sin(a * 3 - t.z * 0.1) * 1.5;
      const w = 1 - smoothstep(t.inner, t.outer, d + wobble);
      if (w > 0 && y >= WATER - 1.2) out.lerp(t.color, w * t.strength);
    }
    out.offsetHSL(0, 0, (this.hash2(x, z) - 0.5) * 0.06);
  }
}

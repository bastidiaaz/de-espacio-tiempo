import { CAMP_HEIGHT, CHUNK_STEP, SHIP_DISTANCE, SHIP_HEIGHT, WATER } from '../config';
import type { Noise2D } from '../math/noise';
import { mulberry32 } from '../math/random';
import { lerp, smoothstep, TAU } from '../math/util';

export interface TrailSample {
  /** 0 at camp, 1 at the ship. */
  t: number;
  /** Distance from the trail centerline. */
  d: number;
}

/**
 * The height field: procedural noise, shaped around the story
 * (flattened camp, crash trail, flattened crash site).
 * The camp is always at the world origin.
 */
export class TerrainField {
  readonly shipX: number;
  readonly shipZ: number;
  /** Unit direction camp -> ship. */
  readonly dirX: number;
  readonly dirZ: number;
  /** Unit perpendicular to the trail. */
  readonly perpX: number;
  readonly perpZ: number;
  private readonly noise: Noise2D;
  private readonly len2: number;

  constructor(noise: Noise2D, seed: number) {
    this.noise = noise;
    // Pick the gentlest direction for the crash trail.
    let sx = SHIP_DISTANCE;
    let sz = 0;
    const rr = mulberry32(seed ^ 0xabc);
    let best = 1e9;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU + rr() * 0.2;
      let sc = 0;
      for (let s = 1; s <= 10; s++) {
        const h = this.rawHeight(Math.cos(a) * s * 11, Math.sin(a) * s * 11);
        sc += Math.abs(h - 3) + (h < WATER ? 6 : 0);
      }
      if (sc < best) {
        best = sc;
        sx = Math.cos(a) * SHIP_DISTANCE;
        sz = Math.sin(a) * SHIP_DISTANCE;
      }
    }
    this.shipX = sx;
    this.shipZ = sz;
    this.len2 = sx * sx + sz * sz;
    this.dirX = sx / SHIP_DISTANCE;
    this.dirZ = sz / SHIP_DISTANCE;
    this.perpX = -this.dirZ;
    this.perpZ = this.dirX;
  }

  rawHeight(x: number, z: number): number {
    const noise = this.noise;
    const c = noise(x * 0.0045, z * 0.0045);
    let h = 0;
    let a = 1;
    let f = 0.015;
    let s = 0;
    for (let o = 0; o < 4; o++) {
      h += noise(x * f + o * 37.1, z * f - o * 19.7) * a;
      s += a;
      a *= 0.5;
      f *= 2.03;
    }
    h /= s;
    const r = 1 - Math.abs(noise(x * 0.008 + 120.5, z * 0.008 - 60.2));
    return c * 7 + h * 6 + Math.pow(r, 4) * 14 * smoothstep(-0.1, 0.6, c) + 1.5;
  }

  trail(x: number, z: number): TrailSample {
    const t = Math.min(1, Math.max(0, (x * this.shipX + z * this.shipZ) / this.len2));
    return { t, d: Math.hypot(x - this.shipX * t, z - this.shipZ * t) };
  }

  /** Point on the trail at fraction t, offset sideways by `lateral` meters. */
  onTrail(t: number, lateral: number): [number, number] {
    return [this.shipX * t + this.perpX * lateral, this.shipZ * t + this.perpZ * lateral];
  }

  /** Smooth height at any point. */
  heightAt(x: number, z: number): number {
    let h = this.rawHeight(x, z);
    const det = this.noise(x * 0.06 + 9, z * 0.06 - 4) * 0.45;
    const tr = this.trail(x, z);
    const base = lerp(CAMP_HEIGHT, SHIP_HEIGHT, tr.t) - 0.3 * smoothstep(0.1, 0.3, tr.t) + det;
    h = lerp(h, base, (1 - smoothstep(5, 14, tr.d)) * 0.95);
    h = lerp(h, CAMP_HEIGHT + det, 1 - smoothstep(12, 24, Math.hypot(x, z)));
    h = lerp(h, SHIP_HEIGHT + det, 1 - smoothstep(10, 22, Math.hypot(x - this.shipX, z - this.shipZ)));
    return h;
  }

  /** Height of the rendered low-poly surface (same triangulation as the chunk meshes). */
  groundAt(x: number, z: number): number {
    const gx = x / CHUNK_STEP;
    const gz = z / CHUNK_STEP;
    const ix = Math.floor(gx);
    const iz = Math.floor(gz);
    const u = gx - ix;
    const v = gz - iz;
    const x0 = ix * CHUNK_STEP;
    const z0 = iz * CHUNK_STEP;
    const x1 = (ix + 1) * CHUNK_STEP;
    const z1 = (iz + 1) * CHUNK_STEP;
    const h10 = this.heightAt(x1, z0);
    const h01 = this.heightAt(x0, z1);
    if (u + v <= 1) {
      const h00 = this.heightAt(x0, z0);
      return h00 + (h10 - h00) * u + (h01 - h00) * v;
    }
    const h11 = this.heightAt(x1, z1);
    return h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
  }
}

import * as THREE from 'three';
import { CHUNK_SIZE } from '../config';
import { lerp } from '../math/util';
import type { Sky } from './sky';
import type { TerrainField } from './terrain';

const palette = (p: Record<string, string>) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, new THREE.Color(v)])) as Record<
    'h' | 'm' | 't' | 's' | 'hs' | 'hg' | 'd',
    THREE.Color
  >;

/** Night -> dawn palettes. Act I caps k at PRE_DAWN (Game.ts), so it never gets near dawn. */
const NIGHT = palette({
  h: '#3d3a78',
  m: '#2b2c66',
  t: '#0f1233',
  s: '#7a6bd0',
  hs: '#8d9cff',
  hg: '#2a2350',
  d: '#9fb0ff',
});
const DAWN = palette({
  h: '#f2b3a6',
  m: '#d98fb0',
  t: '#5b5aa6',
  s: '#ffd9a0',
  hs: '#ffd8c8',
  hg: '#5a4a8a',
  d: '#ffc89a',
});

export interface AtmosphereDeps {
  fog: THREE.Fog;
  sky: Sky;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  motesMaterial: THREE.PointsMaterial;
  field: TerrainField;
  viewRadius: number;
}

/**
 * Owns the two story-driven dials:
 *  - k: 0 (deep night) -> 1 (dawn); driven by how much Isi has remembered, capped by the act
 *  - radius: how far Isi dares to look for now (fog + walkable area); it grows as the fear eases
 */
export class Atmosphere {
  kTarget: number;
  kCur: number;
  radiusTarget: number;
  radiusCur: number;
  private readonly d: AtmosphereDeps;

  constructor(deps: AtmosphereDeps, k: number, radius: number) {
    this.d = deps;
    this.kTarget = this.kCur = k;
    this.radiusTarget = this.radiusCur = radius;
  }

  /** Debug jumps: land on the targets now instead of easing towards them. */
  snap(chapter: number): void {
    this.kCur = this.kTarget;
    this.radiusCur = this.radiusTarget;
    this.d.sky.shipStar.material.opacity = chapter >= 4 ? 1 : 0;
  }

  update(dt: number, chapter: number): void {
    const { fog, sky, hemi, sun, motesMaterial, field, viewRadius } = this.d;
    this.kCur += (this.kTarget - this.kCur) * (1 - Math.exp(-dt * 0.25));
    const k = this.kCur;
    const u = sky.uniforms;
    u.cH.value.lerpColors(NIGHT.h, DAWN.h, k);
    u.cM.value.lerpColors(NIGHT.m, DAWN.m, k);
    u.cT.value.lerpColors(NIGHT.t, DAWN.t, k);
    u.cS.value.lerpColors(NIGHT.s, DAWN.s, k);
    fog.color.copy(u.cH.value);
    hemi.color.lerpColors(NIGHT.hs, DAWN.hs, k);
    hemi.groundColor.lerpColors(NIGHT.hg, DAWN.hg, k);
    hemi.intensity = lerp(1.1, 1.5, k);
    sun.color.lerpColors(NIGHT.d, DAWN.d, k);
    sun.intensity = lerp(0.35, 2.0, k);
    u.sunDir.value.set(field.dirX * 0.3 - 0.2, lerp(-0.25, 0.09, k), -1).normalize();
    sun.position.copy(u.sunDir.value).multiplyScalar(100);
    sky.starMaterial.opacity = lerp(0.95, 0.12, k);
    motesMaterial.opacity = lerp(0.85, 0.4, k);

    this.radiusCur += (this.radiusTarget - this.radiusCur) * (1 - Math.exp(-dt * 0.5));
    fog.near = Math.min(this.radiusCur * 0.35, 28);
    fog.far = Math.min(this.radiusCur + 14, viewRadius * CHUNK_SIZE - 6);

    const star = sky.shipStar.material;
    star.opacity += ((chapter >= 4 ? 1 : 0) - star.opacity) * dt * 0.5;
  }
}

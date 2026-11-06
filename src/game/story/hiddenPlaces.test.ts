import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { WATER } from '../config';
import { makeNoise } from '../math/noise';
import { TerrainField } from '../world/terrain';
import { HIDDEN_IDS } from '../../content/story';
import { createPropKit } from '../world/props';
import { HiddenSet } from './hidden';
import {
  FIRE_EYE,
  HILL_CLEARANCE,
  ISLET,
  MAX_SCALE,
  MIN_SILHOUETTE,
  buildPlaces,
  horizonTowards,
  islandModifier,
} from './hiddenPlaces';

describe('islandModifier', () => {
  const island = islandModifier(250, 0);

  it('leaves the terrain untouched away from the island', () => {
    for (const h of [-3, 0, 5, 12]) {
      expect(island(250 + 17, 0, h)).toBe(h);
      expect(island(0, 0, h)).toBe(h);
    }
  });

  it('keeps the islet dry and sinks the moat under the water', () => {
    for (const h of [WATER - 0.5, 0, 4, 9]) {
      expect(island(250, 0, h)).toBeGreaterThan(WATER + 0.5);
      expect(island(250 + ISLET - 1, 0, h)).toBeGreaterThan(WATER + 0.5);
      expect(island(250, 10, h)).toBeLessThan(WATER - 0.6); // swimming depth, as in player.ts
      expect(island(240, 0, h)).toBeLessThan(WATER - 0.6);
    }
  });

  it('never applies near camp once added to a field', () => {
    const field = new TerrainField(makeNoise(12345), 12345);
    const before = [field.heightAt(10, 20), field.heightAt(-120, 60), field.groundAt(100, -40)];
    field.addModifier(islandModifier(250, 0));
    expect([field.heightAt(10, 20), field.heightAt(-120, 60), field.groundAt(100, -40)]).toEqual(before);
    expect(field.groundAt(250, 0)).toBeGreaterThan(WATER + 0.5);
  });
});

describe('structures and trails, seen from the fire', () => {
  const seeds = Array.from({ length: 20 }, (_, i) => i * 7919 + 11);
  const build = (seed: number) => {
    const field = new TerrainField(makeNoise(seed), seed);
    return new HiddenSet(field, createPropKit(), new THREE.Texture(), seed);
  };

  it.each(seeds)('seed %i: every structure rises as a silhouette above the horizon', (seed) => {
    const hidden = build(seed);
    const ids = Object.keys(hidden.structures);
    expect(ids.sort()).toEqual(['campanil', 'earring', 'guitar', 'insulin']);
    const field = new TerrainField(makeNoise(seed), seed);
    for (const st of Object.values(hidden.structures)) {
      const elevation = Math.atan2(st!.top - FIRE_EYE, Math.hypot(st!.x, st!.z));
      expect(elevation).toBeGreaterThanOrEqual(MIN_SILHOUETTE - 1e-9);
      // ...and well above whatever hill stands in between, unless that hill is so big near camp
      // that the structure already hit its maximum size (it still shows, just less).
      const hill = horizonTowards(field, st!.x, st!.z);
      if (st!.scale < MAX_SCALE) expect(elevation).toBeGreaterThanOrEqual(hill + HILL_CLEARANCE - 1e-9);
      else expect(elevation).toBeGreaterThan(hill);
    }
  });

  it.each(seeds)('seed %i: a loose trail leads from near the fire towards each structure', (seed) => {
    const field = new TerrainField(makeNoise(seed), seed);
    const kit = createPropKit();
    const hidden = new HiddenSet(field, kit, new THREE.Texture(), seed);
    const { spots } = hidden.layout;
    const places = buildPlaces(new TerrainField(makeNoise(seed), seed), kit, spots, seed, HIDDEN_IDS);
    expect(places.trailPoints.letter).toBeUndefined(); // nothing points at the mirador
    for (const id of ['guitar', 'insulin', 'campanil', 'earring'] as const) {
      const st = places.structures[id]!;
      const points = places.trailPoints[id]!;
      expect(points.length, id).toBeGreaterThanOrEqual(3);
      expect(Math.hypot(points[0].x, points[0].z)).toBeLessThan(40); // seen from the fire
      for (let k = 1; k < points.length; k++) {
        const gap = Math.hypot(points[k].x - points[k - 1].x, points[k].z - points[k - 1].z);
        expect(gap).toBeLessThan(55); // never a long break
      }
      const D = Math.hypot(st.x, st.z);
      for (const p of points) {
        // Along the way to the structure, wandering a little to the sides.
        const along = (p.x * st.x + p.z * st.z) / D;
        const side = Math.abs(p.x * st.z - p.z * st.x) / D;
        expect(along).toBeGreaterThan(20);
        expect(along).toBeLessThan(D);
        expect(side).toBeLessThanOrEqual(20 + 1e-9);
      }
    }
  });
});

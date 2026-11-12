import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FREE_ROAM_RADIUS } from '../config';
import { makeNoise } from '../math/noise';
import { mulberry32 } from '../math/random';
import { EDGE_MARGIN, MIRADOR_FADE, miradorWeight } from '../systems/edge';
import { createPropKit } from '../world/props';
import { TerrainField } from '../world/terrain';
import { HiddenSet } from './hidden';
import { MIRADOR_HALF_WIDTH } from './hiddenLayout';
import { CLIFF_TOP, MOUNTAIN_END, MOUNTAIN_START, Mirador, PEAK_HEIGHT, RIM_CLEARANCE } from './mirador';

const seeds = Array.from({ length: 12 }, (_, i) => i * 7919 + 11).concat(12345);
const STOP = FREE_ROAM_RADIUS - EDGE_MARGIN;

describe('the mountain as a height modifier', () => {
  const m = new Mirador(0.9, 3, 77);

  it('leaves the terrain untouched near camp, outside its sector and past the cliff', () => {
    for (const h of [-3, 0, 5, 12]) {
      for (const r of [0, 150, 300, MOUNTAIN_START, MOUNTAIN_END, 500])
        for (let a = 0; a < 6.3; a += 0.37) expect(m.modifier(Math.cos(a) * r, Math.sin(a) * r, h)).toBe(h);
      for (const off of [MIRADOR_HALF_WIDTH + MIRADOR_FADE, 1, 2, Math.PI])
        for (const r of [350, 380, 400, 415])
          for (const s of [-1, 1])
            expect(m.modifier(Math.cos(0.9 + s * off) * r, Math.sin(0.9 + s * off) * r, h)).toBe(h);
    }
  });

  it('does not consume the world generator', () => {
    const before = mulberry32(77)();
    new Mirador(0.9, 3, 77);
    expect(mulberry32(77)()).toBe(before);
  });

  it('is deterministic per seed', () => {
    const again = new Mirador(0.9, 3, 77);
    for (const [x, z] of [
      [230, 290],
      [240, 300],
      [215, 330],
    ])
      expect(again.modifier(x, z, 1)).toBe(m.modifier(x, z, 1));
  });

  it('keeps the plateau flat one terrain cell past the free-roam stop', () => {
    expect(RIM_CLEARANCE).toBeGreaterThan(0);
  });
});

describe.each(seeds)('on real terrain, seed %i', (seed) => {
  const plain = new TerrainField(makeNoise(seed), seed);
  const field = new TerrainField(makeNoise(seed), seed);
  const hidden = new HiddenSet(field, createPropKit(), new THREE.Texture(), seed);
  const m = hidden.mirador;
  const out = (r: number, off = 0) => ({ x: Math.cos(m.angle + off) * r, z: Math.sin(m.angle + off) * r });

  it('never changes the world of the story', () => {
    for (const [x, z] of [
      [10, 20],
      [-120, 60],
      [100, -40],
      [out(MOUNTAIN_START - 4).x, out(MOUNTAIN_START - 4).z],
    ])
      expect(field.groundAt(x, z)).toBe(plain.groundAt(x, z));
  });

  it('has a walkable ramp from the plain to the plateau, never too steep', () => {
    const pts = m.pathPoints(1);
    let prev = field.groundAt(pts[0].x, pts[0].z);
    expect(prev).toBeLessThan(m.baseY + 3);
    for (const p of pts) {
      expect(m.walkable(p.x, p.z)).toBe(true);
      const y = field.groundAt(p.x, p.z);
      expect(Math.abs(y - prev)).toBeLessThan(0.85); // under ~40° on any metre of it
      prev = y;
    }
    expect(prev).toBeGreaterThan(m.topY - 6);
    expect(m.walkable(m.foot.x, m.foot.z)).toBe(true);
  });

  it('lets the player walk the plateau up to the stop, on level ground, with the cliff right after', () => {
    for (let r = 387; r <= STOP; r += 1.5)
      for (const side of [-8, 0, 8]) {
        const p = m.world(r, side);
        expect(m.walkable(p.x, p.z)).toBe(true);
        expect(field.groundAt(p.x, p.z)).toBeGreaterThan(m.topY - 6);
      }
    const rim = out(STOP);
    expect(field.groundAt(rim.x, rim.z)).toBeCloseTo(m.topY, 0);
    expect(STOP).toBeLessThan(CLIFF_TOP);
    const below = out(CLIFF_TOP + 11);
    expect(field.groundAt(below.x, below.z)).toBeLessThan(m.topY - PEAK_HEIGHT * 0.6);
  });

  it('puts the letter on the plateau, with room to stand behind it', () => {
    const letter = hidden.items.find((h) => h.id === 'letter')!;
    const { x, z } = letter.obj.position;
    expect(m.walkable(x, z)).toBe(true);
    expect(letter.obj.position.y).toBeGreaterThan(m.topY - 2);
    const stand = hidden.standingSpot(letter, 3);
    expect(m.walkable(stand.x, stand.z)).toBe(true);
    expect(Math.hypot(x, z)).toBeLessThan(STOP - 2);
  });

  it('blocks the rest of the ridge: the crest is only reached by the ramp', () => {
    // Walking straight out anywhere but at the ramp's foot, the player is stopped low on the flank.
    const ramp = m.pathPoints(1);
    for (let off = -MIRADOR_HALF_WIDTH + 0.02; off <= MIRADOR_HALF_WIDTH - 0.02; off += 0.02) {
      let r = MOUNTAIN_START - 2;
      let p = out(r, off);
      for (; r < STOP; r += 0.5) {
        const q = out(r, off);
        if (!m.walkable(q.x, q.z)) break;
        p = q;
      }
      if (ramp.some((s) => Math.hypot(s.x - p.x, s.z - p.z) < 8)) continue;
      expect(r, `off ${off.toFixed(2)}`).toBeLessThan(376);
      expect(m.reveal(p.x, p.z, field.groundAt(p.x, p.z))).toBeLessThan(0.05);
    }
  });

  it('slides along the steep flank instead of climbing it', () => {
    const wall = out(366);
    expect(m.walkable(wall.x, wall.z)).toBe(false);
    const from = out(346);
    expect(m.walkable(from.x, from.z)).toBe(true);
    const s = m.resolveStep(from.x, from.z, wall.x, wall.z);
    expect(m.walkable(s.x, s.z)).toBe(true);
    // Already inside (a debug jump): free to walk out.
    expect(m.resolveStep(wall.x, wall.z, wall.x + 1, wall.z)).toEqual({ x: wall.x + 1, z: wall.z });
  });

  it('reveals its sky with the climb: nothing at the foot or elsewhere, everything at the rim', () => {
    const y = (p: { x: number; z: number }) => field.groundAt(p.x, p.z);
    expect(m.reveal(m.foot.x, m.foot.z, y(m.foot))).toBe(0);
    expect(m.reveal(0, 0, 50)).toBe(0);
    expect(m.reveal(-m.summit.x, -m.summit.z, m.topY)).toBe(0);
    expect(m.reveal(out(STOP).x, out(STOP).z, y(out(STOP)))).toBeGreaterThan(0.99);
    let prev = 0;
    for (const p of m.pathPoints(2)) {
      const r = m.reveal(p.x, p.z, y(p));
      expect(r).toBeGreaterThanOrEqual(prev - 0.02);
      prev = r;
    }
    expect(prev).toBeGreaterThan(0.85);
  });

  it('stands where the edge does not go dark (ENG-14)', () => {
    expect(miradorWeight(m.summit.x, m.summit.z, hidden.layout.miradorAngle)).toBe(1);
  });
});

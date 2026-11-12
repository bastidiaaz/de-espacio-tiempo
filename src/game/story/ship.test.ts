import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { TRIANGLE_BUDGET } from '../assets/models';
import { SHIP, buildShip } from './ship';

const flat = () => 0;
const build = (groundAt: (x: number, z: number) => number = flat) => buildShip(new THREE.Texture(), groundAt);
const meshOf = (group: THREE.Group) => group.children.find((o): o is THREE.Mesh => o instanceof THREE.Mesh)!;

describe('buildShip (ART-05)', () => {
  it('fits the mobile budget of a hero piece, in one baked mesh with vertex colours', () => {
    const ship = build();
    expect(ship.triangles).toBeGreaterThan(1000);
    expect(ship.triangles).toBeLessThanOrEqual(TRIANGLE_BUDGET.hero);
    const meshes = ship.group.children.filter((o) => o instanceof THREE.Mesh);
    // The wreck and the lamp: two draw calls (plus the lamp's glow sprite).
    expect(meshes).toHaveLength(2);
    const { geometry, material } = meshOf(ship.group);
    expect(geometry.getAttribute('color').count).toBe(ship.triangles * 3);
    expect((material as THREE.MeshLambertMaterial).flatShading).toBe(true);
    expect((material as THREE.MeshLambertMaterial).vertexColors).toBe(true);
  });

  it('is the size of a bus: about 12 m long, 3 to 4 m of hull', () => {
    // Only the hull: the mesh near the centre line and above the ploughed earth and the scattered pieces.
    const pos = meshOf(build().group).geometry.getAttribute('position');
    let minX = Infinity;
    let maxX = -Infinity;
    let top = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getZ(i)) > 1.2 || pos.getY(i) < 1.5) continue;
      minX = Math.min(minX, pos.getX(i));
      maxX = Math.max(maxX, pos.getX(i));
      if (pos.getX(i) > 2) top = Math.max(top, pos.getY(i));
    }
    expect(maxX - minX).toBeGreaterThan(11);
    expect(maxX - minX).toBeLessThan(13.5);
    expect(Math.max(maxX, -minX)).toBeLessThanOrEqual(SHIP.halfLength + 0.3);
    // Cabin and canopy (the antenna behind them stands taller).
    expect(top).toBeGreaterThan(3);
    expect(top).toBeLessThan(4.3);
  });

  it('is the same wreck every time (no world rng, no Math.random)', () => {
    const a = meshOf(build().group).geometry.getAttribute('position').array;
    const b = meshOf(build().group).geometry.getAttribute('position').array;
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('rests its loose pieces on the ground it is given', () => {
    const lifted = meshOf(build(() => 3).group).geometry.boundingBox!;
    const level = meshOf(build().group).geometry.boundingBox!;
    // The hull keeps its place; only what lies around it follows the terrain.
    expect(lifted.max.y).toBeCloseTo(Math.max(level.max.y, lifted.max.y));
    expect(lifted.min.y).toBeGreaterThanOrEqual(level.min.y - 1e-6);
  });

  it('blocks the way along the whole hull', () => {
    const { colliders } = build();
    for (let x = -SHIP.halfLength + 1; x <= SHIP.halfLength - 1; x += 0.5) {
      expect(colliders.some((c) => Math.hypot(c.x - x, c.z) < c.r)).toBe(true);
    }
  });
});

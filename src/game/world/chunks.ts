import * as THREE from 'three';
import { CHUNK_SEGMENTS as SEG, CHUNK_SIZE as CH, CHUNK_STEP as STEP, WATER } from '../config';
import { mulberry32, type Rng } from '../math/random';
import { TAU } from '../math/util';
import { buildInstanced, pick, pushInstance, tint } from '../three/helpers';
import type { Collider } from './collision';
import type { TerrainPalette } from './palette';
import { emptyPropLists, placeMushroom, type PropKind, type PropKit, type PropLists } from './props';
import type { TerrainField } from './terrain';

interface Chunk {
  group: THREE.Group;
  colliders: Collider[];
  cx: number;
  cz: number;
}

const _V = new THREE.Vector3();

/** Streams terrain + scattered props in square chunks around the player. */
export class ChunkManager {
  readonly group = new THREE.Group();
  private readonly chunks = new Map<string, Chunk>();
  private readonly queue: [number, number, number][] = [];
  private lastKey = '';
  private readonly field: TerrainField;
  private readonly palette: TerrainPalette;
  private readonly kit: PropKit;
  private readonly seed: number;
  private readonly radius: number;
  private readonly clearings: readonly Collider[];

  /**
   * `clearings`: circles kept free of scattered props (the hideouts of the hidden objects, ENG-13).
   * Props are still generated there and dropped afterwards, so the `rng()` sequence is unchanged.
   */
  constructor(
    field: TerrainField,
    palette: TerrainPalette,
    kit: PropKit,
    seed: number,
    radius: number,
    clearings: readonly Collider[] = [],
  ) {
    this.field = field;
    this.palette = palette;
    this.kit = kit;
    this.seed = seed;
    this.radius = radius;
    this.clearings = clearings;
  }

  /** Load/unload around (x, z). `sync` builds everything needed right now. */
  update(x: number, z: number, sync: boolean): void {
    const R = this.radius;
    const pcx = Math.floor(x / CH);
    const pcz = Math.floor(z / CH);
    const pk = pcx + ',' + pcz;
    if (pk !== this.lastKey) {
      this.lastKey = pk;
      for (const [k, c] of this.chunks)
        if (Math.abs(c.cx - pcx) > R + 1 || Math.abs(c.cz - pcz) > R + 1) this.unload(k);
      this.queue.length = 0;
      for (let dz = -R; dz <= R; dz++)
        for (let dx = -R; dx <= R; dx++) {
          const k = pcx + dx + ',' + (pcz + dz);
          if (!this.chunks.has(k)) this.queue.push([pcx + dx, pcz + dz, dx * dx + dz * dz]);
        }
      this.queue.sort((a, b) => a[2] - b[2]);
    }
    let budget = sync ? Infinity : this.queue.length > 6 ? 2 : 1;
    while (budget-- > 0 && this.queue.length) {
      const [a, b] = this.queue.shift()!;
      if (!this.chunks.has(a + ',' + b)) this.build(a, b);
    }
  }

  /** Colliders of the 3x3 chunks around (x, z). */
  collidersNear(x: number, z: number): Collider[] {
    const pcx = Math.floor(x / CH);
    const pcz = Math.floor(z / CH);
    const out: Collider[] = [];
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        const c = this.chunks.get(pcx + dx + ',' + (pcz + dz));
        if (c) out.push(...c.colliders);
      }
    return out;
  }

  dispose(): void {
    for (const k of [...this.chunks.keys()]) this.unload(k);
  }

  private unload(key: string): void {
    const c = this.chunks.get(key);
    if (!c) return;
    this.group.remove(c.group);
    c.group.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) o.dispose();
      else if (o instanceof THREE.Mesh && o.material === this.kit.mat.terrain) o.geometry.dispose();
    });
    this.chunks.delete(key);
  }

  /** Drop the props (and their colliders) that landed in a clearing. Floating islets stay. */
  private clear(cx: number, cz: number, L: PropLists, colliders: Collider[]): void {
    const near = this.clearings.filter(
      (c) =>
        c.x + c.r > cx * CH && c.x - c.r < (cx + 1) * CH && c.z + c.r > cz * CH && c.z - c.r < (cz + 1) * CH,
    );
    if (!near.length) return;
    const inside = (x: number, z: number) => near.some((c) => Math.hypot(x - c.x, z - c.z) < c.r);
    for (const k of Object.keys(L) as PropKind[]) {
      if (k === 'float') continue;
      L[k] = L[k].filter(({ m }) => {
        const [x, y, z] = [m.elements[12], m.elements[13], m.elements[14]];
        // Islets (and the mushrooms on them) float 16 m or more above the ground.
        return !inside(x, z) || y > this.field.groundAt(x, z) + 9;
      });
    }
    for (let i = colliders.length - 1; i >= 0; i--) if (inside(colliders[i].x, colliders[i].z)) colliders.splice(i, 1);
  }

  private build(cx: number, cz: number): void {
    const { field, kit } = this;
    const key = cx + ',' + cz;
    const rng: Rng = mulberry32(((cx * 73856093) ^ (cz * 19349663) ^ this.seed) >>> 0);
    const N = SEG + 1;
    const hs = new Float32Array(N * N);
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) hs[j * N + i] = field.heightAt((cx * SEG + i) * STEP, (cz * SEG + j) * STEP);

    // --- terrain mesh: flat-shaded, one color per triangle ---
    const pos = new Float32Array(SEG * SEG * 18);
    const col = new Float32Array(SEG * SEG * 18);
    const tc = new THREE.Color();
    let p = 0;
    const tri = (
      ax: number,
      ay: number,
      az: number,
      bx: number,
      by: number,
      bz: number,
      qx: number,
      qy: number,
      qz: number,
    ) => {
      pos[p] = ax;
      pos[p + 1] = ay;
      pos[p + 2] = az;
      pos[p + 3] = bx;
      pos[p + 4] = by;
      pos[p + 5] = bz;
      pos[p + 6] = qx;
      pos[p + 7] = qy;
      pos[p + 8] = qz;
      const ux = bx - ax,
        uy = by - ay,
        uz = bz - az,
        vx = qx - ax,
        vy = qy - ay,
        vz = qz - az;
      const nx = uy * vz - uz * vy,
        ny = uz * vx - ux * vz,
        nz = ux * vy - uy * vx;
      this.palette.color((ax + bx + qx) / 3, (ay + by + qy) / 3, (az + bz + qz) / 3, ny / Math.hypot(nx, ny, nz), tc);
      for (let k = 0; k < 3; k++) {
        col[p + k * 3] = tc.r;
        col[p + k * 3 + 1] = tc.g;
        col[p + k * 3 + 2] = tc.b;
      }
      p += 9;
    };
    for (let j = 0; j < SEG; j++)
      for (let i = 0; i < SEG; i++) {
        const x0 = (cx * SEG + i) * STEP,
          x1 = (cx * SEG + i + 1) * STEP;
        const z0 = (cz * SEG + j) * STEP,
          z1 = (cz * SEG + j + 1) * STEP;
        const h00 = hs[j * N + i],
          h10 = hs[j * N + i + 1],
          h01 = hs[(j + 1) * N + i],
          h11 = hs[(j + 1) * N + i + 1];
        tri(x0, h00, z0, x0, h01, z1, x1, h10, z0);
        tri(x1, h10, z0, x0, h01, z1, x1, h11, z1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const group = new THREE.Group();
    group.add(new THREE.Mesh(g, kit.mat.terrain));

    // --- scattered props (order of rng() calls defines the world: do not reorder) ---
    const L = emptyPropLists();
    const colliders: Collider[] = [];
    const ox = cx * CH,
      oz = cz * CH;
    const P = kit.palette;
    const ground = (x: number, z: number) => field.groundAt(x, z);
    for (let k = 0; k < 70; k++) {
      const x = ox + rng() * CH,
        z = oz + rng() * CH,
        y = ground(x, z),
        r = rng();
      if (
        y < WATER + 0.3 ||
        Math.hypot(x, z) < 16 ||
        field.trail(x, z).d < 6 ||
        Math.hypot(x - field.shipX, z - field.shipZ) < 14
      )
        continue;
      const slope = Math.abs(ground(x + 1, z) - y) + Math.abs(ground(x, z + 1) - y);
      if (y <= 7) {
        if (r < 0.07 && slope < 1) {
          placeMushroom(L, kit, rng, x, y, z, true);
          colliders.push({ x, z, r: 0.45 });
          for (let n = 0; n < 2; n++) {
            const a = rng() * TAU,
              d = 1.6 + rng(),
              sx = x + Math.cos(a) * d,
              sz = z + Math.sin(a) * d;
            placeMushroom(L, kit, rng, sx, ground(sx, sz), sz, false);
          }
        } else if (r < 0.22) {
          const c = pick(rng, P.bulbs),
            n = 1 + ((rng() * 3) | 0);
          for (let s = 0; s < n; s++) {
            const sx = x + (rng() - 0.5) * 0.8,
              sz = z + (rng() - 0.5) * 0.8,
              sy = ground(sx, sz),
              h = 0.8 + rng() * 1.1;
            const q = pushInstance(L.stalk, sx, sy, sz, 1, h, 1, (rng() - 0.5) * 0.4, 0, (rng() - 0.5) * 0.4);
            _V.set(0, h, 0).applyQuaternion(q);
            pushInstance(L.bulb, sx + _V.x, sy + _V.y, sz + _V.z, 1, 1.15, 1, 0, rng() * TAU, 0, c);
          }
        } else if (r < 0.7) {
          for (let s = 0; s < 3; s++)
            pushInstance(
              L.tuft,
              x + (rng() - 0.5) * 0.5,
              y - 0.05,
              z + (rng() - 0.5) * 0.5,
              1,
              0.5 + rng() * 0.8,
              1,
              (rng() - 0.5) * 0.7,
              rng() * TAU,
              (rng() - 0.5) * 0.7,
              tint(rng, P.tufts[(rng() * 3) | 0]),
            );
        } else if (r < 0.76) {
          const s = 0.5 + rng() * 1.1;
          pushInstance(
            L.rock,
            x,
            y + s * 0.15,
            z,
            s,
            s * 0.7,
            s * 0.9,
            rng(),
            rng() * TAU,
            rng(),
            tint(rng, pick(rng, P.rocks)),
          );
          colliders.push({ x, z, r: s * 0.85 });
        }
      } else if (y <= 12.5) {
        if (r < 0.16) {
          const c = pick(rng, P.crystals),
            n = 1 + ((rng() * 4) | 0);
          for (let s = 0; s < n; s++) {
            const k2 = 0.6 + rng() * 0.9;
            pushInstance(
              L.crystal,
              x + (rng() - 0.5),
              y + 0.2,
              z + (rng() - 0.5),
              0.5 * k2,
              (1.4 + rng() * 1.2) * k2,
              0.5 * k2,
              (rng() - 0.5) * 0.8,
              rng() * TAU,
              (rng() - 0.5) * 0.8,
              tint(rng, c),
            );
          }
          colliders.push({ x, z, r: 0.7 });
        } else if (r < 0.3) {
          const s = 0.6 + rng() * 1.4;
          pushInstance(
            L.rock,
            x,
            y + s * 0.15,
            z,
            s,
            s * 0.7,
            s * 0.9,
            rng(),
            rng() * TAU,
            rng(),
            tint(rng, pick(rng, P.rocks)),
          );
          colliders.push({ x, z, r: s * 0.85 });
        } else if (r < 0.6) {
          for (let s = 0; s < 3; s++)
            pushInstance(
              L.tuft,
              x + (rng() - 0.5) * 0.5,
              y - 0.05,
              z + (rng() - 0.5) * 0.5,
              1,
              0.4 + rng() * 0.6,
              1,
              (rng() - 0.5) * 0.7,
              rng() * TAU,
              (rng() - 0.5) * 0.7,
              tint(rng, P.tufts[3]),
            );
        }
      } else if (r < 0.2) {
        pushInstance(
          L.crystal,
          x,
          y + 0.3,
          z,
          0.6,
          2 + rng() * 2,
          0.6,
          (rng() - 0.5) * 0.5,
          rng() * TAU,
          (rng() - 0.5) * 0.5,
          pick(rng, P.crystals),
        );
        colliders.push({ x, z, r: 0.6 });
      }
    }
    // Floating islets.
    if (rng() < 0.2) {
      const x = ox + rng() * CH,
        z = oz + rng() * CH,
        base = Math.max(ground(x, z), WATER) + 16 + rng() * 14;
      const w = 3 + rng() * 3,
        h = 4 + rng() * 3;
      pushInstance(L.float, x, base, z, w, h, w, 0, rng() * TAU, 0, tint(rng, pick(rng, P.rocks)));
      if (rng() < 0.7) placeMushroom(L, kit, rng, x, base + h * 0.5, z, true);
    }
    this.clear(cx, cz, L, colliders);
    for (const k of Object.keys(L) as PropKind[]) {
      const im = buildInstanced(kit.geo[k], kit.mat[k === 'float' ? 'rock' : k], L[k]);
      if (im) group.add(im);
    }
    this.group.add(group);
    this.chunks.set(key, { group, colliders, cx, cz });
  }
}

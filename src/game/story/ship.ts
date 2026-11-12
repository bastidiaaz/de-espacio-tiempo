import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../math/random';
import { additiveSprite, basic, lam } from '../three/helpers';

/**
 * Isi's ship (ART-05, DIS-08): the size of a bus, huge and already wrecked. Procedural, in the
 * game's flat low-poly look: every part is baked into ONE geometry with vertex colours (one draw
 * call, one Lambert material, like a model from `loadModel`), plus the blinking lamp and its glow.
 *
 * Local frame of the returned group: +X is the nose, +Y is up, the origin sits on the ground under
 * the middle of the hull. Never draws from the world's `rng()`: the scattered plates use their own
 * fixed generator, the same for every seed.
 */
export const SHIP = {
  /** Nose tip to nozzle (m): a bus. */
  length: 12.6,
  /** Half of it: what the reveal's camera keeps clear of. */
  halfLength: 6.4,
  /** Hull radius. */
  radius: 1.9,
} as const;

/** How far the hull is turned away from the line to camp (rad). */
export const SHIP_SKEW = 0.5;

const C = {
  cream: 0xfff0dc,
  /** Scorched, dusty hull plates. */
  worn: 0xcfc2bd,
  soot: 0x6a5d78,
  orange: 0xf3a25e,
  rust: 0xb8683f,
  char: 0x3b3350,
  /** Inside of the hull, seen through the break and the missing plates. */
  dark: 0x231e3a,
  visor: 0x35577a,
  grey: 0x9a93b0,
  /** Ploughed-up ground, from the terrain palette (scorch / rock). */
  dirt: 0x5f5480,
  stone: 0x8b78ad,
} as const;

const SIDES = 10;
/** Distance from the axis to the middle of a hull facet, per unit of radius. */
const APOTHEM = Math.cos(Math.PI / SIDES);
/** Angle between two facets: the top one is centred at 0. */
const FACET = (Math.PI * 2) / SIDES;

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

/** Collects coloured parts under a stack of transforms and bakes them into one geometry. */
class Builder {
  private readonly parts: THREE.BufferGeometry[] = [];
  private base = new THREE.Matrix4();

  /** Runs `fn` with `m` applied on top of the current transform. */
  within(m: THREE.Matrix4, fn: () => void): void {
    const prev = this.base;
    this.base = prev.clone().multiply(m);
    fn();
    this.base = prev;
  }

  /** Same argument order as `mesh()` in three/helpers. Takes ownership of `geo`. */
  add(
    geo: THREE.BufferGeometry,
    color: number,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1,
  ): void {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    _q.setFromEuler(_e.set(rx, ry, rz));
    g.applyMatrix4(new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)).premultiply(this.base));
    // Flat shading derives the normals in the shader: position + colour is all the mesh needs.
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');
    const n = g.getAttribute('position').count;
    const colors = new Float32Array(n * 3);
    _c.set(color);
    for (let i = 0; i < n; i++) colors.set([_c.r, _c.g, _c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.parts.push(g);
  }

  /** A local point through the current transform. */
  point(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(x, y, z).applyMatrix4(this.base);
  }

  build(): THREE.BufferGeometry {
    const merged = mergeGeometries(this.parts)!;
    this.parts.forEach((g) => g.dispose());
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    return merged;
  }
}

const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);
const transform = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1),
  );

export interface ShipModel {
  group: THREE.Group;
  /** Triangles of the baked mesh (budget: `TRIANGLE_BUDGET.hero`). */
  triangles: number;
  /** Circles to walk around, in the group's local XZ. */
  colliders: { x: number; z: number; r: number }[];
  /** The red lamp blinks. */
  update(time: number): void;
}

/**
 * `groundAt(x, z)`: height of the ground at a local point, relative to the group's origin, so the
 * torn-off pieces and the ploughed earth sit on the terrain while the hull keeps its own tilt.
 */
export function buildShip(glow: THREE.Texture, groundAt: (x: number, z: number) => number): ShipModel {
  const b = new Builder();
  const R: number = SHIP.radius;

  /** A length of hull along X, from x0 (radius r0) to x1 (radius r1). */
  const tube = (color: number, x0: number, x1: number, r0: number, r1: number, open = false, sides = SIDES) =>
    b.add(
      new THREE.CylinderGeometry(r1, r0, Math.abs(x1 - x0), sides, 1, open),
      color,
      (x0 + x1) / 2,
      0,
      0,
      0,
      0,
      -Math.PI / 2,
    );
  /** A plate lying on the hull facet `k` (0 = top, counted towards +Z), lifted `lift` m off it. */
  const plate = (color: number, x: number, k: number, len: number, wide: number, lift = 0.03, tilt = 0, r = R) => {
    const a = k * FACET;
    const d = r * APOTHEM + lift;
    b.add(box(len, 0.07, wide), color, x, Math.cos(a) * d, Math.sin(a) * d, a, 0, tilt);
  };
  /** A structural ring around the axis. */
  const rib = (x: number, r: number) =>
    b.add(new THREE.TorusGeometry(r, 0.1, 4, SIDES), C.grey, x, 0, 0, 0, Math.PI / 2, 0);

  let lampAt = new THREE.Vector3();

  // ------------------------------------------------------------------ the hull, tilted and dug in
  // Rolled to one side, nose down in the earth it ploughed up.
  b.within(transform(0, 1.72, 0, 0.13, 0, -0.055), () => {
    // --- forward section: cabin and nose ---
    tube(C.cream, 0.8, 4.4, R, R * 0.96, true);
    tube(C.dark, 0.95, 4.4, R * 0.93, R * 0.9, true);
    tube(C.cream, 4.4, 5.8, R * 0.96, 0.75);
    // Crumpled tip, bent down into the ground.
    b.add(new THREE.ConeGeometry(0.78, 1.1, 7), C.worn, 6.15, -0.22, 0.05, 0, 0, -Math.PI / 2 - 0.55);
    tube(C.orange, 3.5, 4.0, R * 1.02, R * 1.01);
    tube(C.char, 4.0, 4.12, R * 1.0, R * 0.99);
    // Canopy, with its frame and a cracked pane.
    b.add(new THREE.IcosahedronGeometry(1.2, 1), C.visor, 3.0, 1.32, 0, 0, 0, 0, 1.65, 0.72, 0.95);
    b.add(box(0.12, 0.9, 2.1), C.cream, 3.05, 1.72, 0, 0, 0, 0.1);
    b.add(box(3.1, 0.1, 0.14), C.cream, 3.0, 2.2, 0, 0, 0, -0.04);
    b.add(box(0.9, 0.06, 0.7), C.dark, 3.75, 1.98, 0.42, 0.5, 0.2, -0.4);
    // Portholes down both sides.
    for (const x of [1.5, 2.35]) {
      plate(C.visor, x, 2, 0.5, 0.55, 0.02);
      plate(C.visor, x, -2, 0.5, 0.55, 0.02);
    }
    // Plates: scorched, missing (the dark inside shows) or peeling off.
    plate(C.worn, 2.0, 1, 1.5, 1.05);
    plate(C.dark, 1.5, -1, 1.1, 0.9, 0.015);
    plate(C.worn, 1.9, 3, 1.7, 1.05);
    plate(C.dark, 2.6, 4, 1.2, 0.85, 0.015);
    plate(C.soot, 4.9, 1, 0.9, 0.7, 0.03, 0, R * 0.78);
    plate(C.soot, 5.0, -2, 0.8, 0.7, 0.03, 0, R * 0.76);
    plate(C.cream, 1.3, -3, 1.3, 1.0, 0.32, 0.3);
    plate(C.orange, 2.9, -3, 0.8, 0.9, 0.04);
    // Antenna stub and a bent sensor boom on the roof.
    b.add(new THREE.CylinderGeometry(0.04, 0.06, 1.5, 5), C.grey, 1.4, 2.5, -0.5, 0.3, 0, 0.5);
    b.add(new THREE.CylinderGeometry(0.3, 0.05, 0.14, 8), C.cream, 1.05, 3.05, -0.72, 0.5, 0, 0.9);

    // --- the break: ribs, stringers, torn skin, hanging cables ---
    rib(0.85, R * 0.94);
    rib(-0.05, R * 0.9);
    for (let k = 0; k < SIDES; k++) {
      // Jagged edge of the forward skin: every other facet keeps a torn tongue of plate.
      if (k % 2 === 0) plate(C.cream, 0.45, k, 0.9, 0.8, 0.02, k % 4 === 0 ? 0.25 : -0.12);
      else plate(C.worn, 0.7, k, 0.4, 0.6, 0.02, 0.1);
    }
    // Stringers that still bridge the gap, bent.
    b.add(box(2.3, 0.1, 0.1), C.grey, -0.2, 1.55, 0.6, 0, 0.12, -0.16);
    b.add(box(2.0, 0.1, 0.1), C.grey, -0.1, -0.9, -1.45, 0, -0.1, 0.1);
    b.add(box(1.5, 0.1, 0.1), C.grey, 0.1, 0.5, 1.7, 0.3, 0.2, -0.3);
    // Deck plate hanging out of the cabin, and cables.
    b.add(box(1.9, 0.08, 1.7), C.soot, -0.05, -0.75, 0.1, 0.1, 0, 0.42);
    for (const [x, y, z, len, lean] of [
      [0.5, 0.75, 0.9, 1.7, 0.12],
      [0.3, 0.9, -0.6, 1.2, -0.2],
      [0.6, 0.3, -1.3, 1.9, 0.08],
      [-0.4, 1.0, 0.2, 1.0, 0.3],
    ] as const)
      b.add(box(0.05, len, 0.05), C.char, x, y - len / 2, z, lean, 0, lean * 0.6);
    // Bulkhead inside the cabin, with its hatch open on the dark.
    b.add(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.08, SIDES), C.soot, 1.6, 0, 0, 0, 0, -Math.PI / 2);
    b.add(box(0.1, 1.5, 0.8), C.dark, 1.55, -0.3, 0.2);

    // --- rear section: snapped off, dropped and twisted ---
    b.within(transform(-0.75, -0.3, 0.3, 0.22, 0.15, 0.06), () => {
      tube(C.cream, -3.8, 0, R * 0.92, R, true);
      tube(C.dark, -3.8, -0.15, R * 0.86, R * 0.93, true);
      rib(-0.25, R * 0.94);
      rib(-2.0, R * 0.9);
      b.add(new THREE.CylinderGeometry(R * 0.88, R * 0.88, 0.08, SIDES), C.soot, -2.3, 0, 0, 0, 0, -Math.PI / 2);
      b.add(box(0.1, 1.4, 0.8), C.dark, -2.24, -0.3, -0.3);
      tube(C.orange, -1.5, -1.0, R * 0.99, R * 1.01);
      tube(C.char, -1.62, -1.5, R * 0.97, R * 0.98);
      for (let k = 0; k < SIDES; k++) {
        if (k % 2 === 1) plate(C.cream, -0.35, k, 0.8, 0.8, 0.02, k % 4 === 1 ? -0.3 : 0.14);
      }
      plate(C.worn, -2.5, 1, 1.6, 1.05);
      plate(C.dark, -2.8, -1, 1.2, 0.9, 0.015);
      plate(C.dark, -1.9, 3, 0.9, 0.8, 0.015);
      plate(C.worn, -2.9, -3, 1.4, 1.0);
      plate(C.cream, -2.2, 2, 1.2, 1.0, 0.4, -0.35);
      plate(C.rust, -3.3, 0, 0.7, 0.8, 0.04);
      // Engine block and the main nozzle, open and burnt.
      tube(C.char, -4.7, -3.8, R * 0.62, R * 0.8);
      tube(C.soot, -5.45, -4.7, R * 0.78, R * 0.52, true);
      tube(C.dark, -5.4, -4.7, R * 0.7, R * 0.46, true);
      b.add(new THREE.TorusGeometry(R * 0.78, 0.07, 4, SIDES), C.grey, -5.45, 0, 0, 0, Math.PI / 2, 0);
      // Feed pipes along the engine.
      for (const a of [0.6, 2.2, 3.9, 5.3])
        b.add(
          new THREE.CylinderGeometry(0.09, 0.09, 1.5, 5),
          C.grey,
          -4.2,
          Math.cos(a) * R * 0.78,
          Math.sin(a) * R * 0.78,
          0,
          0,
          -Math.PI / 2 + 0.12,
        );
      // The booster that stayed on (the other one lies on the ground).
      b.add(new THREE.CylinderGeometry(0.5, 0.58, 2.7, 8), C.cream, -3.3, -0.7, 2.25, 0, 0, -Math.PI / 2);
      b.add(new THREE.CylinderGeometry(0.44, 0.6, 0.6, 8, 1, true), C.char, -4.9, -0.7, 2.25, 0, 0, -Math.PI / 2);
      b.add(new THREE.ConeGeometry(0.5, 0.9, 8), C.orange, -1.5, -0.7, 2.25, 0, 0, -Math.PI / 2);
      b.add(box(1.2, 0.12, 0.5), C.grey, -3.2, -0.5, 1.75);
      // Empty mounts where the other booster was.
      b.add(box(0.5, 0.14, 0.7), C.grey, -2.6, -0.6, -1.95, 0, 0, 0.2);
      b.add(box(0.5, 0.14, 0.6), C.grey, -3.8, -0.6, -1.85, 0, 0, -0.3);
      // Tail fin, its top third snapped and folded over.
      b.add(box(2.3, 2.3, 0.2), C.orange, -3.0, 2.75, 0, 0, 0, -0.32);
      b.add(box(1.5, 0.22, 0.26), C.cream, -2.55, 1.75, 0, 0, 0, -0.1);
      b.add(box(1.5, 1.0, 0.18), C.rust, -4.05, 3.75, 0.42, 0.9, 0.1, -0.5);
      b.add(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 5), C.grey, -3.15, 4.2, 0, 0, 0, 0.12);
      lampAt = b.point(-3.2, 4.72, 0);
      // The wing that held: resting on its tip.
      b.add(box(3.0, 0.2, 4.2), C.cream, -1.9, -0.95, 3.5, 0.2, 0.08, 0);
      b.add(box(2.4, 0.22, 0.7), C.orange, -2.1, -1.36, 5.55, 0.2, 0.08, 0);
      b.add(box(1.4, 0.08, 1.2), C.worn, -3.3, -0.85, 3.6, 0.5, 0, 0.25);
      b.add(box(0.12, 0.12, 3.4), C.grey, -1.2, -0.8, 3.3, 0.2, 0.08, 0);
      // The other wing: a torn stub with its spars showing.
      b.add(box(2.7, 0.2, 1.5), C.cream, -1.9, -0.6, -2.4, -0.3, -0.06, 0);
      b.add(box(0.12, 0.12, 1.5), C.grey, -1.2, -0.2, -3.5, -0.35, 0.1, 0);
      b.add(box(0.12, 0.12, 1.0), C.grey, -2.4, -0.15, -3.3, -0.5, -0.2, 0);
      b.add(box(1.0, 0.08, 0.8), C.worn, -2.9, -0.3, -3.3, -0.9, 0.2, 0.3);
    });
  });

  // ------------------------------------------------------------------ on the ground around it
  /** Rests a part on the terrain at local (x, z), `up` m above it. */
  const onGround = (x: number, z: number, up: number, ry: number, fn: () => void) =>
    b.within(transform(x, groundAt(x, z) + up, z, 0, ry, 0), fn);
  const lump = (color: number, x: number, z: number, sx: number, sy: number, sz: number, ry: number) =>
    onGround(x, z, sy * 0.15, ry, () =>
      b.add(new THREE.IcosahedronGeometry(1, 0), color, 0, 0, 0, 0.2, 0, 0.15, sx, sy, sz),
    );

  // Earth ploughed up around the nose and along both sides of the furrow it came down (+X, towards camp).
  lump(C.dirt, 6.5, 0.2, 1.7, 0.85, 2.3, 0.4);
  lump(C.stone, 5.6, 2.4, 1.4, 0.7, 1.2, 1.1);
  lump(C.dirt, 5.4, -2.5, 1.5, 0.8, 1.3, 2.3);
  lump(C.stone, 7.6, -1.6, 1.3, 0.6, 1.5, 0.2);
  lump(C.dirt, 3.0, 2.9, 1.3, 0.45, 0.9, 0.7);
  lump(C.dirt, 2.6, -3.0, 1.4, 0.5, 0.9, 2.9);
  lump(C.dirt, -0.5, -2.9, 1.1, 0.4, 0.8, 1.9);
  for (let i = 0; i < 4; i++) {
    const x = 8.6 + i * 2.1;
    lump(i % 2 ? C.stone : C.dirt, x, 3.1 + (i % 2) * 0.5, 1.2 - i * 0.15, 0.5 - i * 0.08, 0.8, i * 1.3);
    lump(i % 2 ? C.dirt : C.stone, x + 0.9, -3.2 - (i % 2) * 0.4, 1.1 - i * 0.15, 0.46 - i * 0.08, 0.75, i * 2.1 + 1);
  }

  // The booster that tore off, half buried behind the stub wing.
  onGround(-6.6, -5.6, 0.32, 0.5, () => {
    b.add(new THREE.CylinderGeometry(0.5, 0.58, 2.7, 8), C.worn, 0, 0, 0, 0.12, 0, -Math.PI / 2 + 0.14);
    b.add(new THREE.CylinderGeometry(0.44, 0.6, 0.6, 8, 1, true), C.char, -1.6, -0.22, 0, 0.12, 0, -Math.PI / 2 + 0.14);
    b.add(box(0.7, 0.14, 0.6), C.grey, 0.2, 0.5, 0.2, 0.4, 0, 0.3);
  });
  lump(C.dirt, -5.6, -5.9, 1.3, 0.45, 1.0, 0.9);

  // The far half of the torn wing, standing out of the earth like a blade.
  onGround(-1.2, -7.4, 0.9, 0.35, () => {
    b.add(box(2.5, 0.2, 2.9), C.cream, 0, 0, 0, 0.95, 0, 0.12);
    b.add(box(2.1, 0.22, 0.6), C.orange, -0.1, 0.98, -1.28, 0.95, 0, 0.12);
    b.add(box(0.12, 0.12, 1.3), C.grey, 0.6, -0.9, 1.3, 0.95, 0, 0.12);
  });
  lump(C.dirt, -1.0, -6.5, 1.6, 0.5, 1.0, 0.3);

  // A landing leg, a hatch and the broken dish, thrown clear.
  onGround(3.6, 6.3, 0.5, 1.2, () => {
    b.add(new THREE.CylinderGeometry(0.09, 0.12, 2.2, 6), C.grey, 0, 0.35, 0, 0, 0, 1.05);
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 8), C.char, -1.0, -0.22, 0, 0, 0, 0.3);
  });
  onGround(-4.4, 7.6, 0.12, 2.2, () => {
    b.add(box(1.5, 0.1, 1.1), C.orange, 0, 0, 0, 0.12, 0, -0.08);
    b.add(box(0.5, 0.12, 0.4), C.visor, 0.2, 0.03, 0, 0.12, 0, -0.08);
  });
  onGround(7.4, 4.9, 0.28, 0.8, () => {
    b.add(new THREE.CylinderGeometry(0.8, 0.1, 0.3, 9, 1, true), C.cream, 0, 0, 0, 0.9, 0, 0.3);
    b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), C.grey, 0.2, 0.25, -0.2, 0.9, 0, 0.3);
  });

  // Hull plates scattered around the wreck: own fixed generator, the same in every world.
  const rnd = mulberry32(0x5a17);
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 5.5 + rnd() * 7.5;
    const x = Math.cos(a) * d * 1.25;
    const z = Math.sin(a) * d * 0.9;
    const s = 0.5 + rnd() * 0.9;
    const stuck = rnd() < 0.35;
    const tone = rnd();
    const color = tone < 0.2 ? C.orange : tone < 0.55 ? C.cream : C.worn;
    onGround(x, z, stuck ? s * 0.3 : 0.06, rnd() * 6, () =>
      b.add(box(s * 1.3, 0.07, s), color, 0, 0, 0, stuck ? 0.7 + rnd() * 0.6 : rnd() * 0.25, 0, rnd() * 0.3 - 0.15),
    );
  }

  // ------------------------------------------------------------------ assemble
  const geometry = b.build();
  const group = new THREE.Group();
  // Both sides: the hull is open at the break, and its inside shows.
  group.add(new THREE.Mesh(geometry, lam(0xffffff, { vertexColors: true, side: THREE.DoubleSide })));
  const lampMaterial = basic(0xff5a5a);
  const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), lampMaterial);
  lamp.position.copy(lampAt);
  const halo = additiveSprite(glow, 0xff4a4a, 0);
  halo.position.copy(lampAt);
  group.add(lamp, halo);

  const colliders = [-5, -2.5, 0, 2.5, 5].map((x) => ({ x, z: 0, r: 2.3 }));
  colliders.push({ x: -2.8, z: 3.9, r: 2.0 }, { x: -2.4, z: -2.9, r: 1.3 }, { x: 6.3, z: 0, r: 2.0 });

  return {
    group,
    triangles: geometry.getAttribute('position').count / 3,
    colliders,
    update(time) {
      const blink = Math.sin(time * 4) > 0.6 ? 1 : 0.2;
      lampMaterial.color.setRGB(blink, blink * 0.35, blink * 0.35);
      halo.material.opacity = blink * 0.75;
      halo.scale.setScalar(1 + blink * 1.6);
    },
  };
}

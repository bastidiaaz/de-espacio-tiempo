/**
 * What stands on and below the mirador's mountain (ART-08): crags along the crest, a waterfall
 * that springs on the plateau, runs to the lip between stones and falls down the cliff into the
 * sea, and the foam of that sea: surf along the cliff's toe, rings around the rocks that stand in
 * the water, whitecaps out on the open sea. Past the cliff there is only water (the sea itself is
 * the terrain sinking in `mirador.ts`).
 *
 * The water flows in its shader: a time coordinate (`flow.x`, seconds for the water to get there
 * from the spring, falling as a body falls) scrolls streaks down the stream and the fall, which
 * also sways a little. Foam, spray and mist are instanced meshes moved on the CPU, only while
 * someone is close enough to see them.
 *
 * Mobile first: a few hundred triangles of water, one instanced mesh per kind of piece. Its own
 * generator, derived from the seed.
 */
import * as THREE from 'three';
import { WATER } from '../config';
import { mulberry32, type Rng } from '../math/random';
import { lerp, TAU } from '../math/util';
import { buildInstanced, pick, pushInstance, tint, type InstanceEntry } from '../three/helpers';
import type { Collider } from '../world/collision';
import type { PropKit } from '../world/props';
import type { TerrainField } from '../world/terrain';
import { waterCovers, waveY } from '../world/water';
import { MIRADOR_HALF_WIDTH } from './hiddenLayout';
import { CLIFF_TOE, CLIFF_TOP, type Mirador } from './mirador';

const SALT = 0x6c1ff5;
const CRAGS = 46;
/** Across the plateau (m, mirador frame) where the stream runs and falls. */
const FALL_V = 6;
/** The spring, on the plateau (m from the fire along the mirador's direction). */
const SPRING_U = 396;
/** How far out the falling water leans as it drops `d` m: never touches the cliff's face. */
const FALL_LEAN = (d: number) => 0.8 + 1.7 * Math.sqrt(d);
const FALL_SEGMENTS = 28;
/** Half-width of the falling water across the cliff, `t` from the lip (0) to the sea (1). */
const FALL_RADIUS = (t: number) => lerp(0.5, 1.4, t);
const FALL_SIDES = 8;
/** Speed of the stream on the plateau (m/s) and of a fall (m/s²). */
const STREAM_SPEED = 1.4;
const GRAVITY = 9.8;
const FOAM = 90;
const DROPS = 20;
const MIST = 12;
const RINGS = 5;
const WHITECAPS = 46;
/** Surf along the cliff's toe: one patch every this many metres, two rows. */
const SURF_EVERY = 2.6;
/** Beyond this distance (m) from the lip nothing moves and the sea's foam is hidden. */
const ANIMATE_WITHIN = 320;

const WATER_LIGHT = new THREE.Color('#bff3f1');
const WATER_MID = new THREE.Color('#7ad7d6');
const FOAM_COLOR = new THREE.Color('#eefbfc');
/** The sea's own colour: foam fades into it. */
const SEA = new THREE.Color('#7ad7d6');

export interface MiradorWorld {
  group: THREE.Group;
  /** The stones around the waterfall the player could walk into. */
  colliders: Collider[];
  update(time: number, viewer: THREE.Vector3, still: boolean): void;
}

export function buildMiradorWorld(field: TerrainField, kit: PropKit, m: Mirador, seed: number): MiradorWorld {
  const rng = mulberry32((seed ^ SALT) >>> 0);
  const group = new THREE.Group();
  const rock: InstanceEntry[] = [];

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
  // The spring: a few stones the stream comes out from.
  for (let i = 0; i < 4; i++) crag(SPRING_U - 1.2 + rng() * 0.8, FALL_V + (i - 1.5) * 0.9, 0.8 + rng() * 0.9);

  const spire = new THREE.ConeGeometry(1, 1, 5, 1).translate(0, 0.5, 0);
  const crags = buildInstanced(spire, kit.mat.rock, rock);
  if (crags) group.add(crags);

  const falls = buildFalls(field, kit, m, rng);
  group.add(falls.group);
  return falls.withGroup(group);
}

/** Where the cliff's face is (m along the mirador's direction) at height `y`, `v` m across. */
function faceAt(field: TerrainField, m: Mirador, v: number, y: number): number {
  for (let u = CLIFF_TOP - 1; u < CLIFF_TOE + 4; u += 0.2) {
    const p = m.world(u, v);
    if (field.groundAt(p.x, p.z) < y) return u;
  }
  return CLIFF_TOE + 4;
}

/**
 * A water material whose streaks flow along `flow.x` (seconds from the spring) and that sways
 * sideways by `flow.z` (0 at the lip, 1 at the bottom); `flow.y` tells the lanes apart.
 */
function flowingWater(opacity: number, sway: number, foam: number, uTime: { value: number }, key: string) {
  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    // A little light of its own: moving water catches whatever light there is, even at night.
    emissive: 0x24505a,
    transparent: true,
    opacity,
    flatShading: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = uTime;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 flow;\nuniform float uTime;\nvarying vec2 vFlow;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vFlow = flow.xy;
        float swing = sin(flow.x * 2.3 - uTime * 2.9) + 0.45 * sin(flow.x * 5.3 - uTime * 6.1 + 1.3);
        transformed.xz += vec2(0.8, 0.6) * swing * flow.z * ${sway.toFixed(3)};`,
      );
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec2 vFlow;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float lane = fract(sin(vFlow.y * 91.7 + 3.1) * 43758.5453);
        float ph = (vFlow.x - uTime) * (1.4 + lane * 0.9) + lane * 7.0;
        float streak = smoothstep(0.45, 0.95, sin(ph * 6.2832) * 0.5 + 0.5);
        float fleck = smoothstep(0.82, 1.0, sin((vFlow.x - uTime * 1.07) * 7.3 + lane * 19.0) * 0.5 + 0.5);
        float white = clamp((streak * 0.7 + fleck * 0.5) * ${foam.toFixed(3)}, 0.0, 0.9);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 1.0, 1.0), white);
        diffuseColor.a = min(1.0, diffuseColor.a * (0.85 + white * 0.45));`,
      );
  };
  mat.customProgramCacheKey = () => `mirador-water-${key}`;
  return mat;
}

interface Built {
  group: THREE.Group;
  withGroup(parent: THREE.Group): MiradorWorld;
}

/** The stream, its stones, the fall, its foam, spray and mist, and the sea's foam. */
function buildFalls(field: TerrainField, kit: PropKit, m: Mirador, rng: Rng): Built {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const lipU = CLIFF_TOP + 0.4;
  const lip = m.world(lipU, FALL_V);
  const topY = field.heightAt(lip.x, lip.z) + 0.12;
  const drop = topY - WATER;
  const fallTime = Math.sqrt((2 * drop) / GRAVITY);
  const streamTime = (lipU - SPRING_U) / STREAM_SPEED;
  // Point of the fall `d` m below the lip, in world space.
  const at = (d: number, v = FALL_V) => {
    const p = m.world(lipU + FALL_LEAN(d) - FALL_LEAN(0), v);
    return new THREE.Vector3(p.x, topY - d, p.z);
  };
  // A direction in the mirador's frame (along, across), in world space.
  const dir = (du: number, dv: number) => m.world(du, dv);
  const uTime = { value: 0 };

  const shade = (k: number, out: number[]) =>
    out.push(lerp(WATER_MID.r, WATER_LIGHT.r, k), lerp(WATER_MID.g, WATER_LIGHT.g, k), lerp(WATER_MID.b, WATER_LIGHT.b, k));
  const mesh = (pos: number[], col: number[], flow: number[], mat: THREE.Material, order: number) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('flow', new THREE.Float32BufferAttribute(flow, 3));
    geo.computeVertexNormals();
    const o = new THREE.Mesh(geo, mat);
    o.renderOrder = order;
    group.add(o);
  };

  // The stream: a strip from the spring to the lip, a hand above the ground, a few lanes across.
  {
    const pos: number[] = [];
    const col: number[] = [];
    const flow: number[] = [];
    const steps = 10;
    const lanes = 3;
    const edge = (u: number, across: number) => {
      const w = lerp(0.45, 0.75, (u - SPRING_U) / (lipU - SPRING_U));
      const p = m.world(u, FALL_V + across * w);
      return [p.x, Math.max(field.groundAt(p.x, p.z), field.heightAt(p.x, p.z)) + 0.07, p.z];
    };
    for (let i = 0; i < steps; i++) {
      const u0 = lerp(SPRING_U, lipU, i / steps);
      const u1 = lerp(SPRING_U, lipU, (i + 1) / steps);
      for (let l = 0; l < lanes; l++) {
        const a0 = (l / lanes) * 2 - 1;
        const a1 = ((l + 1) / lanes) * 2 - 1;
        const q = [edge(u0, a0), edge(u0, a1), edge(u1, a0), edge(u1, a1)];
        const t = [(u0 - SPRING_U) / STREAM_SPEED, (u1 - SPRING_U) / STREAM_SPEED];
        for (const j of [0, 2, 1, 1, 2, 3]) {
          pos.push(...q[j]);
          shade(((i + l) % 2) * 0.35, col);
          flow.push(t[j < 2 ? 0 : 1], l + 0.5, 0);
        }
      }
    }
    mesh(pos, col, flow, flowingWater(0.88, 0, 0.55, uTime, 'stream'), 1);
  }

  // The fall: a tube along the curve, widening as it drops; and a veil of spray around it.
  const tube = (radius: (t: number) => number, light: number, mat: THREE.Material, order: number) => {
    const pos: number[] = [];
    const col: number[] = [];
    const flow: number[] = [];
    const ring = (i: number) => {
      const t = i / FALL_SEGMENTS;
      const d = t * t * drop; // more segments near the lip, where it bends
      const c = at(d);
      const r = radius(t);
      const out: THREE.Vector3[] = [];
      for (let s = 0; s < FALL_SIDES; s++) {
        const a = (s / FALL_SIDES) * TAU;
        // A flattened ring across the fall: wider along the cliff than out from it.
        const side = dir(Math.sin(a) * r * 0.55, Math.cos(a) * r);
        out.push(new THREE.Vector3(c.x + side.x, c.y, c.z + side.z));
      }
      return { out, t, time: streamTime + Math.sqrt((2 * d) / GRAVITY) };
    };
    let prev = ring(0);
    for (let i = 1; i <= FALL_SEGMENTS; i++) {
      const next = ring(i);
      for (let s = 0; s < FALL_SIDES; s++) {
        const s1 = (s + 1) % FALL_SIDES;
        const quad = [prev.out[s], next.out[s], prev.out[s1], prev.out[s1], next.out[s], next.out[s1]];
        const rows = [prev, next, prev, prev, next, next];
        const k = ((i + s) % 2 ? 0.6 : 0.3) + light;
        quad.forEach((v, j) => {
          pos.push(v.x, v.y, v.z);
          shade(Math.min(1, k), col);
          flow.push(rows[j].time, s + 0.5, rows[j].t);
        });
      }
      prev = next;
    }
    mesh(pos, col, flow, mat, order);
  };
  tube(FALL_RADIUS, 0, flowingWater(0.93, 0.35, 0.9, uTime, 'fall'), 1);
  tube((t) => lerp(0.75, 2.6, t), 0.45, flowingWater(0.3, 0.7, 1, uTime, 'veil'), 2);

  // Stones: along the stream's banks, framing the lip, out of the cliff's face beside the fall,
  // and standing in the sea around where it lands. Wet ones darker.
  const stones: InstanceEntry[] = [];
  const stone = (x: number, y: number, z: number, s: number, wet: number, flat = 0.75) =>
    pushInstance(
      stones,
      x,
      y,
      z,
      s * (0.8 + rng() * 0.5),
      s * flat * (0.7 + rng() * 0.4),
      s * (0.8 + rng() * 0.5),
      (rng() - 0.5) * 0.5,
      rng() * TAU,
      (rng() - 0.5) * 0.5,
      tint(rng, pick(rng, kit.palette.rocks)).multiplyScalar(lerp(1, 0.62, wet)),
    );
  const onGround = (u: number, v: number, s: number, wet: number, blocks: boolean) => {
    const p = m.world(u, v);
    stone(p.x, field.groundAt(p.x, p.z) + s * 0.15, p.z, s, wet);
    if (blocks) colliders.push({ x: p.x, z: p.z, r: s * 0.85 });
  };
  for (let u = SPRING_U + 0.6; u < CLIFF_TOP - 0.6; u += 0.9 + rng() * 0.7) {
    const w = lerp(0.45, 0.75, (u - SPRING_U) / (lipU - SPRING_U));
    for (const side of [-1, 1]) {
      if (rng() < 0.25) continue;
      const s = 0.22 + rng() * 0.38;
      onGround(u, FALL_V + side * (w + s * 0.6 + rng() * 0.3), s, 0.5, false);
    }
  }
  // Two in the stream itself, the water parting around them.
  onGround(SPRING_U + 2.6, FALL_V + 0.15, 0.24, 1, false);
  onGround(CLIFF_TOP - 1.4, FALL_V - 0.2, 0.3, 1, false);
  // Framing the lip.
  for (const side of [-1, 1]) {
    onGround(CLIFF_TOP - 0.2, FALL_V + side * (1.9 + rng() * 0.4), 1 + rng() * 0.35, 0.3, true);
    onGround(CLIFF_TOP - 1.6, FALL_V + side * (2.6 + rng() * 0.5), 0.6 + rng() * 0.3, 0.2, true);
  }
  // Out of the cliff's face, beside the fall, all the way down.
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const v = FALL_V + side * (2.6 + rng() * 4);
    const y = topY - 3 - rng() * (drop - 6);
    const u = faceAt(field, m, v, y);
    const p = m.world(u + 0.2, v);
    stone(p.x, y, p.z, 0.9 + rng() * 1.5, 0.35 + 0.5 * (1 - (y - WATER) / drop), 0.9);
  }
  // In the sea, around where it lands, and a few more along the cliff's toe.
  const baseU = lipU + FALL_LEAN(drop) - FALL_LEAN(0);
  const seaRocks: { x: number; z: number; r: number }[] = [];
  const inSea = (u: number, v: number, s: number) => {
    const p = m.world(u, v);
    stone(p.x, WATER - s * (0.15 + rng() * 0.3), p.z, s, 1, 0.9);
    seaRocks.push({ x: p.x, z: p.z, r: s });
  };
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + rng() * 0.5;
    const d = 3.6 + rng() * 4.5;
    inSea(Math.max(CLIFF_TOE - 1, baseU + Math.cos(a) * d * 0.7), FALL_V + Math.sin(a) * d, 1.1 + rng() * 1.7);
  }
  for (let i = 0; i < 9; i++) {
    const a = (rng() - 0.5) * 2 * (MIRADOR_HALF_WIDTH - 0.03);
    const r = CLIFF_TOE + 1 + rng() * 9;
    inSea(Math.cos(a) * r, Math.sin(a) * r, 1.3 + rng() * 2.6);
  }
  const rocks = buildInstanced(kit.geo.rock, kit.mat.rock, stones);
  if (rocks) group.add(rocks);

  // --- What moves -------------------------------------------------------------------------
  const dropMat = new THREE.MeshBasicMaterial({ color: FOAM_COLOR, transparent: true, opacity: 0.85 });
  const mistMat = new THREE.MeshBasicMaterial({ color: FOAM_COLOR, transparent: true, opacity: 0.1, depthWrite: false });
  // The sea's foam lies flat on the water and is lit like it, so it fades into it.
  const seaFoamMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const blob = new THREE.IcosahedronGeometry(1, 0);
  const patch = new THREE.CircleGeometry(1, 7).rotateX(-Math.PI / 2);
  const band = new THREE.RingGeometry(0.55, 1, 9, 1).rotateX(-Math.PI / 2);
  const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number, order: number, colored = false) => {
    const im = new THREE.InstancedMesh(geo, mat, n);
    im.frustumCulled = false;
    im.renderOrder = order;
    if (colored) for (let i = 0; i < n; i++) im.setColorAt(i, FOAM_COLOR);
    group.add(im);
    return im;
  };
  const foam = instanced(blob, dropMat, FOAM, 3);
  const drops = instanced(blob, dropMat, DROPS, 3);
  const mist = instanced(blob, mistMat, MIST, 4);
  const plunge = instanced(band, seaFoamMat, RINGS, 2, true);

  // Falling foam: rides the fall, spreading across it as it drops.
  const foamBits = Array.from({ length: FOAM }, (_, i) => ({
    phase: i / FOAM + rng() * 0.02,
    v: (rng() - 0.5) * 2.1,
    out: (rng() - 0.5) * 1.2,
    size: 0.06 + rng() * 0.1,
  }));
  const base = at(drop);
  // Spray: drops thrown up and out where the fall meets the sea.
  const dropBits = Array.from({ length: DROPS }, () => ({
    life: 1 + rng() * 0.7,
    phase: rng(),
    a: rng() * TAU,
    up: 4 + rng() * 4,
    out: 1.4 + rng() * 2.6,
    size: 0.1 + rng() * 0.16,
  }));
  // Mist rising from the plunge.
  const mistBits = Array.from({ length: MIST }, (_, i) => ({ phase: i / MIST, a: rng() * TAU, drift: 1 + rng() * 3 }));

  // Surf along the toe of the cliff, two rows, and a ring around every rock in the water.
  interface Patch {
    x: number;
    z: number;
    nx: number;
    nz: number;
    yaw: number;
    len: number;
    wide: number;
    phase: number;
    row: number;
  }
  const shore: Patch[] = [];
  const arc = MIRADOR_HALF_WIDTH * (CLIFF_TOE + 1);
  for (let k = 0; k < (2 * arc) / SURF_EVERY; k++) {
    const a = -MIRADOR_HALF_WIDTH + (k * SURF_EVERY) / (CLIFF_TOE + 1) + (rng() - 0.5) * 0.004;
    let r = CLIFF_TOP;
    while (r < CLIFF_TOE + 6) {
      const p = m.world(Math.cos(a) * r, Math.sin(a) * r);
      if (field.groundAt(p.x, p.z) < WATER - 0.1) break;
      r += 0.25;
    }
    const n = dir(Math.cos(a), Math.sin(a));
    for (let row = 0; row < 2; row++) {
      const p = m.world(Math.cos(a) * (r + row * 1.6), Math.sin(a) * (r + row * 1.6));
      shore.push({
        x: p.x,
        z: p.z,
        nx: n.x,
        nz: n.z,
        yaw: Math.atan2(n.x, n.z),
        len: (row ? 1.6 : 2) + rng() * 0.9,
        wide: (row ? 0.6 : 0.9) + rng() * 0.4,
        phase: k * 0.37 + row * 1.9 + rng() * 0.6,
        row,
      });
    }
  }
  const rockRings = seaRocks.map((s) => ({ ...s, phase: rng() * TAU }));
  const surfMesh = instanced(patch, seaFoamMat, shore.length, 2, true);
  const bands = instanced(band, seaFoamMat, rockRings.length, 2, true);

  // Whitecaps out on the open sea: born, swelling along the crest, carried toward the cliff, gone.
  const caps = Array.from({ length: WHITECAPS }, () => {
    const a = (rng() - 0.5) * 2 * (MIRADOR_HALF_WIDTH - 0.02);
    return {
      a,
      r: CLIFF_TOE + 8 + rng() * 115,
      life: 5 + rng() * 5,
      phase: rng(),
      len: 2.2 + rng() * 3.4,
      wide: 0.7 + rng() * 0.7,
    };
  });
  const capMesh = instanced(patch, seaFoamMat, WHITECAPS, 2, true);
  const seaFoam = [surfMesh, bands, capMesh, plunge];

  const mat = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const up = THREE.Object3D.DEFAULT_UP;
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  let placed = false;
  let shown = true;
  let now = 0;

  // Foam fades into the sea as `k` goes to 0.
  const foamAt = (im: THREE.InstancedMesh, i: number, k: number) => im.setColorAt(i, c.copy(SEA).lerp(FOAM_COLOR, k));
  // A flat piece of foam riding the waves: `sx` across `yaw`'s direction, `sz` along it.
  const flat = (im: THREE.InstancedMesh, i: number, x: number, z: number, yaw: number, sx: number, sz: number) => {
    q.setFromAxisAngle(up, yaw);
    im.setMatrixAt(i, mat.compose(p.set(x, WATER + 0.06 + waveY(x, z, now), z), q, scale.set(sx, 1, sz)));
  };

  const update = (time: number, viewer: THREE.Vector3, still: boolean) => {
    const far = Math.hypot(viewer.x - lip.x, viewer.z - lip.z) > ANIMATE_WITHIN;
    if (far !== !shown) {
      shown = !far;
      for (const im of seaFoam) im.visible = shown;
    }
    if (far && placed) return;
    const t = still ? 0 : time;
    uTime.value = t;
    now = time;
    // The water sheet follows the viewer: foam where it isn't would float over the sea floor.
    const wet = (x: number, z: number) => waterCovers(x, z, viewer.x, viewer.z, 6);

    foamBits.forEach((o, i) => {
      const s = (t / fallTime + o.phase) % 1;
      const d = s * s * drop;
      const r = FALL_RADIUS(s);
      const pt = at(d, FALL_V + o.v * r);
      const out = dir(o.out * r * 0.55, 0);
      p.set(pt.x + out.x, pt.y, pt.z + out.z);
      // Stretched along the fall, more as it speeds up.
      const k = o.size * lerp(0.7, 1.6, s);
      q.setFromAxisAngle(up, i + t * 2);
      foam.setMatrixAt(i, mat.compose(p, q, scale.set(k, k * lerp(2, 5, s), k)));
    });
    dropBits.forEach((o, i) => {
      const s = ((t / o.life + o.phase) % 1) * o.life;
      const h = o.up * s - 0.5 * GRAVITY * s * s;
      const off = dir(Math.cos(o.a) * o.out * s * 0.7, Math.sin(o.a) * o.out * s);
      if (h < -0.2) return drops.setMatrixAt(i, hide);
      q.setFromAxisAngle(up, o.a);
      drops.setMatrixAt(i, mat.compose(p.set(base.x + off.x, WATER + h, base.z + off.z), q, scale.setScalar(o.size)));
    });
    mistBits.forEach((o, i) => {
      const s = (t / 3.4 + o.phase) % 1;
      const off = dir(Math.cos(o.a) * o.drift * s * 0.6 + 0.6, Math.sin(o.a) * o.drift * s);
      const k = lerp(0.8, 2.6, s) * Math.sin(Math.PI * Math.min(1, s * 1.4));
      q.setFromAxisAngle(up, o.a + s);
      mist.setMatrixAt(i, mat.compose(p.set(base.x + off.x, WATER + 0.4 + s * 4.5, base.z + off.z), q, scale.set(k, k * 0.8, k)));
    });
    for (let i = 0; i < RINGS; i++) {
      const s = (t / 2.8 + i / RINGS) % 1;
      const k = lerp(1.6, 7.5, Math.sqrt(s));
      flat(plunge, i, base.x, base.z, i, k, k * 0.85);
      foamAt(plunge, i, 1 - s);
    }

    shore.forEach((o, i) => {
      if (!wet(o.x, o.z)) return surfMesh.setMatrixAt(i, hide);
      // Each wave pushes the foam up against the cliff, then it spreads and thins as it draws back.
      const w = Math.sin(t * 0.85 + o.phase);
      const reach = o.row ? 0.4 + w * 0.9 : 0.1 + Math.max(0, -w) * 1.4;
      const x = o.x + o.nx * reach;
      const z = o.z + o.nz * reach;
      flat(surfMesh, i, x, z, o.yaw, o.len * (1 + 0.25 * w), o.wide * (1 + 0.4 * Math.abs(w)));
      foamAt(surfMesh, i, o.row ? 0.45 + 0.4 * (0.5 + 0.5 * w) : 0.75 + 0.25 * w);
    });
    rockRings.forEach((o, i) => {
      if (!wet(o.x, o.z)) return bands.setMatrixAt(i, hide);
      const w = 0.5 + 0.5 * Math.sin(t * 1.3 + o.phase);
      const k = o.r * (1.05 + 0.35 * w);
      flat(bands, i, o.x, o.z, o.phase, k, k);
      foamAt(bands, i, 0.95 - 0.5 * w);
    });
    caps.forEach((o, i) => {
      const s = (t / o.life + o.phase) % 1;
      const cycle = Math.floor(t / o.life + o.phase);
      // Each life somewhere a little different, drifting in toward the cliff.
      const a = o.a + Math.sin(cycle * 12.9898 + i) * 0.02;
      const r = o.r - s * 4 + Math.sin(cycle * 78.233 + i) * 3;
      const pt = m.world(Math.cos(a) * r, Math.sin(a) * r);
      if (!wet(pt.x, pt.z)) return capMesh.setMatrixAt(i, hide);
      const n = dir(Math.cos(a), Math.sin(a));
      const life = Math.sin(Math.PI * s);
      flat(capMesh, i, pt.x, pt.z, Math.atan2(n.x, n.z), o.len * (0.5 + 0.5 * life), o.wide * life);
      foamAt(capMesh, i, 0.25 + 0.75 * life);
    });

    for (const im of [foam, drops, mist, ...seaFoam]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    placed = true;
  };
  update(0, new THREE.Vector3(lip.x, 0, lip.z), true);

  return {
    group,
    withGroup(parent) {
      return { group: parent, colliders, update };
    },
  };
}

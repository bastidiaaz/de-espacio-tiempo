/**
 * What stands on and below the mirador's mountain (ART-08): crags along the crest and a waterfall
 * that springs on the plateau, runs to the lip and falls down the cliff into the sea. Past the
 * cliff there is only water (the sea itself is the terrain sinking in `mirador.ts`).
 *
 * Mobile first: the crags are one instanced mesh; the waterfall is one tube, one strip, and two
 * small instanced meshes (falling foam and the splash) moved on the CPU, only while someone is
 * close enough to see them. Its own generator, derived from the seed.
 */
import * as THREE from 'three';
import { WATER } from '../config';
import { mulberry32 } from '../math/random';
import { lerp, TAU } from '../math/util';
import { buildInstanced, pick, pushInstance, tint, type InstanceEntry } from '../three/helpers';
import type { PropKit } from '../world/props';
import type { TerrainField } from '../world/terrain';
import { MIRADOR_HALF_WIDTH } from './hiddenLayout';
import { CLIFF_TOP, type Mirador } from './mirador';

const SALT = 0x6c1ff5;
const CRAGS = 46;
/** Across the plateau (m, mirador frame) where the stream runs and falls. */
const FALL_V = 6;
/** The spring, on the plateau (m from the fire along the mirador's direction). */
const SPRING_U = 396;
/** How far out the falling water leans as it drops `d` m: never touches the cliff's face. */
const FALL_LEAN = (d: number) => 0.8 + 1.7 * Math.sqrt(d);
const FALL_SEGMENTS = 22;
const FALL_SIDES = 6;
const FOAM = 36;
const SPLASH = 9;
/** Beyond this distance (m) the foam stops moving: nobody can see it. */
const ANIMATE_WITHIN = 320;

const WATER_LIGHT = new THREE.Color('#bff3f1');
const WATER_MID = new THREE.Color('#7ad7d6');
const FOAM_COLOR = new THREE.Color('#f4fdff');

export interface MiradorWorld {
  group: THREE.Group;
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

  const falls = buildFalls(field, m);
  group.add(falls.group);
  return { group, update: falls.update };
}

/** The stream on the plateau, the fall down the cliff, its foam and its splash. */
function buildFalls(field: TerrainField, m: Mirador): MiradorWorld {
  const group = new THREE.Group();
  const lipU = CLIFF_TOP + 0.4;
  const lip = m.world(lipU, FALL_V);
  const topY = field.heightAt(lip.x, lip.z) + 0.12;
  const drop = topY - WATER;
  // Point of the fall `d` m below the lip, in world space.
  const at = (d: number, v = FALL_V) => {
    const p = m.world(lipU + FALL_LEAN(d) - FALL_LEAN(0), v);
    return new THREE.Vector3(p.x, topY - d, p.z);
  };

  const water = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.86,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  // The stream: a flat strip from the spring to the lip, a hand above the ground.
  {
    const pos: number[] = [];
    const col: number[] = [];
    const steps = 8;
    const edge = (u: number, side: number) => {
      const w = lerp(0.45, 0.7, (u - SPRING_U) / (lipU - SPRING_U));
      const p = m.world(u, FALL_V + side * w);
      return [p.x, Math.max(field.groundAt(p.x, p.z), field.heightAt(p.x, p.z)) + 0.07, p.z];
    };
    for (let i = 0; i < steps; i++) {
      const u0 = lerp(SPRING_U, lipU, i / steps);
      const u1 = lerp(SPRING_U, lipU, (i + 1) / steps);
      const [a, b, c, d] = [edge(u0, -1), edge(u0, 1), edge(u1, -1), edge(u1, 1)];
      for (const v of [a, c, b, b, c, d]) {
        pos.push(...v);
        const k = (i % 2) * 0.35;
        col.push(lerp(WATER_MID.r, WATER_LIGHT.r, k), lerp(WATER_MID.g, WATER_LIGHT.g, k), lerp(WATER_MID.b, WATER_LIGHT.b, k));
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, water));
  }

  // The fall: a low-poly tube along the curve, widening as it drops, lighter at the top.
  {
    const pos: number[] = [];
    const col: number[] = [];
    const ring = (i: number) => {
      const t = i / FALL_SEGMENTS;
      const c = at(t * t * drop); // more segments near the lip, where it bends
      const r = lerp(0.55, 1.5, t);
      const out: THREE.Vector3[] = [];
      for (let s = 0; s < FALL_SIDES; s++) {
        const a = (s / FALL_SIDES) * TAU;
        // A flattened ring across the fall: wider along the cliff than out from it.
        const side = m.world(Math.sin(a) * r * 0.55, Math.cos(a) * r);
        out.push(new THREE.Vector3(c.x + side.x, c.y, c.z + side.z));
      }
      return { out, t };
    };
    let prev = ring(0);
    for (let i = 1; i <= FALL_SEGMENTS; i++) {
      const next = ring(i);
      for (let s = 0; s < FALL_SIDES; s++) {
        const s1 = (s + 1) % FALL_SIDES;
        const quad = [prev.out[s], next.out[s], prev.out[s1], prev.out[s1], next.out[s], next.out[s1]];
        const k = (i + s) % 2 ? 0.55 : 0.2;
        const shade = lerp(1, 0.4, next.t);
        for (const v of quad) {
          pos.push(v.x, v.y, v.z);
          col.push(
            lerp(WATER_MID.r, WATER_LIGHT.r, k * shade + (1 - shade) * 0.1),
            lerp(WATER_MID.g, WATER_LIGHT.g, k * shade + (1 - shade) * 0.1),
            lerp(WATER_MID.b, WATER_LIGHT.b, k * shade + (1 - shade) * 0.1),
          );
        }
      }
      prev = next;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, water));
  }

  // Foam falling along it, and the splash where it meets the sea.
  // Unlit: foam reads as foam, white against the water and the dark cliff, never as stone.
  const foamMat = new THREE.MeshBasicMaterial({ color: FOAM_COLOR, transparent: true, opacity: 0.8 });
  const foam = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), foamMat, FOAM);
  const splash = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), foamMat, SPLASH);
  foam.frustumCulled = false;
  splash.frustumCulled = false;
  group.add(foam, splash);
  const offsets = Array.from({ length: FOAM }, (_, i) => ({
    phase: i / FOAM,
    v: ((i * 7) % 5) / 4 - 0.5,
    size: 0.14 + ((i * 13) % 7) * 0.035,
  }));
  const base = at(drop);
  const splashAt = Array.from({ length: SPLASH }, (_, i) => {
    const a = (i / SPLASH) * TAU;
    const side = m.world(Math.cos(a) * 2.2, Math.sin(a) * 2.2);
    return { x: base.x + side.x, z: base.z + side.z, phase: i * 0.71 };
  });
  const mat = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const p = new THREE.Vector3();
  let placed = false;

  const update = (time: number, viewer: THREE.Vector3, still: boolean) => {
    const far = Math.hypot(viewer.x - lip.x, viewer.z - lip.z) > ANIMATE_WITHIN;
    if (far && placed) return;
    const t = still ? 0 : time;
    offsets.forEach((o, i) => {
      const s = (t * 0.32 + o.phase) % 1; // ~3 s from the lip to the sea, falling faster as it goes
      const pt = at(s * s * drop, FALL_V + o.v * lerp(0.5, 1.8, s));
      p.copy(pt);
      const k = o.size * lerp(0.7, 1.6, s);
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, i + t * 2);
      foam.setMatrixAt(i, mat.compose(p, q, scale.set(k, k, k)));
    });
    splashAt.forEach((s, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.1 + s.phase);
      p.set(s.x, WATER + 0.15 + pulse * 0.5, s.z);
      const k = 0.8 + pulse * 0.7;
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, s.phase + t * 0.6);
      splash.setMatrixAt(i, mat.compose(p, q, scale.set(k * 1.4, k * 0.6, k * 1.4)));
    });
    foam.instanceMatrix.needsUpdate = true;
    splash.instanceMatrix.needsUpdate = true;
    placed = true;
  };
  update(0, new THREE.Vector3(lip.x, 0, lip.z), true);
  return { group, update };
}

import * as THREE from 'three';
import type { Rng } from '../math/random';
import { TAU } from '../math/util';
import { basic, lam, pick, pushInstance, tint, type InstanceEntry } from '../three/helpers';

export type PropKind = 'stem' | 'cap' | 'stalk' | 'bulb' | 'tuft' | 'crystal' | 'rock' | 'float';
export type PropLists = Record<PropKind, InstanceEntry[]>;

const colors = (hexes: readonly string[]) => hexes.map((c) => new THREE.Color(c));

/** Shared geometries/materials/color sets for procedurally scattered props. */
export function createPropKit() {
  const geo: Record<PropKind, THREE.BufferGeometry> = {
    stem: new THREE.CylinderGeometry(0.22, 0.3, 1, 6, 1).translate(0, 0.5, 0),
    cap: new THREE.CylinderGeometry(0.15, 1, 0.6, 8, 1).translate(0, 0.3, 0),
    stalk: new THREE.CylinderGeometry(0.03, 0.05, 1, 4, 1).translate(0, 0.5, 0),
    bulb: new THREE.IcosahedronGeometry(0.2, 0),
    tuft: new THREE.ConeGeometry(0.12, 1, 3).translate(0, 0.5, 0),
    crystal: new THREE.OctahedronGeometry(0.5, 0),
    rock: new THREE.DodecahedronGeometry(1, 0),
    float: new THREE.ConeGeometry(1, 1, 6).rotateX(Math.PI),
  };
  const mat = {
    terrain: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
    stem: lam(0xfff0dc),
    cap: lam(0xffffff),
    stalk: lam(0x5aa58f),
    bulb: basic(0xffffff),
    tuft: lam(0xffffff),
    crystal: lam(0xffffff, { emissive: 0x2b1f5c }),
    rock: lam(0xffffff),
  };
  const palette = {
    caps: colors(['#f29bb5', '#ff9e7a', '#c9a0ff', '#ffd27a', '#7fe0d0']),
    bulbs: colors(['#8ff5ff', '#ffd0f0', '#fff3a8']),
    crystals: colors(['#8ef0ff', '#ff9ed8', '#b79cff']),
    tufts: colors(['#3f9e8c', '#6cc49b', '#86d6b8', '#b49be0']),
    rocks: colors(['#7d6f9e', '#9384b3', '#6f6590']),
  };
  return { geo, mat, palette };
}

export type PropKit = ReturnType<typeof createPropKit>;

export const emptyPropLists = (): PropLists => ({
  stem: [],
  cap: [],
  stalk: [],
  bulb: [],
  tuft: [],
  crystal: [],
  rock: [],
  float: [],
});

export function placeMushroom(
  L: PropLists,
  kit: PropKit,
  rng: Rng,
  x: number,
  y: number,
  z: number,
  big: boolean,
): void {
  const H = big ? 2.4 + rng() * 3 : 0.6 + rng() * 0.8;
  const s = big ? 1 + rng() * 0.6 : 0.5 + rng() * 0.3;
  const Rr = big ? 1.4 + rng() * 1.3 : 0.45 + rng() * 0.3;
  pushInstance(L.stem, x, y - 0.1, z, s, H, s, 0, rng() * TAU, 0);
  pushInstance(L.cap, x, y + H - 0.25, z, Rr, Rr * 0.75, Rr, 0, rng() * TAU, 0, tint(rng, pick(rng, kit.palette.caps)));
}

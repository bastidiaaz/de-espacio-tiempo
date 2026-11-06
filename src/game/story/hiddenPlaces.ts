/**
 * The places around the hidden objects (brief del Acto I, "Lugares de los ocultos", 2026-11-06):
 * a patch of biome found nowhere else on the planet, 10–55 m around each object, with one large
 * structure of the planet's own (natural, made by no one), so the player thinks "I haven't seen
 * this before" and goes to look. Never right next to the object: its hideout (hidden.ts) stays as
 * it is.
 *
 * From the fire, every structure rises as a silhouette in the fog, and a loose trail of its biome's
 * own elements leads from the fire towards it (free roam only), not obvious enough to be a path.
 *
 * Determinism: a generator of its own per place, derived from the seed (never the world's `rng()`).
 * Only the campanil's island changes the terrain, and only around it (far from camp).
 */
import * as THREE from 'three';
import type { HiddenId } from '../../content/story';
import { CAMP_HEIGHT, WATER } from '../config';
import { mulberry32, type Rng } from '../math/random';
import { lerp, smoothstep, TAU } from '../math/util';
import { buildInstanced, lam, mesh, pick, pushInstance, tint, type InstanceEntry } from '../three/helpers';
import type { Collider } from '../world/collision';
import type { TintZone } from '../world/palette';
import type { PropKit } from '../world/props';
import type { HeightModifier, TerrainField } from '../world/terrain';

/** Ring (m from the object) where a place's trees and spires go: near, never right next to it. */
const RING_INNER = 10;
const RING_OUTER = 55;
/** Within this radius (m) the common props of the planet are not scattered: the biome is its own. */
const BIOME_CLEARING = 52;
/**
 * The colossal structure stands this far (m) from the object, so its base never lands on the
 * hideout, and is this many times the size of its first version (pedido del autor: "colosales").
 */
const STRUCTURE_MIN = 40;
const STRUCTURE_MAX = 55;
const COLOSSAL = 4;
/**
 * Seen from the fire, every structure's top must rise at least this far above the horizon (rad).
 * Past the fog's far end everything takes the horizon's color, so a structure only reads as a
 * silhouette where it stands against the darker sky above it (sky.ts: horizon → mid between
 * ~1° and ~13°). Structures farther away are scaled up until they reach it.
 */
export const MIN_SILHOUETTE = (14 * Math.PI) / 180;
/** Eye height at the fire, where the silhouettes are measured from. */
export const FIRE_EYE = CAMP_HEIGHT + 1.6;
/** How far above the highest hill on the way the top must rise (rad), so a sliver isn't all that shows. */
export const HILL_CLEARANCE = (8 * Math.PI) / 180;
/** A floating structure's underside must clear the hill too, by this much (rad): the whole rock shows. */
const UNDERSIDE_CLEARANCE = (2 * Math.PI) / 180;
/** Hills farther than this from the fire are never drawn from there (chunks around it). */
const HORIZON_REACH = 170;
/** Even behind a big hill, no structure grows beyond this (a 12× tree is ~250 m tall). */
export const MAX_SCALE = 12;
/** Trail from the fire to each structure: starts this far from the fire, stops this far before it. */
const TRAIL_START = 28;
const TRAIL_STOP = 30;
/** Distance between two trail elements (m): STEP plus up to STEP_JITTER; and their sideways wander. */
const TRAIL_STEP = 18;
const TRAIL_STEP_JITTER = 10;
const TRAIL_WANDER = 16;
/** The island: dry islet up to ISLET m, water from MOAT_IN to MOAT_OUT, back to the terrain by SHORE. */
export const ISLET = 5;
const MOAT_IN = 7;
const MOAT_OUT = 14;
const SHORE = 16.5;
/** How deep the moat goes below the water line (m): deep enough to swim. */
const MOAT_DEPTH = 1.4;
/** Mixed into the seed for the places' own generators, and for the trails'. */
const SALT = 0x91ace5;
const TRAIL_SALT = 0x7a11e5;

/**
 * The campanil's island: a ring sunk under the water around (cx, cz) and a dry islet in the middle.
 * Returns `h` untouched farther than SHORE m away.
 */
export function islandModifier(cx: number, cz: number): HeightModifier {
  return (x, z, h) => {
    const d = Math.hypot(x - cx, z - cz);
    if (d >= SHORE) return h;
    const moat = smoothstep(ISLET, MOAT_IN, d) * (1 - smoothstep(MOAT_OUT, SHORE, d));
    let out = lerp(h, Math.min(h, WATER - MOAT_DEPTH), moat);
    const islet = 1 - smoothstep(ISLET, MOAT_IN - 0.5, d);
    out = lerp(out, Math.max(out, WATER + 0.7), islet);
    return out;
  };
}

/** A colossal structure: where it stands and how high its top reaches (world y). */
export interface Structure {
  x: number;
  z: number;
  top: number;
  /** Times its first size (MAX_SCALE when a big hill near camp would still hide more of it). */
  scale: number;
}

export interface Places {
  group: THREE.Group;
  colliders: Collider[];
  /** Ground colors for the terrain palette. */
  tints: TintZone[];
  /** Circles the chunks keep free of the planet's common props. */
  clearings: Collider[];
  structures: Partial<Record<HiddenId, Structure>>;
  /** The trails from the fire: shown (and solid) only in the free roam. */
  trails: THREE.Group;
  trailColliders: Collider[];
  /** Where each trail's elements stand, in order from the fire. */
  trailPoints: Partial<Record<HiddenId, { x: number; z: number }[]>>;
}

const LIST_KEYS = [
  'trunk',
  'canopy',
  'spireRock',
  'spireCrystal',
  'giantCrystal',
  'rock',
  'reed',
  'stalk',
  'bulb',
  'float',
] as const;
type ListKey = (typeof LIST_KEYS)[number];
const emptyLists = () =>
  Object.fromEntries(LIST_KEYS.map((k) => [k, [] as InstanceEntry[]])) as Record<ListKey, InstanceEntry[]>;

interface PlaceCtx {
  field: TerrainField;
  kit: PropKit;
  rng: Rng;
  x: number;
  z: number;
  group: THREE.Group;
  lists: Record<ListKey, InstanceEntry[]>;
  colliders: Collider[];
  tints: TintZone[];
  clearings: Collider[];
  /** Set by the place's structure builder. */
  structure?: Structure;
}

const colors = (hexes: readonly string[]) => hexes.map((c) => new THREE.Color(c));
const WOOD = colors(['#e0bd92', '#cfa477', '#ecd0a6']);
const LEAVES = colors(['#ffc7a0', '#ffdca8', '#e4f0b0', '#ffb6a6']);
const ICE = colors(['#a9d4ff', '#c9e6ff', '#8fb8f0']);
const COPPER = colors(['#c8693c', '#d97a48', '#b45a32']);
const REEDS = colors(['#6fd0b8', '#8fe0c4', '#5ab8a8']);

/** Materials of the structures, fresh for each build (they are disposed with the act). */
const MAT = {
  bark: () => lam(0xd2ab80),
  crown: () => lam(0xffd2a8, { emissive: 0x4a2c1c }),
  cathedral: () => lam(0xb8dcff, { emissive: 0x1c3a7a }),
  floatRock: () => lam(0x8a7aae),
  copperArch: () => lam(0xd0703f, { emissive: 0x2a0c04 }),
};

/** Builds the places of every hidden object at `spots` (the island goes through `field` first). */
export function buildPlaces(
  field: TerrainField,
  kit: PropKit,
  spots: Record<HiddenId, { x: number; z: number }>,
  seed: number,
  order: readonly HiddenId[],
): Places {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const tints: TintZone[] = [];
  const clearings: Collider[] = [];
  const lists = emptyLists();
  const structures: Places['structures'] = {};
  const trails = new THREE.Group();
  const trailLists = emptyLists();
  const trailColliders: Collider[] = [];
  const trailPoints: Places['trailPoints'] = {};
  order.forEach((id, i) => {
    const rng = mulberry32((seed ^ SALT ^ Math.imul(i + 1, 0x85ebca6b)) >>> 0);
    const c: PlaceCtx = { field, kit, rng, x: spots[id].x, z: spots[id].z, group, lists, colliders, tints, clearings };
    PLACE[id](c);
    const st = c.structure;
    const crumb = TRAIL[id];
    if (!st) return;
    structures[id] = st;
    if (!crumb) return;
    const tc: PlaceCtx = {
      ...c,
      rng: mulberry32((seed ^ TRAIL_SALT ^ Math.imul(i + 1, 0x27d4eb2f)) >>> 0),
      lists: trailLists,
      colliders: trailColliders,
    };
    const points = trailTowards(tc, st.x, st.z);
    trailPoints[id] = points;
    // In a lake, the crumb stands on the bottom only as deep as it can still stick out of the water.
    for (const p of points) crumb(tc, p.x, Math.max(field.groundAt(p.x, p.z), WATER - 0.4), p.z);
  });

  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, 1, 5, 1).translate(0, 0.5, 0);
  const canopyGeo = new THREE.IcosahedronGeometry(1, 0);
  const spireGeo = new THREE.ConeGeometry(1, 1, 5, 1).translate(0, 0.5, 0);
  const giantGeo = new THREE.OctahedronGeometry(1, 0).translate(0, 1, 0);
  const reedGeo = new THREE.ConeGeometry(0.08, 1, 3).translate(0, 0.5, 0);
  const trunkMat = lam(0xffffff);
  const canopyMat = lam(0xffffff, { emissive: 0x3a2a20 }); // stands out at night
  const reedMat = lam(0xffffff);
  const cathedral = MAT.cathedral();
  for (const [into, L] of [
    [group, lists],
    [trails, trailLists],
  ] as const) {
    const add = (im: THREE.InstancedMesh | null) => im && into.add(im);
    add(buildInstanced(trunkGeo, trunkMat, L.trunk));
    add(buildInstanced(canopyGeo, canopyMat, L.canopy));
    add(buildInstanced(spireGeo, kit.mat.rock, L.spireRock));
    add(buildInstanced(spireGeo, kit.mat.crystal, L.spireCrystal));
    add(buildInstanced(giantGeo, cathedral, L.giantCrystal));
    add(buildInstanced(kit.geo.rock, kit.mat.rock, L.rock));
    add(buildInstanced(reedGeo, reedMat, L.reed));
    add(buildInstanced(kit.geo.stalk, kit.mat.stalk, L.stalk));
    add(buildInstanced(kit.geo.bulb, kit.mat.bulb, L.bulb));
    add(buildInstanced(kit.geo.float, kit.mat.rock, L.float));
  }
  return { group, colliders, tints, clearings, structures, trails, trailColliders, trailPoints };
}

/**
 * Highest angle (rad) the terrain rises to, seen from the fire's eye, along the line towards (x, z).
 * Only within the terrain the fire can see (the chunks loaded around it, ~170 m); beyond that
 * there is no ground drawn to hide anything.
 */
export function horizonTowards(field: TerrainField, x: number, z: number): number {
  const D = Math.hypot(x, z);
  const a0 = Math.atan2(z, x);
  let best = -Math.PI / 2;
  // A narrow fan around the direction: the structure is wide, and a hill just beside the line counts.
  for (let da = -0.12; da <= 0.12 + 1e-9; da += 0.04)
    for (let s = 4; s < Math.min(D, HORIZON_REACH); s += 2) {
      const h = Math.max(field.groundAt(Math.cos(a0 + da) * s, Math.sin(a0 + da) * s), WATER);
      best = Math.max(best, Math.atan2(h - FIRE_EYE, s));
    }
  return best;
}

/**
 * How much to scale a structure standing on ground `groundY` at (x, z) so that its top, at
 * `unitTop` m above the ground per unit of scale, rises MIN_SILHOUETTE above the horizon seen from
 * the fire, and HILL_CLEARANCE above any hill in between. A floating structure also gives
 * `unitUnderside`, the height of its underside per unit of scale, which must clear the hill by
 * UNDERSIDE_CLEARANCE. Never smaller than `base`, never larger than MAX_SCALE.
 */
export function silhouetteScale(
  field: TerrainField,
  x: number,
  z: number,
  groundY: number,
  unitTop: number,
  base: number,
  unitUnderside?: number,
): number {
  const D = Math.hypot(x, z);
  const hill = horizonTowards(field, x, z);
  const heightAt = (angle: number) => FIRE_EYE + D * Math.tan(angle) - groundY;
  let S = Math.max(base, heightAt(Math.max(MIN_SILHOUETTE, hill + HILL_CLEARANCE)) / unitTop);
  if (unitUnderside) S = Math.max(S, heightAt(hill + UNDERSIDE_CLEARANCE) / unitUnderside);
  return Math.min(MAX_SCALE, S);
}

/**
 * Where the structure stands: a dry spot on the side of the biome that faces the fire; else a dry
 * spot anywhere around; else the fire-side spot anyway, in the water (a colossal tree in a lake is fine).
 */
function structureSpot(c: PlaceCtx): { x: number; z: number; y: number } {
  const toFire = Math.atan2(-c.z, -c.x);
  const at = (a: number, d: number) => {
    const x = c.x + Math.cos(a) * d;
    const z = c.z + Math.sin(a) * d;
    return { x, z, y: c.field.groundAt(x, z) };
  };
  const ring = () => STRUCTURE_MIN + c.rng() * (STRUCTURE_MAX - STRUCTURE_MIN);
  for (let k = 0; k < 8; k++) {
    const p = at(toFire + (c.rng() - 0.5) * 1.6, ring());
    if (p.y > WATER + 0.3) return p;
  }
  for (let k = 0; k < 12; k++) {
    const p = at(c.rng() * TAU, ring());
    if (p.y > WATER + 0.3) return p;
  }
  const p = at(toFire, STRUCTURE_MIN);
  return { ...p, y: Math.max(p.y, WATER) };
}

/**
 * Loose points from the fire towards (tx, tz): every 18–28 m, wandering up to 8 m to each side
 * (up to 20 m to stay out of the water). Not a line to follow at a glance; a hint to whoever notices them.
 */
export function trailTowards(c: Pick<PlaceCtx, 'rng' | 'field'>, tx: number, tz: number): { x: number; z: number }[] {
  const D = Math.hypot(tx, tz);
  const ux = tx / D;
  const uz = tz / D;
  const out: { x: number; z: number }[] = [];
  for (let s = TRAIL_START; s < D - TRAIL_STOP; s += TRAIL_STEP + c.rng() * TRAIL_STEP_JITTER) {
    const w = (c.rng() - 0.5) * TRAIL_WANDER;
    // In the water, look sideways for dry ground (up to 12 m off the way); if there is none (a
    // lake), the crumb goes in the water anyway, sticking out of it: the trail never breaks.
    let at = { x: ux * s - uz * w, z: uz * s + ux * w };
    for (const off of [0, 4, -4, 8, -8, 12, -12]) {
      const x = ux * s - uz * (w + off);
      const z = uz * s + ux * (w + off);
      if (c.field.groundAt(x, z) > WATER + 0.3) {
        at = { x, z };
        break;
      }
    }
    out.push(at);
  }
  return out;
}

/** A random dry point between `inner` and `outer` m from the object, or null after a few tries. */
function spotAround(c: PlaceCtx, inner = RING_INNER, outer = RING_OUTER): { x: number; z: number; y: number } | null {
  for (let k = 0; k < 6; k++) {
    const a = c.rng() * TAU;
    // sqrt: evenly spread over the ring's area, not bunched at its inner edge.
    const d = Math.sqrt(inner * inner + c.rng() * (outer * outer - inner * inner));
    const x = c.x + Math.cos(a) * d;
    const z = c.z + Math.sin(a) * d;
    const y = c.field.groundAt(x, z);
    if (y > WATER + 0.3) return { x, z, y };
  }
  return null;
}

/** Ground tint over the whole biome, nearly at full strength. */
const tintBiome = (c: PlaceCtx, hex: string) =>
  c.tints.push({ x: c.x, z: c.z, inner: 48, outer: 62, color: new THREE.Color(hex), strength: 0.92 });

/** A small tree: two trunk segments (the upper one leaning more) and a round crown. */
function tree(c: PlaceCtx, x: number, y: number, z: number, h: number, crown: number): void {
  const lean = 0.08 + c.rng() * 0.12;
  const dir = c.rng() * TAU;
  const wood = tint(c.rng, pick(c.rng, WOOD));
  const h1 = h * 0.55;
  const s = h / 6; // thicker trunks on taller trees
  const q = pushInstance(c.lists.trunk, x, y - 0.1, z, s, h1, s, Math.sin(dir) * lean, 0, Math.cos(dir) * lean, wood);
  const top = new THREE.Vector3(0, h1, 0).applyQuaternion(q);
  const lean2 = lean * 2.4;
  const q2 = pushInstance(
    c.lists.trunk,
    x + top.x,
    y - 0.1 + top.y,
    z + top.z,
    s * 0.6,
    h - h1,
    s * 0.6,
    Math.sin(dir) * lean2,
    0,
    Math.cos(dir) * lean2,
    wood,
  );
  const tip = new THREE.Vector3(0, h - h1, 0).applyQuaternion(q2).add(top);
  pushInstance(
    c.lists.canopy,
    x + tip.x,
    y + tip.y + crown * 0.35,
    z + tip.z,
    crown,
    crown * 0.8,
    crown,
    c.rng(),
    c.rng() * TAU,
    c.rng(),
    tint(c.rng, pick(c.rng, LEAVES)),
  );
}

type Place = (c: PlaceCtx) => void;

const PLACE: Record<HiddenId, Place> = {
  /** The very different one: a grove of pale wooden trees on warm sand, around a mother tree. */
  guitar(c) {
    tintBiome(c, '#ffe2a8');
    c.clearings.push({ x: c.x, z: c.z, r: BIOME_CLEARING });
    for (let i = 0; i < 36; i++) {
      const p = spotAround(c);
      if (!p) continue;
      tree(c, p.x, p.y, p.z, 4 + c.rng() * 3.5, 1.3 + c.rng() * 0.9);
      c.colliders.push({ x: p.x, z: p.z, r: 0.35 });
    }
    // Saplings: the grove's children, knee to head high.
    for (let i = 0; i < 24; i++) {
      const p = spotAround(c, 7, RING_OUTER);
      if (p) tree(c, p.x, p.y, p.z, 0.8 + c.rng() * 1.2, 0.35 + c.rng() * 0.3);
    }
    const p = structureSpot(c);
    motherTree(c, p.x, p.y, p.z);
  },

  /** Spiky ground: tall spires of rock and crystal on a cold blue soil, around a crystal cathedral. */
  insulin(c) {
    tintBiome(c, '#9cc8ff');
    c.clearings.push({ x: c.x, z: c.z, r: BIOME_CLEARING });
    for (let i = 0; i < 32; i++) {
      const p = spotAround(c);
      if (!p) continue;
      const r = 0.6 + c.rng() * 0.9;
      const h = 4 + c.rng() * 8;
      const crystal = c.rng() < 0.45;
      pushInstance(
        crystal ? c.lists.spireCrystal : c.lists.spireRock,
        p.x,
        p.y - 0.3,
        p.z,
        r,
        h,
        r,
        (c.rng() - 0.5) * 0.25,
        c.rng() * TAU,
        (c.rng() - 0.5) * 0.25,
        crystal ? tint(c.rng, pick(c.rng, ICE)) : tint(c.rng, pick(c.rng, c.kit.palette.rocks)),
      );
      c.colliders.push({ x: p.x, z: p.z, r: r * 0.85 });
    }
    // Shards at ground level, everywhere in the biome.
    for (let i = 0; i < 40; i++) {
      const p = spotAround(c, 7, RING_OUTER);
      if (!p) continue;
      const r = 0.15 + c.rng() * 0.2;
      pushInstance(
        c.lists.spireCrystal,
        p.x,
        p.y - 0.1,
        p.z,
        r,
        0.5 + c.rng() * 1.1,
        r,
        (c.rng() - 0.5) * 0.8,
        c.rng() * TAU,
        (c.rng() - 0.5) * 0.8,
        tint(c.rng, pick(c.rng, ICE)),
      );
    }
    const p = structureSpot(c);
    crystalCathedral(c, p.x, p.y, p.z);
  },

  /**
   * An island (the moat is carved by `islandModifier`, which HiddenSet adds to the field first),
   * ringed by tall reeds on the far shore, under a huge floating rock.
   */
  campanil(c) {
    c.clearings.push({ x: c.x, z: c.z, r: SHORE + 8 });
    for (let i = 0; i < 70; i++) {
      const a = c.rng() * TAU;
      const d = SHORE - 1 + c.rng() * 7;
      const x = c.x + Math.cos(a) * d;
      const z = c.z + Math.sin(a) * d;
      const y = c.field.groundAt(x, z);
      if (y < WATER + 0.1) continue;
      pushInstance(
        c.lists.reed,
        x,
        y - 0.1,
        z,
        1,
        1.4 + c.rng() * 1.8,
        1,
        (c.rng() - 0.5) * 0.4,
        c.rng() * TAU,
        (c.rng() - 0.5) * 0.4,
        tint(c.rng, pick(c.rng, REEDS)),
      );
    }
    floatingRock(c, c.x + (c.rng() - 0.5) * 6, c.z + (c.rng() - 0.5) * 6);
  },

  /** Copper-red soil with copper boulders among the stalks of its hideout, and a giant copper arch. */
  earring(c) {
    tintBiome(c, '#f07a45');
    c.clearings.push({ x: c.x, z: c.z, r: BIOME_CLEARING });
    for (let i = 0; i < 26; i++) {
      const p = spotAround(c);
      if (!p) continue;
      const s = 0.6 + c.rng() * 1.6;
      pushInstance(
        c.lists.rock,
        p.x,
        p.y + s * 0.1,
        p.z,
        s,
        s * 0.6,
        s * 0.9,
        c.rng(),
        c.rng() * TAU,
        c.rng(),
        tint(c.rng, pick(c.rng, COPPER)),
      );
      c.colliders.push({ x: p.x, z: p.z, r: s * 0.8 });
    }
    // The stalks of its hideout spread thin across the biome.
    const bulb = pick(c.rng, c.kit.palette.bulbs);
    for (let i = 0; i < 30; i++) {
      const p = spotAround(c, 7, RING_OUTER);
      if (!p) continue;
      const h = 0.8 + c.rng() * 1.2;
      const q = pushInstance(c.lists.stalk, p.x, p.y, p.z, 1, h, 1, (c.rng() - 0.5) * 0.4, 0, (c.rng() - 0.5) * 0.4);
      const top = new THREE.Vector3(0, h, 0).applyQuaternion(q);
      pushInstance(c.lists.bulb, p.x + top.x, p.y + top.y, p.z + top.z, 1, 1.15, 1, 0, c.rng() * TAU, 0, bulb);
    }
    const p = structureSpot(c);
    copperArch(c, p.x, p.y, p.z);
  },

  /** Its place is the mirador's mountain (ART-08), which nothing points at from afar. */
  letter() {},
};

// ------------------------------------------------------------------ structures

/** A huge old tree: wide trunk, roots arching over the ground, a crown of several big masses. */
function motherTree(c: PlaceCtx, x: number, y: number, z: number): void {
  const bark = MAT.bark();
  const crown = MAT.crown();
  const H = 15 + c.rng() * 5;
  // Built at its first size, then made colossal (more if it stands far: see silhouetteScale).
  // Its lowest possible top: the central crown mass, sunk 0.5 into the ground.
  const S = silhouetteScale(c.field, x, z, y, H * 1.02 + 2 - 0.5, COLOSSAL);
  const g = new THREE.Group();
  g.position.set(x, y - S * 0.5, z);
  g.rotation.y = c.rng() * TAU;
  g.scale.setScalar(S);
  g.add(mesh(new THREE.CylinderGeometry(1.3, 2.4, H * 0.6, 8), bark, 0, H * 0.3 - 0.3, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.8, 1.3, H * 0.45, 7), bark, 0.6, H * 0.8, 0, 0, 0, -0.12));
  const roots = 6;
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * TAU + c.rng() * 0.4;
    const r = 2.4 + c.rng() * 1.2;
    const root = mesh(new THREE.TorusGeometry(r, 0.45, 4, 7, Math.PI), bark, Math.cos(a) * r, -0.4, Math.sin(a) * r);
    root.rotation.y = -a; // the arch runs outward from the trunk
    g.add(root);
  }
  const top = H * 1.02;
  for (let i = 0; i < 7; i++) {
    const a = c.rng() * TAU;
    const d = i === 0 ? 0 : 2.5 + c.rng() * 3;
    const r = 3.5 + c.rng() * 2.5;
    g.add(
      mesh(
        new THREE.IcosahedronGeometry(r, 0),
        crown,
        Math.cos(a) * d + 0.6,
        top + (c.rng() - 0.3) * 2.5,
        Math.sin(a) * d,
        c.rng(),
        c.rng(),
        0,
        1,
        0.8,
        1,
      ),
    );
  }
  c.group.add(g);
  c.colliders.push({ x, z, r: 2.4 * S });
  c.structure = { x, z, top: y + S * (H * 1.02 + 2 - 0.5), scale: S };
}

/** A cluster of giant crystals leaning towards one point above them, with a faint light of their own. */
function crystalCathedral(c: PlaceCtx, x: number, y: number, z: number): void {
  // The middle crystal is 26 units tall, sunk 0.8: that is the top.
  const S = silhouetteScale(c.field, x, z, y, 26 - 0.8, COLOSSAL);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + c.rng() * 0.3;
    const d = (4 + c.rng() * 3) * S;
    const bx = x + Math.cos(a) * d;
    const bz = z + Math.sin(a) * d;
    const h = (7 + c.rng() * 6) * S; // half height: the geometry is 2 units tall
    const w = (1.2 + c.rng() * 0.9) * S;
    const lean = 0.3 + c.rng() * 0.15;
    // Lean towards the centre: tilt about the axis perpendicular to the direction to the centre.
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), -lean);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(bx, c.field.groundAt(bx, bz) - 0.8 * S, bz),
      q,
      new THREE.Vector3(w, h, w),
    );
    c.lists.giantCrystal.push({ m, c: tint(c.rng, pick(c.rng, ICE)) });
    c.colliders.push({ x: bx, z: bz, r: w * 0.9 });
  }
  // A tall one in the middle.
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y - 0.8 * S, z),
    new THREE.Quaternion(),
    new THREE.Vector3(1.8 * S, 13 * S, 1.8 * S),
  );
  c.lists.giantCrystal.push({ m, c: tint(c.rng, pick(c.rng, ICE)) });
  c.colliders.push({ x, z, r: 1.6 * S });
  c.structure = { x, z, top: y + S * (26 - 0.8), scale: S };
}

/**
 * A huge rock hanging in the air over the island, with roots and glowing stalks dangling below.
 * Per unit of scale it floats 13.3 m up (its roots clear the island) and its top reaches 5.3 m higher.
 */
function floatingRock(c: PlaceCtx, x: number, z: number): void {
  const rock = MAT.floatRock();
  const roots = MAT.bark();
  const ground = c.field.groundAt(c.x, c.z);
  const S = silhouetteScale(c.field, x, z, ground, 13.3 + 5.3, COLOSSAL * 0.9, 13.3 - 6.5); // apex at -6.5
  const y = ground + 13.3 * S;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = c.rng() * TAU;
  g.scale.setScalar(S);
  g.add(mesh(new THREE.ConeGeometry(7, 9, 7), rock, 0, -2, 0, Math.PI));
  g.add(mesh(new THREE.DodecahedronGeometry(6.5, 0), rock, 0, 2.4, 0, 0, 0, 0, 1, 0.45, 1));
  for (let i = 0; i < 14; i++) {
    const a = c.rng() * TAU;
    const d = 1 + c.rng() * 4;
    const len = 2 + c.rng() * 5;
    const sx = Math.cos(a) * d;
    const sz = Math.sin(a) * d;
    const sy = -6.5 + (9 * d) / 7; // on the cone's underside (apex at -6.5, radius 7 at +2.5)
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.12, len, 4), roots, sx, sy - len / 2, sz));
    if (c.rng() < 0.6) g.add(mesh(new THREE.IcosahedronGeometry(0.25, 0), c.kit.mat.bulb, sx, sy - len, sz));
  }
  c.group.add(g);
  c.structure = { x, z, top: y + 5.3 * S, scale: S };
}

/** A giant natural arch of copper rock, standing across the line towards the object. */
function copperArch(c: PlaceCtx, x: number, y: number, z: number): void {
  const stone = MAT.copperArch();
  const R = 8 + c.rng() * 3;
  const unitTop = (R + 1.7) * 1.35 - 1.2; // the crown of the arch, sunk 1.2
  const S = silhouetteScale(c.field, x, z, y, unitTop, COLOSSAL * 0.9);
  const g = new THREE.Group();
  g.position.set(x, y - 1.2 * S, z);
  g.scale.setScalar(S);
  // The arch's span runs across the direction to the object: you look through it towards it.
  const toObject = Math.atan2(c.z - z, c.x - x);
  g.rotation.y = -toObject + Math.PI / 2;
  const arch = mesh(new THREE.TorusGeometry(R, 1.7, 5, 12, Math.PI), stone, 0, 0, 0);
  arch.scale.set(1, 1.35, 1); // taller than wide
  g.add(arch);
  for (const k of [-1, 1])
    g.add(mesh(new THREE.DodecahedronGeometry(2.6, 0), stone, k * R, 0.4, 0, c.rng(), c.rng(), 0, 1, 0.7, 1));
  c.group.add(g);
  // Feet, in world space: along the arch's span (local x).
  const ux = Math.cos(toObject + Math.PI / 2);
  const uz = Math.sin(toObject + Math.PI / 2);
  for (const k of [-1, 1]) c.colliders.push({ x: x + ux * R * S * k, z: z + uz * R * S * k, r: 2.2 * S });
  c.structure = { x, z, top: y + unitTop * S, scale: S };
}

// ------------------------------------------------------------------ trails

type Crumb = (c: PlaceCtx, x: number, y: number, z: number) => void;

/** One element of each biome, dropped along its trail. The letter has none: nothing points at the mirador. */
const TRAIL: Partial<Record<HiddenId, Crumb>> = {
  /** A young wooden tree, like the grove's. */
  guitar(c, x, y, z) {
    tree(c, x, y, z, 2.5 + c.rng() * 2, 0.7 + c.rng() * 0.5);
    c.colliders.push({ x, z, r: 0.25 });
  },
  /** One to three cold blue crystals. */
  insulin(c, x, y, z) {
    const n = 1 + Math.floor(c.rng() * 3);
    for (let i = 0; i < n; i++) {
      const r = 0.25 + c.rng() * 0.2;
      pushInstance(
        c.lists.spireCrystal,
        x + (c.rng() - 0.5) * 1.2,
        y - 0.2,
        z + (c.rng() - 0.5) * 1.2,
        r,
        1.5 + c.rng() * 2,
        r,
        (c.rng() - 0.5) * 0.4,
        c.rng() * TAU,
        (c.rng() - 0.5) * 0.4,
        tint(c.rng, pick(c.rng, ICE)),
      );
    }
    c.colliders.push({ x, z, r: 0.5 });
  },
  /** A small rock floating a few metres up, with a glowing stalk hanging from it. */
  campanil(c, x, y, z) {
    const w = 0.7 + c.rng() * 0.6;
    const fy = y + 3 + c.rng() * 3;
    pushInstance(
      c.lists.float,
      x,
      fy,
      z,
      w,
      w * 1.2,
      w,
      0,
      c.rng() * TAU,
      0,
      tint(c.rng, pick(c.rng, c.kit.palette.rocks)),
    );
    const len = 0.8 + c.rng() * 1.2;
    const bottom = fy - w * 0.6;
    pushInstance(c.lists.stalk, x, bottom, z, 1, len, 1, Math.PI, 0, 0); // hanging: the stalk grows downwards
    pushInstance(
      c.lists.bulb,
      x,
      bottom - len,
      z,
      0.8,
      0.9,
      0.8,
      0,
      c.rng() * TAU,
      0,
      pick(c.rng, c.kit.palette.bulbs),
    );
  },
  /** A copper boulder. */
  earring(c, x, y, z) {
    const s = 0.5 + c.rng() * 0.6;
    pushInstance(
      c.lists.rock,
      x,
      y + s * 0.1,
      z,
      s,
      s * 0.6,
      s * 0.9,
      c.rng(),
      c.rng() * TAU,
      c.rng(),
      tint(c.rng, pick(c.rng, COPPER)),
    );
    c.colliders.push({ x, z, r: s * 0.8 });
  },
};

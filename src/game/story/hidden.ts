import * as THREE from 'three';
import { HIDDEN, type HiddenDef, type HiddenId } from '../../content/story';
import { WATER } from '../config';
import { mulberry32, type Rng } from '../math/random';
import { smoothstep, TAU } from '../math/util';
import {
  additiveSprite,
  basic,
  buildInstanced,
  lam,
  mesh,
  pick,
  pushInstance,
  tint,
  type InstanceEntry,
} from '../three/helpers';
import type { Collider } from '../world/collision';
import type { PropKit } from '../world/props';
import { STAR_ANGLE } from '../world/sky';
import type { TerrainField } from '../world/terrain';
import type { TintZone } from '../world/palette';
import { facesAlong, layoutHidden, type HiddenLayout } from './hiddenLayout';
import { buildPlaces, islandModifier, type Structure } from './hiddenPlaces';

/** A hidden object placed in the world (ENG-13). */
export interface HiddenItem extends HiddenDef {
  /** Tells it apart from a memory in the gaze code. */
  hidden: true;
  obj: THREE.Group;
  glint: THREE.Sprite;
  /** Direction (rad, `atan2(z, x)`) from the object to where you naturally stand to look at it. */
  approachAngle: number;
  /** If set, it only answers when, looking at it, the viewer faces this direction (rad). */
  lookAngle: number | null;
}

/** The proximity glint fades in between these distances (m): "visible a unos 30 m". */
const GLINT_FAR = 32;
const GLINT_NEAR = 25;
/** Beyond this the objects are not drawn at all (fog hides them long before). */
const DRAW_DISTANCE = 120;
/** How far to each side of `lookAngle` the viewer may stand. */
const LOOK_HALF_ANGLE = 1.2;
/** Radius kept free of scattered props around each hideout. */
const CLEARING = 5;
/** Mixed into the seed for the hideouts' own generator (not the world's). */
const SALT = 0x5eed1e;

const _w = new THREE.Vector3();
const _v = new THREE.Vector3();

/**
 * The five hidden objects of the free roam, each with its own hideout and its own place around it
 * (hiddenPlaces.ts), built with the world. Isi doesn't recognise them; they don't count in the
 * counter. Placeholder shapes until ART-11.
 *
 * Build it before the chunks: it adds the campanil's island to `field`, and the chunks need its
 * `clearings` and `tints`.
 */
export class HiddenSet {
  readonly group = new THREE.Group();
  readonly items: HiddenItem[];
  readonly layout: HiddenLayout;
  /** Hideout rocks the player bumps into. */
  readonly colliders: Collider[] = [];
  /** Where the chunks must not scatter props. */
  readonly clearings: Collider[];
  /** Ground colors of the places around the objects, for the terrain palette. */
  readonly tints: TintZone[];
  /** The colossal structure of each place (the letter has none). */
  readonly structures: Partial<Record<HiddenId, Structure>>;

  constructor(field: TerrainField, kit: PropKit, glow: THREE.Texture, seed: number) {
    this.layout = layoutHidden({
      seed,
      shipAngle: Math.atan2(field.shipZ, field.shipX),
      starAngle: STAR_ANGLE,
      isDry: (x, z) => isDry(field, x, z),
    });
    const { spots } = this.layout;
    // The spots were chosen on the original terrain; now the island is carved around the campanil.
    field.addModifier(islandModifier(spots.campanil.x, spots.campanil.z));
    this.clearings = HIDDEN.map(({ id }) => ({ x: spots[id].x, z: spots[id].z, r: CLEARING }));

    const lists = {
      rock: [] as InstanceEntry[],
      crystal: [] as InstanceEntry[],
      stalk: [] as InstanceEntry[],
      bulb: [] as InstanceEntry[],
    };
    const nest: Nest = { field, kit, lists, colliders: this.colliders };

    this.items = HIDDEN.map((def, i) => {
      const { x, z } = spots[def.id];
      const out = Math.atan2(z, x);
      const rng = mulberry32((seed ^ SALT ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0);
      const obj = new THREE.Group();
      obj.position.set(x, field.groundAt(x, z), z);
      this.group.add(obj);
      const { approachAngle, lookAngle } = BUILD[def.id]({
        ...nest,
        rng,
        obj,
        x,
        z,
        out,
        mirador: this.layout.miradorAngle,
      });
      const glint = additiveSprite(glow, 0xfff4e0, 0);
      glint.scale.setScalar(0.7);
      this.group.add(glint);
      return { ...def, hidden: true as const, obj, glint, approachAngle, lookAngle };
    });

    for (const k of ['rock', 'crystal', 'stalk', 'bulb'] as const) {
      const im = buildInstanced(kit.geo[k], kit.mat[k], lists[k]);
      if (im) this.group.add(im);
    }

    const places = buildPlaces(
      field,
      kit,
      spots,
      seed,
      HIDDEN.map((h) => h.id),
    );
    this.group.add(places.group);
    this.colliders.push(...places.colliders);
    this.clearings.push(...places.clearings);
    this.tints = places.tints;
    this.structures = places.structures;
  }

  /** World-space point the player has to look at. Shared vector: copy it to keep it. */
  targetOf(h: HiddenItem): THREE.Vector3 {
    return h.obj.getWorldPosition(_w).add(_v.set(0, h.attention.offsetY, 0));
  }

  /** Whether a viewer at (x, z) is on the side the object answers from. */
  answers(h: HiddenItem, x: number, z: number): boolean {
    if (h.lookAngle === null) return true;
    return facesAlong(x, z, h.obj.position.x, h.obj.position.z, h.lookAngle, LOOK_HALF_ANGLE);
  }

  /** Where to stand, `distance` m from the object, to look at it (debug jumps). */
  standingSpot(h: HiddenItem, distance: number): { x: number; z: number } {
    const { x, z } = h.obj.position;
    return { x: x + Math.cos(h.approachAngle) * distance, z: z + Math.sin(h.approachAngle) * distance };
  }

  /**
   * Objects exist only in the free roam (`active`). A faint glint, like something catching the
   * light, appears within ~30 m on the ones not found yet; never from afar, never as text.
   */
  update(dt: number, time: number, viewer: THREE.Vector3, active: boolean, found: ReadonlySet<string>): void {
    this.items.forEach((h, i) => {
      const d = Math.hypot(viewer.x - h.obj.position.x, viewer.z - h.obj.position.z);
      h.obj.visible = active && d < DRAW_DISTANCE;
      h.glint.position.copy(this.targetOf(h)).y += 0.08;
      const near = 1 - smoothstep(GLINT_NEAR, GLINT_FAR, d);
      const twinkle = 0.1 + 0.8 * Math.pow(Math.max(0, Math.sin(time * 1.7 + i * 2.1)), 12);
      const target = active && !found.has(h.id) ? near * twinkle : 0;
      const m = h.glint.material;
      m.opacity += (target - m.opacity) * Math.min(1, dt * 8);
    });
  }
}

/** Dry, and not right at the shore: the hideout spans a few metres. */
function isDry(field: TerrainField, x: number, z: number): boolean {
  if (field.groundAt(x, z) < WATER + 0.4) return false;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    if (field.groundAt(x + Math.cos(a) * 3, z + Math.sin(a) * 3) < WATER + 0.2) return false;
  }
  return true;
}

// ------------------------------------------------------------------ hideouts

interface Nest {
  field: TerrainField;
  kit: PropKit;
  lists: Record<'rock' | 'crystal' | 'stalk' | 'bulb', InstanceEntry[]>;
  colliders: Collider[];
}

interface BuildCtx extends Nest {
  rng: Rng;
  /** The object's group, already on the ground at (x, z). Its own meshes go in local coordinates. */
  obj: THREE.Group;
  x: number;
  z: number;
  /** Direction from the fire to the object (rad). */
  out: number;
  /** Direction of the mirador from the fire (rad). */
  mirador: number;
}

type Build = (c: BuildCtx) => { approachAngle: number; lookAngle: number | null };

const M = {
  wood: lam(0xb7773f),
  woodDark: lam(0x5c3b26),
  string: basic(0xe8e0d0),
  pen: lam(0xe9e6f2),
  penCap: lam(0xf08a3c),
  cream: lam(0xfff0dc),
  sky: lam(0x7fa6d8),
  tower: lam(0xb9b2c8),
  copper: lam(0xc0643a, { emissive: 0x2a0e04 }),
  paper: lam(0xf6efe2),
};

/** A rock of the hideout `d` m from (x, z) in direction `a`, with a collider. */
function rock(c: BuildCtx, a: number, d: number, s: number): void {
  const x = c.x + Math.cos(a) * d;
  const z = c.z + Math.sin(a) * d;
  const y = c.field.groundAt(x, z);
  pushInstance(
    c.lists.rock,
    x,
    y + s * 0.15,
    z,
    s,
    s * 0.8,
    s * 0.9,
    c.rng(),
    c.rng() * TAU,
    c.rng(),
    tint(c.rng, pick(c.rng, c.kit.palette.rocks)),
  );
  c.colliders.push({ x, z, r: s * 0.8 });
}

/** Points the group's local +z along world direction `a`. */
const faceTowards = (g: THREE.Object3D, a: number) => {
  g.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
};

const BUILD: Record<HiddenId, Build> = {
  /** Leaning alone against a rock, in a horseshoe of rocks closed towards the fire. */
  guitar(c) {
    const back = c.out + Math.PI; // towards the fire
    rock(c, back, 1.6, 1.2);
    for (const k of [-1, 1]) {
      rock(c, back + k * 0.9, 1.9, 1.2 + c.rng() * 0.4);
      rock(c, back + k * 1.75, 2.1, 0.9 + c.rng() * 0.4);
    }
    const g = new THREE.Group();
    faceTowards(g, c.out);
    g.position.y = 0.02;
    const body = new THREE.Group();
    body.rotation.x = -0.32; // leaning back onto the rock
    body.position.z = -0.25;
    body.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 9), M.wood, 0, 0.24, 0, Math.PI / 2));
    body.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.09, 9), M.wood, 0, 0.5, 0, Math.PI / 2));
    body.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 7), M.woodDark, 0, 0.4, 0.002, Math.PI / 2));
    body.add(mesh(new THREE.BoxGeometry(0.055, 0.46, 0.035), M.woodDark, 0, 0.84, 0));
    body.add(mesh(new THREE.BoxGeometry(0.08, 0.15, 0.03), M.woodDark, 0, 1.13, -0.01, -0.2));
    body.add(mesh(new THREE.BoxGeometry(0.035, 0.85, 0.004), M.string, 0, 0.66, 0.05));
    g.add(body);
    c.obj.add(g);
    return { approachAngle: c.out, lookAngle: null };
  },

  /** Lying on the ground inside a ring of tall crystals, with a gap facing away from the fire. */
  insulin(c) {
    const n = 8;
    const color = pick(c.rng, c.kit.palette.crystals);
    for (let i = 0; i < n; i++) {
      const a = c.out + Math.PI + ((i - (n - 1) / 2) / n) * TAU * 0.82; // the gap faces outwards
      const d = 1.2 + c.rng() * 0.3;
      const x = c.x + Math.cos(a) * d;
      const z = c.z + Math.sin(a) * d;
      const k = 0.8 + c.rng() * 0.5;
      pushInstance(
        c.lists.crystal,
        x,
        c.field.groundAt(x, z) + 0.4,
        z,
        0.5 * k,
        (1.8 + c.rng() * 1.2) * k,
        0.5 * k,
        (c.rng() - 0.5) * 0.5,
        c.rng() * TAU,
        (c.rng() - 0.5) * 0.5,
        tint(c.rng, color),
      );
      c.colliders.push({ x, z, r: 0.35 });
    }
    const g = new THREE.Group();
    g.rotation.y = c.rng() * TAU;
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), M.pen, 0, 0.02, 0, 0, 0, Math.PI / 2));
    g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 6), M.penCap, 0.09, 0.02, 0, 0, 0, Math.PI / 2));
    c.obj.add(g);
    return { approachAngle: c.out, lookAngle: null };
  },

  /** Propped on a rock so that, looking at it, you face the star. Rocks around its back and sides. */
  campanil(c) {
    const toStar = STAR_ANGLE;
    rock(c, toStar, 0.75, 0.6);
    rock(c, toStar + 1.4, 1.5, 1.1 + c.rng() * 0.3);
    rock(c, toStar - 1.4, 1.5, 1.1 + c.rng() * 0.3);
    rock(c, toStar + 0.6, 1.8, 1.3 + c.rng() * 0.3);
    rock(c, toStar - 0.6, 1.8, 1.3 + c.rng() * 0.3);
    const g = new THREE.Group();
    faceTowards(g, toStar + Math.PI); // the picture faces the viewer, the star is behind it
    const p = new THREE.Group();
    p.position.set(0, 0.14, 0);
    p.rotation.x = -0.5; // leaning back onto the rock
    p.add(mesh(new THREE.BoxGeometry(0.3, 0.22, 0.012), M.cream, 0, 0, 0));
    p.add(mesh(new THREE.BoxGeometry(0.25, 0.16, 0.014), M.sky, 0, 0.012, 0.002));
    p.add(mesh(new THREE.BoxGeometry(0.035, 0.12, 0.016), M.tower, 0, 0.0, 0.004));
    g.add(p);
    c.obj.add(g);
    return { approachAngle: toStar + Math.PI, lookAngle: toStar };
  },

  /** On a flat stone in a thicket of stalks with bulbs. */
  earring(c) {
    const color = pick(c.rng, c.kit.palette.bulbs);
    for (let i = 0; i < 14; i++) {
      const a = c.rng() * TAU;
      const d = 0.45 + c.rng() * 1.3;
      const x = c.x + Math.cos(a) * d;
      const z = c.z + Math.sin(a) * d;
      const h = 1.0 + c.rng() * 1.2;
      const y = c.field.groundAt(x, z);
      const q = pushInstance(c.lists.stalk, x, y, z, 1.2, h, 1.2, (c.rng() - 0.5) * 0.4, 0, (c.rng() - 0.5) * 0.4);
      _v.set(0, h, 0).applyQuaternion(q);
      pushInstance(c.lists.bulb, x + _v.x, y + _v.y, z + _v.z, 1, 1.15, 1, 0, c.rng() * TAU, 0, color);
    }
    const g = new THREE.Group();
    g.rotation.y = c.rng() * TAU;
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 7), M.tower, 0, 0.03, 0));
    g.add(mesh(new THREE.OctahedronGeometry(1, 0), M.copper, 0, 0.075, 0, Math.PI / 2, 0, 0, 0.035, 0.1, 0.012));
    g.add(mesh(new THREE.TorusGeometry(0.018, 0.004, 4, 8), M.copper, 0, 0.075, -0.11, Math.PI / 2));
    c.obj.add(g);
    return { approachAngle: c.out + Math.PI, lookAngle: null };
  },

  /**
   * On a rock at the mirador's summit, facing the view beyond the cliff: looking at it, you are
   * already looking at the landscape. The mountain around it comes with ART-08.
   */
  letter(c) {
    const view = c.mirador;
    rock(c, 0, 0, 0.65);
    const g = new THREE.Group();
    faceTowards(g, view);
    g.position.y = 0.6;
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.006, 0.3), M.paper, 0, 0.03, 0, 0.25));
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.006, 0.12), M.paper, 0, 0.07, -0.12, 0.9));
    g.add(mesh(new THREE.DodecahedronGeometry(0.05, 0), M.tower, 0.06, 0.06, 0.06));
    c.obj.add(g);
    return { approachAngle: view + Math.PI, lookAngle: view };
  },
};

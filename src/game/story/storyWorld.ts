import * as THREE from 'three';
import type { ItemId } from '../../content/story';
import { mulberry32 } from '../math/random';
import { basic, buildInstanced, lam, mesh, pushInstance, type InstanceEntry } from '../three/helpers';
import type { Collider } from '../world/collision';
import type { PropKit } from '../world/props';
import type { TerrainField } from '../world/terrain';
import { Campfire } from './campfire';

/** Every story object that can be remembered, except the sky "star" (owned by Sky). */
export type StoryObjects = Record<Exclude<ItemId, 'star'>, THREE.Object3D>;

export interface StoryWorld {
  group: THREE.Group;
  campfire: Campfire;
  /** Where the player wakes up. */
  bedroll: { x: number; z: number };
  colliders: Collider[];
  objects: StoryObjects;
  /** Blinking lamps on the ship and the beacon. */
  update(time: number): void;
}

/**
 * Handmade, hand-placed story set: camp, crash trail, belongings, ship.
 * Positions are derived from the terrain's trail so every seed reads the same way.
 */
export function buildStoryWorld(field: TerrainField, kit: PropKit, glow: THREE.Texture, seed: number): StoryWorld {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const M = {
    cream: lam(0xfff0dc),
    orange: lam(0xf3a25e),
    visor: lam(0x35577a, { emissive: 0x10203a }),
    wood: lam(0x7a5a4a),
    stone: lam(0x8a7fa6),
    char: lam(0x3b3350),
    teal: lam(0x4fb3a9),
    indigo: lam(0x3a3a8a),
    bed: lam(0x5b6fb0),
    photo: lam(0xffc98f),
    green: lam(0x6cc49b),
    grey: lam(0x9a93b0),
    red: basic(0xff5a5a),
  };
  const rock = kit.geo.rock;

  const placed = (x: number, z: number, ry = 0, sink = 0) => {
    const g = new THREE.Group();
    g.position.set(x, field.groundAt(x, z) - sink, z);
    g.rotation.y = ry;
    group.add(g);
    return g;
  };
  const ANG = Math.atan2(field.shipZ, field.shipX);
  const at = (a: number, d: number): [number, number] => [Math.cos(ANG + a) * d, Math.sin(ANG + a) * d];
  const { shipX: SX, shipZ: SZ, dirX: SDx, dirZ: SDz } = field;

  // --- campfire ---
  const campfire = new Campfire(placed(0, 0), rock, M, glow);
  colliders.push({ x: 0, z: 0, r: 1.0 });

  // --- camp: bedroll, log seat ---
  const [bx, bz] = at(Math.PI, 2.8);
  const bed = placed(bx, bz, -ANG);
  bed.add(mesh(new THREE.BoxGeometry(0.9, 0.14, 2.0), M.bed, 0, 0.07, 0));
  bed.add(mesh(new THREE.BoxGeometry(0.7, 0.2, 0.4), M.cream, 0, 0.14, 0.75));
  const [lx, lz] = at(2.0, 2.5);
  const log = placed(lx, lz, -(ANG + 2.0));
  log.add(mesh(new THREE.CylinderGeometry(0.25, 0.27, 1.7, 7), M.wood, 0, 0.22, 0, 0, 0, Math.PI / 2));
  colliders.push({ x: lx, z: lz, r: 0.7 });

  // --- the ship, nose toward camp ---
  const ship = placed(SX, SZ, Math.atan2(SDz, -SDx), 0.7);
  ship.rotation.order = 'YXZ';
  ship.rotation.x = 0.16;
  ship.rotation.z = 0.08;
  ship.add(mesh(new THREE.CylinderGeometry(1.5, 1.9, 8, 8), M.cream, 0, 1.2, 0, 0, 0, Math.PI / 2));
  ship.add(mesh(new THREE.ConeGeometry(1.5, 2.6, 8), M.cream, 5.3, 1.2, 0, 0, 0, -Math.PI / 2));
  ship.add(mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.6, 8), M.orange, 1.2, 1.2, 0, 0, 0, Math.PI / 2));
  ship.add(mesh(new THREE.CylinderGeometry(1.1, 1.4, 1.2, 8), M.char, -4.6, 1.2, 0, 0, 0, Math.PI / 2));
  ship.add(mesh(new THREE.IcosahedronGeometry(1.1, 1), M.visor, 3.2, 2.4, 0, 0, 0, 0, 1.6, 0.7, 0.9));
  ship.add(mesh(new THREE.BoxGeometry(3, 0.25, 3.6), M.cream, -1, 0.6, 2.6, 0.12));
  ship.add(mesh(new THREE.BoxGeometry(2.2, 0.25, 1.6), M.cream, -0.8, 0.3, -2.0, -0.5, 0.3));
  ship.add(mesh(new THREE.BoxGeometry(2, 2.2, 0.25), M.orange, -3.8, 2.9, 0, 0, 0, -0.3));
  const shipLamp = mesh(new THREE.IcosahedronGeometry(0.14, 0), M.red, -4.3, 4.0, 0);
  ship.add(shipLamp);
  for (const s of [-4, 0, 4]) colliders.push({ x: SX - SDx * s, z: SZ - SDz * s, r: 2.6 });

  // --- debris along the trail ---
  {
    const dr = mulberry32(seed ^ 0xd3b);
    const list: InstanceEntry[] = [];
    for (let i = 0; i < 26; i++) {
      const t = 0.15 + dr() * 0.8;
      const [x, z] = field.onTrail(t, (dr() - 0.5) * 7);
      const s = 0.15 + dr() * 0.45;
      pushInstance(
        list,
        x,
        field.groundAt(x, z) + s * 0.2,
        z,
        s * 2,
        s * 0.3,
        s * 1.4,
        dr() * 3,
        dr() * 3,
        dr() * 3,
        dr() < 0.3 ? new THREE.Color('#f3a25e') : new THREE.Color('#e9e2d6'),
      );
    }
    group.add(buildInstanced(new THREE.TetrahedronGeometry(1, 0), lam(0xffffff), list)!);
  }

  // --- belongings ---
  const HP = at(0.9, 4.4),
    TP = at(2.25, 1.95);
  const PP = field.onTrail(0.24, 4),
    PH = field.onTrail(0.32, -5),
    SE = field.onTrail(0.4, 3.5);
  const RC = field.onTrail(0.6, -4),
    BC = field.onTrail(0.76, 5.5);

  const helmet = placed(HP[0], HP[1], 1.2);
  helmet.add(mesh(new THREE.IcosahedronGeometry(0.32, 1), M.cream, 0, 0.28, 0));
  helmet.add(mesh(new THREE.IcosahedronGeometry(0.24, 1), M.visor, 0.14, 0.3, 0, 0, 0, 0, 0.6, 0.8, 0.9));
  helmet.add(mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.1, 8), M.orange, -0.18, 0.25, 0, 0, 0, Math.PI / 2));
  helmet.add(mesh(new THREE.BoxGeometry(0.02, 0.02, 0.34), basic(0xffffff), 0.27, 0.33, 0, 0.4));
  helmet.rotation.z = 0.4;

  const thermos = placed(TP[0], TP[1], 0.4);
  thermos.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.34, 8), M.teal, 0, 0.12, 0, 0, 0, 1.3));
  thermos.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 8), M.cream, 0.17, 0.14, 0, 0, 0, 1.3));

  const patch = placed(PP[0], PP[1], 0.3);
  patch.add(mesh(rock, M.stone, 0, 0.15, 0, 0.3, 0.6, 0, 0.5, 0.32, 0.45));
  patch.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 6), M.orange, 0, 0.38, 0));
  patch.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 6), M.indigo, 0, 0.39, 0));
  colliders.push({ x: PP[0], z: PP[1], r: 0.45 });

  const photo = placed(PH[0], PH[1], Math.atan2(-PH[0], -PH[1]));
  photo.add(mesh(rock, M.stone, 0, 0.2, -0.2, 0.5, 0.2, 0, 0.45, 0.4, 0.35));
  {
    const p = new THREE.Group();
    p.position.set(0, 0.22, 0.08);
    p.rotation.x = -0.45;
    p.add(mesh(new THREE.BoxGeometry(0.32, 0.24, 0.012), M.cream, 0, 0, 0));
    p.add(mesh(new THREE.BoxGeometry(0.26, 0.17, 0.014), M.photo, 0, 0.015, 0.002));
    photo.add(p);
  }

  const seeds = placed(SE[0], SE[1], 1.1);
  seeds.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 10), M.green, 0, 0.13, 0, 0, 0, 1.4));
  seeds.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 10), M.cream, 0.32, 0.06, 0.1, 0.3, 0, 0.3));
  for (let i = 0; i < 6; i++)
    seeds.add(mesh(new THREE.IcosahedronGeometry(0.025, 0), M.photo, -0.2 - i * 0.06, 0.02, (i % 2) * 0.06 - 0.03));

  const recorder = placed(RC[0], RC[1], 0.7, 0.12);
  recorder.add(mesh(new THREE.BoxGeometry(0.55, 0.38, 0.65), lam(0xff8a3d), 0, 0.12, 0, 0.2, 0, 0.15));
  recorder.add(mesh(new THREE.BoxGeometry(0.56, 0.08, 0.66), M.cream, 0, 0.18, 0, 0.2, 0, 0.15));

  const beacon = placed(BC[0], BC[1], 2.1);
  beacon.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), M.grey, 0, 0.6, 0, 0, 0, 1.05));
  beacon.add(mesh(new THREE.CylinderGeometry(0.65, 0.08, 0.25, 10), M.cream, -0.95, 1.05, 0, 0, 0, 1.05));
  const beaconLamp = mesh(new THREE.IcosahedronGeometry(0.08, 0), M.red, -1.0, 1.25, 0);
  beacon.add(beaconLamp);

  const shipLampColor = (shipLamp.material as THREE.MeshBasicMaterial).color;

  return {
    group,
    campfire,
    bedroll: { x: bx, z: bz },
    colliders,
    objects: { fire: campfire.group, helmet, thermos, patch, photo, seeds, recorder, beacon, ship },
    update(time) {
      const blink = Math.sin(time * 4) > 0.6 ? 1 : 0.2;
      shipLampColor.setRGB(blink, blink * 0.35, blink * 0.35);
      beaconLamp.scale.setScalar(0.6 + blink * 0.6);
    },
  };
}

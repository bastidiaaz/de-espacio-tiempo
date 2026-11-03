import * as THREE from 'three';
import type { ItemId, MemoryDef } from '../../content/story';
import { additiveSprite } from '../three/helpers';
import type { StoryObjects } from './storyWorld';

/** A memory placed in the world. */
export interface Item extends MemoryDef {
  obj: THREE.Object3D;
  glint: THREE.Sprite;
}

const _w = new THREE.Vector3();
const _v = new THREE.Vector3();

export class ItemSet {
  readonly items: Item[];
  private readonly shipStar: THREE.Sprite;

  constructor(
    defs: readonly MemoryDef[],
    objects: StoryObjects,
    shipStar: THREE.Sprite,
    parent: THREE.Object3D,
    glow: THREE.Texture,
  ) {
    this.shipStar = shipStar;
    const starProxy = new THREE.Object3D();
    this.items = defs.map((def) => {
      const glint = additiveSprite(glow, 0xcfe8ff, 0);
      glint.scale.setScalar(0.9);
      parent.add(glint);
      const obj = def.id === 'star' ? starProxy : objects[def.id as Exclude<ItemId, 'star'>];
      return { ...def, obj, glint };
    });
  }

  /**
   * World-space point the player has to look at.
   * Returns a shared vector: copy it if you need to keep it.
   */
  targetOf(it: Item): THREE.Vector3 {
    if (it.id === 'star') {
      this.shipStar.getWorldPosition(_w);
      return _w;
    }
    return it.obj.getWorldPosition(_w).add(_v.set(0, it.attention.offsetY, 0));
  }

  /** Pulsing glints on memories that can be recalled right now. */
  updateGlints(dt: number, time: number, isAvailable: (it: Item) => boolean): void {
    for (const it of this.items) {
      if (it.id === 'star') continue;
      const on = isAvailable(it);
      it.glint.position.copy(this.targetOf(it));
      const target = on ? 0.35 + Math.sin(time * 2.4 + it.attention.offsetY * 5) * 0.25 : 0;
      it.glint.material.opacity += (target - it.glint.material.opacity) * Math.min(1, dt * 3);
    }
  }
}

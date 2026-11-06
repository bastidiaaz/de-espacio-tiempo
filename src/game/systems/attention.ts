import type * as THREE from 'three';
import { STILLNESS_LINE } from '../../content/story';
import { DWELL_SECONDS } from '../config';
import type { Item, ItemSet } from '../story/items';
import { Dwell, pickFocus, type Sighting } from './gaze';
import type { Narrative } from './narrative';
import type { Progress } from './progress';

export interface AttentionView {
  setReticle(near: boolean, focus: number): void;
}

/**
 * The core verb: stand still and hold your gaze on an object; looking at it gives Isi the memory back.
 * Picks the available memory closest to screen center and fills a ring over DWELL_SECONDS.
 * The selection and dwell rules live in `gaze.ts`; this class only projects through the camera.
 */
export class Attention {
  private readonly dwell = new Dwell<Item>(DWELL_SECONDS);
  private readonly deps: {
    camera: THREE.PerspectiveCamera;
    items: ItemSet;
    progress: Progress;
    narrative: Narrative;
    view: AttentionView;
    onRemember: (it: Item) => void;
  };

  constructor(deps: Attention['deps']) {
    this.deps = deps;
  }

  update(dt: number, active: boolean, moveAmount: number): void {
    const { camera, narrative, view } = this.deps;
    const best = active && !narrative.card ? pickFocus(this.sightings(), camera.aspect) : null;
    const r = this.dwell.step(best, dt, moveAmount);
    if (r.moving && narrative.whisperTime <= 0) narrative.whisper(STILLNESS_LINE, 1.6);
    view.setReticle(!!best, r.progress);
    if (r.completed) this.deps.onRemember(r.completed);
  }

  private *sightings(): Generator<Sighting<Item>> {
    const { camera, items, progress } = this.deps;
    for (const it of items.items) {
      if (!progress.isAvailable(it)) continue;
      const wp = items.targetOf(it);
      const distance = camera.position.distanceTo(wp);
      if (distance > it.attention.range) continue; // skip the projection, as before
      wp.project(camera);
      // `wp` is shared by `targetOf`: safe because pickFocus reads each sighting before the next.
      yield { item: it, tuning: it.attention, distance, ndc: wp };
    }
  }
}

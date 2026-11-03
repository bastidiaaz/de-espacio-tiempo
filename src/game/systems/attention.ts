import type * as THREE from 'three';
import { STILLNESS_LINE } from '../../content/story';
import { DWELL_SECONDS } from '../config';
import type { Item, ItemSet } from '../story/items';
import type { Narrative } from './narrative';
import type { Progress } from './progress';

export interface AttentionView {
  setReticle(near: boolean, focus: number): void;
}

/**
 * The core verb: stand still and hold your gaze on something to remember it.
 * Picks the available memory closest to screen center and fills a ring over DWELL_SECONDS.
 */
export class Attention {
  private focusItem: Item | null = null;
  private focus = 0;
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
    const { camera, items, progress, narrative, view } = this.deps;
    let best: Item | null = null;
    let bestD = 1e9;
    if (active && !narrative.card) {
      for (const it of items.items) {
        if (progress.remembered.has(it.id) || it.chapter > progress.chapter) continue;
        const wp = items.targetOf(it);
        if (camera.position.distanceTo(wp) > it.attention.range) continue;
        wp.project(camera);
        if (wp.z > 1) continue;
        const d = Math.hypot(wp.x * camera.aspect, wp.y);
        if (d < it.attention.cone && d < bestD) {
          best = it;
          bestD = d;
        }
      }
    }
    if (best !== this.focusItem) {
      this.focusItem = best;
      this.focus = 0;
    }
    if (best && moveAmount < 0.15) {
      this.focus += dt / DWELL_SECONDS;
    } else if (best && moveAmount >= 0.15) {
      this.focus = Math.max(0, this.focus - dt * 1.5);
      if (narrative.whisperTime <= 0) narrative.whisper(STILLNESS_LINE, 1.6);
    }
    view.setReticle(!!best, Math.min(1, this.focus));
    if (best && this.focus >= 1) {
      this.deps.onRemember(best);
      this.focusItem = null;
      this.focus = 0;
    }
  }
}

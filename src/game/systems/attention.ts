import type * as THREE from 'three';
import { STILLNESS_LINE } from '../../content/story';
import { DWELL_SECONDS } from '../config';
import { Dwell, pickFocus, type GazeTuning, type Sighting } from './gaze';
import type { Narrative } from './narrative';

export interface AttentionView {
  setReticle(near: boolean, focus: number): void;
}

/** Something that can be looked at right now. */
export interface GazeCandidate<T> {
  item: T;
  /** World-space point to look at. May be a shared vector: it is read (and projected) before the next one. */
  target: THREE.Vector3;
  tuning: GazeTuning;
}

/**
 * The core verb: stand still and hold your gaze on an object; looking at it gives Isi the memory back.
 * Picks the candidate closest to screen center and fills a ring over DWELL_SECONDS.
 * The selection and dwell rules live in `gaze.ts`; this class only projects through the camera.
 * What can be looked at (memories of the current chapter, hidden objects of the free roam) is up to `candidates`.
 */
export class Attention<T> {
  private readonly dwell = new Dwell<T>(DWELL_SECONDS);
  private readonly deps: {
    camera: THREE.PerspectiveCamera;
    narrative: Narrative;
    view: AttentionView;
    candidates: () => Iterable<GazeCandidate<T>>;
    onRemember: (item: T) => void;
  };

  constructor(deps: Attention<T>['deps']) {
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

  private *sightings(): Generator<Sighting<T>> {
    const { camera } = this.deps;
    for (const { item, target, tuning } of this.deps.candidates()) {
      const distance = camera.position.distanceTo(target);
      if (distance > tuning.range) continue; // skip the projection, as before
      target.project(camera);
      yield { item, tuning, distance, ndc: target };
    }
  }
}

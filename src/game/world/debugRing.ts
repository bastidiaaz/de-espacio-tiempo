import * as THREE from 'three';
import { WATER } from '../config';
import type { TerrainField } from './terrain';

const SEGMENTS = 180;
/** Metres above the ground, so the line doesn't z-fight with the terrain. */
const LIFT = 0.15;

/** Debug only: a line on the ground, where the player can no longer walk or where the dark band starts. */
export class DebugRing {
  readonly line: THREE.LineLoop;
  private readonly field: TerrainField;
  private readonly positions: Float32Array;
  private lastRadius = -1;

  constructor(field: TerrainField, color = 0xffb070) {
    this.field = field;
    this.positions = new Float32Array(SEGMENTS * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75, fog: false });
    this.line = new THREE.LineLoop(geometry, material);
    this.line.frustumCulled = false;
  }

  update(radius: number, visible: boolean): void {
    this.line.visible = visible;
    if (!visible || Math.abs(radius - this.lastRadius) < 0.2) return;
    this.lastRadius = radius;
    const p = this.positions;
    for (let i = 0; i < SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      p[i * 3] = x;
      p[i * 3 + 1] = Math.max(this.field.groundAt(x, z), WATER) + LIFT;
      p[i * 3 + 2] = z;
    }
    this.line.geometry.attributes.position.needsUpdate = true;
  }
}

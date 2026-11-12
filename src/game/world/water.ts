import * as THREE from 'three';
import { WATER } from '../config';

const SIZE = 300;
const SEGMENTS = 28;
const STEP = SIZE / SEGMENTS;

/** Height of the waves above WATER at world (x, z) and time t. */
export const waveY = (x: number, z: number, t: number): number =>
  Math.sin(x * 0.22 + t * 0.9) * 0.18 + Math.cos(z * 0.27 + t * 1.2) * 0.15;

/** Whether the water sheet, following a viewer at (px, pz), covers (x, z) with `margin` m to spare. */
export function waterCovers(x: number, z: number, px: number, pz: number, margin = 0): boolean {
  const half = SIZE / 2 - margin;
  return Math.abs(x - Math.round(px / STEP) * STEP) < half && Math.abs(z - Math.round(pz / STEP) * STEP) < half;
}

/** A low-poly water sheet that follows the player and waves in world space. */
export class Water {
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.BufferGeometry;
  private readonly base: Float32Array;

  constructor() {
    this.geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS).rotateX(-Math.PI / 2).toNonIndexed();
    this.base = (this.geometry.attributes.position.array as Float32Array).slice();
    this.mesh = new THREE.Mesh(
      this.geometry,
      new THREE.MeshLambertMaterial({ color: 0x7ad7d6, transparent: true, opacity: 0.78, flatShading: true }),
    );
    this.mesh.position.y = WATER;
  }

  update(t: number, px: number, pz: number): void {
    const m = this.mesh;
    m.position.x = Math.round(px / STEP) * STEP;
    m.position.z = Math.round(pz / STEP) * STEP;
    const a = this.geometry.attributes.position.array as Float32Array;
    const b = this.base;
    for (let i = 0; i < a.length; i += 3) {
      a[i + 1] = waveY(b[i] + m.position.x, b[i + 2] + m.position.z, t);
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}

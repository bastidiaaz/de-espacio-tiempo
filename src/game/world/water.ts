import * as THREE from 'three';
import { WATER } from '../config';

const SIZE = 300;
const SEGMENTS = 28;
const STEP = SIZE / SEGMENTS;

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
      const wx = b[i] + m.position.x;
      const wz = b[i + 2] + m.position.z;
      a[i + 1] = Math.sin(wx * 0.22 + t * 0.9) * 0.18 + Math.cos(wz * 0.27 + t * 1.2) * 0.15;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}

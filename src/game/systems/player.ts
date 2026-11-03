import * as THREE from 'three';
import { WATER } from '../config';
import type { TerrainField } from '../world/terrain';
import type { Input } from './input';

/** First-person astronaut: position, look angles, walking. */
export class Player {
  readonly position: THREE.Vector3;
  yaw: number;
  pitch: number;
  /** Eye height above the ground (rises while waking up). */
  eye: number;
  walk = 0;
  /** 0..1 how hard the player is trying to move this frame. */
  moveAmount = 0;

  constructor(position: THREE.Vector3, yaw: number, pitch: number, eye: number) {
    this.position = position;
    this.yaw = yaw;
    this.pitch = pitch;
    this.eye = eye;
  }

  look(dx: number, dy: number, k: number): void {
    this.yaw -= dx * k;
    this.pitch = Math.min(1.35, Math.max(-1.2, this.pitch - dy * k));
  }

  /** `resolve` pushes the player out of obstacles and keeps them inside the remembered area. */
  update(dt: number, input: Input, field: TerrainField, resolve: (p: THREE.Vector3) => void): void {
    const P = this.position;
    let f = 0;
    let r = 0;
    if (input.isDown('KeyW', 'ArrowUp')) f += 1;
    if (input.isDown('KeyS', 'ArrowDown')) f -= 1;
    if (input.isDown('KeyD', 'ArrowRight')) r += 1;
    if (input.isDown('KeyA', 'ArrowLeft')) r -= 1;
    f -= input.stick.y;
    r += input.stick.x;
    const yaw = this.yaw;
    let mx = -Math.sin(yaw) * f + Math.cos(yaw) * r;
    let mz = -Math.cos(yaw) * f - Math.sin(yaw) * r;
    let len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
      len = 1;
    }
    this.moveAmount = len;
    const swim = field.groundAt(P.x, P.z) < WATER - 0.6;
    const speed = (swim ? 2.6 : 4.2) * (input.isDown('ShiftLeft', 'ShiftRight') ? 1.5 : 1);
    P.x += mx * speed * dt;
    P.z += mz * speed * dt;
    resolve(P);
    const floor = Math.max(field.groundAt(P.x, P.z), WATER - 0.6);
    P.y += (floor - P.y) * (1 - Math.exp(-dt * 14));
    this.walk += dt * len * speed * 2.2;
  }

  applyToCamera(camera: THREE.PerspectiveCamera, reducedMotion: boolean): void {
    const bob = reducedMotion ? 0 : Math.sin(this.walk) * 0.045 * this.moveAmount;
    camera.position.set(this.position.x, this.position.y + this.eye + bob, this.position.z);
    camera.rotation.set(this.pitch, this.yaw, 0);
  }
}

import * as THREE from 'three';
import type { Rng } from '../math/random';

export const lam = (color: THREE.ColorRepresentation, extra: THREE.MeshLambertMaterialParameters = {}) =>
  new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, extra));

export const basic = (color: THREE.ColorRepresentation) => new THREE.MeshBasicMaterial({ color });

export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
): THREE.Mesh {
  const o = new THREE.Mesh(geometry, material);
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  o.scale.set(sx, sy, sz);
  return o;
}

export interface InstanceEntry {
  m: THREE.Matrix4;
  c?: THREE.Color;
}

const _E = new THREE.Euler();
const _Q = new THREE.Quaternion();
const _P = new THREE.Vector3();
const _S = new THREE.Vector3();

/**
 * Queue one instance transform. Returns a shared quaternion that is only
 * valid until the next call.
 */
export function pushInstance(
  list: InstanceEntry[],
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  rx: number,
  ry: number,
  rz: number,
  color?: THREE.Color,
): THREE.Quaternion {
  _E.set(rx, ry, rz);
  _Q.setFromEuler(_E);
  _P.set(x, y, z);
  _S.set(sx, sy, sz);
  list.push({ m: new THREE.Matrix4().compose(_P, _Q, _S), c: color });
  return _Q;
}

export function buildInstanced(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  list: InstanceEntry[],
): THREE.InstancedMesh | null {
  if (!list.length) return null;
  const im = new THREE.InstancedMesh(geometry, material, list.length);
  list.forEach((it, i) => {
    im.setMatrixAt(i, it.m);
    if (it.c) im.setColorAt(i, it.c);
  });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  return im;
}

/** Soft radial dot used for every glow (embers, motes, halos, glints). */
export function createGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Frees the GPU resources under `root`: geometries, materials and their textures. Safe on shared materials. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Sprite || o instanceof THREE.Line) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m: THREE.Material) => {
        for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
        m.dispose();
      });
    }
  });
}

export const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[(rng() * arr.length) | 0];

export const tint = (rng: Rng, c: THREE.Color): THREE.Color =>
  c.clone().offsetHSL((rng() - 0.5) * 0.03, 0, (rng() - 0.5) * 0.08);

export const additiveSprite = (map: THREE.Texture, color: THREE.ColorRepresentation, opacity = 1, fog = true) =>
  new THREE.Sprite(
    new THREE.SpriteMaterial({
      map,
      color,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity,
      fog,
    }),
  );

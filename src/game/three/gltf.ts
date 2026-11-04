import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { lam } from './helpers';

/**
 * Loads a .glb and re-skins it in the game's material: one flat-shaded Lambert that reads the
 * model's vertex colours, the same as the terrain. glTF materials arrive as PBR (MeshStandardMaterial),
 * which would light differently from everything else in the scene and cost more on mobile.
 *
 * Each call loads its own copy: the caller owns it and frees it with `disposeObject`.
 * Never draws from an `rng()`, so it can't change what a seed generates.
 */
export async function loadModel(url: string): Promise<THREE.Group> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  const material = lam(0xffffff, { vertexColors: true });
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const old = Array.isArray(o.material) ? o.material : [o.material];
    old.forEach((m: THREE.Material) => m.dispose());
    o.material = material;
  });
  return root;
}

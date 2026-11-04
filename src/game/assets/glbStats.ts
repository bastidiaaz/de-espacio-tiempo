/**
 * Reads what matters for the budget out of a binary glTF (.glb), without Three.js or the DOM,
 * so the checks run in Node (models.test.ts).
 */

export interface GlbStats {
  triangles: number;
  meshes: number;
  /** Every primitive carries COLOR_0 (the low-poly look: flat colours, no textures). */
  vertexColors: boolean;
  textures: number;
  /** Extensions the loader would need (draco, meshopt...). Must stay empty: we ship no decoders. */
  extensionsRequired: string[];
}

interface GltfJson {
  meshes?: { primitives: { mode?: number; indices?: number; attributes: Record<string, number> }[] }[];
  accessors: { count: number }[];
  textures?: unknown[];
  extensionsRequired?: string[];
}

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const TRIANGLES = 4;

export function glbStats(bytes: Uint8Array): GlbStats {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error('not a .glb file');
  if (view.getUint32(4, true) !== 2) throw new Error('only glTF 2.0 is supported');
  const jsonLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_JSON) throw new Error('first chunk is not JSON');
  const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength))) as GltfJson;

  let triangles = 0;
  let vertexColors = true;
  const meshes = json.meshes ?? [];
  for (const m of meshes) {
    for (const p of m.primitives) {
      if ((p.mode ?? TRIANGLES) !== TRIANGLES) throw new Error(`primitive mode ${p.mode} is not triangles`);
      const count = p.indices !== undefined ? json.accessors[p.indices].count : json.accessors[p.attributes.POSITION].count;
      triangles += count / 3;
      if (p.attributes.COLOR_0 === undefined) vertexColors = false;
    }
  }
  return {
    triangles,
    meshes: meshes.length,
    vertexColors: meshes.length > 0 && vertexColors,
    textures: json.textures?.length ?? 0,
    extensionsRequired: json.extensionsRequired ?? [],
  };
}

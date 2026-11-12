import * as THREE from 'three';
import { POST, bloomLevels, grainFrame, type PostQuality } from './postConfig';

/**
 * Post-processing (ART-04): a soft bloom, a permanent vignette and film grain, in as few passes as
 * possible (mobile first). Parameters live in `postConfig.ts`.
 *
 *   scene ─► sceneTarget ─► [bright pass + ½] ─► [½] … ─► [blend back up] … ─► composite ─► screen
 *
 * - Everything runs at the renderer's own resolution, so in retro mode (460 px high) the bloom and
 *   the grain are computed on the low-res image and get pixelated with it by the canvas upscale.
 * - Bloom levels halve each time; together they cost well under one full-screen pass.
 * - `off` renders straight to the screen: the exact original path, at zero cost.
 *
 * Colour: the scene target is made to behave exactly like the screen, so the base image is
 * bit-identical to the render without post-processing (same output encoding, same blending of the
 * additive glows, sky shader untouched). Three.js 0.160 always renders linear into a render target
 * unless it is flagged as an XR target, in which case it uses the target's own colour space; that
 * flag plus an explicit `RGBA8` internal format (so WebGL doesn't encode a second time) is the
 * whole trick. It leans on 0.160 internals: re-check it (zeroed `POST` must match `off` pixel for
 * pixel) if Three.js is ever upgraded.
 */

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/** 4-tap box downsample; with `uThreshold` >= 0 it also keeps only the bright part (soft knee). */
const DOWN = /* glsl */ `
uniform sampler2D tMap; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee;
varying vec2 vUv;
void main(){
  vec3 c = (texture2D(tMap, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(1.0, -1.0)).rgb
          + texture2D(tMap, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(1.0, 1.0)).rgb) * 0.25;
  if (uThreshold >= 0.0) {
    float br = max(c.r, max(c.g, c.b));
    float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    soft = soft * soft / (4.0 * uKnee + 1e-4);
    c *= max(soft, br - uThreshold) / max(br, 1e-4);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

/** Tent upsample, alpha-blended over the next tighter level with weight `uSpread`. */
const UP = /* glsl */ `
uniform sampler2D tMap; uniform vec2 uTexel; uniform float uSpread;
varying vec2 vUv;
void main(){
  vec3 c = (texture2D(tMap, vUv + uTexel * vec2(-0.5, -0.5)).rgb + texture2D(tMap, vUv + uTexel * vec2(0.5, -0.5)).rgb
          + texture2D(tMap, vUv + uTexel * vec2(-0.5, 0.5)).rgb + texture2D(tMap, vUv + uTexel * vec2(0.5, 0.5)).rgb) * 0.25;
  gl_FragColor = vec4(c, uSpread);
}`;

/** Scene + bloom (screen blend), vignette, grain. Display-encoded in, display-encoded out. */
const COMPOSITE = /* glsl */ `
uniform sampler2D tScene; uniform sampler2D tBloom;
uniform float uBloom; uniform vec3 uVignette; uniform float uGrain; uniform float uSeed;
varying vec2 vUv;
float hash(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main(){
  vec3 col = texture2D(tScene, vUv).rgb;
  if (uBloom > 0.0) {
    vec3 glow = min(texture2D(tBloom, vUv).rgb * uBloom, 1.0);
    col = 1.0 - (1.0 - col) * (1.0 - glow);
  }
  // Elliptical: the corners are at distance 1 whatever the aspect ratio.
  float d = length((vUv - 0.5) * 2.0) * 0.70710678;
  col *= 1.0 - uVignette.z * smoothstep(uVignette.x, uVignette.y, d);
  // Zero-mean and weaker in the blacks, so the night doesn't turn grey.
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float n = hash(floor(gl_FragCoord.xy) + uSeed) - 0.5;
  col += n * uGrain * (0.35 + 0.65 * sqrt(luma));
  gl_FragColor = vec4(col, 1.0);
}`;

const target = (depth: boolean): THREE.WebGLRenderTarget => {
  const rt = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    depthBuffer: depth,
    stencilBuffer: false,
  });
  return rt;
};

const pass = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>, blend = false) =>
  new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    transparent: blend,
    blending: blend ? THREE.NormalBlending : THREE.NoBlending,
  });

export class PostFx {
  quality: PostQuality;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly reducedMotion: boolean;
  private readonly sceneTarget = target(true);
  /** Bloom levels, tightest first; only the first `levels` are in use. */
  private readonly mips: THREE.WebGLRenderTarget[] = [];
  private levels = 0;
  private readonly size = new THREE.Vector2();

  private readonly quadScene = new THREE.Scene();
  private readonly quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;
  private readonly down = pass(DOWN, {
    tMap: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uThreshold: { value: -1 },
    uKnee: { value: POST.bloom.knee },
  });
  private readonly up = pass(
    UP,
    { tMap: { value: null }, uTexel: { value: new THREE.Vector2() }, uSpread: { value: POST.bloom.spread } },
    true,
  );
  private readonly composite = pass(COMPOSITE, {
    tScene: { value: this.sceneTarget.texture },
    tBloom: { value: null },
    uBloom: { value: 0 },
    uVignette: { value: new THREE.Vector3(POST.vignette.start, POST.vignette.end, POST.vignette.strength) },
    uGrain: { value: 0 },
    uSeed: { value: 0 },
  });

  constructor(renderer: THREE.WebGLRenderer, quality: PostQuality, reducedMotion: boolean) {
    this.renderer = renderer;
    this.quality = quality;
    this.reducedMotion = reducedMotion;

    // See the note on colour at the top of the file.
    const tex = this.sceneTarget.texture;
    tex.colorSpace = renderer.outputColorSpace;
    tex.internalFormat = 'RGBA8';
    (this.sceneTarget as THREE.WebGLRenderTarget & { isXRRenderTarget: boolean }).isXRRenderTarget = true;

    // One triangle that covers the screen.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.quad = new THREE.Mesh(geometry, this.composite);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
    this.composite.uniforms.uGrain.value =
      POST.grain.amount * (reducedMotion ? POST.grain.reducedMotionScale : 1);
  }

  /** Call after the renderer's size or pixel ratio changes. */
  resize(): void {
    const { width, height } = this.renderer.getDrawingBufferSize(this.size);
    this.sceneTarget.setSize(width, height);
    this.levels = bloomLevels(height);
    let w = width;
    let h = height;
    for (let i = 0; i < this.levels; i++) {
      w = Math.max(1, w >> 1);
      h = Math.max(1, h >> 1);
      (this.mips[i] ??= target(false)).setSize(w, h);
    }
  }

  /** Draws a frame. `time` (game seconds) only drives the grain. */
  render(scene: THREE.Scene, camera: THREE.Camera, time: number): void {
    const { renderer } = this;
    if (this.quality === 'off') {
      renderer.render(scene, camera);
      return;
    }
    renderer.setRenderTarget(this.sceneTarget);
    renderer.render(scene, camera);

    // The quads cover every pixel: no clears needed from here on.
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    const bloom = this.quality === 'full';
    if (bloom) this.renderBloom();
    const u = this.composite.uniforms;
    u.tBloom.value = bloom ? this.mips[0].texture : null;
    u.uBloom.value = bloom ? POST.bloom.intensity : 0;
    // Kept small so the hash keeps its precision.
    u.uSeed.value = (grainFrame(time, this.reducedMotion) % 512) * 17;
    this.draw(this.composite, null);
    renderer.autoClear = autoClear;
  }

  dispose(): void {
    this.sceneTarget.dispose();
    for (const m of this.mips) m.dispose();
    this.quad.geometry.dispose();
    this.down.dispose();
    this.up.dispose();
    this.composite.dispose();
  }

  private renderBloom(): void {
    const { down, up, mips, levels } = this;
    let src: THREE.WebGLRenderTarget = this.sceneTarget;
    for (let i = 0; i < levels; i++) {
      down.uniforms.tMap.value = src.texture;
      down.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      down.uniforms.uThreshold.value = i === 0 ? POST.bloom.threshold : -1;
      this.draw(down, mips[i]);
      src = mips[i];
    }
    for (let i = levels - 2; i >= 0; i--) {
      src = mips[i + 1];
      up.uniforms.tMap.value = src.texture;
      up.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      this.draw(up, mips[i]);
    }
  }

  private draw(material: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget | null): void {
    this.quad.material = material;
    this.renderer.setRenderTarget(to);
    this.renderer.render(this.quadScene, this.quadCamera);
  }
}

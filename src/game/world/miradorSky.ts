/**
 * The sky that only exists at the mirador (ART-08, brief del Acto I: "Mirador"): a giant planet
 * with colored rings, low over the horizon beyond the cliff, and a galaxy behind it whose stars
 * and nebulae shimmer slowly. Like `Sky`, the group follows the camera.
 *
 * `update` gets how much of it shows (0 at the foot of the mountain, 1 at the rim): the planet
 * rises from under the horizon as the player climbs, so the crest uncovers the rings first.
 *
 * Draw order: everything here is in the opaque pass right after the sky dome (negative
 * `renderOrder`, blending on), so the terrain simply paints over it; nothing depends on the fog.
 * Only the planet writes depth, which hides the ordinary stars and the far side of the rings.
 *
 * Far behind them: a few small planets, distinguishable but tiny, and a black hole very deep in
 * the background (its disc, the ring of bent light around it and the black shadow, as flat
 * shapes facing the viewer).
 *
 * Mobile first: a few low-poly spheres, a handful of flat meshes, one `Points` and ~20 sprites.
 * Determinism: its own generator, derived from the seed.
 */
import * as THREE from 'three';
import { mulberry32, type Rng } from '../math/random';
import { lerp, smoothstep, TAU } from '../math/util';

const SALT = 0x51a7e0;
/** Distance (m) from the camera to the planet's centre, and its radius: ~28° of sky to each side. */
const DISTANCE = 520;
const RADIUS = 245;
/** The planet's centre, in degrees: off to one side, and from under the horizon up to its place. */
const AZIMUTH = 7;
const ELEVATION_HIDDEN = -24;
const ELEVATION_SHOWN = 21;
const RING_INNER = 1.22;
const RING_OUTER = 1.62;
const STARS = 820;
const DEG = Math.PI / 180;
/** The retro mode's height: point sizes are given for it and scaled to the real one. */
const REFERENCE_HEIGHT = 460;

const hex = (list: readonly string[]) => list.map((c) => new THREE.Color(c));
const PLANET_BANDS = hex(['#f2fbff', '#c9e8ff', '#9fd0ff', '#b9bfff', '#e2d4ff', '#8fb6f5']);
/** Rings from the inside out: [width share, color, opacity]. Gaps are bands with no opacity. */
const RING_BANDS: readonly (readonly [number, string, number])[] = [
  [1.2, '#7c5cff', 0.55],
  [0.5, '#000000', 0],
  [1.6, '#ff6fd2', 0.8],
  [0.35, '#000000', 0],
  [1.0, '#b48cff', 0.7],
  [0.6, '#5fd4ff', 0.6],
  [0.4, '#000000', 0],
  [1.3, '#ff9ec0', 0.55],
  [0.7, '#8a6bff', 0.35],
];
const STAR_COLORS = hex(['#ffffff', '#ffffff', '#cfe4ff', '#ffd6f2', '#aef2ff', '#ffe9b8', '#d7c4ff']);
const NEBULA_COLORS = ['#ff5fc8', '#8a6bff', '#4fd8ff', '#b04fff', '#ff8a7a', '#5f8bff'];

/** Fades everything out towards the horizon: the planet sinks into the haze instead of ending on a line. */
const HAZE = /* glsl */ `
float haze(vec3 dir){ return smoothstep(-0.02, 0.2, normalize(dir).y); }`;

const planetVertex = /* glsl */ `
attribute vec3 aColor;
varying vec3 vColor; varying vec3 vN; varying vec3 vDir;
void main(){
  vColor = aColor;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const planetFragment = /* glsl */ `
uniform vec3 uLight; uniform float uAlpha;
varying vec3 vColor; varying vec3 vN; varying vec3 vDir;
${HAZE}
void main(){
  vec3 n = normalize(vN); vec3 d = normalize(vDir);
  float lit = smoothstep(-0.3, 0.7, dot(n, uLight));
  vec3 night = vColor * vec3(0.10, 0.11, 0.30) + vec3(0.025, 0.025, 0.09);
  vec3 col = mix(night, vColor, lit);
  float rim = pow(1.0 - max(dot(n, -d), 0.0), 3.0);
  col += vec3(0.45, 0.6, 1.0) * rim * 0.3 * (0.25 + 0.75 * lit);
  float a = uAlpha * haze(vDir);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

const ringVertex = /* glsl */ `
attribute vec4 aColor;
varying vec4 vColor; varying vec3 vDir;
void main(){
  vColor = aColor;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const ringFragment = /* glsl */ `
uniform float uAlpha;
varying vec4 vColor; varying vec3 vDir;
${HAZE}
void main(){
  float a = vColor.a * uAlpha * haze(vDir);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor.rgb, a);
  #include <colorspace_fragment>
}`;

const starVertex = /* glsl */ `
attribute vec3 aColor; attribute float aPhase; attribute float aSize;
uniform float uTime; uniform float uAlpha; uniform float uScale;
varying vec4 vColor;
${HAZE}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  // Twinkle: each star its own rhythm, dipping well down and flaring now and then.
  float s = 0.5 + 0.5 * sin(uTime * (1.1 + aPhase * 2.6) + aPhase * 40.0);
  float flare = pow(0.5 + 0.5 * sin(uTime * (0.37 + aPhase * 0.5) + aPhase * 17.0), 8.0);
  float twinkle = 0.25 + 0.75 * s * s + 0.6 * flare;
  vColor = vec4(aColor, uAlpha * min(1.0, twinkle) * haze(wp.xyz - cameraPosition));
  gl_PointSize = aSize * uScale * (0.8 + 0.35 * s + 0.5 * flare);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const starFragment = /* glsl */ `
varying vec4 vColor;
void main(){
  gl_FragColor = vColor;
  #include <colorspace_fragment>
}`;

interface Nebula {
  sprite: THREE.Sprite;
  opacity: number;
  phase: number;
}

export class MiradorSky {
  readonly group = new THREE.Group();
  /** 0..1 how much of it shows right now (eased). AUD-03's wind can follow the same value. */
  reveal = 0;
  private readonly body = new THREE.Group();
  private readonly planetUniforms = { uLight: { value: new THREE.Vector3() }, uAlpha: { value: 0 } };
  private readonly ringUniforms = { uAlpha: { value: 0 } };
  private readonly starUniforms = { uTime: { value: 0 }, uAlpha: { value: 0 }, uScale: { value: 1 } };
  /** The far planets (shaded like the big one) and the black hole's flat shapes. */
  private readonly farPlanetUniforms = { uLight: { value: new THREE.Vector3() }, uAlpha: { value: 0 } };
  private readonly farUniforms = { uAlpha: { value: 0 } };
  private readonly nebulae: Nebula[] = [];

  /** `angle`: the mirador's direction from the fire (rad, `atan2(z, x)`): where "outwards" is. */
  constructor(seed: number, glow: THREE.Texture, angle: number) {
    const rng = mulberry32((seed ^ SALT) >>> 0);
    // Built looking down -Z (outwards), +X to the right; then turned to the mirador's direction.
    this.group.rotation.y = Math.atan2(-Math.cos(angle), -Math.sin(angle));
    this.group.visible = false;
    this.planetUniforms.uLight.value.set(-0.85, 0.42, 0.18).normalize().applyEuler(this.group.rotation);

    // The far planets are lit from behind the viewer: small as they are, a dark side would hide them.
    this.farPlanetUniforms.uLight.value.set(0.25, 0.45, 1).normalize().applyEuler(this.group.rotation);

    this.buildGalaxy(rng, glow);
    this.buildPlanet(rng);
    this.group.add(this.body);
    this.buildFarPlanets(rng);
    this.buildBlackHole(glow);
  }

  /**
   * `target`: how much should show (Mirador.reveal). `drawHeight`: the canvas's height in pixels,
   * for the stars' size. `still`: reduced motion, no twinkling.
   */
  update(dt: number, time: number, target: number, drawHeight: number, still: boolean): void {
    this.reveal += (target - this.reveal) * (1 - Math.exp(-dt * 2.5));
    if (target <= 0 && this.reveal < 0.002) this.reveal = 0;
    const r = this.reveal;
    this.group.visible = r > 0;
    if (!this.group.visible) return;

    // The planet comes up from under the horizon; it is already solid while most of it is still hidden.
    const elevation = lerp(ELEVATION_HIDDEN, ELEVATION_SHOWN, smoothstep(0, 1, r)) * DEG;
    const azimuth = AZIMUTH * DEG;
    this.body.position
      .set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), -Math.cos(azimuth) * Math.cos(elevation))
      .multiplyScalar(DISTANCE);
    const solid = smoothstep(0.02, 0.4, r);
    this.planetUniforms.uAlpha.value = solid;
    this.ringUniforms.uAlpha.value = solid;

    // The galaxy comes last, once the planet is well up.
    const galaxy = smoothstep(0.25, 0.95, r);
    const t = still ? 0 : time;
    this.starUniforms.uTime.value = t;
    this.starUniforms.uAlpha.value = galaxy;
    this.farPlanetUniforms.uAlpha.value = galaxy;
    this.farUniforms.uAlpha.value = galaxy;
    this.starUniforms.uScale.value = Math.max(1, drawHeight / REFERENCE_HEIGHT);
    for (const n of this.nebulae)
      n.sprite.material.opacity = n.opacity * galaxy * (0.72 + 0.28 * Math.sin(t * 0.21 + n.phase));
  }

  private buildPlanet(rng: Rng): void {
    // Flat-shaded sphere, banded along its pole (local +Z, the rings' axis), one color per face.
    const geo = new THREE.IcosahedronGeometry(RADIUS, 7);
    geo.computeVertexNormals(); // non-indexed: face normals
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const phase = rng() * TAU;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i += 3) {
      const lat = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / (3 * RADIUS);
      const wave = Math.sin(lat * 8.5 + phase) * 0.35 + Math.sin(lat * 21 + phase * 2) * 0.15 + 0.5;
      const k = Math.min(0.999, Math.max(0, wave + (rng() - 0.5) * 0.1));
      c.copy(PLANET_BANDS[Math.floor(k * PLANET_BANDS.length)]).offsetHSL(0, 0, (rng() - 0.5) * 0.035);
      for (let v = 0; v < 3; v++) c.toArray(colors, (i + v) * 3);
    }
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    const planet = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        uniforms: this.planetUniforms,
        vertexShader: planetVertex,
        fragmentShader: planetFragment,
        blending: THREE.CustomBlending, // source-alpha over, although it is drawn in the opaque pass
        depthFunc: THREE.AlwaysDepth,
        fog: false,
      }),
    );
    planet.renderOrder = -8;

    // Rings: flat bands of color with gaps, as one mesh in the XY plane.
    const segments = 96;
    const total = RING_BANDS.reduce((s, [w]) => s + w, 0);
    const p: number[] = [];
    const col: number[] = [];
    let at = RING_INNER * RADIUS;
    for (const [share, color, opacity] of RING_BANDS) {
      const r0 = at;
      const r1 = (at += (share / total) * (RING_OUTER - RING_INNER) * RADIUS);
      if (opacity <= 0) continue;
      c.set(color);
      for (let s = 0; s < segments; s++) {
        const a0 = (s / segments) * TAU;
        const a1 = ((s + 1) / segments) * TAU;
        const quad = [
          [r0, a0],
          [r1, a0],
          [r1, a1],
          [r0, a0],
          [r1, a1],
          [r0, a1],
        ];
        for (const [r, a] of quad) {
          p.push(Math.cos(a) * r, Math.sin(a) * r, 0);
          col.push(c.r, c.g, c.b, opacity);
        }
      }
    }
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    ringGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 4));
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.ShaderMaterial({
        uniforms: this.ringUniforms,
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        blending: THREE.CustomBlending,
        side: THREE.DoubleSide,
        depthWrite: false, // tested against the planet only: the world is drawn after and over it
        fog: false,
      }),
    );
    ring.renderOrder = -7;
    ring.frustumCulled = false;

    // Tilted so the rings cross the disc at a slant, a little open.
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -66 * DEG);
    const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 22 * DEG);
    this.body.quaternion.copy(roll.multiply(tilt));
    this.body.add(planet, ring);
  }

  private buildGalaxy(rng: Rng, glow: THREE.Texture): void {
    // A band across the sky behind the planet, along a tilted great circle.
    const centre = new THREE.Vector3(-0.2, 0.62, -1).normalize();
    const along = new THREE.Vector3(1, 0, 0).addScaledVector(centre, -centre.x).normalize();
    along.applyAxisAngle(centre, 0.55);
    const across = new THREE.Vector3().crossVectors(centre, along);
    const gauss = () => (rng() + rng() + rng() - 1.5) / 1.5;
    const dir = new THREE.Vector3();
    const onBand = (t: number, off: number) =>
      dir
        .copy(centre)
        .multiplyScalar(Math.cos(t))
        .addScaledVector(along, Math.sin(t))
        .multiplyScalar(Math.cos(off))
        .addScaledVector(across, Math.sin(off));

    const pos: number[] = [];
    const col: number[] = [];
    const phase: number[] = [];
    const size: number[] = [];
    while (phase.length < STARS) {
      // Most of them in the band, tighter towards its core; the rest scattered around it.
      const loose = rng() < 0.3;
      onBand(gauss() * 1.5, gauss() * (loose ? 0.6 : 0.13));
      if (dir.y < 0.03) continue;
      pos.push(dir.x * 630, dir.y * 630, dir.z * 630);
      const c = STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)];
      const b = 0.55 + rng() * 0.45;
      col.push(c.r * b, c.g * b, c.b * b);
      phase.push(rng());
      size.push(rng() < 0.08 ? 3.2 : 1.2 + rng() * 1.3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    const stars = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        uniforms: this.starUniforms,
        vertexShader: starVertex,
        fragmentShader: starFragment,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        fog: false,
      }),
    );
    stars.renderOrder = -9;
    stars.frustumCulled = false;
    this.group.add(stars);

    const nebula = (d: THREE.Vector3, w: number, h: number, color: string, opacity: number) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glow,
          color,
          opacity: 0,
          transparent: false, // opaque pass, like the rest: before the terrain
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
          fog: false,
        }),
      );
      sprite.position.copy(d).multiplyScalar(620);
      sprite.scale.set(w, h, 1);
      sprite.renderOrder = -9.5;
      this.group.add(sprite);
      this.nebulae.push({ sprite, opacity, phase: rng() * TAU });
    };
    // Clouds of color along the band, layered: big soft ones, then smaller, brighter cores.
    for (let i = 0; i < 18; i++) {
      const core = i >= 11;
      onBand(((i % 11) / 10 - 0.5) * 2.3 + gauss() * (core ? 0.25 : 0.1), gauss() * (core ? 0.07 : 0.1));
      if (dir.y < 0.16) continue;
      const s = core ? 90 + rng() * 110 : 200 + rng() * 220;
      const opacity = core ? 0.38 + rng() * 0.2 : 0.3 + rng() * 0.18;
      nebula(dir, s, s * (0.55 + rng() * 0.45), NEBULA_COLORS[(i * 5) % NEBULA_COLORS.length], opacity);
    }
    // A glow along the horizon, under the planet.
    nebula(dir.set(0.05, 0.13, -1).normalize(), 760, 150, '#ff6ad5', 0.3);
  }

  /** Small planets far behind the big one: a few pixels each, but with their own colors and rings. */
  private buildFarPlanets(rng: Rng): void {
    const c = new THREE.Color();
    for (const p of FAR_PLANETS) {
      const geo = new THREE.IcosahedronGeometry(p.radius, 2);
      geo.computeVertexNormals();
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const bands = hex(p.bands);
      const phase = rng() * TAU;
      for (let i = 0; i < pos.count; i += 3) {
        const lat = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / (3 * p.radius);
        const k = Math.min(0.999, Math.max(0, 0.5 + 0.5 * Math.sin(lat * p.stripes + phase)));
        c.copy(bands[Math.floor(k * bands.length)]);
        for (let v = 0; v < 3; v++) c.toArray(colors, (i + v) * 3);
      }
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      const mesh = new THREE.Mesh(
        geo,
        new THREE.ShaderMaterial({
          uniforms: this.farPlanetUniforms,
          vertexShader: planetVertex,
          fragmentShader: planetFragment,
          blending: THREE.CustomBlending,
          depthFunc: THREE.AlwaysDepth,
          fog: false,
        }),
      );
      mesh.renderOrder = -8.9;
      const at = skyDir(p.az, p.el).multiplyScalar(FAR_DISTANCE);
      mesh.position.copy(at);
      mesh.rotation.set(rng() * 0.6 - 0.3, rng() * TAU, rng() * 0.6 - 0.3);
      this.group.add(mesh);
      if (p.ring) {
        const tone = hexRgb(p.ring);
        const ring = flat(
          annulus(p.radius * 1.45, p.radius * 2.1, 0, TAU, 32, (t) => [...tone, 0.75 * (1 - t * 0.5)]),
          this.farUniforms,
          THREE.CustomBlending,
          -8.85,
        );
        ring.position.copy(at);
        ring.quaternion
          .copy(facing(at))
          .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -1.15));
        ring.rotateZ(rng() * 0.8 - 0.4);
        this.group.add(ring);
      }
    }
  }

  /**
   * A black hole very deep in the background: the far half of its disc, the ring of bent light,
   * the shadow, and the near half of the disc over it, all flat and facing the viewer.
   */
  private buildBlackHole(glow: THREE.Texture): void {
    const at = skyDir(BLACK_HOLE.az, BLACK_HOLE.el).multiplyScalar(FAR_DISTANCE + 20);
    const q = facing(at).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), BLACK_HOLE.roll));
    const R = BLACK_HOLE.radius;
    const hot = hexRgb('#fff1cf');
    const warm = hexRgb('#ff8a3c');
    const deep = hexRgb('#c2341c');
    const disc = (t: number): number[] => {
      const c = t < 0.4 ? mix3(hot, warm, t / 0.4) : mix3(warm, deep, (t - 0.4) / 0.6);
      return [...c, 0.95 * (1 - t) ** 1.4];
    };
    const squash = (g: THREE.BufferGeometry) => g.scale(1, BLACK_HOLE.squash, 1);
    const parts = [
      // Far half of the disc, above the shadow.
      flat(squash(annulus(R * 1.5, R * 4.6, 0, Math.PI, 48, disc)), this.farUniforms, THREE.AdditiveBlending, -8.8),
      // The disc's far side bent around the shadow: a thin bright ring.
      flat(
        annulus(R * 1.04, R * 1.42, 0, TAU, 48, (t) => [...mix3(hot, warm, t), 0.9 * (1 - t)]),
        this.farUniforms,
        THREE.AdditiveBlending,
        -8.75,
      ),
      // The shadow itself.
      flat(annulus(0, R * 1.02, 0, TAU, 32, () => [0, 0, 0, 1]), this.farUniforms, THREE.CustomBlending, -8.7),
      // Near half of the disc, over the shadow.
      flat(squash(annulus(R * 1.5, R * 4.6, Math.PI, TAU, 48, disc)), this.farUniforms, THREE.AdditiveBlending, -8.65),
    ];
    for (const mesh of parts) {
      mesh.position.copy(at);
      mesh.quaternion.copy(q);
      this.group.add(mesh);
    }
    // A faint warm halo around it all.
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color: '#ff8a4a',
        opacity: 0,
        transparent: false,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        fog: false,
      }),
    );
    halo.position.copy(at);
    halo.scale.set(R * 14, R * 9, 1);
    halo.renderOrder = -9.4;
    this.group.add(halo);
    this.nebulae.push({ sprite: halo, opacity: 0.22, phase: 0 });
  }
}

/** Far behind the big planet (m), but inside the camera's far plane. */
const FAR_DISTANCE = 600;

/** Small far planets: where (degrees; azimuth 0 = straight out, + to the right), size and look. */
const FAR_PLANETS: readonly {
  az: number;
  el: number;
  radius: number;
  bands: readonly string[];
  stripes: number;
  ring?: string;
}[] = [
  { az: -62, el: 28, radius: 9, bands: ['#ffb36b', '#e97a4c', '#ffd8a0'], stripes: 9, ring: '#ffd9a8' },
  { az: -30, el: 64, radius: 6, bands: ['#9ff0d0', '#5fc9b0', '#d9fff2'], stripes: 5 },
  { az: 50, el: 50, radius: 11, bands: ['#c9b6ff', '#8f78f0', '#efe6ff'], stripes: 7 },
  { az: 74, el: 21, radius: 7, bands: ['#ff8fae', '#d95a86', '#ffd1df'], stripes: 4, ring: '#ffc2e0' },
  { az: -84, el: 13, radius: 5, bands: ['#d8f4ff', '#a6d6f2'], stripes: 3 },
  { az: 22, el: 74, radius: 8, bands: ['#ffe7a1', '#e8c26a', '#fff6d6'], stripes: 11 },
  { az: 104, el: 40, radius: 6, bands: ['#a8f0ff', '#6cc4ff'], stripes: 6 },
];

/** The black hole: where (degrees), its shadow's radius (m), how flat its disc looks and its roll. */
const BLACK_HOLE = { az: -40, el: 47, radius: 8.5, squash: 0.24, roll: 0.22 };

/** Direction in the sky (built looking down -Z, +X to the right), from degrees. */
function skyDir(az: number, el: number): THREE.Vector3 {
  const a = az * DEG;
  const e = el * DEG;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

/** Rotation that turns a shape drawn in the XY plane to face the viewer at the origin. */
function facing(at: THREE.Vector3): THREE.Quaternion {
  const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), at, new THREE.Vector3(0, 1, 0));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

function hexRgb(h: string): [number, number, number] {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
}

function mix3(a: readonly number[], b: readonly number[], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** A flat ring (or a disc, from 0) in the XY plane between two angles; colors by radial position 0..1. */
function annulus(
  r0: number,
  r1: number,
  a0: number,
  a1: number,
  segments: number,
  color: (t: number) => number[],
): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const steps = 3;
  for (let s = 0; s < segments; s++) {
    const b0 = lerp(a0, a1, s / segments);
    const b1 = lerp(a0, a1, (s + 1) / segments);
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps;
      const t1 = (k + 1) / steps;
      const q0 = lerp(r0, r1, t0);
      const q1 = lerp(r0, r1, t1);
      const quad: [number, number, number][] = [
        [q0, b0, t0],
        [q1, b0, t1],
        [q1, b1, t1],
        [q0, b0, t0],
        [q1, b1, t1],
        [q0, b1, t0],
      ];
      for (const [r, a, t] of quad) {
        pos.push(Math.cos(a) * r, Math.sin(a) * r, 0);
        col.push(...color(t));
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 4));
  return geo;
}

/** A flat shape drawn with the rings' shader: colors with alpha, fading into the haze. */
function flat(
  geo: THREE.BufferGeometry,
  uniforms: { uAlpha: { value: number } },
  blending: THREE.Blending,
  order: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: ringVertex,
      fragmentShader: ringFragment,
      blending,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      fog: false,
    }),
  );
  mesh.renderOrder = order;
  mesh.frustumCulled = false;
  return mesh;
}

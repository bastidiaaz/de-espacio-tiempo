import * as THREE from 'three';
import { mulberry32 } from '../math/random';
import { additiveSprite } from '../three/helpers';

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const fragmentShader = /* glsl */ `
uniform vec3 cH, cM, cT, cS; uniform vec3 sunDir; varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir); float y = d.y;
  vec3 col = mix(cH, cM, smoothstep(0.02, 0.22, y)); col = mix(col, cT, smoothstep(0.2, 0.75, y));
  float s = max(dot(d, normalize(sunDir)), 0.0); col += cS * (pow(s, 6.0) * 0.35 + pow(s, 40.0) * 0.5);
  col = mix(col, cS * 1.5 + vec3(0.2), smoothstep(0.9989, 0.9993, s) * smoothstep(-0.02, 0.02, y));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export interface SkyUniforms {
  [uniform: string]: THREE.IUniform;
  /** Horizon (also the fog color). */
  cH: THREE.IUniform<THREE.Color>;
  cM: THREE.IUniform<THREE.Color>;
  cT: THREE.IUniform<THREE.Color>;
  /** Sun glow. */
  cS: THREE.IUniform<THREE.Color>;
  sunDir: THREE.IUniform<THREE.Vector3>;
}

/** Horizontal direction of the star from the fire (rad, `atan2(z, x)`). Fixed: it no longer drifts. */
export const STAR_ANGLE = 0.6;
/** Unit direction of the star (`shipStar`), about 48° above the horizon. */
export const STAR_DIRECTION: readonly [number, number, number] = (() => {
  const [x, y, z] = [Math.cos(STAR_ANGLE) * 0.55, 0.62, Math.sin(STAR_ANGLE) * 0.55];
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
})();

/**
 * The ringed giant of the ordinary sky, smaller and farther than it used to be (DIS-05): a distant
 * echo of the one waiting behind the mirador's ridge. Same direction and bands, no new `rng()` calls.
 */
const GIANT_SCALE = 0.5;
const GIANT_DISTANCE = 560;

/** Sky dome, stars, ringed giant, moon and the far planet Isi was heading to (`shipStar`). Follows the camera. */
export class Sky {
  readonly group = new THREE.Group();
  readonly uniforms: SkyUniforms = {
    cH: { value: new THREE.Color() },
    cM: { value: new THREE.Color() },
    cT: { value: new THREE.Color() },
    cS: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, -0.2, -1) },
  };
  readonly starMaterial: THREE.PointsMaterial;
  readonly shipStar: THREE.Sprite;

  constructor(seed: number, glowTexture: THREE.Texture) {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(650, 24, 16),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader,
        fragmentShader,
      }),
    );
    dome.renderOrder = -10;
    this.group.add(dome);

    // Stars
    const starPos: number[] = [];
    const sr = mulberry32(seed ^ 0x5151);
    while (starPos.length < 700 * 3) {
      const v = new THREE.Vector3(sr() * 2 - 1, sr(), sr() * 2 - 1).normalize();
      if (v.y < 0.12) continue;
      v.multiplyScalar(600);
      starPos.push(v.x, v.y, v.z);
    }
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xfff6e8,
      size: 2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.95,
      fog: false,
      depthWrite: false,
    });
    this.group.add(
      new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3)),
        this.starMaterial,
      ),
    );

    // Ringed giant + moon
    const g = new THREE.IcosahedronGeometry(70, 3);
    const pos = g.attributes.position;
    const cols: number[] = [];
    const bands = ['#ffd2b0', '#f29a9a', '#c58bd1', '#ffe6c9'].map((c) => new THREE.Color(c));
    for (let i = 0; i < pos.count; i += 3) {
      const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 210;
      const c = bands[Math.floor((Math.sin(y * 9 + (seed % 7)) * 0.5 + 0.5) * 3.99)];
      for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const planet = new THREE.Mesh(
      g,
      new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false, emissive: 0x2a2050 }),
    );
    const dir = new THREE.Vector3(-0.55, 0.42, -0.72).normalize().multiplyScalar(GIANT_DISTANCE);
    planet.position.copy(dir);
    planet.scale.setScalar(GIANT_SCALE);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(95, 140, 48, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffdcc4,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        fog: false,
        depthWrite: false,
      }),
    );
    ring.position.copy(dir);
    ring.scale.setScalar(GIANT_SCALE);
    ring.rotation.set(1.15, 0.2, 0.35);
    const moon = new THREE.Mesh(
      new THREE.IcosahedronGeometry(14, 1),
      new THREE.MeshLambertMaterial({ color: 0xd9f2ff, flatShading: true, fog: false, emissive: 0x404a70 }),
    );
    moon.position.set(0.62, 0.5, -0.35).normalize().multiplyScalar(470);
    this.group.add(planet, ring, moon);

    // The far planet Isi was heading to ("Un planeta lejano"): fades in from chapter 4 (Atmosphere)
    // and she ends up holding the gaze on it. It stays put (author, 2026-11-06), so the hidden
    // objects can be laid out around it. The name is historical: in the original premise it was a
    // colony ship arriving.
    this.shipStar = additiveSprite(glowTexture, 0xfff1c0, 0, false);
    this.shipStar.scale.setScalar(18);
    this.shipStar.position.set(...STAR_DIRECTION).multiplyScalar(560);
    this.group.add(this.shipStar);
  }
}

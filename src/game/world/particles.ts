import * as THREE from 'three';

const pointsMaterial = (map: THREE.Texture, color: number, size: number, opacity: number) =>
  new THREE.PointsMaterial({
    map,
    color,
    size,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

/** Fireflies drifting in a box that wraps around the player. */
export class Motes {
  readonly points: THREE.Points;
  readonly material: THREE.PointsMaterial;
  private readonly pos: Float32Array;
  private readonly seed: Float32Array;
  private readonly count: number;

  constructor(count: number, map: THREE.Texture, origin: THREE.Vector3) {
    this.count = count;
    this.pos = new Float32Array(count * 3);
    this.seed = new Float32Array(count);
    this.material = pointsMaterial(map, 0xe6ffb0, 0.4, 0.8);
    this.points = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(this.pos, 3)),
      this.material,
    );
    this.points.frustumCulled = false;
    for (let i = 0; i < count; i++) {
      this.seed[i] = Math.random();
      this.pos[i * 3] = origin.x + (Math.random() - 0.5) * 50;
      this.pos[i * 3 + 1] = origin.y - 2 + Math.random() * 12;
      this.pos[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 50;
    }
  }

  update(dt: number, time: number, P: THREE.Vector3): void {
    const m = this.pos;
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      const s = this.seed[i];
      m[j] += Math.sin(time * 0.5 + s * 20) * dt * 0.4;
      m[j + 1] += dt * (0.1 + s * 0.2);
      m[j + 2] += Math.cos(time * 0.4 + s * 13) * dt * 0.4;
      if (m[j] - P.x > 25) m[j] -= 50;
      else if (m[j] - P.x < -25) m[j] += 50;
      if (m[j + 2] - P.z > 25) m[j + 2] -= 50;
      else if (m[j + 2] - P.z < -25) m[j + 2] += 50;
      if (m[j + 1] - P.y > 10) m[j + 1] -= 13;
      else if (m[j + 1] - P.y < -3) m[j + 1] += 13;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

const EMBER_COUNT = 40;

/** Sparks rising from the campfire. */
export class Embers {
  readonly points: THREE.Points;
  private readonly pos = new Float32Array(EMBER_COUNT * 3);
  private readonly life = new Float32Array(EMBER_COUNT);
  private readonly fireY: number;

  constructor(fireY: number, map: THREE.Texture) {
    this.fireY = fireY;
    this.points = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(this.pos, 3)),
      pointsMaterial(map, 0xffa050, 0.18, 0.9),
    );
    this.points.frustumCulled = false;
    for (let i = 0; i < EMBER_COUNT; i++) {
      this.life[i] = Math.random() * 2.5;
      this.pos[i * 3 + 1] = fireY - 10;
    }
  }

  update(dt: number, time: number): void {
    const e = this.pos;
    for (let i = 0; i < EMBER_COUNT; i++) {
      this.life[i] -= dt;
      const j = i * 3;
      if (this.life[i] <= 0) {
        this.life[i] = 1.5 + Math.random() * 1.5;
        e[j] = (Math.random() - 0.5) * 0.4;
        e[j + 1] = this.fireY + 0.4;
        e[j + 2] = (Math.random() - 0.5) * 0.4;
      }
      e[j] += Math.sin(time * 3 + i) * dt * 0.3;
      e[j + 1] += dt * (0.9 + (i % 5) * 0.15);
      e[j + 2] += Math.cos(time * 2.5 + i) * dt * 0.3;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

/** Short-lived glow when something is remembered. */
export class Bursts {
  readonly group = new THREE.Group();
  private readonly live: { s: THREE.Sprite; t: number }[] = [];
  private readonly map: THREE.Texture;

  constructor(map: THREE.Texture) {
    this.map = map;
  }

  spawn(at: THREE.Vector3): void {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.map,
        color: 0xcfe8ff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    s.position.copy(at);
    this.group.add(s);
    this.live.push({ s, t: 0 });
  }

  update(dt: number): void {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const e = this.live[i];
      e.t += dt;
      e.s.scale.setScalar(1 + e.t * 8);
      e.s.material.opacity = Math.max(0, 1 - e.t * 1.6);
      if (e.t > 0.65) {
        this.group.remove(e.s);
        e.s.material.dispose();
        this.live.splice(i, 1);
      }
    }
  }
}

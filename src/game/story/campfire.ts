import * as THREE from 'three';
import { lerp, TAU } from '../math/util';
import { additiveSprite, mesh } from '../three/helpers';

export interface CampfireMaterials {
  stone: THREE.Material;
  wood: THREE.Material;
  char: THREE.Material;
}

/** Stones, logs, flickering flames, halo and the warm point light. */
export class Campfire {
  readonly group: THREE.Group;
  private readonly flames: THREE.Mesh[];
  private readonly halo: THREE.Sprite;
  private readonly light: THREE.PointLight;

  constructor(group: THREE.Group, rockGeo: THREE.BufferGeometry, m: CampfireMaterials, glow: THREE.Texture) {
    this.group = group;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      group.add(mesh(rockGeo, m.stone, Math.cos(a) * 0.75, 0.1, Math.sin(a) * 0.75, i, i * 2, 0, 0.26, 0.2, 0.24));
    }
    for (let i = 0; i < 3; i++)
      group.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.1, 5), m.wood, 0, 0.25, 0, 1.1, i * 2.1, 0));
    group.add(mesh(new THREE.CircleGeometry(0.7, 8).rotateX(-Math.PI / 2), m.char, 0, 0.03, 0));
    this.flames = [0xffe08a, 0xffb347, 0xff7a3d].map((c, i) => {
      const f = mesh(
        new THREE.ConeGeometry(0.32 - i * 0.06, 1, 5).translate(0, 0.5, 0),
        new THREE.MeshBasicMaterial({
          color: c,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
        (i - 1) * 0.12,
        0.15,
        (i % 2) * 0.1,
      );
      group.add(f);
      return f;
    });
    this.halo = additiveSprite(glow, 0xff9a4d, 0.7);
    this.halo.position.y = 0.7;
    this.halo.scale.setScalar(3.4);
    group.add(this.halo);
    this.light = new THREE.PointLight(0xff9a4d, 18, 30, 1.5);
    this.light.position.set(0, 1.1, 0);
    group.add(this.light);
  }

  /** `dawn` dims the fire a little as the sky brightens. */
  update(time: number, dawn: number): void {
    const fl = 0.85 + Math.sin(time * 13) * 0.06 + Math.sin(time * 7.3) * 0.08 + (Math.random() - 0.5) * 0.06;
    this.light.intensity = 18 * fl * lerp(1, 0.7, dawn);
    this.halo.material.opacity = 0.6 * fl;
    this.flames.forEach((f, i) => {
      f.scale.set(1 + Math.sin(time * 9 + i) * 0.08, (0.8 + i * 0.15) * (fl + Math.sin(time * 11 + i * 2) * 0.12), 1);
      f.rotation.y = time * (0.6 + i * 0.3);
    });
  }
}

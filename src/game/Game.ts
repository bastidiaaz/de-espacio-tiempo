import * as THREE from 'three';
import { COPY } from '../content/copy';
import { CHAPTERS, EDGE_LINES, MEMORIES, WAKE_LINES } from '../content/story';
import type { GameActions, GameStore, Phase } from '../state/gameStore';
import { FREE_ROAM_RADIUS, HINT_DELAY, STORAGE_KEYS, viewRadiusFor } from './config';
import { makeNoise } from './math/noise';
import { createHash2 } from './math/random';
import { easeInOut, lerp, lerpAngle } from './math/util';
import { isCoarsePointer, prefersReducedMotion, storage } from './platform';
import { ItemSet, type Item } from './story/items';
import { buildStoryWorld, type StoryWorld } from './story/storyWorld';
import { Attention } from './systems/attention';
import { AudioEngine } from './systems/audio';
import { Input } from './systems/input';
import { Narrative } from './systems/narrative';
import { Player } from './systems/player';
import { Progress } from './systems/progress';
import { Atmosphere } from './world/atmosphere';
import { ChunkManager } from './world/chunks';
import { pushOut } from './world/collision';
import { TerrainPalette } from './world/palette';
import { Bursts, Embers, Motes } from './world/particles';
import { createPropKit } from './world/props';
import { resolveSeed } from './world/seed';
import { Sky } from './world/sky';
import { TerrainField } from './world/terrain';
import { Water } from './world/water';
import { createGlowTexture } from './three/helpers';

const TOTAL = MEMORIES.length;
/** Night sky "brightens" up to this much before the ending's dawn. */
/** Brightest the sky ever gets: the act closes in stillness, never in a full dawn. */
const PRE_DAWN = 0.12;
/** Pixel height the retro mode renders at before upscaling. */
const RETRO_HEIGHT = 460;
const CHIME_ROOTS = [440, 554.37, 659.25, 880];

/**
 * Owns the Three.js scene and the game loop, and orchestrates every system.
 * Talks to React only through the store (out) and GameActions (in).
 */
export class Game implements GameActions {
  private readonly store: GameStore;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly fog: THREE.Fog;
  private readonly memoryKey: string;
  private readonly viewRadius = viewRadiusFor(isCoarsePointer);

  private readonly field: TerrainField;
  private readonly chunks: ChunkManager;
  private readonly water: Water;
  private readonly sky: Sky;
  private readonly story: StoryWorld;
  private readonly items: ItemSet;
  private readonly motes: Motes;
  private readonly embers: Embers;
  private readonly bursts: Bursts;
  private readonly atmosphere: Atmosphere;
  private readonly progress: Progress;
  private readonly narrative: Narrative;
  private readonly attention: Attention;
  private readonly player: Player;
  private readonly input: Input;
  private readonly audio: AudioEngine;
  private readonly yawToFire: number;

  private phase: Phase = 'intro';
  private time = 0;
  private last = performance.now();
  private wakeT = 0;
  private edgeT = 0;
  private lastProgress = 0;
  private retro: boolean;
  private sound: boolean;
  private raf = 0;
  private readonly timers = new Set<number>();

  constructor(container: HTMLElement, store: GameStore) {
    this.store = store;

    // --- seed + procedural field ---
    const seed = resolveSeed();
    this.memoryKey = STORAGE_KEYS.memory(seed);
    const noise = makeNoise(seed);
    this.field = new TerrainField(noise, seed);
    addEventListener('hashchange', this.onHashChange);

    // --- renderer ---
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'world';
    this.canvas.setAttribute('aria-label', COPY.canvasLabel);
    container.appendChild(this.canvas);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.05, 1400);
    this.camera.rotation.order = 'YXZ';
    this.fog = new THREE.Fog(0x3d3a78, 5, 26);
    this.scene.fog = this.fog;
    this.retro = storage.get(STORAGE_KEYS.retro) !== '0';
    this.sound = storage.get(STORAGE_KEYS.sound) !== '0';
    this.resize();
    addEventListener('resize', this.resize);

    const hemi = new THREE.HemisphereLight(0x8d9cff, 0x2a2350, 1.1);
    const sun = new THREE.DirectionalLight(0x9fb0ff, 0.35);
    this.scene.add(hemi, sun, sun.target);

    // --- world ---
    const glow = createGlowTexture();
    this.sky = new Sky(seed, glow);
    this.scene.add(this.sky.group);
    const kit = createPropKit();
    this.chunks = new ChunkManager(
      this.field,
      new TerrainPalette(this.field, noise, createHash2(seed)),
      kit,
      seed,
      this.viewRadius,
    );
    this.scene.add(this.chunks.group);
    this.water = new Water();
    this.scene.add(this.water.mesh);

    // --- story ---
    this.story = buildStoryWorld(this.field, kit, glow, seed);
    this.scene.add(this.story.group);
    this.items = new ItemSet(MEMORIES, this.story.objects, this.sky.shipStar, this.story.group, glow);
    this.progress = new Progress(MEMORIES, CHAPTERS.length, Progress.parse(storage.get(this.memoryKey)));

    // --- player + particles ---
    const { x: bx, z: bz } = this.story.bedroll;
    this.player = new Player(
      new THREE.Vector3(bx, this.field.groundAt(bx, bz), bz),
      Math.atan2(0.55, 0.72),
      0.75,
      0.35,
    );
    this.yawToFire = Math.atan2(-(0 - bx), -(0 - bz));
    this.motes = new Motes(isCoarsePointer ? 140 : 240, glow, this.player.position);
    this.embers = new Embers(this.story.campfire.group.position.y, glow);
    this.bursts = new Bursts(glow);
    this.scene.add(this.motes.points, this.embers.points, this.bursts.group);

    const p = this.progress;
    this.atmosphere = new Atmosphere(
      {
        fog: this.fog,
        sky: this.sky,
        hemi,
        sun,
        motesMaterial: this.motes.material,
        field: this.field,
        viewRadius: this.viewRadius,
      },
      (p.count / TOTAL) * PRE_DAWN,
      p.freeRoam ? FREE_ROAM_RADIUS : CHAPTERS[p.chapter].radius,
    );
    this.chunks.update(this.player.position.x, this.player.position.z, true);

    // --- systems ---
    this.narrative = new Narrative(
      {
        showCard: (c) => this.store.setState({ card: { ...c, shown: '', done: false }, cardVisible: true }),
        setCardProgress: (shown, done) => {
          const card = this.store.getState().card;
          if (card) this.store.setState({ card: { ...card, shown, done } });
        },
        hideCard: () => {
          const card = this.store.getState().card;
          this.store.setState({ cardVisible: false, card: card && { ...card, done: false } });
        },
        showWhisper: (text) => this.store.setState({ whisper: text, whisperVisible: true }),
        hideWhisper: () => this.store.setState({ whisperVisible: false }),
      },
      prefersReducedMotion,
    );
    this.attention = new Attention({
      camera: this.camera,
      items: this.items,
      progress: this.progress,
      narrative: this.narrative,
      view: {
        setReticle: (near, focus) => {
          const s = this.store.getState();
          if (s.reticleNear !== near || s.focus !== focus) this.store.setState({ reticleNear: near, focus });
        },
      },
      onRemember: (it) => this.remember(it),
    });
    this.input = new Input(this.canvas, {
      enabled: () => this.phase === 'play',
      onLook: (dx, dy, k) => this.player.look(dx, dy, k),
      onKey: (code) => {
        if ((code === 'Enter' || code === 'KeyE') && this.narrative.card) this.narrative.advance();
      },
      onStick: (stick) => this.store.setState({ stick }),
    });
    this.audio = new AudioEngine(this.sound);

    // --- initial UI state ---
    this.store.setState({
      phase: 'intro',
      total: TOTAL,
      remembered: [...p.remembered],
      sound: this.sound,
      retro: this.retro,
      introLede: p.freeRoam ? COPY.intro.complete : p.count ? COPY.intro.resumed : COPY.intro.fresh,
    });

    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------------- actions (from UI)

  wake = (): void => {
    if (this.phase !== 'intro') return;
    this.audio.start();
    this.setPhase('waking');
    this.wakeT = 0;
  };

  advanceCard = (): void => this.narrative.advance();

  toggleSound = (): void => {
    this.sound = !this.sound;
    storage.set(STORAGE_KEYS.sound, this.sound ? '1' : '0');
    this.audio.setEnabled(this.sound);
    this.store.setState({ sound: this.sound });
  };

  toggleRetro = (): void => {
    this.retro = !this.retro;
    this.resize();
    storage.set(STORAGE_KEYS.retro, this.retro ? '1' : '0');
    this.store.setState({ retro: this.retro });
  };

  keepWandering = (): void => {
    this.store.setState({ endingVisible: false });
    this.progress.freeRoam = true;
    this.atmosphere.radiusTarget = FREE_ROAM_RADIUS;
  };

  restart = (): void => {
    storage.remove(this.memoryKey);
    location.reload();
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    for (const t of this.timers) clearTimeout(t);
    removeEventListener('resize', this.resize);
    removeEventListener('hashchange', this.onHashChange);
    this.input.dispose();
    this.audio.dispose();
    this.chunks.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Sprite) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m: THREE.Material) => m.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }

  // ---------------------------------------------------------------- loop

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const { player, progress, narrative } = this;

    if (this.phase === 'intro') {
      player.yaw += dt * 0.015;
    } else if (this.phase === 'waking') {
      this.updateWaking(dt);
    } else {
      player.update(dt, this.input, this.field, this.resolvePlayer);
      // Note: the `chapter < length` guard is the one intentional fix vs. the single-file version,
      // which threw here if you waited 45 s on the ending screen.
      if (
        !progress.freeRoam &&
        !narrative.card &&
        progress.chapter < CHAPTERS.length &&
        this.time - this.lastProgress > HINT_DELAY
      ) {
        narrative.whisper(CHAPTERS[progress.chapter].hint, 4.5);
        this.lastProgress = this.time - 20;
      }
    }
    this.edgeT -= dt;
    narrative.tickWhisper(dt);

    this.atmosphere.update(dt, this.time, progress.chapter);
    player.applyToCamera(this.camera, prefersReducedMotion);
    this.attention.update(dt, this.phase === 'play', player.moveAmount);
    narrative.update(dt);
    this.chunks.update(player.position.x, player.position.z, false);
    this.water.update(this.time, player.position.x, player.position.z);
    this.updateEffects(dt);
    this.sky.group.position.copy(this.camera.position);

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  private updateWaking(dt: number): void {
    const { player } = this;
    this.wakeT += dt / 4;
    const e = easeInOut(Math.min(1, this.wakeT));
    player.eye = lerp(0.35, 1.6, e);
    player.pitch = lerp(0.75, 0.02, e);
    player.yaw = lerpAngle(player.yaw, this.yawToFire, Math.min(1, dt * 1.2));
    if (this.wakeT >= 1) {
      this.setPhase('play');
      this.lastProgress = this.time;
      if (!this.progress.count) WAKE_LINES.forEach((line) => this.narrative.say(line));
    }
  }

  private updateEffects(dt: number): void {
    const { time, progress, player } = this;
    this.story.campfire.update(time, this.atmosphere.kCur);
    this.embers.update(dt, time);
    this.motes.update(dt, time, player.position);
    this.story.update(time);
    this.items.updateGlints(dt, time, (it) => progress.isAvailable(it) && this.phase === 'play');
    this.bursts.update(dt);
    this.audio.setFireLevel(Math.max(0, 1 - Math.hypot(player.position.x, player.position.z) / 18) * 0.5);
  }

  /** Obstacles first, then the edge of what the player remembers. */
  private resolvePlayer = (P: THREE.Vector3): void => {
    pushOut(P, this.story.colliders);
    pushOut(P, this.chunks.collidersNear(P.x, P.z));
    const lim = this.atmosphere.radiusCur - 1.5;
    const dc = Math.hypot(P.x, P.z);
    if (!this.progress.freeRoam && dc > lim) {
      P.x *= lim / dc;
      P.z *= lim / dc;
      if (this.edgeT <= 0) {
        this.narrative.whisper(EDGE_LINES[(Math.random() * EDGE_LINES.length) | 0]);
        this.edgeT = 7;
      }
    }
  };

  // ---------------------------------------------------------------- story

  private remember(it: Item): void {
    const { progress, narrative, atmosphere, audio } = this;
    progress.remember(it.id);
    storage.set(this.memoryKey, progress.serialize());
    this.store.setState({ remembered: [...progress.remembered] });
    this.lastProgress = this.time;

    const base = CHIME_ROOTS[progress.count % 4];
    audio.chime(base, 0.08);
    audio.chime(base * 1.25, 0.06, 0.15);
    audio.chime(base * 1.5, 0.05, 0.3);
    if (it.id !== 'star') this.bursts.spawn(this.items.targetOf(it));
    narrative.say(it.text, it.title, 'memory');

    if (progress.isChapterComplete(progress.chapter)) {
      CHAPTERS[progress.chapter].done.forEach((t) => narrative.say(t));
      progress.chapter++;
      audio.swell();
      if (progress.isFinished) {
        atmosphere.kTarget = PRE_DAWN;
        narrative.afterCards = () => this.later(() => this.store.setState({ endingVisible: true }), 3500);
        return;
      }
      atmosphere.radiusTarget = CHAPTERS[progress.chapter].radius;
    }
    atmosphere.kTarget = (progress.count / TOTAL) * PRE_DAWN;
  }

  // ---------------------------------------------------------------- helpers

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.store.setState({ phase });
  }

  private resize = (): void => {
    this.renderer.setPixelRatio(
      this.retro ? Math.min(devicePixelRatio, RETRO_HEIGHT / innerHeight) : Math.min(devicePixelRatio, 1.75),
    );
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.canvas.style.imageRendering = this.retro ? 'pixelated' : 'auto';
  };

  private onHashChange = (): void => location.reload();

  private later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }
}

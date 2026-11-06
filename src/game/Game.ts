import * as THREE from 'three';
import { COPY } from '../content/copy';
import { CHAPTERS, EDGE_LINES, MEMORIES, STAR_CHAPTER, WAKE_LINES } from '../content/story';
import type { GameActions, GameStore, Phase } from '../state/gameStore';
import { FREE_ROAM_RADIUS, HINT_DELAY, STORAGE_KEYS, WATER, viewRadiusFor } from './config';
import { facing, parseHash, standInFront } from './debug';
import type { ActEngine, ActSettings } from './engine';
import { makeNoise } from './math/noise';
import { createHash2 } from './math/random';
import { easeInOut, lerp, lerpAngle } from './math/util';
import { isCoarsePointer, prefersReducedMotion, storage } from './platform';
import { ItemSet, type Item } from './story/items';
import { Closing, panLook } from './story/closing';
import { migrateSave } from './story/saveMigration';
import { buildStoryWorld, type StoryWorld } from './story/storyWorld';
import { Attention } from './systems/attention';
import { AudioEngine } from './systems/audio';
import { Input } from './systems/input';
import { Narrative } from './systems/narrative';
import { Player } from './systems/player';
import { Progress } from './systems/progress';
import { SEATED_EYE, STAND_EYE, Seat, type Pose } from './systems/seat';
import { Atmosphere } from './world/atmosphere';
import { ChunkManager } from './world/chunks';
import { DebugRing } from './world/debugRing';
import { pushOut } from './world/collision';
import { TerrainPalette } from './world/palette';
import { Bursts, Embers, Motes } from './world/particles';
import { createPropKit } from './world/props';
import { resolveSeed } from './world/seed';
import { Sky } from './world/sky';
import { TerrainField } from './world/terrain';
import { Water } from './world/water';
import { modelUrl } from './assets/models';
import { loadModel } from './three/gltf';
import { createGlowTexture, disposeObject } from './three/helpers';

const TOTAL = MEMORIES.length;
/** Brightest the sky ever gets: the act closes in stillness, never in a full dawn. */
const PRE_DAWN = 0.12;
/** Pixel height the retro mode renders at before upscaling. */
const RETRO_HEIGHT = 460;
/** The player stops this far (m) inside the remembered radius. */
const EDGE_MARGIN = 1.5;
const CHIME_ROOTS = [440, 554.37, 659.25, 880];
/** Reduced motion: how long the screen stays black while Isi sits down or gets up (ms). */
const FADE_MS = 400;

/** What the shell gives Act I's engine (see docs/adr/0001-multi-acto.md). */
export interface GameOptions {
  settings: ActSettings;
  /** Called when every memory has been faced (also on load, for saves that were already finished). */
  onComplete(): void;
  /** Called after the act's progress is wiped, so the shell can mount it again. */
  onRestart(): void;
}

/**
 * Owns the Three.js scene and the game loop, and orchestrates every system.
 * Talks to React only through the store (out) and GameActions (in).
 */
export class Game implements GameActions, ActEngine {
  private readonly store: GameStore;
  private readonly options: GameOptions;
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
  /** Sitting by the fire (DIS-07). */
  private readonly seat: Seat;
  /** After the last quote: guided camera, then the ending screen (DIS-07). */
  private readonly closing = new Closing();
  private readonly input: Input;
  private readonly audio: AudioEngine;
  private readonly yawToFire: number;
  /** `#debug` (ENG-03): debug panel on, nothing saved. */
  private readonly debug: boolean;
  private readonly debugRing: DebugRing | null = null;

  private phase: Phase = 'intro';
  private time = 0;
  private last = performance.now();
  private wakeT = 0;
  private edgeT = 0;
  private lastProgress = 0;
  private retro: boolean;
  private sound: boolean;
  private paused = false;
  private raf = 0;
  private disposed = false;
  private readonly timers = new Set<number>();

  constructor(container: HTMLElement, store: GameStore, options: GameOptions) {
    this.store = store;
    this.options = options;

    // --- seed + procedural field ---
    const seed = resolveSeed();
    this.memoryKey = STORAGE_KEYS.memory(seed);
    const noise = makeNoise(seed);
    this.field = new TerrainField(noise, seed);
    this.debug = parseHash(location.hash).debug;
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
    this.retro = options.settings.retro;
    this.sound = options.settings.sound;
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
    this.progress = new Progress(
      MEMORIES,
      CHAPTERS.length,
      migrateSave(Progress.parse(storage.get(this.memoryKey))),
    );

    // --- player + particles ---
    const { x: bx, z: bz } = this.story.bedroll;
    this.player = new Player(
      new THREE.Vector3(bx, this.field.groundAt(bx, bz), bz),
      Math.atan2(0.55, 0.72),
      0.75,
      0.35,
    );
    this.yawToFire = Math.atan2(-(0 - bx), -(0 - bz));
    // She sits where she woke up: next to the fire and clear of every collider.
    this.seat = new Seat(this.story.bedroll);
    if (!this.progress.freeRoam && this.progress.chapter === STAR_CHAPTER) this.seat.snapSeated();
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
    if (this.debug) {
      this.debugRing = new DebugRing(this.field);
      this.scene.add(this.debugRing.line);
      void this.placeTestModel();
    }

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
      enabled: () => this.phase === 'play' && !this.paused && !this.closing.locksLook,
      canMove: () => !this.seat.locksMovement,
      onLook: (dx, dy, k) => this.player.look(dx, dy, k),
      onKey: (code) => {
        if (this.paused) return;
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
      introLede: p.freeRoam ? COPY.intro.complete : p.count ? COPY.intro.resumed : COPY.intro.fresh,
      debug: this.debug,
    });

    if (p.isFinished) options.onComplete();
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

  // ---------------------------------------------------------------- ActEngine (from the shell)

  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) for (const k in this.input.keys) this.input.keys[k] = false;
    else this.last = performance.now();
  }

  /** Persisted by the shell. */
  setSound(on: boolean): void {
    this.sound = on;
    this.audio.setEnabled(on);
  }

  /** Persisted by the shell. */
  setRetro(on: boolean): void {
    this.retro = on;
    this.resize();
  }

  keepWandering = (): void => {
    this.store.setState({ endingVisible: false });
    this.closing.reset();
    this.standUp();
    this.progress.freeRoam = true;
    this.atmosphere.radiusTarget = FREE_ROAM_RADIUS;
  };

  restart = (): void => {
    if (!this.debug) storage.remove(this.memoryKey);
    this.options.onRestart();
  };

  // ---------------------------------------------------------------- debug (`#debug`, ENG-03)

  /** Back at camp, facing the fire, as on waking. */
  debugJumpToChapter = (chapter: number): void => {
    if (!this.debug) return;
    this.debugJump(chapter);
    this.moveTo(this.story.bedroll.x, this.story.bedroll.z);
    this.player.yaw = this.yawToFire;
    this.player.pitch = 0.02;
  };

  debugJumpToItem = (id: string): void => {
    const it = this.items.items.find((x) => x.id === id);
    if (!it || !this.debug) return;
    this.debugJump(it.chapter);
    const { player } = this;
    if (it.id === 'star') {
      this.moveTo(this.story.bedroll.x, this.story.bedroll.z);
      // The star sprite lives in the sky group, which is centred on the camera: its position is a direction.
      const f = facing({ x: 0, y: 0, z: 0 }, this.sky.shipStar.position);
      player.yaw = f.yaw;
      player.pitch = f.pitch;
      return;
    }
    const target = this.items.targetOf(it).clone();
    const spot = standInFront(target, Math.min(9, Math.max(2.5, it.attention.range * 0.45)));
    this.moveTo(spot.x, spot.z);
    const eye = { x: player.position.x, y: player.position.y + player.eye, z: player.position.z };
    const f = facing(eye, target);
    player.yaw = f.yaw;
    player.pitch = f.pitch;
  };

  debugCompleteAll = (): void => {
    if (!this.debug) return;
    this.debugJump(CHAPTERS.length - 1);
    for (const it of this.items.items) if (!this.progress.remembered.has(it.id)) this.remember(it);
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    for (const t of this.timers) clearTimeout(t);
    removeEventListener('resize', this.resize);
    removeEventListener('hashchange', this.onHashChange);
    this.input.dispose();
    this.audio.dispose();
    this.chunks.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }

  /**
   * ENG-10 test asset: a polyfork rock a few steps ahead of the bedroll, in `#debug` only, to check
   * that loaded models match the flat-shaded look. Fixed position, no `rng()`.
   */
  private async placeTestModel(): Promise<void> {
    let rock: THREE.Group;
    try {
      rock = await loadModel(modelUrl('testRock'));
    } catch (e) {
      console.warn('[debug] test model failed to load', e);
      return;
    }
    if (this.disposed) {
      disposeObject(rock);
      return;
    }
    // Off to one side of the bedroll → fire line (the fire is at the origin), so it's in frame on waking.
    const { x: bx, z: bz } = this.story.bedroll;
    const a = Math.atan2(-bz, -bx) + 0.5;
    const x = bx + Math.cos(a) * 3;
    const z = bz + Math.sin(a) * 3;
    rock.position.set(x, this.field.groundAt(x, z), z);
    this.scene.add(rock);
  }

  // ---------------------------------------------------------------- loop

  private frame = (now: number): void => {
    if (this.paused) {
      // Frozen in place behind the options panel: keep drawing, advance nothing.
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const { player, progress, narrative } = this;

    if (this.phase === 'intro') {
      player.yaw += dt * 0.015;
    } else if (this.phase === 'waking') {
      this.updateWaking(dt);
    } else {
      const pose = this.seat.update(dt);
      if (pose) this.applyPose(pose, dt);
      else player.update(dt, this.input, this.field, this.resolvePlayer);
      const stage = this.closing.update(dt);
      // AUD-01: aquí entra el coro (una vez) y baja el ambiente; sigue sonando tras la pantalla
      // final y aunque se apriete "Seguir explorando".
      if (stage === 'ending') this.showEnding();
      if (this.closing.locksLook) this.guideCamera(dt);
      // Note: the `chapter < length` guard is the one intentional fix vs. the single-file version,
      // which threw here if you waited 45 s on the ending screen.
      if (
        !progress.freeRoam &&
        !narrative.card &&
        this.closing.stage === 'idle' &&
        progress.chapter < CHAPTERS.length &&
        this.time - this.lastProgress > HINT_DELAY
      ) {
        narrative.whisper(CHAPTERS[progress.chapter].hint, 4.5);
        this.lastProgress = this.time - 20;
      }
    }
    this.edgeT -= dt;
    narrative.tickWhisper(dt);
    const seated = this.seat.locksMovement;
    if (this.store.getState().seated !== seated) this.store.setState({ seated });

    this.atmosphere.update(dt, this.time, progress.chapter);
    if (this.debugRing) this.updateDebug();
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
    player.eye = lerp(0.35, this.seat.locksMovement ? SEATED_EYE : STAND_EYE, e);
    player.pitch = lerp(0.75, 0.02, e);
    player.yaw = lerpAngle(player.yaw, this.yawToFire, Math.min(1, dt * 1.2));
    if (this.wakeT >= 1) {
      this.setPhase('play');
      this.lastProgress = this.time;
      if (!this.progress.count) WAKE_LINES.forEach((line) => this.narrative.say(line));
    }
  }

  /** Seated (or sitting down / getting up): the seat drives position and eye height. */
  private applyPose(pose: Pose, dt: number): void {
    const { player } = this;
    const P = player.position;
    player.moveAmount = 0;
    P.x = pose.x;
    P.z = pose.z;
    P.y = this.field.groundAt(P.x, P.z);
    player.eye = pose.eye;
    if (this.seat.state === 'sitting') {
      const yaw = facing({ x: P.x, y: 0, z: P.z }, { x: 0, y: 0, z: 0 }).yaw;
      player.yaw = lerpAngle(player.yaw, yaw, Math.min(1, dt * 2.4));
      player.pitch = lerp(player.pitch, -0.12, Math.min(1, dt * 2.4));
    }
  }

  /** After the campfire memory (DIS-07): down by the fire, or a short fade with reduced motion. */
  private sitDown(): void {
    const { player } = this;
    if (!prefersReducedMotion) {
      this.seat.sit({ x: player.position.x, z: player.position.z, eye: player.eye });
      return;
    }
    this.store.setState({ fade: true });
    this.later(() => {
      this.seat.snapSeated();
      player.yaw = this.yawToFire;
      player.pitch = -0.12;
      this.store.setState({ fade: false });
    }, FADE_MS);
  }

  /** Guided camera of the closing: a slow 360 at the star's height; held on the star with reduced motion. */
  private guideCamera(dt: number): void {
    const { player } = this;
    // The star sprite lives in the sky group, centred on the camera: its position is a direction.
    const star = facing({ x: 0, y: 0, z: 0 }, this.sky.shipStar.position);
    const look = prefersReducedMotion ? star : panLook(this.closing.cameraU, star);
    // Follow with a little lag: no snap when the camera takes over, and the drifting star stays framed.
    const k = Math.min(1, dt * 3);
    player.yaw = lerpAngle(player.yaw, look.yaw, k);
    player.pitch = lerp(player.pitch, look.pitch, k);
  }

  /** The act counts as finished only now, so a reload mid-closing replays it (DIS-07). */
  private showEnding(): void {
    if (!this.debug) {
      storage.set(this.memoryKey, this.progress.serialize());
      this.options.onComplete();
    }
    this.store.setState({ endingVisible: true });
  }

  /** "Seguir explorando": up on her feet, or a short fade with reduced motion. */
  private standUp(): void {
    if (this.seat.state !== 'seated') return;
    if (!prefersReducedMotion) {
      this.seat.rise();
      return;
    }
    this.store.setState({ fade: true });
    this.later(() => {
      this.seat.snapStanding();
      this.player.eye = STAND_EYE;
      this.store.setState({ fade: false });
    }, FADE_MS);
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
    const lim = this.atmosphere.radiusCur - EDGE_MARGIN;
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
    // `star` is saved with the ending screen (showEnding), not here.
    if (!this.debug && it.id !== 'star') storage.set(this.memoryKey, progress.serialize());
    this.store.setState({ remembered: [...progress.remembered] });
    this.lastProgress = this.time;

    const base = CHIME_ROOTS[progress.count % 4];
    audio.chime(base, 0.08);
    audio.chime(base * 1.25, 0.06, 0.15);
    audio.chime(base * 1.5, 0.05, 0.3);
    if (it.id !== 'star') this.bursts.spawn(this.items.targetOf(it));
    narrative.say(it.text, it.title, 'memory');
    if (it.id === 'campfire') this.sitDown();

    if (progress.isChapterComplete(progress.chapter)) {
      CHAPTERS[progress.chapter].done.forEach((t) => narrative.say(t));
      progress.chapter++;
      audio.swell();
      if (progress.isFinished) {
        atmosphere.kTarget = PRE_DAWN;
        narrative.afterCards = () => this.closing.start();
        return;
      }
      atmosphere.radiusTarget = CHAPTERS[progress.chapter].radius;
    }
    atmosphere.kTarget = (progress.count / TOTAL) * PRE_DAWN;
  }

  // ---------------------------------------------------------------- debug helpers

  /** Earlier chapters remembered, this one active, the world snapped to match. Never saved. */
  private debugJump(chapter: number): void {
    if (!this.debug) return;
    const { progress, atmosphere, player } = this;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    progress.jumpToChapter(chapter);
    this.closing.reset();
    this.narrative.clear();
    this.store.setState({ remembered: [...progress.remembered], endingVisible: false, fade: false });
    if (progress.chapter === STAR_CHAPTER) this.seat.snapSeated();
    else this.seat.snapStanding();
    player.eye = this.seat.locksMovement ? SEATED_EYE : STAND_EYE;
    if (this.phase === 'intro') this.audio.start();
    if (this.phase !== 'play') {
      player.pitch = 0.02;
      this.setPhase('play');
    }
    atmosphere.kTarget = (progress.count / TOTAL) * PRE_DAWN;
    atmosphere.radiusTarget = CHAPTERS[progress.chapter].radius;
    atmosphere.snap(progress.chapter);
    this.lastProgress = this.time;
  }

  /** Teleport on the ground, out of any obstacle. */
  private moveTo(x: number, z: number): void {
    const P = this.player.position;
    this.chunks.update(x, z, true);
    P.set(x, 0, z);
    pushOut(P, this.story.colliders);
    pushOut(P, this.chunks.collidersNear(P.x, P.z));
    P.y = Math.max(this.field.groundAt(P.x, P.z), WATER - 0.6);
  }

  /** The edge line, plus chapter and radius for the panel (only when they change). */
  private updateDebug(): void {
    const { atmosphere, progress } = this;
    this.debugRing?.update(atmosphere.radiusCur - EDGE_MARGIN, !progress.freeRoam);
    const next = {
      debugChapter: progress.chapter,
      debugRadius: Math.round(atmosphere.radiusCur),
      debugRadiusTarget: Math.round(atmosphere.radiusTarget),
    };
    const s = this.store.getState();
    if (
      s.debugChapter !== next.debugChapter ||
      s.debugRadius !== next.debugRadius ||
      s.debugRadiusTarget !== next.debugRadiusTarget
    )
      this.store.setState(next);
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

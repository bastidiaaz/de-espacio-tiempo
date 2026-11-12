import * as THREE from 'three';
import { COPY } from '../content/copy';
import { CHAPTERS, EDGE_LINES, FREE_EDGE_LINES, HIDDEN_IDS, MEMORIES, STAR_CHAPTER, WAKE_LINES } from '../content/story';
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
import { HiddenSet, type HiddenItem } from './story/hidden';
import { Attention, type GazeCandidate } from './systems/attention';
import { AudioEngine } from './systems/audio';
import { EDGE_MARGIN, EdgeBounce, bandWidth, edgeLevel, miradorWeight, nominalBand, slowOutward } from './systems/edge';
import { Input } from './systems/input';
import { shipSilence, type MixState } from './systems/mix';
import { Narrative } from './systems/narrative';
import { Player } from './systems/player';
import { Progress } from './systems/progress';
import { panTowards, proximityLevel } from './systems/proximity';
import { SEATED_EYE, STAND_EYE, Seat, type Pose } from './systems/seat';
import { Atmosphere } from './world/atmosphere';
import { ChunkManager } from './world/chunks';
import { DebugRing } from './world/debugRing';
import { pushOut } from './world/collision';
import { TerrainPalette } from './world/palette';
import { Bursts, Embers, Motes } from './world/particles';
import { createPropKit } from './world/props';
import { resolveSeed } from './world/seed';
import { MiradorSky } from './world/miradorSky';
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
  /** `lvr-a1-hidden-<seed>` (ENG-13). */
  private readonly hiddenKey: string;
  private readonly viewRadius = viewRadiusFor(isCoarsePointer);

  private readonly field: TerrainField;
  private readonly chunks: ChunkManager;
  private readonly water: Water;
  private readonly sky: Sky;
  /** The sky that only shows from the mirador's peak (ART-08). */
  private readonly miradorSky: MiradorSky;
  private readonly story: StoryWorld;
  private readonly items: ItemSet;
  /** The five hidden objects of the free roam (ENG-13). */
  private readonly hidden: HiddenSet;
  /** Hidden ids found so far. Not part of `progress`: they don't count in the counter. */
  private readonly found: Set<string>;
  private readonly motes: Motes;
  private readonly embers: Embers;
  private readonly bursts: Bursts;
  private readonly atmosphere: Atmosphere;
  private readonly progress: Progress;
  private readonly narrative: Narrative;
  private readonly attention: Attention<Item | HiddenItem>;
  /** Reused by `gazeCandidates`: Attention reads each candidate before the next one. */
  private readonly candidate: GazeCandidate<Item | HiddenItem> = {
    item: null as unknown as Item,
    target: new THREE.Vector3(),
    tuning: { range: 0, cone: 0 },
  };
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
  /** Debug: where the dark band before the edge starts (ENG-14). */
  private readonly debugBandRing: DebugRing | null = null;

  private phase: Phase = 'intro';
  private time = 0;
  private last = performance.now();
  private wakeT = 0;
  private edgeT = 0;
  /** Width (m) of the dark band before the stop, eased; -1 snaps it on the next frame (ENG-14). */
  private edgeWidth = -1;
  /** Touching the stop pushes her gently back instead of a rigid wall (pedido del autor). */
  private readonly bounce = new EdgeBounce();
  private lastProgress = 0;
  /** Level of the proximity arpeggio this frame: the note layers make room for it (AUD-06). */
  private cueLevel = 0;
  /** The silence before the ship is on (AUD-03, DIS-08). */
  private shipQuiet = false;
  /** Debug: values forced on the audio mix from the panel. */
  private debugMix: Partial<MixState> = {};
  private retro: boolean;
  private sound: boolean;
  private lookSensitivity: number;
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
    this.hiddenKey = STORAGE_KEYS.hidden(seed);
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
    this.lookSensitivity = options.settings.lookSensitivity;
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
    // Before the chunks: they keep the hideouts clear of scattered props.
    this.hidden = new HiddenSet(this.field, kit, glow, seed);
    this.scene.add(this.hidden.group);
    this.miradorSky = new MiradorSky(seed, glow, this.hidden.mirador.angle);
    this.scene.add(this.miradorSky.group);
    this.found = new Set(
      Progress.parse(storage.get(this.hiddenKey)).filter((id) => (HIDDEN_IDS as readonly string[]).includes(id)),
    );
    this.chunks = new ChunkManager(
      this.field,
      new TerrainPalette(this.field, noise, createHash2(seed), this.hidden.tints),
      kit,
      seed,
      this.viewRadius,
      this.hidden.clearings,
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
      this.debugBandRing = new DebugRing(this.field, 0x7fb4ff);
      this.scene.add(this.debugRing.line, this.debugBandRing.line);
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
    this.attention = new Attention<Item | HiddenItem>({
      camera: this.camera,
      candidates: () => this.gazeCandidates(),
      narrative: this.narrative,
      view: {
        setReticle: (near, focus) => {
          const s = this.store.getState();
          if (s.reticleNear !== near || s.focus !== focus) this.store.setState({ reticleNear: near, focus });
        },
      },
      onRemember: (it) => ('hidden' in it ? this.findHidden(it) : this.remember(it)),
    });
    this.input = new Input(this.canvas, {
      enabled: () => this.phase === 'play' && !this.paused && !this.closing.locksLook,
      canMove: () => !this.seat.locksMovement,
      onLook: (dx, dy, k) => this.player.look(dx, dy, k * this.lookSensitivity),
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
      hiddenFound: [...this.found],
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

  /** Persisted by the shell. */
  setLookSensitivity(multiplier: number): void {
    this.lookSensitivity = multiplier;
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

  /** Straight into the free roam, standing where the hidden object answers the gaze. */
  debugJumpToHidden = (id: string): void => {
    const h = this.hidden.items.find((x) => x.id === id);
    if (!h || !this.debug) return;
    this.debugFreeRoam();
    const target = this.hidden.targetOf(h).clone();
    const spot = this.hidden.standingSpot(h, Math.min(3.5, h.attention.range * 0.6));
    this.moveTo(spot.x, spot.z);
    const { player } = this;
    const f = facing({ x: player.position.x, y: player.position.y + player.eye, z: player.position.z }, target);
    player.yaw = f.yaw;
    player.pitch = f.pitch;
  };

  /** AUD-01: hear the chorus (from the top, every time) without playing the whole act. */
  debugPlayChorus = (): void => {
    if (!this.debug) return;
    this.audio.start(); // no-op once started; the click is the user gesture it needs
    this.audio.playChorus(true);
  };

  /** Straight into the free roam: where the ramp starts, facing it, or on the plateau, facing outwards. */
  debugJumpToMirador = (where: 'foot' | 'summit'): void => {
    if (!this.debug) return;
    this.debugFreeRoam();
    const { player } = this;
    const m = this.hidden.mirador;
    const spot = where === 'foot' ? m.foot : m.summit;
    this.moveTo(spot.x, spot.z);
    const to = where === 'foot' ? m.pathStart : { x: spot.x * 2, z: spot.z * 2 };
    player.yaw = facing({ x: player.position.x, y: 0, z: player.position.z }, { x: to.x, y: 0, z: to.z }).yaw;
    player.pitch = where === 'foot' ? 0.2 : 0.3;
  };

  debugResetHidden = (): void => {
    if (!this.debug) return;
    this.found.clear();
    this.store.setState({ hiddenFound: [] });
  };

  /**
   * Forces these values of the audio mix (silence, chapter layers, wind, edge), replacing any
   * earlier ones; `null` hands it all back to the game.
   */
  debugAudio = (patch: Partial<MixState> | null): void => {
    if (!this.debug) return;
    this.debugMix = patch ?? {};
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
      else {
        player.update(dt, this.input, this.field, this.resolvePlayer);
        this.applyBounce(dt);
      }
      const stage = this.closing.update(dt);
      // AUD-01: the chorus comes in with the guided camera, once. It keeps playing behind the
      // ending screen and after "Seguir explorando"; nothing here ever cuts it.
      if (stage === 'camera') this.audio.playChorus();
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
    this.updateEdge(dt);
    narrative.tickWhisper(dt);
    const seated = this.seat.locksMovement;
    if (this.store.getState().seated !== seated) this.store.setState({ seated });

    this.atmosphere.update(dt, progress.chapter);
    if (this.debugRing) this.updateDebug();
    player.applyToCamera(this.camera, prefersReducedMotion);
    this.attention.update(dt, this.phase === 'play', player.moveAmount);
    narrative.update(dt);
    this.chunks.update(player.position.x, player.position.z, false);
    this.water.update(this.time, player.position.x, player.position.z);
    this.updateEffects(dt);
    this.sky.group.position.copy(this.camera.position);
    // The mirador's sky rises with the climb (ART-08); the wind follows `miradorSky.reveal` (AUD-03).
    const P = player.position;
    this.miradorSky.update(
      dt,
      this.time,
      this.hidden.mirador.reveal(P.x, P.z, P.y),
      this.canvas.height,
      prefersReducedMotion,
    );
    this.miradorSky.group.position.copy(this.camera.position);

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
    this.hidden.update(dt, time, player.position, progress.freeRoam && this.phase === 'play', this.found);
    this.updateProximity();
    this.updateAmbience();
    this.bursts.update(dt);
    this.audio.setFireLevel(Math.max(0, 1 - Math.hypot(player.position.x, player.position.z) / 18) * 0.5);
  }

  /**
   * Proximity cue (pedido del autor, 2026-11-06): a calm arpeggio whose volume grows near the
   * closest hidden object not found yet, panned towards it. Only in the free roam, and quiet while a card is open.
   */
  private updateProximity(): void {
    const { player } = this;
    let level = 0;
    let pan = 0;
    if (this.progress.freeRoam && this.phase === 'play' && !this.narrative.card) {
      for (const h of this.hidden.items) {
        if (this.found.has(h.id)) continue;
        const dx = h.obj.position.x - player.position.x;
        const dz = h.obj.position.z - player.position.z;
        const l = proximityLevel(Math.hypot(dx, dz));
        if (l > level) {
          level = l;
          pan = panTowards(player.yaw, dx, dz);
        }
      }
    }
    this.cueLevel = level;
    this.audio.setProximity(level, pan);
  }

  /**
   * Wind, silence and chapter layers (AUD-03, AUD-06). The mirador's wind follows its sky (ART-08).
   * The edge (AUD-05) is not wired yet: it only takes `edge: this.atmosphere.edge` here.
   */
  private updateAmbience(): void {
    const { progress } = this;
    const P = this.player.position;
    const ship = this.items.items.find((it) => it.id === 'ship');
    let nearShip = false;
    if (ship && this.phase === 'play' && progress.isAvailable(ship)) {
      const t = this.items.targetOf(ship);
      nearShip = shipSilence(Math.hypot(t.x - P.x, t.z - P.z), this.shipQuiet);
    }
    this.shipQuiet = nearShip;
    this.audio.setMix({
      chapter: progress.chapter,
      freeRoam: progress.freeRoam,
      silence: nearShip ? 'wind' : 'off',
      windZone: this.miradorSky.reveal, // the wind grows with the climb, like the mirador's sky (ART-08)
      cue: this.cueLevel,
      ...this.debugMix,
    });
  }

  /**
   * The pull back near the edge, then obstacles, then the edge of what the player remembers
   * (ENG-14: also in the free roam, at FREE_ROAM_RADIUS).
   */
  private resolvePlayer = (P: THREE.Vector3, fromX: number, fromZ: number): void => {
    // While the bounce pushes, no step outwards at all; otherwise the dark band's slow-down.
    const level = this.bounce.pushing ? 1 : this.edgeAt(fromX, fromZ);
    if (level > 0) {
      const s = slowOutward(fromX, fromZ, P.x, P.z, level, this.bounce.pushing ? 0 : undefined);
      P.x = s.x;
      P.z = s.z;
    }
    pushOut(P, this.story.colliders);
    pushOut(P, this.hidden.colliders);
    pushOut(P, this.chunks.collidersNear(P.x, P.z));
    // The mirador's ridge is too steep everywhere but on its ramp (ART-08).
    const step = this.hidden.mirador.resolveStep(fromX, fromZ, P.x, P.z);
    P.x = step.x;
    P.z = step.z;
    const lim = this.atmosphere.radiusCur - EDGE_MARGIN;
    const dc = Math.hypot(P.x, P.z);
    if (dc > lim) {
      P.x *= lim / dc;
      P.z *= lim / dc;
      this.bounce.hit();
      // At the mirador the cliff already says it: no line there.
      if (this.edgeT <= 0 && this.mirador(P.x, P.z) < 0.5) {
        const lines = this.progress.freeRoam ? FREE_EDGE_LINES : EDGE_LINES;
        this.narrative.whisper(lines[(Math.random() * lines.length) | 0]);
        this.edgeT = 7;
      }
    }
  };

  /** After touching the stop: a short push back towards the fire, fading out (EdgeBounce). */
  private applyBounce(dt: number): void {
    const d = this.bounce.step(dt);
    if (d <= 0) return;
    const P = this.player.position;
    const r = Math.hypot(P.x, P.z);
    if (r < 1e-6) return;
    P.x -= (P.x / r) * d;
    P.z -= (P.z / r) * d;
    pushOut(P, this.story.colliders);
    pushOut(P, this.hidden.colliders);
    pushOut(P, this.chunks.collidersNear(P.x, P.z));
  }

  /** 0..1 how far into the dark band (x, z) is; 0 at the mirador (ENG-14). */
  private edgeAt(x: number, z: number): number {
    if (this.edgeWidth <= 0) return 0;
    const level = edgeLevel(Math.hypot(x, z), this.atmosphere.radiusCur - EDGE_MARGIN, this.edgeWidth);
    return level * (1 - this.mirador(x, z));
  }

  /** 1 in the mirador's sector of the free roam, 0 elsewhere (and always 0 before the free roam). */
  private mirador(x: number, z: number): number {
    return this.progress.freeRoam ? miradorWeight(x, z, this.hidden.layout.miradorAngle) : 0;
  }

  /**
   * The edge goes dark (ENG-14): eases the band's width (narrower while a pending item lies in
   * it, so no memory waits in the dark) and hands the level to the light and the vignette.
   */
  private updateEdge(dt: number): void {
    const { atmosphere, progress, player } = this;
    const limit = atmosphere.radiusCur - EDGE_MARGIN;
    const nominal = nominalBand(atmosphere.radiusCur, progress.freeRoam);
    const target = progress.freeRoam ? nominal : bandWidth(limit, nominal, this.pendingItemDists());
    if (this.edgeWidth < 0) this.edgeWidth = target;
    else this.edgeWidth += (target - this.edgeWidth) * (1 - Math.exp(-dt * 0.5));
    const level = this.edgeAt(player.position.x, player.position.z);
    atmosphere.edge = level;
    const shown = Math.round(level * 20) / 20;
    if (this.store.getState().edge !== shown) this.store.setState({ edge: shown });
  }

  /** Distance to the fire of every memory that can be recalled now (the star lives in the sky). */
  private *pendingItemDists(): Generator<number> {
    for (const it of this.items.items) {
      if (it.id === 'star' || !this.progress.isAvailable(it)) continue;
      const t = this.items.targetOf(it);
      yield Math.hypot(t.x, t.z);
    }
  }

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

  /**
   * What the gaze can land on this frame: the memories of the current chapter and, in the free
   * roam, the hidden objects not found yet, from the side they answer from.
   */
  private *gazeCandidates(): Generator<GazeCandidate<Item | HiddenItem>> {
    const c = this.candidate;
    for (const it of this.items.items) {
      if (!this.progress.isAvailable(it)) continue;
      c.item = it;
      c.target.copy(this.items.targetOf(it));
      c.tuning = it.attention;
      yield c;
    }
    if (!this.progress.freeRoam) return;
    const P = this.player.position;
    for (const h of this.hidden.items) {
      if (this.found.has(h.id) || !this.hidden.answers(h, P.x, P.z)) continue;
      c.item = h;
      c.target.copy(this.hidden.targetOf(h));
      c.tuning = h.attention;
      yield c;
    }
  }

  /** A hidden object (ENG-13): a card and a sound, like a memory, but outside the counter. */
  private findHidden(h: HiddenItem): void {
    this.found.add(h.id);
    if (!this.debug) storage.set(this.hiddenKey, JSON.stringify([...this.found]));
    this.store.setState({ hiddenFound: [...this.found] });
    // AUD-08: the guitar gets its own arpeggio; until then, the usual memory chime.
    const base = CHIME_ROOTS[this.found.size % 4];
    this.audio.chime(base, 0.08);
    this.audio.chime(base * 1.25, 0.06, 0.15);
    this.audio.chime(base * 1.5, 0.05, 0.3);
    this.bursts.spawn(this.hidden.targetOf(h));
    this.narrative.say(h.text, h.title, 'memory');
  }

  // ---------------------------------------------------------------- debug helpers

  /** Every memory remembered, standing, free roam on. Never saved. */
  private debugFreeRoam(): void {
    const { progress, atmosphere, player } = this;
    this.debugJump(CHAPTERS.length - 1);
    progress.completeAll();
    this.seat.snapStanding();
    player.eye = STAND_EYE;
    this.store.setState({ remembered: [...progress.remembered] });
    atmosphere.kTarget = PRE_DAWN;
    atmosphere.radiusTarget = FREE_ROAM_RADIUS;
    atmosphere.snap(progress.chapter);
    this.edgeWidth = -1;
  }

  /** Earlier chapters remembered, this one active, the world snapped to match. Never saved. */
  private debugJump(chapter: number): void {
    if (!this.debug) return;
    const { progress, atmosphere, player } = this;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    progress.jumpToChapter(chapter);
    this.closing.reset();
    this.audio.stopChorus();
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
    this.edgeWidth = -1;
    this.lastProgress = this.time;
  }

  /** Teleport on the ground, out of any obstacle. */
  private moveTo(x: number, z: number): void {
    const P = this.player.position;
    this.bounce.reset();
    this.chunks.update(x, z, true);
    P.set(x, 0, z);
    pushOut(P, this.story.colliders);
    pushOut(P, this.hidden.colliders);
    pushOut(P, this.chunks.collidersNear(P.x, P.z));
    P.y = Math.max(this.field.groundAt(P.x, P.z), WATER - 0.6);
  }

  /** The edge and band lines, plus chapter, radius and band for the panel (only when they change). */
  private updateDebug(): void {
    const { atmosphere, progress } = this;
    const limit = atmosphere.radiusCur - EDGE_MARGIN;
    this.debugRing?.update(limit, true);
    this.debugBandRing?.update(limit - this.edgeWidth, this.edgeWidth > 0.2);
    const next = {
      debugChapter: progress.chapter,
      debugRadius: Math.round(atmosphere.radiusCur),
      debugRadiusTarget: Math.round(atmosphere.radiusTarget),
      debugBand: Math.round(Math.max(0, this.edgeWidth)),
    };
    const s = this.store.getState();
    if (
      s.debugChapter !== next.debugChapter ||
      s.debugRadius !== next.debugRadius ||
      s.debugRadiusTarget !== next.debugRadiusTarget ||
      s.debugBand !== next.debugBand
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

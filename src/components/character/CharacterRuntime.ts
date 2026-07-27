import * as THREE from 'three';
import {
  DEFAULT_CHARACTER_MODEL_URL,
  type CharacterActionId,
  type CharacterGltfLoadResult,
  type CharacterLoadStatus,
  type CharacterPlaybackState,
} from '../../types/character';
import { applyCharacterFit } from './characterFitMath';
import { CharacterAnimationController } from './CharacterAnimationController';
import {
  canAcceptCharacterClick,
  CHARACTER_SPECIAL_ACTION_DURATION_SEC,
  isSpecialActionActive,
  resolveHoverEmissive,
  resolveNextSpecialAction,
  shouldSampleCharacterRaycast,
  stepHoverIntensity,
  type CharacterSpecialActionId,
} from './characterInteractionMath';
import { loadCharacterGltf } from './loadCharacterGltf';

// src/components/character/CharacterRuntime.ts
// Independent Character Layer: transparent WebGL scene, lights, glTF, mixer.

export type CharacterRuntimeListeners = {
  onStatus?: (status: CharacterLoadStatus, error?: string | null) => void;
  onClips?: (clipNames: string[]) => void;
  onPlayback?: (
    state: CharacterPlaybackState,
    clipName: string | null,
    actionId?: CharacterActionId | null,
  ) => void;
  /** Discrete hover change for cursor / a11y (not per-frame). */
  onHoverChange?: (hovered: boolean) => void;
};

type EmissiveSnapshot = {
  material: THREE.MeshStandardMaterial | THREE.MeshPhongMaterial;
  r: number;
  g: number;
  b: number;
};

/**
 * Owns the Character Layer Three.js graph (separate from Ambient / cover particles).
 */
export class CharacterRuntime {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private root: THREE.Group | null = null;
  private characterRoot: THREE.Object3D | null = null;
  private animation = new CharacterAnimationController();
  private abort: AbortController | null = null;
  private disposed = false;
  private listeners: CharacterRuntimeListeners;
  /** One-shot beat scale emphasis that decays toward 1 each frame. */
  private beatEmphasis = 1;
  private baseRootScale = 1;

  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2(2, 2);
  private lastRaycastAtMs: number | null = null;
  private hovered = false;
  private hoverIntensity = 0;
  private emissiveSnapshots: EmissiveSnapshot[] = [];

  private lastClickAtMs: number | null = null;
  private lastSpecial: CharacterSpecialActionId | null = null;
  private interactionUntilSec: number | null = null;
  private spinYawRate = 0;
  private performanceNow: () => number;
  private qualityTier: 'high' | 'balanced' | 'lite' = 'balanced';

  constructor(
    listeners: CharacterRuntimeListeners = {},
    performanceNow: () => number = () => performance.now(),
  ) {
    this.listeners = listeners;
    this.performanceNow = performanceNow;
  }

  /** Apply Ticket 10 LOD: lower DPR and skip hover work on lite. */
  setQualityTier(tier: 'high' | 'balanced' | 'lite'): void {
    this.qualityTier = tier;
    if (this.renderer) {
      const cap = tier === 'high' ? 2 : tier === 'balanced' ? 1.5 : 1;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    }
  }

  /**
   * Attach to a canvas and build camera + three-point lighting.
   */
  mount(canvas: HTMLCanvasElement): void {
    this.disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    // Framed for the bottom-right corner dock (tighter, slightly low angle).
    camera.position.set(0.35, 1.05, 3.4);
    camera.lookAt(0, 0.7, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.qualityTier === 'lite' ? 1 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const root = new THREE.Group();
    scene.add(root);
    this.setupThreePointLights(scene);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.root = root;
  }

  /**
   * Key / fill / rim lights so the character reads on a transparent layer.
   */
  private setupThreePointLights(scene: THREE.Scene): void {
    const key = new THREE.DirectionalLight(0xfff2e0, 1.15);
    key.position.set(2.2, 3.4, 2.8);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.45);
    fill.position.set(-2.4, 1.6, 1.2);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.55);
    rim.position.set(0.2, 2.2, -2.8);
    scene.add(rim);

    const ambient = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambient);
  }

  resize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  /**
   * Load a glTF character into the layer (replaces any previous model).
   */
  async load(url: string = DEFAULT_CHARACTER_MODEL_URL): Promise<CharacterGltfLoadResult | null> {
    if (!this.root || this.disposed) return null;

    this.abort?.abort();
    this.abort = new AbortController();
    this.listeners.onStatus?.('loading', null);

    try {
      const result = await loadCharacterGltf({
        url,
        signal: this.abort.signal,
      });

      if (this.disposed) return null;

      this.clearCharacter();
      applyCharacterFit(result.scene, 1.35);
      this.characterRoot = result.scene;
      this.root.add(result.scene);
      this.captureEmissiveBaselines(result.scene);

      this.animation.bind(result.scene, result.clips);
      this.listeners.onClips?.(result.clipNames);

      if (this.animation.playAction('idle')) {
        this.emitPlayback();
      }

      this.listeners.onStatus?.('ready', null);
      return result;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      const message = error instanceof Error ? error.message : 'Character load failed';
      this.listeners.onStatus?.('error', message);
      return null;
    }
  }

  play(clipName: string): boolean {
    const ok = this.animation.play(clipName);
    if (ok) this.emitPlayback();
    return ok;
  }

  /**
   * Play a preset action. Rhythm path is blocked while a click special owns the mixer.
   */
  playAction(
    actionId: CharacterActionId,
    fadeSec?: number,
    options?: { force?: boolean },
  ): boolean {
    const nowSec = this.performanceNow() / 1000;
    if (!options?.force && isSpecialActionActive(nowSec, this.interactionUntilSec)) {
      return false;
    }
    if (this.animation.getCurrentActionId() === actionId
      && this.animation.getPlaybackState() === 'playing') {
      return true;
    }
    const ok = this.animation.playAction(actionId, fadeSec);
    if (ok) this.emitPlayback();
    return ok;
  }

  /** True while a click special still owns the character. */
  isInteractionLocked(): boolean {
    return isSpecialActionActive(this.performanceNow() / 1000, this.interactionUntilSec);
  }

  isHovered(): boolean {
    return this.hovered;
  }

  /**
   * Update pointer in canvas NDC (-1…1). Throttled raycast; returns current hover.
   */
  setPointerNdc(ndcX: number, ndcY: number, forceSample = false): boolean {
    this.pointerNdc.set(ndcX, ndcY);
    const nowMs = this.performanceNow();
    if (!forceSample && !shouldSampleCharacterRaycast(nowMs, this.lastRaycastAtMs)) {
      return this.hovered;
    }
    this.lastRaycastAtMs = nowMs;
    this.sampleHover();
    return this.hovered;
  }

  /** Clear hover when the pointer leaves the canvas. */
  clearPointer(): void {
    this.pointerNdc.set(2, 2);
    this.setHovered(false);
  }

  /**
   * Click → special action when cooldown allows. Returns whether the click was accepted.
   */
  handlePointerClick(nowMs: number = this.performanceNow()): boolean {
    if (!this.characterRoot || this.disposed) return false;
    this.sampleHover(true);
    if (!this.hovered) return false;
    if (!canAcceptCharacterClick(nowMs, this.lastClickAtMs)) return false;

    const special = resolveNextSpecialAction(this.lastSpecial);
    this.lastSpecial = special;
    this.lastClickAtMs = nowMs;
    this.interactionUntilSec = nowMs / 1000 + CHARACTER_SPECIAL_ACTION_DURATION_SEC;
    this.spinYawRate = special === 'spin' ? Math.PI * 2 / CHARACTER_SPECIAL_ACTION_DURATION_SEC : 0;

    this.playAction(special, undefined, { force: true });
    return true;
  }

  /** Drive AnimationMixer timeScale from song BPM (120 → 1.0x). */
  setBpm(bpm: number | null): void {
    this.animation.setBpm(bpm);
  }

  /**
   * Apply a one-shot scale emphasis from beat strength (decays in update).
   */
  pulseBeatEmphasis(emphasis: number): void {
    if (this.qualityTier === 'lite') return;
    if (!(emphasis > 1)) return;
    this.beatEmphasis = Math.max(this.beatEmphasis, Math.min(1.55, emphasis));
  }

  setBlendWeight(clipName: string, weight: number, fadeSec?: number): boolean {
    return this.animation.setBlendWeight(clipName, weight, fadeSec);
  }

  pause(): void {
    this.animation.pause();
    this.emitPlayback();
  }

  resume(): void {
    this.animation.resume();
    this.emitPlayback();
  }

  stop(): void {
    this.animation.stop();
    this.emitPlayback();
  }

  getPlaybackState(): CharacterPlaybackState {
    return this.animation.getPlaybackState();
  }

  getCurrentClipName(): string | null {
    return this.animation.getCurrentClipName();
  }

  getCurrentActionId(): CharacterActionId | null {
    return this.animation.getCurrentActionId();
  }

  getTimeScale(): number {
    return this.animation.getTimeScale();
  }

  /**
   * Per-frame update + render. Call from the Character Layer RAF only.
   */
  update(deltaTime: number): void {
    if (!this.renderer || !this.scene || !this.camera || this.disposed) return;
    this.animation.update(deltaTime);

    const nowSec = this.performanceNow() / 1000;
    if (this.interactionUntilSec != null && nowSec >= this.interactionUntilSec) {
      this.interactionUntilSec = null;
      this.spinYawRate = 0;
      if (this.root) this.root.rotation.y = 0;
    }

    if (this.spinYawRate !== 0 && this.root) {
      this.root.rotation.y += this.spinYawRate * deltaTime;
    }

    this.hoverIntensity = stepHoverIntensity(this.hoverIntensity, this.hovered, deltaTime);
    this.applyHoverEmissive(this.hoverIntensity);

    // Decay beat emphasis toward 1 without touching React state.
    if (this.beatEmphasis > 1.001) {
      this.beatEmphasis = 1 + (this.beatEmphasis - 1) * Math.exp(-deltaTime * 8);
    } else {
      this.beatEmphasis = 1;
    }
    if (this.root) {
      const s = this.baseRootScale * this.beatEmphasis;
      this.root.scale.setScalar(s);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private sampleHover(force = false): void {
    if (!this.camera || !this.characterRoot) {
      this.setHovered(false);
      return;
    }
    if (!force && (this.pointerNdc.x > 1.5 || this.pointerNdc.y > 1.5)) {
      this.setHovered(false);
      return;
    }
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObject(this.characterRoot, true);
    this.setHovered(hits.length > 0);
  }

  private setHovered(next: boolean): void {
    if (this.hovered === next) return;
    this.hovered = next;
    this.listeners.onHoverChange?.(next);
  }

  private captureEmissiveBaselines(root: THREE.Object3D): void {
    this.emissiveSnapshots = [];
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (!mat || !('emissive' in mat)) continue;
        const m = mat as THREE.MeshStandardMaterial;
        if (!m.emissive) continue;
        this.emissiveSnapshots.push({
          material: m,
          r: m.emissive.r,
          g: m.emissive.g,
          b: m.emissive.b,
        });
      }
    });
  }

  private applyHoverEmissive(intensity: number): void {
    const glow = resolveHoverEmissive(intensity);
    for (const snap of this.emissiveSnapshots) {
      snap.material.emissive.setRGB(
        snap.r + glow.r,
        snap.g + glow.g,
        snap.b + glow.b,
      );
    }
  }

  private emitPlayback(): void {
    this.listeners.onPlayback?.(
      this.animation.getPlaybackState(),
      this.animation.getCurrentClipName(),
      this.animation.getCurrentActionId(),
    );
  }

  private clearCharacter(): void {
    this.animation.dispose();
    this.emissiveSnapshots = [];
    this.setHovered(false);
    this.hoverIntensity = 0;
    this.interactionUntilSec = null;
    this.spinYawRate = 0;
    if (this.root) this.root.rotation.y = 0;
    if (this.characterRoot && this.root) {
      this.root.remove(this.characterRoot);
      this.characterRoot.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material?.dispose();
        }
      });
    }
    this.characterRoot = null;
  }

  dispose(): void {
    this.disposed = true;
    this.abort?.abort();
    this.abort = null;
    this.clearCharacter();
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.root = null;
  }
}

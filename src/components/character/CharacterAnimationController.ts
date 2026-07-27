import * as THREE from 'three';
import type { CharacterActionId, CharacterPlaybackState } from '../../types/character';
import { findClipByName } from './characterAnimationMath';
import {
  CHARACTER_ACTION_LIBRARY,
  resolveActionClipName,
  resolveActionPlaybackTimeScale,
  type CharacterActionDefinition,
} from './characterActionMath';

// src/components/character/CharacterAnimationController.ts
// AnimationMixer wrapper: preset actions, cross-fade, blend weights, BPM timeScale.

export class CharacterAnimationController {
  private mixer: THREE.AnimationMixer | null = null;
  private clips: THREE.AnimationClip[] = [];
  private actions = new Map<string, THREE.AnimationAction>();
  private currentAction: THREE.AnimationAction | null = null;
  private currentClipName: string | null = null;
  private currentActionId: CharacterActionId | null = null;
  private playback: CharacterPlaybackState = 'stopped';
  private bpm: number | null = null;
  private library: Record<CharacterActionId, CharacterActionDefinition> = CHARACTER_ACTION_LIBRARY;

  /**
   * Bind mixer to a root object and clip list from the loaded glTF.
   */
  bind(root: THREE.Object3D, clips: THREE.AnimationClip[]): void {
    this.dispose();
    this.mixer = new THREE.AnimationMixer(root);
    this.clips = clips;
  }

  getClipNames(): string[] {
    return this.clips.map((clip) => clip.name || 'unnamed');
  }

  getCurrentClipName(): string | null {
    return this.currentClipName;
  }

  getCurrentActionId(): CharacterActionId | null {
    return this.currentActionId;
  }

  getPlaybackState(): CharacterPlaybackState {
    return this.playback;
  }

  getBpm(): number | null {
    return this.bpm;
  }

  getTimeScale(): number {
    return this.mixer?.timeScale ?? 1;
  }

  /**
   * Set song BPM; updates mixer timeScale using the active action's base rate.
   */
  setBpm(bpm: number | null): void {
    this.bpm = bpm != null && Number.isFinite(bpm) && bpm > 0 ? bpm : null;
    this.applyTimeScale();
  }

  /**
   * Play a raw clip by name (escape hatch). Prefer playAction for presets.
   */
  play(clipName: string, fadeSec = 0.25): boolean {
    return this.playClip(clipName, fadeSec, null);
  }

  /**
   * Play a semantic preset action with cross-fade + BPM-aware timeScale.
   */
  playAction(actionId: CharacterActionId, fadeSec?: number): boolean {
    const def = this.library[actionId];
    if (!def) return false;

    const clipName = resolveActionClipName(actionId, this.getClipNames(), this.library);
    if (!clipName) return false;

    const ok = this.playClip(clipName, fadeSec ?? def.fadeSec, actionId);
    if (ok) this.applyTimeScale();
    return ok;
  }

  /**
   * Soft-blend an additional clip by weight without making it the primary action.
   * Reserved for upper/lower-body layering (Ticket 07 blend extension).
   */
  setBlendWeight(clipName: string, weight: number, fadeSec = 0.2): boolean {
    if (!this.mixer) return false;
    const clip = findClipByName(this.clips, clipName);
    if (!clip) return false;

    const action = this.getOrCreateAction(clip);
    const clamped = Math.min(1, Math.max(0, weight));
    if (clamped <= 0.001) {
      action.fadeOut(fadeSec);
      return true;
    }

    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.enabled = true;
    action.setEffectiveWeight(clamped);
    action.fadeIn(fadeSec).play();
    return true;
  }

  pause(): void {
    if (!this.currentAction) return;
    this.currentAction.paused = true;
    this.playback = 'paused';
  }

  resume(): void {
    if (!this.currentAction) return;
    this.currentAction.paused = false;
    this.playback = 'playing';
  }

  stop(): void {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }
    this.currentClipName = null;
    this.currentActionId = null;
    this.playback = 'stopped';
  }

  update(deltaTime: number): void {
    if (!this.mixer || this.playback === 'stopped') return;
    if (this.playback === 'paused') return;
    this.mixer.update(deltaTime);
  }

  dispose(): void {
    this.stop();
    this.mixer?.stopAllAction();
    this.mixer = null;
    this.clips = [];
    this.actions.clear();
    this.bpm = null;
  }

  private playClip(
    clipName: string,
    fadeSec: number,
    actionId: CharacterActionId | null,
  ): boolean {
    if (!this.mixer) return false;
    const clip = findClipByName(this.clips, clipName);
    if (!clip) return false;

    const next = this.getOrCreateAction(clip);
    next.reset();
    next.setEffectiveWeight(1);
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
    next.paused = false;

    if (this.currentAction && this.currentAction !== next) {
      this.currentAction.fadeOut(fadeSec);
      next.reset().fadeIn(fadeSec).play();
    } else {
      next.play();
    }

    this.currentAction = next;
    this.currentClipName = clip.name;
    this.currentActionId = actionId;
    this.playback = 'playing';
    return true;
  }

  private getOrCreateAction(clip: THREE.AnimationClip): THREE.AnimationAction {
    const key = clip.name || 'unnamed';
    let action = this.actions.get(key);
    if (!action && this.mixer) {
      action = this.mixer.clipAction(clip);
      this.actions.set(key, action);
    }
    return action!;
  }

  private applyTimeScale(): void {
    if (!this.mixer) return;
    const actionId = this.currentActionId ?? 'idle';
    const def = this.library[actionId] ?? this.library.idle;
    this.mixer.timeScale = resolveActionPlaybackTimeScale(def, this.bpm);
  }
}

// src/types/character.ts
// Interactive Character contracts — glTF load, animation, and layer state.

/**
 * Character model load lifecycle.
 */
export type CharacterLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Playback control for AnimationMixer actions.
 */
export type CharacterPlaybackState = 'playing' | 'paused' | 'stopped';

/**
 * Semantic preset actions (Ticket 07 + Ticket 09 specials).
 */
export type CharacterActionId =
  | 'idle'
  | 'dance-slow'
  | 'dance-fast'
  | 'cheer'
  | 'sad'
  | 'wave'
  | 'spin';

export const CHARACTER_ACTION_IDS: readonly CharacterActionId[] = [
  'idle',
  'dance-slow',
  'dance-fast',
  'cheer',
  'sad',
  'wave',
  'spin',
] as const;

/**
 * Result of a successful glTF character load.
 */
export interface CharacterGltfLoadResult {
  /** Root scene/group from the glTF. */
  scene: import('three').Group | import('three').Object3D;
  /** Animation clip names available on the asset. */
  clipNames: string[];
  /** Raw AnimationClips from the glTF. */
  clips: import('three').AnimationClip[];
  /** Source URL that was loaded. */
  url: string;
}

/**
 * Options when loading a character glTF.
 */
export interface CharacterLoadOptions {
  url: string;
  /** AbortSignal to cancel an in-flight load. */
  signal?: AbortSignal;
}

/**
 * Default preset character shipped with the app (Khronos Fox sample, CC0).
 */
export const DEFAULT_CHARACTER_MODEL_URL = '/assets/character/lyra-fox.glb';

/**
 * Preferred idle clip names to try on first load (order matters).
 */
export const DEFAULT_CHARACTER_IDLE_CLIP_CANDIDATES = [
  'Survey',
  'Idle',
  'idle',
  'Walk',
  'walk',
] as const;

/** BPM that maps to AnimationMixer timeScale = 1. */
export const CHARACTER_BPM_BASELINE = 120;

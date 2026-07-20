// src/stores/useCharacterStore.ts
// Interactive Character Layer UI/state (load status, clips, actions, playback).

import { create } from 'zustand';
import {
  DEFAULT_CHARACTER_MODEL_URL,
  type CharacterActionId,
  type CharacterLoadStatus,
  type CharacterPlaybackState,
} from '../types/character';

export const CHARACTER_ENABLED_STORAGE_KEY = 'lyra_character_enabled';
/** One-time demotion toward melody/rhythm focus; after this, Lab opt-in is honored. */
export const CHARACTER_DEMOTED_MIGRATION_KEY = 'lyra_character_demoted_v1';

/** Lab / command-palette opt-in; off for new users and anyone without a stored preference. */
export const DEFAULT_CHARACTER_ENABLED = false;

/**
 * Read character enabled preference.
 * Missing key → off. First launch after demotion migration forces off once,
 * then stored Lab / command-palette choice is honored.
 */
export const readCharacterEnabledPreference = (): boolean => {
  if (typeof window === 'undefined') return DEFAULT_CHARACTER_ENABLED;
  if (localStorage.getItem(CHARACTER_DEMOTED_MIGRATION_KEY) !== '1') {
    localStorage.setItem(CHARACTER_DEMOTED_MIGRATION_KEY, '1');
    localStorage.setItem(CHARACTER_ENABLED_STORAGE_KEY, '0');
    return false;
  }
  const raw = localStorage.getItem(CHARACTER_ENABLED_STORAGE_KEY);
  if (raw === null) return DEFAULT_CHARACTER_ENABLED;
  return raw === '1' || raw === 'true';
};

interface CharacterState {
  enabled: boolean;
  modelUrl: string;
  status: CharacterLoadStatus;
  error: string | null;
  clipNames: string[];
  currentClip: string | null;
  currentAction: CharacterActionId | null;
  playback: CharacterPlaybackState;
  /** Song BPM used for AnimationMixer timeScale (null = action base only). */
  bpm: number | null;

  setEnabled: (enabled: boolean) => void;
  setModelUrl: (url: string) => void;
  setStatus: (status: CharacterLoadStatus, error?: string | null) => void;
  setClips: (clipNames: string[]) => void;
  setPlayback: (
    playback: CharacterPlaybackState,
    clipName?: string | null,
    actionId?: CharacterActionId | null,
  ) => void;
  setBpm: (bpm: number | null) => void;
  setCurrentAction: (actionId: CharacterActionId | null) => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  /** Off by default; Lab / command palette can opt in. */
  enabled: readCharacterEnabledPreference(),
  modelUrl: DEFAULT_CHARACTER_MODEL_URL,
  status: 'idle',
  error: null,
  clipNames: [],
  currentClip: null,
  currentAction: null,
  playback: 'stopped',
  bpm: null,

  setEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHARACTER_ENABLED_STORAGE_KEY, enabled ? '1' : '0');
    }
    set({ enabled });
  },
  setModelUrl: (url) => set({ modelUrl: url }),
  setStatus: (status, error = null) => set({ status, error }),
  setClips: (clipNames) => set({ clipNames }),
  setPlayback: (playback, clipName, actionId) => set({
    playback,
    ...(clipName !== undefined ? { currentClip: clipName } : {}),
    ...(actionId !== undefined ? { currentAction: actionId } : {}),
  }),
  setBpm: (bpm) => set((state) => (state.bpm === bpm ? state : { bpm })),
  setCurrentAction: (actionId) => set((state) => (
    state.currentAction === actionId ? state : { currentAction: actionId }
  )),
}));

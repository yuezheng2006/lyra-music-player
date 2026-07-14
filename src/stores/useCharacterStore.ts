// src/stores/useCharacterStore.ts
// Interactive Character Layer UI/state (load status, clips, actions, playback).

import { create } from 'zustand';
import {
  DEFAULT_CHARACTER_MODEL_URL,
  type CharacterActionId,
  type CharacterLoadStatus,
  type CharacterPlaybackState,
} from '../types/character';

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
  /** On by default once GeometricLayer mounts CharacterStageOverlay. */
  enabled: true,
  modelUrl: DEFAULT_CHARACTER_MODEL_URL,
  status: 'idle',
  error: null,
  clipNames: [],
  currentClip: null,
  currentAction: null,
  playback: 'stopped',
  bpm: null,

  setEnabled: (enabled) => set({ enabled }),
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

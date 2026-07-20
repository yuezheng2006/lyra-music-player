// src/stores/useMagneticPullStore.ts
// Emotion chip motion preferences: magnetic (A), scramble (B), beat pulse (C).

import { create } from 'zustand';

export const MAGNETIC_PULL_ENABLED_STORAGE_KEY = 'lyra_magnetic_pull_enabled';
export const EMOTION_SCRAMBLE_ENABLED_STORAGE_KEY = 'lyra_emotion_scramble_enabled';
export const EMOTION_BEAT_PULSE_ENABLED_STORAGE_KEY = 'lyra_emotion_beat_pulse_enabled';

const readStoredFlag = (key: string, fallback = true): boolean => {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === '1' || raw === 'true';
};

const writeStoredFlag = (key: string, enabled: boolean) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, enabled ? '1' : '0');
};

interface MagneticPullState {
  enabled: boolean;
  scrambleEnabled: boolean;
  beatPulseEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  setScrambleEnabled: (enabled: boolean) => void;
  setBeatPulseEnabled: (enabled: boolean) => void;
}

export const useMagneticPullStore = create<MagneticPullState>((set) => ({
  enabled: readStoredFlag(MAGNETIC_PULL_ENABLED_STORAGE_KEY, true),
  scrambleEnabled: readStoredFlag(EMOTION_SCRAMBLE_ENABLED_STORAGE_KEY, true),
  beatPulseEnabled: readStoredFlag(EMOTION_BEAT_PULSE_ENABLED_STORAGE_KEY, true),

  setEnabled: (enabled) => {
    writeStoredFlag(MAGNETIC_PULL_ENABLED_STORAGE_KEY, enabled);
    set({ enabled });
  },
  setScrambleEnabled: (enabled) => {
    writeStoredFlag(EMOTION_SCRAMBLE_ENABLED_STORAGE_KEY, enabled);
    set({ scrambleEnabled: enabled });
  },
  setBeatPulseEnabled: (enabled) => {
    writeStoredFlag(EMOTION_BEAT_PULSE_ENABLED_STORAGE_KEY, enabled);
    set({ beatPulseEnabled: enabled });
  },
}));

import { create } from 'zustand';
import type { BeatMap } from '../types/atmosphere';

// src/stores/useAtmosphereBeatMapStore.ts
// Shares the latest atmosphere BeatMap with character / ambient consumers (no prop drilling).

interface AtmosphereBeatMapState {
  beatMap: BeatMap | null;
  setBeatMap: (beatMap: BeatMap | null) => void;
}

export const useAtmosphereBeatMapStore = create<AtmosphereBeatMapState>((set, get) => ({
  beatMap: null,
  setBeatMap: (beatMap) => {
    if (get().beatMap === beatMap) return;
    set({ beatMap });
  },
}));

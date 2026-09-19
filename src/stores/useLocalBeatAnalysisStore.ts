import { create } from 'zustand';
import type { BeatMap } from '../types/atmosphere';
import type { LocalBeatAnalysisMode } from '../utils/atmosphere/localBeatMapCache';

// src/stores/useLocalBeatAnalysisStore.ts
// Local cinema/pulse beat-analysis modal state + handoff into the atmosphere engine.

export type LocalBeatPrompt = {
    persistKey: string;
    songKey: string;
    audioSrc: string;
    trackTitle: string;
};

type LocalBeatHandoff = {
    songKey: string;
    beatMap: BeatMap;
    mode: LocalBeatAnalysisMode;
};

interface LocalBeatAnalysisState {
    isOpen: boolean;
    prompt: LocalBeatPrompt | null;
    mode: LocalBeatAnalysisMode;
    analyzing: boolean;
    status: string;
    statusTone: 'info' | 'warn' | 'fail' | '';
    /** Session skips: do not re-prompt for this persistKey until restart. */
    skippedKeys: Record<string, true>;
    handoff: LocalBeatHandoff | null;
    openPrompt: (prompt: LocalBeatPrompt, preferredMode?: LocalBeatAnalysisMode) => void;
    closeModal: () => void;
    setMode: (mode: LocalBeatAnalysisMode) => void;
    setAnalyzing: (analyzing: boolean) => void;
    setStatus: (status: string, tone?: LocalBeatAnalysisState['statusTone']) => void;
    skipPrompt: (persistKey: string) => void;
    isSkipped: (persistKey: string) => boolean;
    publishHandoff: (handoff: LocalBeatHandoff) => void;
    takeHandoff: (songKey: string) => LocalBeatHandoff | null;
}

export const useLocalBeatAnalysisStore = create<LocalBeatAnalysisState>((set, get) => ({
    isOpen: false,
    prompt: null,
    mode: 'mr',
    analyzing: false,
    status: '',
    statusTone: '',
    skippedKeys: {},
    handoff: null,
    openPrompt: (prompt, preferredMode = 'mr') => {
        if (get().analyzing) return;
        set({
            isOpen: true,
            prompt,
            mode: preferredMode === 'dj' ? 'dj' : 'mr',
            status: '',
            statusTone: '',
        });
    },
    closeModal: () => {
        if (get().analyzing) return;
        set({ isOpen: false });
    },
    setMode: (mode) => {
        if (get().analyzing) return;
        set({ mode: mode === 'dj' ? 'dj' : 'mr' });
    },
    setAnalyzing: (analyzing) => set({ analyzing }),
    setStatus: (status, tone = 'info') => set({ status, statusTone: tone }),
    skipPrompt: (persistKey) => {
        set((state) => ({
            isOpen: false,
            skippedKeys: { ...state.skippedKeys, [persistKey]: true },
        }));
    },
    isSkipped: (persistKey) => Boolean(get().skippedKeys[persistKey]),
    publishHandoff: (handoff) => set({ handoff }),
    takeHandoff: (songKey) => {
        const current = get().handoff;
        if (!current || current.songKey !== songKey) return null;
        set({ handoff: null });
        return current;
    },
}));

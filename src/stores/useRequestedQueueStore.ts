import { create } from 'zustand';
import type { SongResult } from '../types';
import { applyQueueAddBehavior } from '../utils/queueAddBehavior';
import type { QueueAddBehavior } from '../types';

// src/stores/useRequestedQueueStore.ts
// 已点列表：与 playQueue 分离。用户「加入队列」写入；为空时可由当前歌单自动补种。

const STORAGE_KEY = 'requested_queue_v1';

const readStoredQueue = (): SongResult[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? parsed.filter(song => song && typeof song.id === 'number') as SongResult[] : [];
    } catch {
        return [];
    }
};

const persistQueue = (songs: SongResult[]) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    } catch {
        // Ignore quota / private-mode failures.
    }
};

export type RequestedQueueAutoSeedNotice = {
    count: number;
    at: number;
};

type RequestedQueueState = {
    songs: SongResult[];
    /** Set when empty 已点 was auto-filled from the current playlist — drives toast / dock cue. */
    autoSeedNotice: RequestedQueueAutoSeedNotice | null;
    addSongs: (
        songs: SongResult[],
        options?: { currentSong?: SongResult | null; behavior?: QueueAddBehavior },
    ) => { changed: boolean; nextQueue: SongResult[] };
    markAutoSeeded: (count: number) => void;
    clearAutoSeedNotice: () => void;
    removeSong: (songId: number) => void;
    clear: () => void;
    hydrate: () => void;
};

export const useRequestedQueueStore = create<RequestedQueueState>((set, get) => ({
    songs: readStoredQueue(),
    autoSeedNotice: null,
    hydrate: () => {
        set({ songs: readStoredQueue() });
    },
    addSongs: (songs, options = {}) => {
        if (songs.length === 0) {
            return { changed: false, nextQueue: get().songs };
        }

        const { nextQueue, changed } = applyQueueAddBehavior({
            queue: get().songs,
            songs,
            currentSong: options.currentSong ?? null,
            behavior: options.behavior ?? 'append',
        });

        if (changed) {
            persistQueue(nextQueue);
            set({ songs: nextQueue });
        }

        return { changed, nextQueue };
    },
    markAutoSeeded: (count) => {
        if (count <= 0) return;
        set({ autoSeedNotice: { count, at: Date.now() } });
    },
    clearAutoSeedNotice: () => {
        if (!get().autoSeedNotice) return;
        set({ autoSeedNotice: null });
    },
    removeSong: (songId) => {
        const nextQueue = get().songs.filter(song => song.id !== songId);
        if (nextQueue.length === get().songs.length) return;
        persistQueue(nextQueue);
        set({ songs: nextQueue });
    },
    clear: () => {
        persistQueue([]);
        set({ songs: [], autoSeedNotice: null });
    },
}));

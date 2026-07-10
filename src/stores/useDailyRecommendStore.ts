import { create } from 'zustand';
import type { SongResult } from '../types';
import {
    fetchAggregatedDailyRecommend,
    type DailyRecommendSourceBucket,
} from '../services/dailyRecommendService';
import {
    ONLINE_LIBRARY_PROVIDER_IDS,
    useOnlineLibraryFilterStore,
    type OnlineLibraryProviderId,
} from './useOnlineLibraryFilterStore';

// src/stores/useDailyRecommendStore.ts
// App-level cache + preload for multi-source daily recommend.

const CACHE_TTL_MS = 30 * 60 * 1000;
/** Bump when pick strategy changes so stale keyword-search caches are dropped. */
const CACHE_EPOCH = 'netease-only-v1';

export const serializeDailyRecommendProviderKey = (
    playlistProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
): string =>
    `${CACHE_EPOCH}|${ONLINE_LIBRARY_PROVIDER_IDS
        .map(id => `${id}:${playlistProviders[id] !== false ? 1 : 0}`)
        .join(',')}`;

type DailyRecommendState = {
    providerKey: string;
    sources: DailyRecommendSourceBucket[];
    songs: SongResult[];
    loading: boolean;
    settled: boolean;
    error: string | null;
    fetchedAt: number;
    /** In-flight ensure so concurrent callers share one request. */
    inflight: Promise<void> | null;
    ensureLoaded: (options?: { force?: boolean }) => Promise<void>;
    preload: () => void;
};

export const useDailyRecommendStore = create<DailyRecommendState>((set, get) => ({
    providerKey: '',
    sources: [],
    songs: [],
    loading: false,
    settled: false,
    error: null,
    fetchedAt: 0,
    inflight: null,

    ensureLoaded: async (options = {}) => {
        const playlistProviders = useOnlineLibraryFilterStore.getState().playlistProviders;
        const providerKey = serializeDailyRecommendProviderKey(playlistProviders);
        const state = get();
        const cacheFresh = (
            !options.force
            && state.providerKey === providerKey
            && state.fetchedAt > 0
            && (Date.now() - state.fetchedAt) < CACHE_TTL_MS
            && (state.settled || state.songs.length > 0)
        );

        if (cacheFresh && !state.inflight) {
            return;
        }

        if (state.inflight && state.providerKey === providerKey && !options.force) {
            await state.inflight;
            return;
        }

        const run = (async () => {
            set({
                providerKey,
                loading: true,
                settled: false,
                error: null,
                // Keep previous songs visible while refreshing same key; clear on key change.
                ...(state.providerKey === providerKey
                    ? {}
                    : { sources: [], songs: [] }),
            });

            try {
                const result = await fetchAggregatedDailyRecommend(playlistProviders, {
                    timeoutMs: 5_000,
                    onSource: (_bucket, partial) => {
                        // Ignore stale progressive updates from an older provider key.
                        if (get().providerKey !== providerKey) return;
                        set({
                            sources: [...partial.sources],
                            songs: partial.songs,
                            loading: partial.songs.length === 0,
                        });
                    },
                });

                if (get().providerKey !== providerKey) return;

                const firstError = result.songs.length === 0
                    ? (result.sources.find(s => s.error && s.error !== 'need-login')?.error || null)
                    : null;

                set({
                    sources: result.sources,
                    songs: result.songs,
                    error: firstError,
                    loading: false,
                    settled: true,
                    fetchedAt: Date.now(),
                });
            } catch (error) {
                if (get().providerKey !== providerKey) return;
                set({
                    sources: [],
                    songs: [],
                    error: error instanceof Error ? error.message : String(error),
                    loading: false,
                    settled: true,
                    fetchedAt: Date.now(),
                });
            } finally {
                if (get().providerKey === providerKey) {
                    set({ inflight: null, loading: false, settled: true });
                }
            }
        })();

        set({ inflight: run });
        await run;
    },

    preload: () => {
        const { ensureLoaded } = get();
        // Fire-and-forget; errors are stored on the slice.
        void ensureLoaded();
    },
}));

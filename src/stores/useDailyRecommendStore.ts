import { create } from 'zustand';
import type { SongResult } from '../types';
import {
    fetchAggregatedDailyRecommend,
    type DailyRecommendSourceBucket,
} from '../services/dailyRecommendService';
import { isStableRequestError, type RequestErrorCode } from '../utils/network';
import {
    ONLINE_LIBRARY_PROVIDER_IDS,
    useOnlineLibraryFilterStore,
    type OnlineLibraryProviderId,
} from './useOnlineLibraryFilterStore';

// src/stores/useDailyRecommendStore.ts
// App-level cache + preload for Today Picks (multi-source chart matches).

const CACHE_TTL_MS = 30 * 60 * 1000;
/** Bump when pick strategy changes so stale empty/filter caches are dropped. */
const CACHE_EPOCH = 'today-picks-v1';

export const serializeDailyRecommendProviderKey = (
    playlistProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
): string => {
    const peers = ONLINE_LIBRARY_PROVIDER_IDS
        .filter((id) => id !== 'netease' && playlistProviders[id] !== false)
        .join(',');
    return `${CACHE_EPOCH}|peers:${peers || 'none'}`;
};

const pickFailureBucket = (
    sources: DailyRecommendSourceBucket[],
): DailyRecommendSourceBucket | null => (
    sources.find(source => (
        source.songs.length === 0
        && source.error
        && source.error !== 'need-login'
        && source.errorCode !== 'empty'
    )) || null
);

/** Always leave a copyable breadcrumb when the daily page settles empty. */
const summarizeEmptyDiagnostic = (
    sources: DailyRecommendSourceBucket[],
    failure: DailyRecommendSourceBucket | null,
): string => {
    if (failure?.diagnostic) return failure.diagnostic;
    if (sources.length === 0) {
        return 'today-picks: no peer sources enabled';
    }
    const lines = sources.map(source => (
        `source=${source.provider}`
        + ` songs=${source.songs.length}`
        + ` kind=${source.kind}`
        + ` error=${source.error || '-'}`
        + ` code=${source.errorCode || '-'}`
    ));
    if (failure?.error) lines.unshift(`failure=${failure.error}`);
    return lines.join('\n');
};

type DailyRecommendState = {
    providerKey: string;
    sources: DailyRecommendSourceBucket[];
    songs: SongResult[];
    loading: boolean;
    settled: boolean;
    error: string | null;
    errorCode: RequestErrorCode | 'need-login' | 'empty' | null;
    diagnostic: string | null;
    needsAuth: boolean;
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
    errorCode: null,
    diagnostic: null,
    needsAuth: false,
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
            && state.songs.length > 0
            // Empty (or failed-empty) caches are never "fresh" — always allow recovery.
            && !state.error
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
                errorCode: null,
                diagnostic: null,
                needsAuth: false,
                // Keep previous songs visible while refreshing same key; clear on key change.
                ...(state.providerKey === providerKey
                    ? {}
                    : { sources: [], songs: [] }),
            });

            try {
                const result = await fetchAggregatedDailyRecommend(playlistProviders, {
                    timeoutMs: 12_000,
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

                const failure = result.songs.length === 0
                    ? pickFailureBucket(result.sources)
                    : null;
                const diagnostic = result.songs.length === 0
                    ? summarizeEmptyDiagnostic(result.sources, failure)
                    : null;

                set({
                    sources: result.sources,
                    songs: result.songs,
                    error: failure?.error || null,
                    errorCode: failure?.errorCode || (result.songs.length === 0 && result.sources.length === 0
                        ? 'empty'
                        : null),
                    diagnostic,
                    needsAuth: false,
                    loading: false,
                    settled: true,
                    fetchedAt: Date.now(),
                });
            } catch (error) {
                if (get().providerKey !== providerKey) return;
                if (isStableRequestError(error)) {
                    set({
                        sources: [],
                        songs: [],
                        error: error.message,
                        errorCode: error.code,
                        diagnostic: error.toDiagnosticSummary(),
                        needsAuth: false,
                        loading: false,
                        settled: true,
                        fetchedAt: Date.now(),
                    });
                    return;
                }
                set({
                    sources: [],
                    songs: [],
                    error: error instanceof Error ? error.message : String(error),
                    errorCode: 'unknown',
                    diagnostic: error instanceof Error ? error.message : String(error),
                    needsAuth: false,
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

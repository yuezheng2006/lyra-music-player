import type { SongResult } from '../types';
import type { OnlineMusicProviderId } from '../types';
import { getMusicProvider } from './musicProviders/registry';
import { pickDailyRecommendQuery } from '../utils/dailyRecommendQueries';
import { keepListeningDeskFullTracks } from '../utils/home/listeningDeskMath';
import { serializeDailyRecommendProviderKey } from '../stores/useDailyRecommendStore';
import {
    interleaveDailyRecommendSongs,
    listTodayPicksProviders,
    type DailyRecommendSourceBucket,
} from './dailyRecommendService';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';

// src/services/listeningDeskFallback.ts
// Seed the desk with keyword search per peer. Fast sources paint first; coco follows.

const FALLBACK_CACHE_VERSION = 'full-track-v1';
const FALLBACK_LIMIT = 12;
const FALLBACK_TIMEOUT_MS = 6_500;
const FALLBACK_TTL_MS = 10 * 60 * 1000;
const FAST_DESK_PROVIDERS: readonly OnlineMusicProviderId[] = ['qishui', 'kugou', 'kuwo'];

type FallbackCache = {
    key: string;
    songs: SongResult[];
    at: number;
};

let fallbackCache: FallbackCache | null = null;

export type ListeningDeskFallbackOptions = {
    signal?: AbortSignal;
    onPartial?: (songs: SongResult[]) => void;
};

const emptyBucket = (
    provider: DailyRecommendSourceBucket['provider'],
    query: string,
): DailyRecommendSourceBucket => ({
    provider,
    songs: [],
    kind: 'picks',
    query,
});

export const orderListeningDeskFallbackProviders = (
    providers: readonly OnlineMusicProviderId[],
): OnlineMusicProviderId[] => {
    const remaining = new Set(providers);
    const ordered: OnlineMusicProviderId[] = [];
    for (const id of FAST_DESK_PROVIDERS) {
        if (!remaining.has(id)) continue;
        ordered.push(id);
        remaining.delete(id);
    }
    for (const id of providers) {
        if (!remaining.has(id)) continue;
        ordered.push(id);
        remaining.delete(id);
    }
    return ordered;
};

const searchOneProvider = async (
    provider: DailyRecommendSourceBucket['provider'],
): Promise<DailyRecommendSourceBucket> => {
    const query = pickDailyRecommendQuery(provider);
    const signal = AbortSignal.timeout(FALLBACK_TIMEOUT_MS);
    try {
        const result = await getMusicProvider(provider).search(query, {
            limit: FALLBACK_LIMIT,
            offset: 0,
            signal,
        });
        return {
            provider,
            songs: keepListeningDeskFullTracks(Array.isArray(result.songs) ? result.songs : []),
            kind: 'picks',
            query,
        };
    } catch {
        return emptyBucket(provider, query);
    }
};

export const fetchListeningDeskFallback = async (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
    options: ListeningDeskFallbackOptions = {},
): Promise<SongResult[]> => {
    const key = `${FALLBACK_CACHE_VERSION}:${serializeDailyRecommendProviderKey(enabledProviders)}`;
    const cached = fallbackCache;
    if (
        cached
        && cached.key === key
        && Date.now() - cached.at < FALLBACK_TTL_MS
        && cached.songs.length > 0
    ) {
        options.onPartial?.(cached.songs);
        return cached.songs;
    }

    const providers = orderListeningDeskFallbackProviders(
        listTodayPicksProviders(enabledProviders),
    );
    if (providers.length === 0) return [];

    const buckets: DailyRecommendSourceBucket[] = providers.map(provider => (
        emptyBucket(provider, pickDailyRecommendQuery(provider))
    ));

    const publish = () => {
        if (options.signal?.aborted) return;
        options.onPartial?.(interleaveDailyRecommendSongs(buckets));
    };

    const runWave = async (wave: OnlineMusicProviderId[]) => {
        await Promise.all(wave.map(async (provider) => {
            const index = providers.indexOf(provider);
            buckets[index] = await searchOneProvider(provider);
            publish();
        }));
    };

    const fast = providers.filter(id => FAST_DESK_PROVIDERS.includes(id));
    const slow = providers.filter(id => !FAST_DESK_PROVIDERS.includes(id));
    await runWave(fast);
    await runWave(slow);

    const songs = interleaveDailyRecommendSongs(buckets).slice(0, 18);
    if (songs.length > 0) {
        fallbackCache = { key, songs, at: Date.now() };
    }
    if (options.signal?.aborted) return songs;
    return songs;
};

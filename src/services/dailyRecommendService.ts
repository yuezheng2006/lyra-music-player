import type { OnlineMusicProviderId, SongResult } from '../types';
import {
    ONLINE_LIBRARY_PROVIDER_IDS,
    type OnlineLibraryProviderId,
} from '../stores/useOnlineLibraryFilterStore';
import type { RequestErrorCode } from '../utils/network';
import { isSongMarkedUnavailable } from './netease';
import {
    dedupeSongsByTitle,
    fetchChartMatchedPicks,
    fetchHotChartSeeds,
    recommendTitleKey,
    type ChartSeed,
} from './dailyChartPicks';

// src/services/dailyRecommendService.ts
// Today Picks: hot-chart seeds matched on enabled peer providers (no NetEase personalized daily).

export type DailyRecommendKind = 'personalized' | 'picks';

export type DailyRecommendSourceBucket = {
    provider: OnlineMusicProviderId;
    songs: SongResult[];
    kind: DailyRecommendKind;
    query?: string;
    error?: string;
    errorCode?: RequestErrorCode | 'need-login' | 'empty';
    diagnostic?: string;
};

export type AggregatedDailyRecommend = {
    sources: DailyRecommendSourceBucket[];
    songs: SongResult[];
    /** Always false — Today Picks does not use NetEase personalized daily. */
    needLoginNetease: boolean;
};

export type FetchAggregatedDailyRecommendOptions = {
    /** Per-source hard timeout so one hung peer cannot block the whole page. */
    timeoutMs?: number;
    /** Called whenever a source finishes so UI can paint progressively. */
    onSource?: (
        bucket: DailyRecommendSourceBucket,
        partial: AggregatedDailyRecommend,
    ) => void;
};

const DEFAULT_SOURCE_TIMEOUT_MS = 8_000;
const PEER_PICK_LIMIT = 8;
const QQ_PICK_LIMIT = 12;

const songKey = (song: SongResult) =>
    `${song.musicProvider || 'unknown'}:${song.providerSongId || song.id}:${song.name}`;

/** Enabled non-NetEase library providers in stable UI order. */
export const listTodayPicksProviders = (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
): OnlineMusicProviderId[] => (
    ONLINE_LIBRARY_PROVIDER_IDS.filter(
        (id) => id !== 'netease' && enabledProviders[id] !== false,
    ) as OnlineMusicProviderId[]
);

/**
 * Round-robin merge across providers.
 * Also soft-dedupes by normalized title so "全部" does not repeat the same hit.
 */
export const interleaveDailyRecommendSongs = (
    buckets: DailyRecommendSourceBucket[],
): SongResult[] => {
    const queues = buckets
        .map(bucket => [...dedupeSongsByTitle(bucket.songs)])
        .filter(list => list.length > 0);
    const merged: SongResult[] = [];
    const seenExact = new Set<string>();
    const seenTitle = new Set<string>();

    while (queues.some(list => list.length > 0)) {
        for (const list of queues) {
            const next = list.shift();
            if (!next) continue;
            if (isSongMarkedUnavailable(next)) continue;
            const exact = songKey(next);
            const title = recommendTitleKey(next);
            if (seenExact.has(exact)) continue;
            if (title && seenTitle.has(title)) continue;
            seenExact.add(exact);
            if (title) seenTitle.add(title);
            merged.push(next);
        }
    }
    return merged;
};

const withTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number,
    onTimeout: () => T,
): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(onTimeout()), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

/** Chart-matched picks for one peer provider. */
const fetchSidecarBucket = async (
    provider: OnlineMusicProviderId,
    limit: number,
    seeds: ChartSeed[],
): Promise<DailyRecommendSourceBucket> => {
    try {
        const songs = await fetchChartMatchedPicks(provider, seeds, limit);
        const playable = songs.filter(song => !isSongMarkedUnavailable(song));
        return {
            provider,
            songs: playable,
            kind: 'picks',
            query: 'hot-chart',
            error: playable.length === 0 ? 'empty' : undefined,
            errorCode: playable.length === 0 ? 'empty' : undefined,
        };
    } catch (error) {
        return {
            provider,
            songs: [],
            kind: 'picks',
            query: 'hot-chart',
            error: error instanceof Error ? error.message : String(error),
            errorCode: 'unknown',
        };
    }
};

const buildAggregate = (
    sources: DailyRecommendSourceBucket[],
): AggregatedDailyRecommend => ({
    sources,
    songs: interleaveDailyRecommendSongs(sources),
    needLoginNetease: false,
});

/**
 * Fetch Today Picks from enabled peer providers (hot-chart matched).
 * NetEase personalized daily is intentionally not used.
 * Each source is independently timed out so a hung peer cannot block the page.
 */
export const fetchAggregatedDailyRecommend = async (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
    options: FetchAggregatedDailyRecommendOptions = {},
): Promise<AggregatedDailyRecommend> => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS;
    const sidecarTargets = listTodayPicksProviders(enabledProviders);

    if (sidecarTargets.length === 0) {
        return {
            sources: [],
            songs: [],
            needLoginNetease: false,
        };
    }

    const sources: DailyRecommendSourceBucket[] = [];

    const publish = (bucket: DailyRecommendSourceBucket) => {
        const index = sources.findIndex(item => item.provider === bucket.provider);
        if (index >= 0) {
            sources[index] = bucket;
        } else {
            sources.push(bucket);
        }
        options.onSource?.(bucket, buildAggregate(sources));
    };

    const seedLimit = Math.max(QQ_PICK_LIMIT, PEER_PICK_LIMIT) + 6;
    const seedsPromise = fetchHotChartSeeds(seedLimit);

    const tasks = sidecarTargets.map((provider) => {
        const limit = provider === 'qq' ? QQ_PICK_LIMIT : PEER_PICK_LIMIT;
        return withTimeout(
            seedsPromise.then(seeds => fetchSidecarBucket(provider, limit, seeds)),
            timeoutMs,
            (): DailyRecommendSourceBucket => ({
                provider,
                songs: [],
                kind: 'picks',
                query: 'hot-chart',
                error: 'timeout',
                errorCode: 'timeout',
                diagnostic: `source=${provider} code=timeout endpoint=chart-match`,
            }),
        ).then(publish);
    });

    await Promise.all(tasks);
    return buildAggregate(sources);
};

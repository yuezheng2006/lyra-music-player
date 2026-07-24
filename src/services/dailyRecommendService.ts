import type { OnlineMusicProviderId, SongResult } from '../types';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';
import { isStableRequestError, type RequestErrorCode } from '../utils/network';
import { fetchDailyRecommendSongs } from './neteasePodcast';
import { requestSidecarRecommend } from './musicProviders/sidecarProviderClient';
import {
    dedupeSongsByTitle,
    fetchChartMatchedPicks,
    fetchHotChartSeeds,
    recommendTitleKey,
    type ChartSeed,
} from './dailyChartPicks';

// src/services/dailyRecommendService.ts
// Daily recommend: Netease personalized only (peer QQ/Coco CDN playback is too unstable).

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

/** Empty: QQ open CDN 404 loops; keep daily page on Netease only. */
const SIDECAR_RECOMMEND_PROVIDERS: OnlineMusicProviderId[] = [];
const DEFAULT_SOURCE_TIMEOUT_MS = 8_000;
const PEER_PICK_LIMIT = 8;
const QQ_PICK_LIMIT = 12;

const songKey = (song: SongResult) =>
    `${song.musicProvider || 'unknown'}:${song.providerSongId || song.id}:${song.name}`;

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

/** QQ personalized daily when logged in; otherwise chart-matched picks. */
const fetchSidecarBucket = async (
    provider: OnlineMusicProviderId,
    limit: number,
    seeds: ChartSeed[],
): Promise<DailyRecommendSourceBucket> => {
    if (provider === 'qq') {
        try {
            const result = await requestSidecarRecommend(provider, { limit });
            if (result.kind === 'personalized' && result.songs.length > 0) {
                return {
                    provider,
                    songs: dedupeSongsByTitle(result.songs),
                    kind: 'personalized',
                    query: result.query,
                };
            }
        } catch {
            // Fall through to chart matching.
        }
    }

    try {
        const songs = await fetchChartMatchedPicks(provider, seeds, limit);
        return {
            provider,
            songs,
            kind: 'picks',
            query: 'hot-chart',
            error: songs.length === 0 ? 'empty' : undefined,
        };
    } catch (error) {
        return {
            provider,
            songs: [],
            kind: 'picks',
            query: 'hot-chart',
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

const fetchNeteaseBucket = async (): Promise<DailyRecommendSourceBucket> => {
    try {
        const neteaseResult = await fetchDailyRecommendSongs();
        if (neteaseResult.needLogin) {
            return {
                provider: 'netease',
                songs: [],
                kind: 'personalized',
                error: 'need-login',
                errorCode: 'need-login',
            };
        }
        return {
            provider: 'netease',
            songs: dedupeSongsByTitle(neteaseResult.songs),
            kind: 'personalized',
            error: neteaseResult.songs.length === 0 ? (neteaseResult.message || undefined) : undefined,
            errorCode: neteaseResult.songs.length === 0 ? 'empty' : undefined,
        };
    } catch (error) {
        if (isStableRequestError(error)) {
            return {
                provider: 'netease',
                songs: [],
                kind: 'personalized',
                error: error.message,
                errorCode: error.code,
                diagnostic: error.toDiagnosticSummary(),
            };
        }
        return {
            provider: 'netease',
            songs: [],
            kind: 'personalized',
            error: error instanceof Error ? error.message : String(error),
            errorCode: 'unknown',
            diagnostic: error instanceof Error ? error.message : String(error),
        };
    }
};

const buildAggregate = (
    sources: DailyRecommendSourceBucket[],
    wantNetease: boolean,
): AggregatedDailyRecommend => {
    const netease = sources.find(s => s.provider === 'netease');
    return {
        sources,
        songs: interleaveDailyRecommendSongs(sources),
        needLoginNetease: Boolean(
            wantNetease
            && netease?.error === 'need-login'
            && (netease.songs.length === 0),
        ),
    };
};

/**
 * Fetch personalized daily (Netease) + optional peer picks.
 * Netease is always requested: daily recommend is a Netease surface and must not
 * go blank when the home library filter disables the Netease playlist chip.
 * Each source is independently timed out so a hung peer cannot block the page.
 */
export const fetchAggregatedDailyRecommend = async (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
    options: FetchAggregatedDailyRecommendOptions = {},
): Promise<AggregatedDailyRecommend> => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS;
    // Home source toggles filter playlists/search — not this page's only source.
    const wantNetease = true;
    const sidecarTargets = SIDECAR_RECOMMEND_PROVIDERS.filter(
        id => enabledProviders[id as OnlineLibraryProviderId] !== false,
    );

    const sources: DailyRecommendSourceBucket[] = [];

    const publish = (bucket: DailyRecommendSourceBucket) => {
        const index = sources.findIndex(item => item.provider === bucket.provider);
        if (index >= 0) {
            sources[index] = bucket;
        } else {
            sources.push(bucket);
        }
        options.onSource?.(bucket, buildAggregate(sources, wantNetease));
    };

    const seedLimit = Math.max(QQ_PICK_LIMIT, PEER_PICK_LIMIT) + 6;
    const seedsPromise = sidecarTargets.length > 0
        ? fetchHotChartSeeds(seedLimit)
        : Promise.resolve([] as ChartSeed[]);

    const tasks: Array<Promise<void>> = [];

    if (wantNetease) {
        tasks.push(
            withTimeout(
                fetchNeteaseBucket(),
                timeoutMs,
                (): DailyRecommendSourceBucket => ({
                    provider: 'netease',
                    songs: [],
                    kind: 'personalized',
                    error: 'timeout',
                    errorCode: 'timeout',
                    diagnostic: 'source=netease code=timeout endpoint=/recommend/songs',
                }),
            ).then(publish),
        );
    }

    for (const provider of sidecarTargets) {
        const limit = provider === 'qq' ? QQ_PICK_LIMIT : PEER_PICK_LIMIT;
        tasks.push(
            withTimeout(
                seedsPromise.then(seeds => fetchSidecarBucket(provider, limit, seeds)),
                timeoutMs,
                (): DailyRecommendSourceBucket => ({
                    provider,
                    songs: [],
                    kind: 'picks',
                    query: 'hot-chart',
                    error: 'timeout',
                    errorCode: 'timeout',
                    diagnostic: `source=${provider} code=timeout endpoint=/providers/${provider}/recommend`,
                }),
            ).then(publish),
        );
    }

    await Promise.all(tasks);
    return buildAggregate(sources, wantNetease);
};

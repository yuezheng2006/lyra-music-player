/**
 * Song Prefetch Service
 *
 * Prefetches nearby queue audio URLs so next/prev can start without waiting
 * on song-url network latency. Audio is committed as soon as it is ready;
 * lyrics continue in the background and never block the next track's audio.
 */

import { SongResult, LyricData, OnlineLyricsState } from '../types';
import { getOnlineSongCacheKey, isCloudSong, neteaseApi } from './netease';
import { getFromCacheWithMigration } from './db';
import { hasCachedAudio } from './audioCache';
import { getMusicProviderForSong, getProviderSongCacheKey, isNeteaseOnlineSong } from './musicProviders/registry';
import { migrateLyricDataRenderHints } from '../utils/lyrics/renderHints';
import { processNeteaseLyrics } from '../utils/lyrics/neteaseProcessing';
import { detectTimedLyricFormat } from '../utils/lyrics/formatDetection';
import { parseLyricsAsync } from '../utils/lyrics/workerClient';
import { isPureMusicLyricText } from '../utils/lyrics/pureMusic';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import { autoMatchBestLyric } from '../utils/lyrics/autoMatchBestLyric';
import { loadOnlineLyricsState, resolveOnlineLyrics, saveOnlineLyricsState } from '../utils/onlineLyricsState';
import { isLocalPlaybackSong, isNavidromePlaybackSong, isYtmPlaybackSong } from '../utils/appPlaybackGuards';

// Prefetch configuration
const PREFETCH_COUNT_NEXT = 2;
const PREFETCH_COUNT_PREV = 1;
const URL_TTL_MS = 1200 * 1000;
const MAX_PREFETCH_CACHE_SIZE = 200;
const BACKGROUND_PREFETCH_GAP_MS = 50;

export interface PrefetchedSongData {
    songKey: string;
    songId: number;
    audioUrl: string | null;
    audioUrlFetchedAt: number;
    audioUrlQuality: string | null;
    lyrics: LyricData | null;
    lyricRaw: {
        mainLrc: string | null;
        yrcLrc: string | null;
        transLrc: string | null;
        isPureMusic: boolean;
    } | null;
    coverUrl: string | null;
}

const prefetchCache = new Map<string, PrefetchedSongData>();

const getPrefetchSongKey = (song: Pick<SongResult, 'id' | 't' | 'musicProvider'>): string =>
    getProviderSongCacheKey('audio', song);

const touchPrefetchCacheEntry = (songKey: string, data: PrefetchedSongData): PrefetchedSongData => {
    prefetchCache.delete(songKey);
    prefetchCache.set(songKey, data);
    return data;
};

const extractCloudLyricText = (response: any): string => {
    if (typeof response?.lrc === 'string') return response.lrc;
    if (typeof response?.data?.lrc === 'string') return response.data.lrc;
    if (typeof response?.lyric === 'string') return response.lyric;
    if (typeof response?.data?.lyric === 'string') return response.data.lyric;
    return '';
};

let currentPrefetchAbortController: AbortController | null = null;

export const isUrlValid = (fetchedAt: number): boolean => {
    return Date.now() - fetchedAt < URL_TTL_MS;
};

const hasValidPrefetchedAudio = (
    data: PrefetchedSongData | null | undefined,
    requiredQuality?: string,
): boolean => {
    if (!data?.audioUrl || !isUrlValid(data.audioUrlFetchedAt)) {
        return false;
    }
    if (data.audioUrl === 'CACHED_IN_DB') {
        return true;
    }
    if (requiredQuality && data.audioUrlQuality && data.audioUrlQuality !== requiredQuality) {
        return false;
    }
    return true;
};

const commitPrefetchEntry = (data: PrefetchedSongData): PrefetchedSongData => {
    while (prefetchCache.size >= MAX_PREFETCH_CACHE_SIZE && !prefetchCache.has(data.songKey)) {
        const oldestKey = prefetchCache.keys().next().value;
        if (oldestKey === undefined) {
            break;
        }
        prefetchCache.delete(oldestKey);
    }
    return touchPrefetchCacheEntry(data.songKey, data);
};

const seedCoverUrl = (song: SongResult, existing: string | null): string | null => {
    if (existing) {
        return existing;
    }
    const coverUrl = song.al?.picUrl || song.album?.picUrl;
    if (!coverUrl) {
        return null;
    }
    return coverUrl.startsWith('http:') ? coverUrl.replace('http:', 'https:') : coverUrl;
};

const createPrefetchDraft = (
    song: SongResult,
    audioQuality: string,
    existing: PrefetchedSongData | undefined,
): PrefetchedSongData => ({
    songKey: getPrefetchSongKey(song),
    songId: song.id,
    audioUrl: hasValidPrefetchedAudio(existing, audioQuality) ? existing!.audioUrl : null,
    audioUrlFetchedAt: hasValidPrefetchedAudio(existing, audioQuality) ? existing!.audioUrlFetchedAt : 0,
    audioUrlQuality: hasValidPrefetchedAudio(existing, audioQuality) ? existing!.audioUrlQuality : null,
    lyrics: existing?.lyrics || null,
    lyricRaw: existing?.lyricRaw || null,
    coverUrl: seedCoverUrl(song, existing?.coverUrl || null),
});

/**
 * Get prefetched data for a song.
 */
export const getPrefetchedData = (song: SongResult, requiredQuality?: string): PrefetchedSongData | null => {
    const songKey = getPrefetchSongKey(song);
    const songId = song.id;
    const cached = prefetchCache.get(songKey);
    if (!cached) return null;

    if (cached.audioUrl && !isUrlValid(cached.audioUrlFetchedAt)) {
        console.log(`[Prefetch] URL expired for song ${songId}, will refetch`);
        cached.audioUrl = null;
        cached.audioUrlQuality = null;
    }

    if (cached.audioUrl && cached.audioUrl !== 'CACHED_IN_DB' && requiredQuality && cached.audioUrlQuality !== requiredQuality) {
        console.log(`[Prefetch] Quality mismatch for song ${songId}: cached=${cached.audioUrlQuality}, required=${requiredQuality}`);
        cached.audioUrl = null;
        cached.audioUrlQuality = null;
    }

    return touchPrefetchCacheEntry(songKey, cached);
};

const canPrefetchOnlineSong = (song: SongResult): boolean =>
    !isLocalPlaybackSong(song) && !isNavidromePlaybackSong(song) && !isYtmPlaybackSong(song);

/**
 * Fetch and commit audio URL only. Safe to await on the critical next-track path.
 */
export const prefetchSongAudio = async (
    song: SongResult,
    audioQuality: string,
    signal?: AbortSignal,
): Promise<PrefetchedSongData | null> => {
    if (signal?.aborted || !canPrefetchOnlineSong(song)) {
        return null;
    }

    const songKey = getPrefetchSongKey(song);
    const existing = prefetchCache.get(songKey);
    if (hasValidPrefetchedAudio(existing, audioQuality)) {
        return touchPrefetchCacheEntry(songKey, existing!);
    }

    const data = createPrefetchDraft(song, audioQuality, existing);
    console.log(`[Prefetch] Fetching audio for: ${song.name} (quality: ${audioQuality})`);

    try {
        const audioExists = await hasCachedAudio(getProviderSongCacheKey('audio', song));
        if (signal?.aborted) {
            return null;
        }
        if (audioExists) {
            data.audioUrl = 'CACHED_IN_DB';
            data.audioUrlFetchedAt = Date.now();
            data.audioUrlQuality = audioQuality;
            return commitPrefetchEntry(data);
        }

        const provider = getMusicProviderForSong(song);
        const audioResult = await provider.getAudioUrl(song, { quality: audioQuality });
        if (signal?.aborted) {
            return null;
        }
        if (audioResult.kind === 'ok' && audioResult.audioUrl) {
            const url = audioResult.audioUrl.startsWith('http:')
                ? audioResult.audioUrl.replace('http:', 'https:')
                : audioResult.audioUrl;
            data.audioUrl = url;
            data.audioUrlFetchedAt = Date.now();
            data.audioUrlQuality = audioQuality;
            console.log(`[Prefetch] Got audio URL for: ${song.name}`);
            return commitPrefetchEntry(data);
        }
    } catch (error) {
        console.warn(`[Prefetch] Failed to get audio URL for ${song.name}:`, error);
    }

    commitPrefetchEntry(data);
    return data;
};

const mergeLyricPrefetch = (
    songKey: string,
    patch: Partial<Pick<PrefetchedSongData, 'lyrics' | 'lyricRaw' | 'coverUrl'>>,
): void => {
    const existing = prefetchCache.get(songKey);
    if (!existing) {
        return;
    }
    commitPrefetchEntry({
        ...existing,
        ...patch,
        coverUrl: patch.coverUrl ?? existing.coverUrl,
    });
};

/**
 * Background lyric prefetch for Netease. Never blocks audio readiness.
 */
const prefetchSongLyrics = async (
    song: SongResult,
    signal: AbortSignal,
    userId?: number | null,
): Promise<void> => {
    if (signal.aborted || !isNeteaseOnlineSong(song)) {
        return;
    }

    const songKey = getPrefetchSongKey(song);
    const existing = prefetchCache.get(songKey);
    if (existing?.lyrics || existing?.lyricRaw?.isPureMusic) {
        return;
    }

    const songId = song.id;

    try {
        const cachedLyrics = await getFromCacheWithMigration<LyricData>(
            getOnlineSongCacheKey('lyric', song),
            migrateLyricDataRenderHints,
        );
        if (signal.aborted) return;
        if (cachedLyrics) {
            mergeLyricPrefetch(songKey, { lyrics: cachedLyrics });
            return;
        }

        const processed = isCloudSong(song) && userId
            ? await (async () => {
                const lyricRes = await neteaseApi.getCloudLyric(userId, song.id);
                const mainLrc = extractCloudLyricText(lyricRes);
                const isPureMusic = isPureMusicLyricText(mainLrc);
                if (!mainLrc || isPureMusic) {
                    return {
                        mainLrc,
                        yrcLrc: null,
                        transLrc: null,
                        isPureMusic,
                        lyrics: null,
                        chorusRanges: [],
                    };
                }

                const lyrics = await parseLyricsAsync(detectTimedLyricFormat(mainLrc), mainLrc, '');
                return {
                    mainLrc,
                    yrcLrc: null,
                    transLrc: null,
                    isPureMusic,
                    lyrics,
                    chorusRanges: [],
                };
            })()
            : await (async () => {
                const lyricRes = await neteaseApi.getLyric(songId);
                return processNeteaseLyrics(neteaseApi.getProcessedLyricPayload(lyricRes), { songId });
            })();

        if (signal.aborted) return;

        const lyricRaw = {
            mainLrc: processed.mainLrc,
            yrcLrc: processed.yrcLrc,
            transLrc: processed.transLrc,
            isPureMusic: processed.isPureMusic,
        };

        let finalLyrics = processed.lyrics;
        const onlineLyricsState = await loadOnlineLyricsState(song);
        const resolvedLyrics = resolveOnlineLyrics(onlineLyricsState, processed.lyrics);
        const settings = useSettingsUiStore.getState();
        const hasWordByWord = resolvedLyrics?.isWordByWord === true;
        const enableAlternative = settings.enableAlternativeLyricSources;
        const autoUseBest = settings.autoUseBestLyric;
        const preferredSource = settings.preferredAlternativeLyricSource;
        const isBaseNetease = !onlineLyricsState?.hasOnlineOverride;
        const shouldAutoMatch = enableAlternative && autoUseBest
            && (!hasWordByWord || (isBaseNetease && preferredSource !== 'netease'));

        if (shouldAutoMatch) {
            try {
                const artistName = song.artists?.map(artist => artist.name).join(', ')
                    || song.ar?.map(artist => artist.name).join(', ')
                    || '';
                const bestMatch = await autoMatchBestLyric(song.name, artistName, song.duration || song.dt || 0, {
                    album: song.album?.name || song.al?.name,
                    preferredSource: settings.preferredAlternativeLyricSource,
                    neteaseCandidate: {
                        id: song.id,
                        lyrics: processed.lyrics,
                        isPureMusic: processed.isPureMusic,
                        chorusRanges: [],
                    },
                });
                if (signal.aborted) return;
                if (bestMatch && 'lyrics' in bestMatch && bestMatch.source !== 'netease') {
                    const overrideState: OnlineLyricsState = {
                        lyricsSource: 'online',
                        matchedSongId: typeof bestMatch.id === 'number' ? bestMatch.id : parseInt(String(bestMatch.id), 10) || 0,
                        hasOnlineOverride: true,
                        onlineOverrideLyrics: bestMatch.lyrics,
                        matchedLyricsSource: bestMatch.source,
                        matchedLyricsProviderPlatform: bestMatch.matchedLyricsProviderPlatform,
                    };
                    await saveOnlineLyricsState(song, overrideState);
                    finalLyrics = bestMatch.lyrics;
                }
            } catch (error) {
                console.warn('[Prefetch] Failed to auto-match best lyric:', error);
            }
        } else if (resolvedLyrics) {
            finalLyrics = resolvedLyrics;
        }

        mergeLyricPrefetch(songKey, {
            lyrics: finalLyrics,
            lyricRaw,
        });
    } catch (error) {
        console.warn(`[Prefetch] Failed to get lyrics for ${song.name}:`, error);
    }
};

const prefetchSong = async (
    song: SongResult,
    audioQuality: string,
    signal: AbortSignal,
    userId?: number | null,
): Promise<void> => {
    await prefetchSongAudio(song, audioQuality, signal);
    if (!signal.aborted) {
        void prefetchSongLyrics(song, signal, userId);
    }
};

export const updatePrefetchedAudioUrl = (
    song: Pick<SongResult, 'id' | 't' | 'musicProvider'>,
    audioUrl: string,
    audioQuality: string,
): void => {
    const songKey = getPrefetchSongKey(song);
    const existing = prefetchCache.get(songKey);

    commitPrefetchEntry({
        songKey,
        songId: song.id,
        audioUrl,
        audioUrlFetchedAt: Date.now(),
        audioUrlQuality: audioQuality,
        lyrics: existing?.lyrics || null,
        lyricRaw: existing?.lyricRaw || null,
        coverUrl: existing?.coverUrl || null,
    });
};

const collectNearbySongs = (currentSongId: number, queue: SongResult[]): SongResult[] => {
    const currentIndex = queue.findIndex(song => song.id === currentSongId);
    if (currentIndex === -1) {
        return [];
    }

    const songsToPrefetch: SongResult[] = [];

    for (let i = 1; i <= PREFETCH_COUNT_NEXT; i++) {
        const idx = currentIndex + i;
        if (idx < queue.length) {
            songsToPrefetch.push(queue[idx]);
        }
    }

    for (let i = 1; i <= PREFETCH_COUNT_PREV; i++) {
        const idx = currentIndex - i;
        if (idx >= 0) {
            songsToPrefetch.push(queue[idx]);
        }
    }

    return songsToPrefetch;
};

/**
 * Prefetch nearby songs. The immediate next track is fetched urgently;
 * remaining neighbors follow with a short gap so lyrics work stays off the hot path.
 */
export const prefetchNearbySongs = async (
    currentSongId: number,
    queue: SongResult[],
    audioQuality: string,
    userId?: number | null,
): Promise<void> => {
    if (currentPrefetchAbortController) {
        currentPrefetchAbortController.abort();
    }
    currentPrefetchAbortController = new AbortController();
    const signal = currentPrefetchAbortController.signal;

    const songsToPrefetch = collectNearbySongs(currentSongId, queue);
    if (songsToPrefetch.length === 0) {
        console.log('[Prefetch] Current song not in queue, skipping prefetch');
        return;
    }

    console.log(`[Prefetch] Will prefetch ${songsToPrefetch.length} nearby songs`);

    const [urgentSong, ...backgroundSongs] = songsToPrefetch;
    await prefetchSong(urgentSong, audioQuality, signal, userId);
    if (signal.aborted) {
        return;
    }

    const prefetchBackground = (index: number) => {
        if (signal.aborted || index >= backgroundSongs.length) {
            return;
        }
        globalThis.setTimeout(() => {
            if (signal.aborted) {
                return;
            }
            void prefetchSong(backgroundSongs[index], audioQuality, signal, userId).finally(() => {
                prefetchBackground(index + 1);
            });
        }, BACKGROUND_PREFETCH_GAP_MS);
    };

    prefetchBackground(0);
};

/**
 * Clear prefetch cache for songs not in the current queue.
 * Call this after queue shuffle to free memory.
 */
export const cleanupPrefetchCache = (currentQueue: SongResult[]): void => {
    const queueIds = new Set(currentQueue.map(song => getPrefetchSongKey(song)));

    for (const songKey of prefetchCache.keys()) {
        if (!queueIds.has(songKey)) {
            prefetchCache.delete(songKey);
        }
    }

    console.log(`[Prefetch] Cleanup complete, cache size: ${prefetchCache.size}`);
};

export const clearStalePrefetchCache = cleanupPrefetchCache;

export const invalidatePrefetchedLyrics = (): void => {
    for (const [songKey, cached] of prefetchCache.entries()) {
        prefetchCache.set(songKey, {
            ...cached,
            lyrics: null,
            lyricRaw: null,
        });
    }

    console.log(`[Prefetch] Invalidated lyrics for ${prefetchCache.size} prefetched songs`);
};

/**
 * Force re-prefetch (e.g., after queue shuffle)
 */
export const invalidateAndRefetch = async (
    currentSongId: number,
    queue: SongResult[],
    audioQuality: string,
    userId?: number | null,
): Promise<void> => {
    console.log('[Prefetch] Queue changed, invalidating and re-prefetching');
    cleanupPrefetchCache(queue);
    await prefetchNearbySongs(currentSongId, queue, audioQuality, userId);
};

/** Test helper: reset in-memory prefetch state. */
export const __resetPrefetchCacheForTests = (): void => {
    prefetchCache.clear();
    if (currentPrefetchAbortController) {
        currentPrefetchAbortController.abort();
        currentPrefetchAbortController = null;
    }
};

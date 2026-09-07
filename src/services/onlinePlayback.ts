import { LyricData, OnlineLyricsState, SongResult } from '../types';
import { getFromCacheWithMigration, saveToCache } from './db';
import { getCachedAudioBlob } from './audioCache';
import { isCloudSong, neteaseApi } from './netease';
import { PrefetchedSongData, isUrlValid, updatePrefetchedAudioUrl } from './prefetchService';
import { isPureMusicLyricText } from '../utils/lyrics/pureMusic';
import { migrateLyricDataRenderHints } from '../utils/lyrics/renderHints';
import { processNeteaseLyrics } from '../utils/lyrics/neteaseProcessing';
import { detectTimedLyricFormat } from '../utils/lyrics/formatDetection';
import { parseLyricsAsync } from '../utils/lyrics/workerClient';
import { loadOnlineLyricsState, resolveOnlineLyrics, saveOnlineLyricsState } from '../utils/onlineLyricsState';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import { resolveBestLyric } from '../utils/lyrics/resolveBestLyric';
import { getMusicProviderForSong, getProviderSongCacheKey, isNeteaseOnlineSong } from './musicProviders/registry';
import { shouldResolveCompanionVideoForSong } from '../utils/playback/playbackLoadPriorityMath';
import { isYtmPlaybackSong } from '../utils/appPlaybackGuards';
import { isRssPodcastPlaybackSong, resolveRssPodcastEnclosureUrl } from '../utils/playback/rssPodcastPlayback';
import { resolveYtmusicStream } from './ytmusicService';
import type { YtmSong } from '../types/ytmusic';
import { toSafePlaybackUrl } from '../utils/appPlaybackHelpers';

const normalizeAudioUrl = (url?: string | null) => {
    if (!url) return null;
    return toSafePlaybackUrl(url) || null;
};

const buildOkAudioSource = (
    audioSrc: string,
    options?: { videoSrc?: string; blobUrl?: string },
): { kind: 'ok'; audioSrc: string; videoSrc?: string; blobUrl?: string } => {
    if (options?.videoSrc) {
        return {
            kind: 'ok',
            audioSrc,
            videoSrc: options.videoSrc,
            ...(options.blobUrl ? { blobUrl: options.blobUrl } : {}),
        };
    }
    return options?.blobUrl
        ? { kind: 'ok', audioSrc, blobUrl: options.blobUrl }
        : { kind: 'ok', audioSrc };
};

/** Resolve muted companion video when audio came from cache/prefetch without videoUrl. */
const resolveCompanionVideoSrc = async (
    song: SongResult,
    audioQuality: string,
    prefetched: PrefetchedSongData | null,
): Promise<string | undefined> => {
    if (!shouldResolveCompanionVideoForSong(song)) {
        return undefined;
    }

    const prefetchedVideo = normalizeAudioUrl(prefetched?.videoUrl || null);
    if (prefetchedVideo) {
        return prefetchedVideo;
    }

    const provider = getMusicProviderForSong(song);
    const audioResult = await provider.getAudioUrl(song, { quality: audioQuality });
    if (audioResult.kind !== 'ok') {
        return undefined;
    }
    return normalizeAudioUrl(audioResult.videoUrl || null) || undefined;
};

const extractCloudLyricText = (response: any): string => {
    if (typeof response?.lrc === 'string') return response.lrc;
    if (typeof response?.data?.lrc === 'string') return response.data.lrc;
    if (typeof response?.lyric === 'string') return response.lyric;
    if (typeof response?.data?.lyric === 'string') return response.data.lyric;
    return '';
};

export async function loadOnlineSongAudioSource(
    song: SongResult,
    audioQuality: string,
    prefetched: PrefetchedSongData | null,
    options?: { forceRefresh?: boolean },
): Promise<
    | { kind: 'ok'; audioSrc: string; videoSrc?: string; blobUrl?: string }
    | { kind: 'unavailable'; diagnostic?: string; errorCode?: string }
> {
    const forceRefresh = options?.forceRefresh === true;

    if (isYtmPlaybackSong(song)) {
        const videoId = (song as YtmSong).ytmData?.videoId;
        if (!videoId) {
            return { kind: 'unavailable' };
        }
        try {
            const stream = await resolveYtmusicStream(videoId, { forceRefresh });
            return buildOkAudioSource(stream.playbackUrl);
        } catch (error) {
            const { captureRequestFailure } = await import('../utils/network');
            const failure = captureRequestFailure(error, `onlinePlayback:ytm:${song.name}`);
            return {
                kind: 'unavailable',
                diagnostic: failure.diagnostic,
                errorCode: failure.code,
            };
        }
    }

    if (isRssPodcastPlaybackSong(song)) {
        const enclosure = resolveRssPodcastEnclosureUrl(song);
        if (!enclosure) {
            return { kind: 'unavailable' };
        }
        return buildOkAudioSource(enclosure);
    }

    // Prefer a valid prefetch streaming URL before reading a full Electron blob into memory —
    // first audible byte beats local IPC for perceived start latency.
    // Recovery must skip caches — expired Douyin/Qishui signed URLs often still look "valid".
    if (
        !forceRefresh
        && prefetched?.audioUrl
        && prefetched.audioUrl !== 'CACHED_IN_DB'
        && isUrlValid(prefetched.audioUrlFetchedAt)
    ) {
        const prefetchedVideo = normalizeAudioUrl(prefetched.videoUrl || null) || undefined;
        const videoSrc = prefetchedVideo ?? await resolveCompanionVideoSrc(song, audioQuality, prefetched);
        const prefetchedAudio = normalizeAudioUrl(prefetched.audioUrl);
        if (!prefetchedAudio) {
            return { kind: 'unavailable' };
        }
        return buildOkAudioSource(prefetchedAudio, { videoSrc });
    }

    if (!forceRefresh) {
        const audioCacheKey = getProviderSongCacheKey('audio', song);
        const cachedAudioBlob = await getCachedAudioBlob(audioCacheKey);
        if (cachedAudioBlob) {
            const blobUrl = URL.createObjectURL(cachedAudioBlob);
            const videoSrc = await resolveCompanionVideoSrc(song, audioQuality, prefetched);
            return buildOkAudioSource(blobUrl, { blobUrl, videoSrc });
        }
    }

    const provider = getMusicProviderForSong(song);
    try {
        const audioResult = await provider.getAudioUrl(song, {
            quality: audioQuality,
            forceRefresh,
        });
        if (audioResult.kind !== 'ok') {
            return { kind: 'unavailable' };
        }

        const url = normalizeAudioUrl(audioResult.audioUrl);
        if (!url) {
            return { kind: 'unavailable' };
        }
        updatePrefetchedAudioUrl(song, url, audioQuality, audioResult.videoUrl || null);
        const videoSrc = normalizeAudioUrl(audioResult.videoUrl || null) || undefined;
        return buildOkAudioSource(url, { videoSrc });
    } catch (error) {
        const { captureRequestFailure } = await import('../utils/network');
        const failure = captureRequestFailure(error, `onlinePlayback:audio:${song.name}`);
        return {
            kind: 'unavailable',
            diagnostic: failure.diagnostic,
            errorCode: failure.code,
        };
    }
}

export async function loadOnlineSongLyrics(
    song: SongResult,
    prefetched: PrefetchedSongData | null,
    userId: number | null | undefined,
    callbacks: {
        isCurrent: () => boolean;
        onLyrics: (lyrics: LyricData | null) => void;
        onPureMusicChange?: (isPureMusic: boolean) => void;
        onStateChange?: (state: OnlineLyricsState | null) => void;
        onAutoMatchStart?: () => void;
        onDone: () => void;
    }
): Promise<void> {
    const { isCurrent, onLyrics, onPureMusicChange, onStateChange, onAutoMatchStart, onDone } = callbacks;
    const lyricCacheKey = getProviderSongCacheKey('lyric', song);
    const onlineLyricsState = await loadOnlineLyricsState(song);

    if (!isCurrent()) return;
    onStateChange?.(onlineLyricsState);

    const cachedLyrics = await getFromCacheWithMigration<LyricData>(lyricCacheKey, migrateLyricDataRenderHints);
    if (!isCurrent()) return;
    const preferredCachedLyrics = resolveOnlineLyrics(onlineLyricsState, cachedLyrics);
    if (preferredCachedLyrics) {
        const cachedText = preferredCachedLyrics.lines.map(line => line.fullText).join('\n');
        onPureMusicChange?.(
            onlineLyricsState?.lyricsSource === 'online' && typeof onlineLyricsState.matchedIsPureMusic === 'boolean'
                ? onlineLyricsState.matchedIsPureMusic
                : isPureMusicLyricText(cachedText)
        );
        onLyrics(preferredCachedLyrics);
        onDone();
        return;
    }

    if (prefetched?.lyricRaw?.isPureMusic && !prefetched.lyrics) {
        onPureMusicChange?.(true);
        onLyrics(null);
        onDone();
        return;
    }

    if (prefetched?.lyrics) {
        const preferredPrefetchedLyrics = resolveOnlineLyrics(onlineLyricsState, prefetched.lyrics);
        const effectiveLyrics = preferredPrefetchedLyrics ?? prefetched.lyrics;

        const settings = useSettingsUiStore.getState();
        const shouldAutoMatch = settings.enableAlternativeLyricSources &&
                                settings.autoUseBestLyric &&
                                (!effectiveLyrics || !effectiveLyrics.isWordByWord ||
                                 (!onlineLyricsState?.hasOnlineOverride && settings.preferredAlternativeLyricSource !== 'netease'));

        if (!shouldAutoMatch) {
            const effectiveText = effectiveLyrics?.lines.map(line => line.fullText).join('\n') ?? '';
            onPureMusicChange?.(
                onlineLyricsState?.lyricsSource === 'online' && typeof onlineLyricsState.matchedIsPureMusic === 'boolean'
                    ? onlineLyricsState.matchedIsPureMusic
                    : (prefetched.lyricRaw?.isPureMusic || isPureMusicLyricText(effectiveText) || isPureMusicLyricText(prefetched.lyricRaw?.mainLrc))
            );
            onLyrics(effectiveLyrics);
            saveToCache(lyricCacheKey, prefetched.lyrics);
            onDone();
            return;
        }
    }

    if (!isNeteaseOnlineSong(song)) {
        const providerLyrics = await getMusicProviderForSong(song).getLyrics(song);
        if (!isCurrent()) return;

        if (providerLyrics) {
            onPureMusicChange?.(isPureMusicLyricText(providerLyrics.lines.map(line => line.fullText).join('\n')));
            onLyrics(providerLyrics);
            saveToCache(lyricCacheKey, providerLyrics);
        } else {
            onLyrics(null);
        }
        onDone();
        return;
    }

    const processed = prefetched?.lyrics
        ? {
            mainLrc: prefetched.lyricRaw?.mainLrc ?? null,
            yrcLrc: prefetched.lyricRaw?.yrcLrc ?? null,
            transLrc: prefetched.lyricRaw?.transLrc ?? null,
            romaLrc: prefetched.lyricRaw?.romaLrc ?? null,
            isPureMusic: prefetched.lyricRaw?.isPureMusic ?? false,
            lyrics: prefetched.lyrics,
            chorusRanges: [],
          }
        : (isCloudSong(song) && userId
            ? await (async () => {
                const lyricRes = await neteaseApi.getCloudLyric(userId, song.id);
                const mainLrc = extractCloudLyricText(lyricRes);
                const isPureMusic = isPureMusicLyricText(mainLrc);
                if (!mainLrc || isPureMusic) {
                    return {
                        mainLrc,
                        yrcLrc: null,
                        transLrc: null,
                        romaLrc: null,
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
                    romaLrc: null,
                    isPureMusic,
                    lyrics,
                    chorusRanges: [],
                };
            })()
            : await (async () => {
                const lyricRes = await neteaseApi.getLyric(song.id);
                return processNeteaseLyrics(neteaseApi.getProcessedLyricPayload(lyricRes), { songId: song.id });
            })());
    const parsedLyrics = processed.lyrics;

    if (!isCurrent()) return;

    let resolvedLyrics = resolveOnlineLyrics(onlineLyricsState, parsedLyrics);
    let finalState = onlineLyricsState;

    const settings = useSettingsUiStore.getState();
    const shouldAutoMatch = settings.enableAlternativeLyricSources &&
                            settings.autoUseBestLyric &&
                            (!resolvedLyrics || !resolvedLyrics.isWordByWord ||
                             (!onlineLyricsState?.hasOnlineOverride && settings.preferredAlternativeLyricSource !== 'netease'));

    if (shouldAutoMatch) {
        try {
            onAutoMatchStart?.();
            const artistName = song.artists?.map(a => a.name).join(', ') || '';
            const bestMatch = await resolveBestLyric(song.name, artistName, song.duration || song.dt || 0, {
                album: song.album?.name || song.al?.name,
                preferredSource: settings.preferredAlternativeLyricSource,
                neteaseCandidate: {
                    id: song.id,
                    lyrics: parsedLyrics,
                    isPureMusic: processed.isPureMusic,
                    chorusRanges: processed.chorusRanges
                }
            });
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
                resolvedLyrics = bestMatch.lyrics;
                finalState = overrideState;
                onStateChange?.(overrideState);
            }
        } catch (error) {
            console.warn('[OnlinePlayback] Failed to auto-match best lyric:', error);
        }
    }

    if (!isCurrent()) return;

    const resolvedText = resolvedLyrics?.lines.map(line => line.fullText).join('\n') ?? '';
    onPureMusicChange?.(
        finalState?.lyricsSource === 'online' && typeof finalState.matchedIsPureMusic === 'boolean'
            ? finalState.matchedIsPureMusic
            : (resolvedLyrics ? isPureMusicLyricText(resolvedText) : processed.isPureMusic)
    );

    if (!resolvedLyrics) {
        onLyrics(null);
        onDone();
        return;
    }

    onLyrics(resolvedLyrics);
    saveToCache(lyricCacheKey, resolvedLyrics);
    onDone();
}

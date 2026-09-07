import type { SongResult } from '../../types';

// src/utils/playback/rssPodcastPlayback.ts
// RSS enclosure songs play from a public https URL; they are not NetEase/sidecar streams.

const MUSIC_STALL_RECOVERY_TIMEOUT_MS = 8_000;
const PODCAST_STALL_RECOVERY_TIMEOUT_MS = 25_000;

export const isRssPodcastPlaybackSong = (
    song: Pick<SongResult, 'musicProvider' | 'contentType' | 'audioUrl'> | null | undefined,
): boolean => {
    if (!song) return false;
    if (song.musicProvider === 'rss') return true;
    return song.contentType === 'podcast' && Boolean(song.audioUrl);
};

export const resolveRssPodcastEnclosureUrl = (
    song: Pick<SongResult, 'audioUrl'> | null | undefined,
): string | null => {
    const raw = String(song?.audioUrl || '').trim();
    if (!raw) return null;
    const url = raw.startsWith('http:') ? `https:${raw.slice('http:'.length)}` : raw;
    return /^https:\/\//i.test(url) ? url : null;
};

/** RSS CDNs often omit CORS in the browser; Electron rewrites ACAO so analyser can bind. */
export const shouldUseAnonymousHtmlAudioCors = (
    song: Pick<SongResult, 'musicProvider' | 'contentType' | 'audioUrl'> | null | undefined,
    options?: { isElectronRenderer?: boolean },
): boolean => {
    if (!isRssPodcastPlaybackSong(song)) return true;
    return options?.isElectronRenderer === true;
};

/** Hour-long episodes should not be fetched into IndexedDB after they finish. */
export const shouldSkipFullTrackAudioCache = (
    song: Pick<SongResult, 'musicProvider' | 'contentType' | 'audioUrl'> | null | undefined,
): boolean => isRssPodcastPlaybackSong(song);

export const resolveHtmlAudioStallTimeoutMs = (
    song: Pick<SongResult, 'musicProvider' | 'contentType' | 'audioUrl'> | null | undefined,
): number => (
    isRssPodcastPlaybackSong(song)
        ? PODCAST_STALL_RECOVERY_TIMEOUT_MS
        : MUSIC_STALL_RECOVERY_TIMEOUT_MS
);

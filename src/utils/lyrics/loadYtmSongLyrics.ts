import type { LyricData, LyricProviderSource } from '../../types';
import { autoMatchBestLyric } from './autoMatchBestLyric';
import { fetchLrclibLyrics } from './providers/lrclibLyricProvider';

// src/utils/lyrics/loadYtmSongLyrics.ts
// Optional YTM lyrics: LRCLib first (overseas), then auto-match when enabled.
// Playback must never depend on this path.

export type YtmLyricLoadResult = {
    lyrics: LyricData | null;
    isPureMusic?: boolean;
    source?: 'lrclib' | 'autoMatch';
    matchedLyricsSource?: LyricProviderSource;
};

/** Resolve lyrics for a YouTube Music track without blocking playback. */
export async function loadYtmSongLyrics(params: {
    title: string;
    artist: string;
    album?: string | null;
    durationMs?: number | null;
    /** When false, only try LRCLib (skip NetEase/QQ/Kugou/AMLL chain). Default true. */
    enableAutoMatch?: boolean;
}): Promise<YtmLyricLoadResult> {
    try {
        const lrclib = await fetchLrclibLyrics(params);
        if (lrclib?.instrumental) {
            return { lyrics: null, isPureMusic: true, source: 'lrclib', matchedLyricsSource: 'lrclib' };
        }
        if (lrclib?.lyrics?.lines?.length) {
            return { lyrics: lrclib.lyrics, source: 'lrclib', matchedLyricsSource: 'lrclib' };
        }
    } catch (error) {
        console.warn('[ytmusic] LRCLib lyric fetch failed', error);
    }

    if (params.enableAutoMatch === false) {
        return { lyrics: null };
    }

    const durationMs = params.durationMs != null && params.durationMs > 0 ? params.durationMs : 0;
    try {
        const matched = await autoMatchBestLyric(
            params.title,
            params.artist,
            durationMs,
            { album: params.album ?? undefined },
        );
        if (matched && 'isPureMusic' in matched && matched.isPureMusic) {
            return { lyrics: null, isPureMusic: true, source: 'autoMatch' };
        }
        if (matched && 'lyrics' in matched && matched.lyrics) {
            return {
                lyrics: matched.lyrics,
                source: 'autoMatch',
                matchedLyricsSource: matched.source,
            };
        }
    } catch (error) {
        console.warn('[ytmusic] autoMatch lyric fetch failed', error);
    }

    return { lyrics: null };
}

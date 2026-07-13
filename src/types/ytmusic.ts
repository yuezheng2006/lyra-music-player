import type { LyricData, LyricProviderSource, SongResult } from '../types';

// src/types/ytmusic.ts
// YouTube Music browse/playback carriers (sidebar entry, not MusicProvider).

export type YtmStreamInfo = {
    url: string;
    expireAt?: number | null;
    mimeType?: string | null;
};

export type YtmTrackData = {
    videoId: string;
    title: string;
    artist: string;
    album?: string | null;
    durationMs: number;
    coverUrl?: string | null;
    streamUrl?: string | null;
    streamExpireAt?: number | null;
};

export interface YtmSong extends SongResult {
    isYtm: true;
    ytmData: YtmTrackData;
    matchedSongId?: number;
    matchedLyrics?: LyricData;
    matchedIsPureMusic?: boolean;
    hasManualLyricSelection?: boolean;
    lyricsSource?: 'online';
    useOnlineCover?: boolean;
    useOnlineMetadata?: boolean;
    noAutoMatch?: boolean;
    matchedLyricsSource?: LyricProviderSource;
    matchedLyricsProviderPlatform?: SongResult['matchedLyricsProviderPlatform'];
}

export type YtmSearchTrack = {
    videoId: string;
    title: string;
    artist: string;
    album?: string | null;
    durationMs: number;
    coverUrl?: string | null;
};

/** Public home playlist card (before expanding tracks). */
export type YtmHomePlaylist = {
    title: string;
    playlistId: string;
    coverUrl?: string | null;
};

/** One home recommendation section (expanded public playlist). */
export type YtmHomeSection = {
    title: string;
    playlistId: string;
    coverUrl?: string | null;
    tracks: YtmSearchTrack[];
};

export function isYtmSong(song: SongResult | null | undefined): song is YtmSong {
    return Boolean(song && (song as YtmSong).isYtm === true);
}

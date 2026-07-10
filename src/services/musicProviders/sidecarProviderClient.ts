import type { LyricData, OnlineMusicProviderId, SongResult } from '../../types';
import { detectTimedLyricFormat } from '../../utils/lyrics/formatDetection';
import { parseLyricsAsync } from '../../utils/lyrics/workerClient';
import { getQQMusicAuth } from './qqMusicAuth';
import type { MusicProviderSearchResult, ProviderAudioResult } from './types';

// src/services/musicProviders/sidecarProviderClient.ts

type SidecarSongPayload = {
    id?: string | number;
    title?: string;
    name?: string;
    artists?: Array<string | { id?: string | number; name?: string }>;
    artist?: string;
    album?: string | { id?: string | number; name?: string; picUrl?: string; coverUrl?: string };
    durationMs?: number;
    duration?: number;
    coverUrl?: string;
    picUrl?: string;
    picId?: string | number;
    qqMid?: string;
    qqMediaMid?: string;
    musicProvider?: OnlineMusicProviderId;
    providerSongId?: string;
    source?: string;
};

const AUDIO_NEGATIVE_CACHE_TTL_MS = 60_000;
const audioNegativeCache = new Map<string, number>();
const audioInflight = new Map<string, Promise<ProviderAudioResult>>();

const buildAudioLookupKey = (
    providerId: OnlineMusicProviderId,
    song: SongResult,
    quality: string,
) => [
    providerId,
    song.qqMid || song.providerSongId || song.id,
    song.name || '',
    quality,
].join('|');

const getCachedNegativeAudio = (key: string): ProviderAudioResult | null => {
    const expiresAt = audioNegativeCache.get(key);
    if (!expiresAt) return null;
    if (Date.now() > expiresAt) {
        audioNegativeCache.delete(key);
        return null;
    }
    return { kind: 'unavailable' };
};

const rememberNegativeAudio = (key: string) => {
    audioNegativeCache.set(key, Date.now() + AUDIO_NEGATIVE_CACHE_TTL_MS);
};

/** Mark a song's audio lookup as failed after CDN/playback 404 to stop recovery loops. */
export const markProviderAudioUnavailable = (
    providerId: OnlineMusicProviderId,
    song: SongResult,
    quality: string,
) => {
    rememberNegativeAudio(buildAudioLookupKey(providerId, song, quality));
};

const getElectronMusicProviderPort = async (): Promise<number | null> => {
    const electronBridge = typeof window !== 'undefined' ? (window as any).electron : null;
    if (!electronBridge || typeof electronBridge.getMusicProviderPort !== 'function') {
        return null;
    }

    try {
        const port = await electronBridge.getMusicProviderPort();
        return typeof port === 'number' && port > 0 ? port : null;
    } catch {
        return null;
    }
};

const getConfiguredSidecarBase = async () => {
    const viteEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
    const value = viteEnv?.VITE_MUSIC_PROVIDER_API_BASE;
    if (typeof value === 'string' && value.trim()) {
        return value.trim().replace(/\/+$/, '');
    }

    const electronPort = await getElectronMusicProviderPort();
    if (electronPort) {
        return `http://127.0.0.1:${electronPort}`;
    }

    const port = typeof viteEnv?.VITE_MUSIC_PROVIDER_API_PORT === 'string' && viteEnv.VITE_MUSIC_PROVIDER_API_PORT.trim()
        ? viteEnv.VITE_MUSIC_PROVIDER_API_PORT.trim()
        : '3002';
    return `http://127.0.0.1:${port}`;
};

const hashProviderSongId = (providerId: OnlineMusicProviderId, rawId: string): number => {
    let hash = 0x811c9dc5;
    const input = `${providerId}:${rawId}`;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
};

const normalizeArtists = (artists: SidecarSongPayload['artists'], fallbackArtist?: string) => {
    const flattenNames = (value: unknown): string[] => {
        if (!value) return [];
        if (typeof value === 'string') {
            return value.split(/[\/,、]/).map(part => part.trim()).filter(Boolean);
        }
        if (Array.isArray(value)) {
            return value.flatMap(item => flattenNames(item));
        }
        if (typeof value === 'object' && value && 'name' in value && typeof (value as { name?: unknown }).name === 'string') {
            return [(value as { name: string }).name.trim()].filter(Boolean);
        }
        return [];
    };

    const names = flattenNames(artists);
    if (names.length > 0) {
        return names.map((name, index) => ({ id: index, name }));
    }

    return flattenNames(fallbackArtist).map((name, index) => ({ id: index, name }));
};

export const normalizeSidecarSong = (
    providerId: OnlineMusicProviderId,
    payload: SidecarSongPayload
): SongResult => {
    const providerSongId = String(payload.id ?? `${payload.title || payload.name || 'unknown'}:${payload.artist || ''}`);
    const albumPayload = typeof payload.album === 'object' && payload.album ? payload.album : null;
    const albumName = albumPayload?.name || (typeof payload.album === 'string' ? payload.album : '') || 'Unknown Album';
    const coverUrl = payload.coverUrl || payload.picUrl || albumPayload?.coverUrl || albumPayload?.picUrl;
    const duration = Number(payload.durationMs ?? payload.duration ?? 0);

    return {
        id: hashProviderSongId(providerId, providerSongId),
        providerSongId,
        musicProvider: providerId,
        name: payload.title || payload.name || 'Unknown Song',
        artists: normalizeArtists(payload.artists, payload.artist),
        album: {
            id: Number(albumPayload?.id ?? 0),
            name: albumName,
            picUrl: coverUrl,
        },
        duration,
        ar: normalizeArtists(payload.artists, payload.artist),
        al: {
            id: Number(albumPayload?.id ?? 0),
            name: albumName,
            picUrl: coverUrl,
        },
        dt: duration,
        qqMid: payload.qqMid,
        qqMediaMid: payload.qqMediaMid || payload.qqMid,
        providerCatalogSource: payload.source,
    };
};

export const requestSidecarSearch = async (
    providerId: OnlineMusicProviderId,
    query: string,
    options: { limit: number; offset: number }
): Promise<MusicProviderSearchResult> => {
    const base = await getConfiguredSidecarBase();
    if (!base) {
        return { songs: [], total: 0, hasMore: false };
    }

    const params = new URLSearchParams({
        q: query,
        limit: String(options.limit),
        offset: String(options.offset),
    });
    const response = await fetch(`${base}/providers/${providerId}/search?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`${providerId} sidecar search failed: ${response.status}`);
    }

    const data = await response.json();
    const rawSongs = Array.isArray(data?.songs) ? data.songs : Array.isArray(data?.results) ? data.results : [];
    const songs = rawSongs.map((song: SidecarSongPayload) => normalizeSidecarSong(providerId, song));
    return {
        songs,
        total: typeof data?.total === 'number' ? data.total : songs.length,
        hasMore: typeof data?.hasMore === 'boolean' ? data.hasMore : options.offset + songs.length < Number(data?.total ?? songs.length),
    };
};

export const requestSidecarAudioUrl = async (
    providerId: OnlineMusicProviderId,
    song: SongResult,
    options: { quality: string }
): Promise<ProviderAudioResult> => {
    const lookupKey = buildAudioLookupKey(providerId, song, options.quality);
    const cachedNegative = getCachedNegativeAudio(lookupKey);
    if (cachedNegative) {
        return cachedNegative;
    }

    const inflight = audioInflight.get(lookupKey);
    if (inflight) {
        return inflight;
    }

    const request = (async (): Promise<ProviderAudioResult> => {
        const base = await getConfiguredSidecarBase();
        if (!base) {
            rememberNegativeAudio(lookupKey);
            return { kind: 'unavailable' };
        }

        const response = await fetch(`${base}/providers/${providerId}/song-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: song.providerSongId ?? song.id,
                song,
                quality: options.quality,
                ...(providerId === 'qq' ? { qqAuth: getQQMusicAuth() } : {}),
            }),
        });
        // 5xx is a sidecar/transport failure — let callers fall back to local providers.
        // 4xx means the provider resolved "no playable URL" for this song.
        if (!response.ok) {
            if (response.status >= 500) {
                throw new Error(`${providerId} sidecar audio failed: ${response.status}`);
            }
            rememberNegativeAudio(lookupKey);
            return { kind: 'unavailable' };
        }

        const data = await response.json();
        const audioUrl = typeof data?.audioUrl === 'string' ? data.audioUrl : typeof data?.url === 'string' ? data.url : '';
        if (!audioUrl) {
            rememberNegativeAudio(lookupKey);
            return { kind: 'unavailable' };
        }
        return { kind: 'ok', audioUrl };
    })();

    audioInflight.set(lookupKey, request);
    try {
        return await request;
    } finally {
        audioInflight.delete(lookupKey);
    }
};

export const requestSidecarLyrics = async (
    providerId: OnlineMusicProviderId,
    song: SongResult
): Promise<LyricData | null> => {
    const base = await getConfiguredSidecarBase();
    if (!base) {
        return null;
    }

    const response = await fetch(`${base}/providers/${providerId}/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: String(song.providerSongId ?? song.id),
            song,
            ...(providerId === 'qq' ? { qqAuth: getQQMusicAuth() } : {}),
        }),
    });
    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    if (data?.lyrics && Array.isArray(data.lyrics.lines)) {
        return data.lyrics;
    }
    const lyricsText = typeof data?.lyricsText === 'string' ? data.lyricsText : '';
    if (!lyricsText.trim()) {
        return null;
    }
    return parseLyricsAsync(detectTimedLyricFormat(lyricsText), lyricsText, '');
};

export type SidecarRecommendResult = MusicProviderSearchResult & {
    kind?: 'personalized' | 'picks';
    query?: string;
};

export const requestSidecarRecommend = async (
    providerId: OnlineMusicProviderId,
    options: { limit?: number } = {},
): Promise<SidecarRecommendResult> => {
    const base = await getConfiguredSidecarBase();
    if (!base) {
        return { songs: [], total: 0, hasMore: false };
    }

    const limit = Math.max(1, Math.min(options.limit ?? 20, 40));
    const response = await fetch(`${base}/providers/${providerId}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            limit,
            ...(providerId === 'qq' ? { qqAuth: getQQMusicAuth() } : {}),
        }),
    });
    if (!response.ok) {
        throw new Error(`${providerId} sidecar recommend failed: ${response.status}`);
    }

    const data = await response.json();
    const rawSongs = Array.isArray(data?.songs) ? data.songs : Array.isArray(data?.results) ? data.results : [];
    const songs = rawSongs.map((song: SidecarSongPayload) => normalizeSidecarSong(providerId, song));
    return {
        songs,
        total: typeof data?.total === 'number' ? data.total : songs.length,
        hasMore: Boolean(data?.hasMore),
        kind: data?.kind === 'personalized' ? 'personalized' : 'picks',
        query: typeof data?.query === 'string' ? data.query : undefined,
    };
};

import type { YtmHomePlaylist, YtmHomeSection, YtmSearchTrack, YtmStreamInfo } from '../types/ytmusic';

// src/services/ytmusicService.ts
// Renderer wrapper for Electron YouTube Music IPC (search + home playlists + stream proxy).

const getElectronBridge = () => {
    if (typeof window === 'undefined') return undefined;
    return window.electron;
};

const LOCAL_YTM_PLAYBACK_RE = /^https?:\/\/127\.0\.0\.1:\d+\/ytm\//i;
/** Align with main-process shelf TTL — avoid remount refetch flicker. */
const RENDERER_SHELVES_TTL_MS = 6 * 60 * 60 * 1000;
const RENDERER_PLAYLIST_TTL_MS = 2 * 60 * 60 * 1000;
/** Must match electron HOME_CACHE_EPOCH — drop foreign-region session shelves. */
const RENDERER_SHELVES_EPOCH = 'cn-seeds-v1';

type ShelvesCache = { fetchedAt: number; playlists: YtmHomePlaylist[]; epoch: string };
type PlaylistCacheEntry = { fetchedAt: number; section: YtmHomeSection };

let shelvesSessionCache: ShelvesCache | null = null;
const playlistSessionCache = new Map<string, PlaylistCacheEntry>();

function isRendererFresh(fetchedAt: number, ttlMs: number, nowMs = Date.now()): boolean {
    return Number.isFinite(fetchedAt) && nowMs - fetchedAt < ttlMs;
}

export function peekYtmusicHomeShelvesCache(): YtmHomePlaylist[] | null {
    if (!shelvesSessionCache) return null;
    if (shelvesSessionCache.epoch !== RENDERER_SHELVES_EPOCH) return null;
    if (!isRendererFresh(shelvesSessionCache.fetchedAt, RENDERER_SHELVES_TTL_MS)) return null;
    return shelvesSessionCache.playlists;
}

export function peekYtmusicPlaylistCache(playlistId: string): YtmHomeSection | null {
    const entry = playlistSessionCache.get(playlistId);
    if (!entry) return null;
    if (!isRendererFresh(entry.fetchedAt, RENDERER_PLAYLIST_TTL_MS)) return null;
    return entry.section;
}

export function isYtmusicRuntimeAvailable(): boolean {
    const bridge = getElectronBridge();
    return Boolean(bridge?.ytmusicSearch && bridge?.ytmusicResolveStream);
}

/** True for localhost YTM proxy playback URLs returned by main process. */
export function isYtmusicPlaybackUrl(url: string | null | undefined): boolean {
    // Do not accept legacy lyra-ytm:// — Chromium custom-protocol fetch of googlevideo returns 403.
    return Boolean(url && LOCAL_YTM_PLAYBACK_RE.test(url));
}

/**
 * Playback URLs must come from resolveYtmusicStream (includes local proxy port).
 * Kept for callers that already have a proxy URL from IPC.
 */
export function buildYtmusicPlaybackUrl(videoId: string, proxyBaseOrFullUrl?: string): string {
    if (proxyBaseOrFullUrl && isYtmusicPlaybackUrl(proxyBaseOrFullUrl)) {
        return proxyBaseOrFullUrl;
    }
    if (proxyBaseOrFullUrl && /^https?:\/\/127\.0\.0\.1:\d+$/i.test(proxyBaseOrFullUrl)) {
        return `${proxyBaseOrFullUrl.replace(/\/$/, '')}/ytm/${encodeURIComponent(videoId)}`;
    }
    // Fallback only — prefer IPC playbackUrl.
    return `http://127.0.0.1/ytm/${encodeURIComponent(videoId)}`;
}

export async function searchYtmusicTracks(query: string, limit = 20): Promise<YtmSearchTrack[]> {
    const bridge = getElectronBridge();
    if (!bridge?.ytmusicSearch) {
        throw new Error('YouTube Music is only available in the desktop app');
    }

    const result = await bridge.ytmusicSearch({ query, limit });
    if (!result.ok) {
        throw new Error(result.error || 'YouTube Music search failed');
    }
    return Array.isArray(result.tracks) ? result.tracks : [];
}

/** Load public home playlist cards (titles + covers; tracks load on open). */
export async function fetchYtmusicHomeShelves(
    options?: { forceRefresh?: boolean },
): Promise<YtmHomePlaylist[]> {
    if (!options?.forceRefresh) {
        const cached = peekYtmusicHomeShelvesCache();
        if (cached) return cached;
    }

    const bridge = getElectronBridge();
    if (!bridge?.ytmusicGetHomeShelves) {
        throw new Error('YouTube Music home is only available in the desktop app');
    }

    const result = await bridge.ytmusicGetHomeShelves({ forceRefresh: options?.forceRefresh });
    if (!result.ok) {
        throw new Error(result.error || 'YouTube Music home failed');
    }
    const playlists = Array.isArray(result.shelves) ? result.shelves : [];
    shelvesSessionCache = { fetchedAt: Date.now(), playlists, epoch: RENDERER_SHELVES_EPOCH };
    return playlists;
}

/** Expand one public playlist into playable tracks. */
export async function fetchYtmusicPlaylist(
    playlist: YtmHomePlaylist,
    limit = 30,
    options?: { forceRefresh?: boolean },
): Promise<YtmHomeSection> {
    if (!options?.forceRefresh) {
        const cached = peekYtmusicPlaylistCache(playlist.playlistId);
        if (cached) return cached;
    }

    const bridge = getElectronBridge();
    if (!bridge?.ytmusicGetPlaylist) {
        throw new Error('YouTube Music playlist is only available in the desktop app');
    }

    const result = await bridge.ytmusicGetPlaylist({
        playlistId: playlist.playlistId,
        title: playlist.title,
        coverUrl: playlist.coverUrl,
        limit,
        forceRefresh: options?.forceRefresh,
    });
    if (!result.ok || !result.section) {
        throw new Error(result.error || 'Failed to load playlist');
    }
    playlistSessionCache.set(playlist.playlistId, {
        fetchedAt: Date.now(),
        section: result.section,
    });
    return result.section;
}

/** Load empty-state recommendation sections (expanded public home playlists). */
export async function fetchYtmusicHome(options?: { forceRefresh?: boolean }): Promise<YtmHomeSection[]> {
    const bridge = getElectronBridge();
    if (!bridge?.ytmusicGetHome) {
        throw new Error('YouTube Music home is only available in the desktop app');
    }

    const result = await bridge.ytmusicGetHome({ forceRefresh: options?.forceRefresh });
    if (!result.ok) {
        throw new Error(result.error || 'YouTube Music home failed');
    }
    return Array.isArray(result.sections) ? result.sections : [];
}

export async function resolveYtmusicStream(videoId: string): Promise<YtmStreamInfo & { playbackUrl: string }> {
    const bridge = getElectronBridge();
    if (!bridge?.ytmusicResolveStream) {
        throw new Error('YouTube Music is only available in the desktop app');
    }

    const result = await bridge.ytmusicResolveStream({ videoId });
    if (!result.ok || !result.stream?.url) {
        throw new Error(result.error || 'Failed to resolve YouTube Music stream');
    }
    const playbackUrl = (result.stream as YtmStreamInfo & { playbackUrl?: string }).playbackUrl;
    if (!playbackUrl) {
        throw new Error('YouTube Music proxy playback URL missing');
    }
    return {
        ...result.stream,
        playbackUrl,
    };
}

/** Local proxy URLs are always fresh; googlevideo URLs honor expireAt. */
export function isYtmusicStreamFresh(
    streamUrl: string | null | undefined,
    expireAt: number | null | undefined,
    nowMs = Date.now(),
): boolean {
    if (!streamUrl) return false;
    if (isYtmusicPlaybackUrl(streamUrl)) return true;
    if (expireAt == null) return true;
    return expireAt - 60_000 > nowMs;
}

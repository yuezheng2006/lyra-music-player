import type { LyricData } from '../../../types';
import { LyricParserFactory } from '../LyricParserFactory';

// src/utils/lyrics/providers/lrclibLyricProvider.ts
// Public LRCLib API for timed lyrics (good coverage for overseas catalog).

export type LrclibSearchHit = {
    id: number;
    name: string;
    trackName: string;
    artistName: string;
    albumName?: string;
    duration?: number;
    instrumental?: boolean;
    plainLyrics?: string | null;
    syncedLyrics?: string | null;
};

const LRCLIB_BASE = 'https://lrclib.net/api';

function buildSearchUrl(params: {
    title: string;
    artist: string;
    album?: string | null;
    durationSec?: number | null;
}): string {
    const url = new URL(`${LRCLIB_BASE}/search`);
    url.searchParams.set('track_name', params.title);
    url.searchParams.set('artist_name', params.artist);
    if (params.album) url.searchParams.set('album_name', params.album);
    return url.toString();
}

function buildGetUrl(params: {
    title: string;
    artist: string;
    album?: string | null;
    durationSec?: number | null;
}): string {
    const url = new URL(`${LRCLIB_BASE}/get`);
    url.searchParams.set('track_name', params.title);
    url.searchParams.set('artist_name', params.artist);
    if (params.album) url.searchParams.set('album_name', params.album);
    if (params.durationSec != null && Number.isFinite(params.durationSec)) {
        url.searchParams.set('duration', String(Math.round(params.durationSec)));
    }
    return url.toString();
}

async function fetchJson<T>(url: string): Promise<T | null> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'LyraMusicPlayer (https://github.com/yuezheng2006/lyra-music-player)',
        },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`LRCLib request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
}

function parseSyncedOrPlain(synced?: string | null, plain?: string | null): Promise<LyricData | null> {
    const syncedText = synced?.trim();
    if (syncedText) {
        return LyricParserFactory.parse({ type: 'local', lrcContent: syncedText });
    }
    const plainText = plain?.trim();
    if (!plainText) return Promise.resolve(null);
    // Untimed plain lyrics: wrap as a single zero-offset block via LRC-less content.
    return LyricParserFactory.parse({ type: 'local', lrcContent: plainText });
}

/** Fetch best LRCLib lyrics for a track; prefers duration-matched get, then search. */
export async function fetchLrclibLyrics(params: {
    title: string;
    artist: string;
    album?: string | null;
    durationMs?: number | null;
}): Promise<{ lyrics: LyricData; instrumental?: boolean } | null> {
    const title = params.title.trim();
    const artist = params.artist.trim();
    if (!title || !artist) return null;

    const durationSec = params.durationMs != null && params.durationMs > 0
        ? params.durationMs / 1000
        : null;

    try {
        const exact = await fetchJson<LrclibSearchHit>(buildGetUrl({
            title,
            artist,
            album: params.album,
            durationSec,
        }));
        if (exact) {
            if (exact.instrumental) {
                return { lyrics: { lines: [] }, instrumental: true };
            }
            const lyrics = await parseSyncedOrPlain(exact.syncedLyrics, exact.plainLyrics);
            if (lyrics?.lines?.length) return { lyrics };
        }
    } catch {
        // continue to search
    }

    const hits = await fetchJson<LrclibSearchHit[]>(buildSearchUrl({
        title,
        artist,
        album: params.album,
        durationSec,
    }));
    if (!Array.isArray(hits) || hits.length === 0) return null;

    const scored = hits
        .map((hit) => {
            const hitDuration = hit.duration != null ? Number(hit.duration) : null;
            let score = 0;
            if (durationSec != null && hitDuration != null) {
                const delta = Math.abs(hitDuration - durationSec);
                if (delta <= 2) score += 3;
                else if (delta <= 5) score += 1;
                else score -= 2;
            }
            if (hit.syncedLyrics) score += 2;
            if (hit.instrumental) score -= 1;
            return { hit, score };
        })
        .sort((a, b) => b.score - a.score);

    for (const { hit } of scored) {
        if (hit.instrumental) {
            return { lyrics: { lines: [] }, instrumental: true };
        }
        const lyrics = await parseSyncedOrPlain(hit.syncedLyrics, hit.plainLyrics);
        if (lyrics?.lines?.length) return { lyrics };
    }

    return null;
}

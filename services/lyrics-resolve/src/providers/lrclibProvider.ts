// services/lyrics-resolve/src/providers/lrclibProvider.ts
// Overseas LRCLib adapter with Butler-style title cleaning + duration gate.

import { parseLyricsByFormat } from '@lyra/utils/lyrics/parserCore';
import { detectNonTtmlTimedLyricFormat } from '@lyra/utils/lyrics/formatDetection';
import {
    cleanArtistForLrclib,
    cleanTitleForLrclib,
} from '@lyra/utils/lyrics/cleanTitleForLrclib';
import type { LyricData } from '@lyra/types';

const LRCLIB_BASE = 'https://lrclib.net/api';
const DURATION_TOLERANCE_SEC = 2;

export type LrclibFetchInput = {
    title: string;
    artist: string;
    album?: string;
    durationMs?: number;
};

export type LrclibFetchResult = {
    lyrics: LyricData | null;
    isPureMusic?: boolean;
    platformId?: string;
};

type LrclibHit = {
    id?: number;
    trackName?: string;
    artistName?: string;
    albumName?: string;
    duration?: number;
    instrumental?: boolean;
    plainLyrics?: string | null;
    syncedLyrics?: string | null;
};

async function fetchJson<T>(url: string): Promise<T | null> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'LyraLyricsResolve/1.0 (private)',
        },
        signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`LRCLib HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
}

function hasLyrics(hit: LrclibHit | null | undefined): boolean {
    return Boolean(hit?.plainLyrics?.trim() || hit?.syncedLyrics?.trim());
}

function durationOk(hit: LrclibHit, expectedSec: number | null): boolean {
    if (expectedSec == null || expectedSec <= 0) return true;
    const dur = hit.duration;
    if (dur == null || !Number.isFinite(dur)) return true;
    return Math.abs(dur - expectedSec) <= DURATION_TOLERANCE_SEC;
}

function parseHit(hit: LrclibHit): LyricData | null {
    const synced = hit.syncedLyrics?.trim();
    if (synced) {
        const format = detectNonTtmlTimedLyricFormat(synced);
        const lyrics = parseLyricsByFormat(format, synced) as LyricData;
        if (lyrics?.lines?.length) {
            lyrics.isWordByWord = format === 'enhanced-lrc';
            return lyrics;
        }
    }
    const plain = hit.plainLyrics?.trim();
    if (!plain) return null;
    const lyrics = parseLyricsByFormat('lrc', plain) as LyricData;
    if (!lyrics?.lines?.length) return null;
    lyrics.isWordByWord = false;
    return lyrics;
}

export type LrclibSourcePort = {
    fetch: (input: LrclibFetchInput) => Promise<LrclibFetchResult>;
};

export function createLrclibProvider(): LrclibSourcePort {
    return {
        fetch: async (input) => {
            const artist = cleanArtistForLrclib(input.artist || '');
            const title = cleanTitleForLrclib(input.title || '', artist);
            if (!title) {
                return { lyrics: null };
            }

            const expectedSec = input.durationMs != null && input.durationMs > 0
                ? input.durationMs / 1000
                : null;

            // Stage 1: exact get
            try {
                const url = new URL(`${LRCLIB_BASE}/get`);
                url.searchParams.set('track_name', title);
                url.searchParams.set('artist_name', artist || ' ');
                if (input.album) url.searchParams.set('album_name', input.album);
                if (expectedSec != null) {
                    url.searchParams.set('duration', String(Math.round(expectedSec)));
                }
                const exact = await fetchJson<LrclibHit>(url.toString());
                if (exact?.instrumental) {
                    return {
                        lyrics: null,
                        isPureMusic: true,
                        platformId: exact.id != null ? String(exact.id) : undefined,
                    };
                }
                if (exact && hasLyrics(exact) && durationOk(exact, expectedSec)) {
                    return {
                        lyrics: parseHit(exact),
                        platformId: exact.id != null ? String(exact.id) : undefined,
                    };
                }
            } catch (error) {
                console.warn('[lyrics-resolve] LRCLib get failed:', error);
            }

            // Stage 2: search variants, pick closest duration within tolerance
            const attempts: Array<Record<string, string>> = [
                { track_name: title, artist_name: artist },
                { track_name: title },
                { q: `${title} ${artist}`.trim() },
                { q: title },
            ];

            let best: LrclibHit | null = null;
            let bestDiff: number | null = null;

            for (const params of attempts) {
                try {
                    const url = new URL(`${LRCLIB_BASE}/search`);
                    for (const [key, value] of Object.entries(params)) {
                        if (value) url.searchParams.set(key, value);
                    }
                    const items = await fetchJson<LrclibHit[]>(url.toString());
                    if (!Array.isArray(items)) continue;

                    for (const item of items.slice(0, 8)) {
                        if (item.instrumental && (!best || expectedSec == null)) {
                            return {
                                lyrics: null,
                                isPureMusic: true,
                                platformId: item.id != null ? String(item.id) : undefined,
                            };
                        }
                        if (!hasLyrics(item)) continue;
                        if (expectedSec == null) {
                            return {
                                lyrics: parseHit(item),
                                platformId: item.id != null ? String(item.id) : undefined,
                            };
                        }
                        const dur = item.duration;
                        if (dur == null || !Number.isFinite(dur)) continue;
                        const diff = Math.abs(dur - expectedSec);
                        if (diff <= DURATION_TOLERANCE_SEC && (bestDiff == null || diff < bestDiff)) {
                            best = item;
                            bestDiff = diff;
                        }
                    }
                    if (best) break;
                } catch (error) {
                    console.warn('[lyrics-resolve] LRCLib search failed:', error);
                }
            }

            if (!best) {
                return { lyrics: null };
            }
            return {
                lyrics: parseHit(best),
                platformId: best.id != null ? String(best.id) : undefined,
            };
        },
    };
}

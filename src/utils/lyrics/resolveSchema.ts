// src/utils/lyrics/resolveSchema.ts
// Frozen contract for the private word-by-word lyrics resolve service.

import type { LyricData, LyricProviderSource } from '../../types';

export type LyricsResolveStatus = 'matched' | 'pure_music' | 'not_found';

export type LyricsResolvePreferredSource = Extract<
    LyricProviderSource,
    'netease' | 'amll' | 'qq' | 'kugou' | 'lrclib'
>;

export type LyricsResolveHints = {
    neteaseId?: number | string;
    qqMid?: string;
    preferredSource?: LyricsResolvePreferredSource;
};

export type LyricsResolvePolicy = {
    /** Default true: only accept isWordByWord lyrics as matched from domestic sources. */
    requireWordByWord?: boolean;
    /** Default false: accept non-word-by-word from domestic sources. */
    allowLineSyncedFallback?: boolean;
    /**
     * Default true: after domestic word-by-word sources fail, try LRCLib
     * (overseas line-synced / plain). LRCLib hits are accepted even when
     * requireWordByWord is true.
     */
    tryLrclibFallback?: boolean;
    /** Overall resolve budget in ms. */
    timeoutMs?: number;
};

export type LyricsResolveRequest = {
    title: string;
    artist: string;
    album?: string;
    durationMs?: number;
    hints?: LyricsResolveHints;
    policy?: LyricsResolvePolicy;
};

export type LyricsResolveProvenance = {
    source: LyricsResolvePreferredSource;
    platformId: string;
    amllPlatform?: 'ncm' | 'qq';
    matchScore?: number;
    qqMid?: string;
    kgHash?: string;
    cacheHit?: boolean;
};

export type LyricsResolveResponse = {
    status: LyricsResolveStatus;
    lyrics: LyricData | null;
    provenance: LyricsResolveProvenance | null;
    fingerprint: string;
    elapsedMs: number;
};

export const DEFAULT_LYRICS_RESOLVE_POLICY: Required<LyricsResolvePolicy> = {
    requireWordByWord: true,
    allowLineSyncedFallback: false,
    tryLrclibFallback: true,
    timeoutMs: 8000,
};

const PREFERRED_SOURCES: readonly LyricsResolvePreferredSource[] = [
    'netease',
    'amll',
    'qq',
    'kugou',
    'lrclib',
];

function isPreferredSource(value: unknown): value is LyricsResolvePreferredSource {
    return typeof value === 'string' && (PREFERRED_SOURCES as readonly string[]).includes(value);
}

export function normalizeLyricsResolveRequest(input: unknown): LyricsResolveRequest {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid resolve request: expected object');
    }
    const body = input as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
        throw new Error('Invalid resolve request: title is required');
    }
    const artist = typeof body.artist === 'string' ? body.artist.trim() : '';
    const album = typeof body.album === 'string' ? body.album.trim() : undefined;
    const durationMs = typeof body.durationMs === 'number' && Number.isFinite(body.durationMs)
        ? body.durationMs
        : 0;

    const hintsRaw = body.hints && typeof body.hints === 'object'
        ? body.hints as Record<string, unknown>
        : undefined;
    const policyRaw = body.policy && typeof body.policy === 'object'
        ? body.policy as Record<string, unknown>
        : undefined;

    const preferredSource = hintsRaw?.preferredSource;
    const hints: LyricsResolveHints | undefined = hintsRaw
        ? {
            ...(hintsRaw.neteaseId !== undefined ? { neteaseId: hintsRaw.neteaseId as number | string } : {}),
            ...(typeof hintsRaw.qqMid === 'string' ? { qqMid: hintsRaw.qqMid } : {}),
            ...(isPreferredSource(preferredSource) ? { preferredSource } : {}),
        }
        : undefined;

    const policy: LyricsResolvePolicy | undefined = policyRaw
        ? {
            requireWordByWord: typeof policyRaw.requireWordByWord === 'boolean'
                ? policyRaw.requireWordByWord
                : undefined,
            allowLineSyncedFallback: typeof policyRaw.allowLineSyncedFallback === 'boolean'
                ? policyRaw.allowLineSyncedFallback
                : undefined,
            tryLrclibFallback: typeof policyRaw.tryLrclibFallback === 'boolean'
                ? policyRaw.tryLrclibFallback
                : undefined,
            timeoutMs: typeof policyRaw.timeoutMs === 'number' && Number.isFinite(policyRaw.timeoutMs)
                ? policyRaw.timeoutMs
                : undefined,
        }
        : undefined;

    return {
        title,
        artist,
        ...(album ? { album } : {}),
        durationMs,
        ...(hints && Object.keys(hints).length > 0 ? { hints } : {}),
        ...(policy ? { policy } : {}),
    };
}

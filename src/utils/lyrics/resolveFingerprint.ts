// src/utils/lyrics/resolveFingerprint.ts
// Stable cache fingerprint for lyrics resolve requests.

import { normalizeLyricMatchText } from './matchScore';
import { normalizeLyricMatchDurationMs } from './duration';
import type { LyricsResolveRequest } from './resolveSchema';

const DURATION_BUCKET_MS = 1000;

/** Builds a cache key from normalized metadata (title|artist|album|durationBucket). */
export function buildLyricsResolveFingerprint(request: Pick<
    LyricsResolveRequest,
    'title' | 'artist' | 'album' | 'durationMs'
>): string {
    const title = normalizeLyricMatchText(request.title || '');
    const artist = normalizeLyricMatchText(request.artist || '');
    const album = normalizeLyricMatchText(request.album || '');
    const durationMs = normalizeLyricMatchDurationMs(request.durationMs);
    const durationBucket = durationMs > 0
        ? Math.round(durationMs / DURATION_BUCKET_MS) * DURATION_BUCKET_MS
        : 0;
    return `${title}|${artist}|${album}|${durationBucket}`;
}

// services/lyrics-resolve/src/index.ts
// Public library surface for the private lyrics resolve service.

export { ApiKeyGate, TEMP_DEV_API_KEY } from './auth';
export { LyricsResolveCache } from './cache';
export { createDefaultProviders } from './providers/createDefaultProviders';
export { resolveLyrics } from './resolve/resolveLyrics';
export { selectBestCandidate } from './resolve/selectCandidate';
export {
    buildLyricsResolveFingerprint,
    DEFAULT_LYRICS_RESOLVE_POLICY,
    normalizeLyricsResolveRequest,
} from './schema';
export type {
    LyricsResolveHints,
    LyricsResolvePolicy,
    LyricsResolvePreferredSource,
    LyricsResolveProvenance,
    LyricsResolveRequest,
    LyricsResolveResponse,
    LyricsResolveStatus,
} from './schema';

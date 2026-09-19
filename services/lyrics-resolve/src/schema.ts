// services/lyrics-resolve/src/schema.ts
// Re-export frozen resolve contract from the player tree (single source of truth).

export {
    DEFAULT_LYRICS_RESOLVE_POLICY,
    normalizeLyricsResolveRequest,
    type LyricsResolveHints,
    type LyricsResolvePolicy,
    type LyricsResolvePreferredSource,
    type LyricsResolveProvenance,
    type LyricsResolveRequest,
    type LyricsResolveResponse,
    type LyricsResolveStatus,
} from '@lyra/utils/lyrics/resolveSchema';

export { buildLyricsResolveFingerprint } from '@lyra/utils/lyrics/resolveFingerprint';

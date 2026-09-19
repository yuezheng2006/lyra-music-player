// src/utils/lyrics/resolveBestLyric.ts
// Prefer private remote resolve service; fall back to in-process autoMatchBestLyric.

import type { AutoMatchBestLyricOptions, AutoMatchBestLyricResult } from './autoMatchBestLyric';
import { autoMatchBestLyric } from './autoMatchBestLyric';
import {
    fetchRemoteLyricsResolve,
    isLyricsResolveServiceConfigured,
} from '../../services/lyricsResolveClient';
import type { LyricsResolvePreferredSource } from './resolveSchema';

function mapRemoteToAutoMatch(
    remote: Awaited<ReturnType<typeof fetchRemoteLyricsResolve>>,
): AutoMatchBestLyricResult {
    if (!remote) {
        return null;
    }
    if (remote.status === 'pure_music') {
        return { isPureMusic: true };
    }
    if (remote.status !== 'matched' || !remote.lyrics || !remote.provenance) {
        return null;
    }
    return {
        lyrics: remote.lyrics,
        source: remote.provenance.source,
        id: remote.provenance.platformId,
        qqMid: remote.provenance.qqMid,
        kgHash: remote.provenance.kgHash,
        matchedLyricsProviderPlatform: remote.provenance.amllPlatform,
        isPureMusic: false,
    };
}

/**
 * Resolves best word-by-word lyrics for arbitrary tracks.
 * Remote service is used when configured; local matching remains the fallback.
 */
export async function resolveBestLyric(
    title: string,
    artist: string,
    durationMs: number,
    options: AutoMatchBestLyricOptions = {},
): Promise<AutoMatchBestLyricResult> {
    if (isLyricsResolveServiceConfigured()) {
        const preferredSource = options.preferredSource as LyricsResolvePreferredSource | undefined;
        const remote = await fetchRemoteLyricsResolve({
            title,
            artist,
            album: options.album,
            durationMs,
            hints: {
                ...(options.neteaseCandidate?.id != null
                    ? { neteaseId: options.neteaseCandidate.id }
                    : {}),
                ...(preferredSource
                    && (preferredSource === 'netease'
                        || preferredSource === 'amll'
                        || preferredSource === 'qq'
                        || preferredSource === 'kugou'
                        || preferredSource === 'lrclib')
                    ? { preferredSource }
                    : {}),
            },
            policy: {
                requireWordByWord: true,
                allowLineSyncedFallback: false,
                tryLrclibFallback: true,
                timeoutMs: 8000,
            },
        });
        const mapped = mapRemoteToAutoMatch(remote);
        if (mapped) {
            return mapped;
        }
        // Remote not_found / transport failure → fall through to in-process match.
        if (remote?.status === 'not_found') {
            console.log('[resolveBestLyric] Remote returned not_found; trying in-process fallback');
        }
    }

    return autoMatchBestLyric(title, artist, durationMs, options);
}

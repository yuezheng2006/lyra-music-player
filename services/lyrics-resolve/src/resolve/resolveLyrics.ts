// services/lyrics-resolve/src/resolve/resolveLyrics.ts
// Multi-source lyric resolve: domestic word-by-word first, LRCLib overseas fallback.

import { buildLyricSearchQuery } from '@lyra/utils/lyrics/searchQuery';
import { normalizeLyricMatchDurationMs } from '@lyra/utils/lyrics/duration';
import type { AmllSourcePort, LyricSourcePort, ResolveCandidate } from '../providers/types';
import type { LrclibSourcePort } from '../providers/lrclibProvider';
import {
    DEFAULT_LYRICS_RESOLVE_POLICY,
    type LyricsResolvePreferredSource,
    type LyricsResolveRequest,
    type LyricsResolveResponse,
} from '../schema';
import { buildLyricsResolveFingerprint } from '../schema';
import { selectBestCandidate, type MatchTarget } from './selectCandidate';
import type { LyricsResolveCache } from '../cache';

const PROVIDER_SEARCH_TIMEOUT_MS = 3500;
const PROVIDER_LYRIC_TIMEOUT_MS = 5000;
const DOMESTIC_ORDER: LyricsResolvePreferredSource[] = ['netease', 'amll', 'qq', 'kugou'];

export type ResolveDeps = {
    providers: Partial<Record<'netease' | 'qq' | 'kugou', LyricSourcePort>>;
    amll: AmllSourcePort;
    lrclib?: LrclibSourcePort;
    cache?: LyricsResolveCache;
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

function acceptsDomesticLyrics(
    lyrics: { isWordByWord?: boolean } | null,
    requireWordByWord: boolean,
    allowLineSyncedFallback: boolean,
): boolean {
    if (!lyrics) return false;
    if (lyrics.isWordByWord) return true;
    if (!requireWordByWord && allowLineSyncedFallback) return true;
    return false;
}

function buildSourceOrder(preferred?: LyricsResolvePreferredSource): LyricsResolvePreferredSource[] {
    if (!preferred) {
        return [...DOMESTIC_ORDER, 'lrclib'];
    }
    if (preferred === 'lrclib') {
        return ['lrclib', ...DOMESTIC_ORDER];
    }
    return [preferred, ...DOMESTIC_ORDER.filter(s => s !== preferred), 'lrclib'];
}

export async function resolveLyrics(
    request: LyricsResolveRequest,
    deps: ResolveDeps,
): Promise<LyricsResolveResponse> {
    const started = Date.now();
    const policy = { ...DEFAULT_LYRICS_RESOLVE_POLICY, ...request.policy };
    const fingerprint = buildLyricsResolveFingerprint(request);

    if (deps.cache) {
        const cached = deps.cache.get(fingerprint);
        if (cached) {
            return {
                ...cached,
                provenance: cached.provenance
                    ? { ...cached.provenance, cacheHit: true }
                    : null,
                fingerprint,
                elapsedMs: Date.now() - started,
            };
        }
    }

    const target: MatchTarget = {
        title: request.title,
        artist: request.artist || '',
        album: request.album,
        durationMs: normalizeLyricMatchDurationMs(request.durationMs),
    };
    const searchQuery = buildLyricSearchQuery(request.title, request.artist, request.album);
    const preferred = request.hints?.preferredSource;
    const order = buildSourceOrder(preferred);

    const overallDeadline = started + policy.timeoutMs;
    const remaining = () => Math.max(0, overallDeadline - Date.now());

    let neteaseCandidates: ResolveCandidate[] | null = null;

    const getNeteaseCandidates = async (): Promise<ResolveCandidate[]> => {
        if (neteaseCandidates) return neteaseCandidates;
        if (request.hints?.neteaseId != null) {
            neteaseCandidates = [{
                id: request.hints.neteaseId,
                name: request.title,
                artists: request.artist ? [{ name: request.artist }] : [],
                duration: target.durationMs,
                dt: target.durationMs,
                album: request.album ? { name: request.album } : undefined,
            }];
            return neteaseCandidates;
        }
        const port = deps.providers.netease;
        if (!port || remaining() <= 0) {
            neteaseCandidates = [];
            return neteaseCandidates;
        }
        const songs = await withTimeout(
            port.search(searchQuery, 10),
            Math.min(PROVIDER_SEARCH_TIMEOUT_MS, remaining()),
            [],
        );
        const best = selectBestCandidate(songs, target);
        neteaseCandidates = best ? [best.candidate] : [];
        return neteaseCandidates;
    };

    const finish = (
        status: LyricsResolveResponse['status'],
        lyrics: LyricsResolveResponse['lyrics'],
        provenance: LyricsResolveResponse['provenance'],
    ): LyricsResolveResponse => {
        const response: LyricsResolveResponse = {
            status,
            lyrics,
            provenance,
            fingerprint,
            elapsedMs: Date.now() - started,
        };
        deps.cache?.set(fingerprint, {
            status: response.status,
            lyrics: response.lyrics,
            provenance: response.provenance,
            fingerprint,
        });
        return response;
    };

    const tryLrclib = async (): Promise<LyricsResolveResponse | null> => {
        if (!deps.lrclib || remaining() <= 0) {
            return null;
        }
        try {
            const fetched = await withTimeout(
                deps.lrclib.fetch({
                    title: request.title,
                    artist: request.artist || '',
                    album: request.album,
                    durationMs: target.durationMs,
                }),
                Math.min(PROVIDER_LYRIC_TIMEOUT_MS, remaining()),
                { lyrics: null },
            );
            if (fetched.isPureMusic) {
                return finish('pure_music', null, {
                    source: 'lrclib',
                    platformId: fetched.platformId || 'instrumental',
                });
            }
            if (fetched.lyrics?.lines?.length) {
                return finish('matched', fetched.lyrics, {
                    source: 'lrclib',
                    platformId: fetched.platformId || 'lrclib',
                });
            }
        } catch (error) {
            console.warn('[lyrics-resolve] lrclib failed:', error);
        }
        return null;
    };

    for (const source of order) {
        if (remaining() <= 0) break;

        if (source === 'lrclib') {
            const shouldTry = preferred === 'lrclib' || policy.tryLrclibFallback;
            if (!shouldTry) continue;
            const lrclibResult = await tryLrclib();
            if (lrclibResult) return lrclibResult;
            continue;
        }

        if (source === 'netease') {
            const port = deps.providers.netease;
            if (!port) continue;
            try {
                const candidates = await getNeteaseCandidates();
                for (const candidate of candidates) {
                    if (remaining() <= 0) break;
                    const fetched = await withTimeout(
                        port.fetchLyrics(candidate),
                        Math.min(PROVIDER_LYRIC_TIMEOUT_MS, remaining()),
                        { lyrics: null },
                    );
                    if (fetched.isPureMusic) {
                        return finish('pure_music', null, {
                            source: 'netease',
                            platformId: String(candidate.id),
                        });
                    }
                    if (acceptsDomesticLyrics(
                        fetched.lyrics,
                        policy.requireWordByWord,
                        policy.allowLineSyncedFallback,
                    )) {
                        const scored = selectBestCandidate([candidate], target);
                        return finish('matched', fetched.lyrics, {
                            source: 'netease',
                            platformId: String(candidate.id),
                            matchScore: scored?.score ?? fetched.matchScore,
                        });
                    }
                }
            } catch (error) {
                console.warn('[lyrics-resolve] netease failed:', error);
            }
            continue;
        }

        if (source === 'amll') {
            try {
                const candidates = await getNeteaseCandidates();
                for (const candidate of candidates) {
                    if (remaining() <= 0) break;
                    const lyrics = await withTimeout(
                        deps.amll.fetchByPlatformId('ncm', candidate.id),
                        Math.min(PROVIDER_LYRIC_TIMEOUT_MS, remaining()),
                        null,
                    );
                    if (acceptsDomesticLyrics(
                        lyrics,
                        policy.requireWordByWord,
                        policy.allowLineSyncedFallback,
                    )) {
                        const scored = selectBestCandidate([candidate], target);
                        return finish('matched', lyrics, {
                            source: 'amll',
                            platformId: String(candidate.id),
                            amllPlatform: 'ncm',
                            matchScore: scored?.score,
                        });
                    }
                }
            } catch (error) {
                console.warn('[lyrics-resolve] amll failed:', error);
            }
            continue;
        }

        if (source === 'qq' || source === 'kugou') {
            const port = deps.providers[source];
            if (!port) continue;
            try {
                const songs = await withTimeout(
                    port.search(searchQuery, 10),
                    Math.min(PROVIDER_SEARCH_TIMEOUT_MS, remaining()),
                    [],
                );
                const best = selectBestCandidate(songs, target);
                if (!best) continue;
                const fetched = await withTimeout(
                    port.fetchLyrics(best.candidate),
                    Math.min(PROVIDER_LYRIC_TIMEOUT_MS, remaining()),
                    { lyrics: null },
                );
                if (acceptsDomesticLyrics(
                    fetched.lyrics,
                    policy.requireWordByWord,
                    policy.allowLineSyncedFallback,
                )) {
                    return finish('matched', fetched.lyrics, {
                        source,
                        platformId: String(best.candidate.id),
                        matchScore: best.score,
                        ...(source === 'qq' ? { qqMid: best.candidate.qqMid } : {}),
                        ...(source === 'kugou' ? { kgHash: best.candidate.kgHash } : {}),
                    });
                }
            } catch (error) {
                console.warn(`[lyrics-resolve] ${source} failed:`, error);
            }
        }
    }

    return finish('not_found', null, null);
}

export const NOW_PLAYING_WS_PROGRESS_FRESH_MS = 4_000;
export const NOW_PLAYING_REST_CORRECTION_INTERVAL_MS = 15_000;

export type NowPlayingRestQueryReason = 'poll' | 'pause-boundary' | 'resume-boundary';

// src/utils/nowPlaying/nowPlayingRestProgressMath.ts
// REST /api/query/progress is a drift check, not the clock, when WS progress is fresh.

export const shouldQueryNowPlayingRestProgress = ({
    lastPreciseWsAtMs,
    nowMs,
    reason,
}: {
    lastPreciseWsAtMs: number;
    nowMs: number;
    reason: NowPlayingRestQueryReason;
}): boolean => {
    if (!Number.isFinite(lastPreciseWsAtMs) || lastPreciseWsAtMs <= 0) return true;
    const age = nowMs - lastPreciseWsAtMs;
    if (reason === 'poll') return age >= NOW_PLAYING_WS_PROGRESS_FRESH_MS;
    return age >= NOW_PLAYING_WS_PROGRESS_FRESH_MS;
};

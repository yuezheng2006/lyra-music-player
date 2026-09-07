// src/utils/playback/globalLyricTimelineOffsetMath.ts
// Device-level lyric clock offset, stacked with the per-song ADR-0006 offset.

export const GLOBAL_LYRIC_TIMELINE_OFFSET_STORAGE_KEY = 'global_lyric_timeline_offset_ms';
export const GLOBAL_LYRIC_TIMELINE_OFFSET_LIMIT_MS = 2000;

export const clampGlobalLyricTimelineOffsetMs = (value: number): number => {
    if (!Number.isFinite(value)) return 0;
    return Math.round(Math.min(
        GLOBAL_LYRIC_TIMELINE_OFFSET_LIMIT_MS,
        Math.max(-GLOBAL_LYRIC_TIMELINE_OFFSET_LIMIT_MS, value),
    ));
};

export const readStoredGlobalLyricTimelineOffsetMs = (): number => {
    if (typeof window === 'undefined') return 0;
    return clampGlobalLyricTimelineOffsetMs(Number(localStorage.getItem(GLOBAL_LYRIC_TIMELINE_OFFSET_STORAGE_KEY)));
};

export const persistGlobalLyricTimelineOffsetMs = (offsetMs: number): number => {
    const next = clampGlobalLyricTimelineOffsetMs(offsetMs);
    if (typeof window !== 'undefined') {
        localStorage.setItem(GLOBAL_LYRIC_TIMELINE_OFFSET_STORAGE_KEY, String(next));
    }
    return next;
};

export const resolveEffectiveLyricTimelineOffsetMs = (
    songOffsetMs: number,
    globalOffsetMs: number,
): number => (Number.isFinite(songOffsetMs) ? songOffsetMs : 0)
    + (Number.isFinite(globalOffsetMs) ? globalOffsetMs : 0);

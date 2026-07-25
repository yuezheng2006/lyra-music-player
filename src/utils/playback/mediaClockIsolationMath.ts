import { resolveLyricPlaybackTimes } from './syncLyricPlaybackClock';

// src/utils/playback/mediaClockIsolationMath.ts
// Playback isolation contract: media clocks never depend on visualizer RAF / WebGL.
// Visual layer may crash or demote; dock progress + lyric time must still advance
// from HTMLAudioElement.currentTime (via timeupdate / interval backups).

/** Hard floor: given only an audio element clock, derive dock + lyric times. */
export const resolveMediaClocksFromAudioElement = (input: {
    audioCurrentTimeSec: number;
    lyricTimelineOffsetMs?: number;
}): { currentTimeSec: number; lyricTimeSec: number } => (
    resolveLyricPlaybackTimes({
        audioCurrentTimeSec: input.audioCurrentTimeSec,
        lyricTimelineOffsetMs: input.lyricTimelineOffsetMs ?? 0,
    })
);

/** Progress fill percent for DOM-only scrubber paints (no React state per tick). */
export const resolveProgressFillPercent = (
    currentTimeSec: number,
    durationSec: number,
): number => (
    durationSec > 0
        ? Math.min(100, Math.max(0, (currentTimeSec / durationSec) * 100))
        : 0
);

/**
 * Visual GPU recovery must never pause audio or clear the media source.
 * Call sites that handle gpu.process_gone should only demote background mode.
 */
export const GPU_RECOVERY_MAY_TOUCH_PLAYBACK = false;

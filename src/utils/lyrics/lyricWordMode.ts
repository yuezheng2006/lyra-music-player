import type { Line, LyricWordMode } from '../../types';

// src/utils/lyrics/lyricWordMode.ts
// Lyric-module policy: default hides future text; karaoke previews upcoming words/lines.

export type { LyricWordMode };

export const LYRIC_WORD_MODE_STORAGE_KEY = 'lyric_word_mode';
export const DEFAULT_LYRIC_WORD_MODE: LyricWordMode = 'default';
export const KARAOKE_UPCOMING_LINE_COUNT = 2;
/** Dim but readable opacity for not-yet-sung words/chars inside the active line. */
export const KARAOKE_WAITING_WORD_OPACITY = 0.72;

export type WaitingWordPresentation = {
    opacity: number;
    blurPx: number;
    /** Keep waiting words at their resting layout instead of the pre-entry scatter pose. */
    parkAtRest: boolean;
};

export const isLyricWordMode = (value: unknown): value is LyricWordMode => (
    value === 'default' || value === 'karaoke'
);

export const parseLyricWordMode = (value: unknown): LyricWordMode => (
    isLyricWordMode(value) ? value : DEFAULT_LYRIC_WORD_MODE
);

export const shouldShowUpcomingLyrics = (mode: LyricWordMode): boolean => mode === 'karaoke';

/** Monet-style multi-line rails: only preview future rows in karaoke mode. */
export const resolveLyricRailAfterCount = (
    mode: LyricWordMode,
    karaokeAfter = KARAOKE_UPCOMING_LINE_COUNT,
): number => (
    shouldShowUpcomingLyrics(mode) ? karaokeAfter : 0
);

export const resolveUpcomingLyricLines = <T extends Line>(
    nextLines: T[],
    mode: LyricWordMode,
): T[] => (shouldShowUpcomingLyrics(mode) ? nextLines : []);

/** Intra-line waiting words: hidden in default mode, readable preview in karaoke mode. */
export const resolveWaitingWordPresentation = (
    mode: LyricWordMode,
    hiddenOpacity = 0,
    hiddenBlurPx = 10,
): WaitingWordPresentation => (
    shouldShowUpcomingLyrics(mode)
        ? {
            opacity: KARAOKE_WAITING_WORD_OPACITY,
            blurPx: 0,
            parkAtRest: true,
        }
        : {
            opacity: hiddenOpacity,
            blurPx: hiddenBlurPx,
            parkAtRest: false,
        }
);

/**
 * Framer Motion animate key for word status.
 * Waiting must include mode so toggling default↔karaoke re-triggers variants
 * (animate="waiting" alone stays stuck when only variant defs change).
 */
export type LyricWordMotionStatus = 'waiting' | 'active' | 'passed';

export const resolveLyricWordAnimateKey = (
    status: LyricWordMotionStatus,
    mode: LyricWordMode,
): string => (status === 'waiting' ? `waiting-${mode}` : status);

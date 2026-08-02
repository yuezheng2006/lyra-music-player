import type { Line, LyricWordMode } from '../../types';
import { LYRIC_LINE_OPACITY } from '../theme/lyricColorPresets';

// src/utils/lyrics/lyricWordMode.ts
// Lyric-module policy: default hides future text; karaoke previews upcoming with KTV wipe.

export type { LyricWordMode };

export const LYRIC_WORD_MODE_STORAGE_KEY = 'lyric_word_mode';
export const DEFAULT_LYRIC_WORD_MODE: LyricWordMode = 'default';
export const KARAOKE_UPCOMING_LINE_COUNT = 2;
/** Dim but readable opacity for not-yet-sung words/chars inside the active line. */
export const KARAOKE_WAITING_WORD_OPACITY = LYRIC_LINE_OPACITY.karaokeUnsung;

export type WaitingWordPresentation = {
    opacity: number;
    blurPx: number;
    /** Keep waiting words at their resting layout instead of the pre-entry scatter pose. */
    parkAtRest: boolean;
};

export const isLyricWordMode = (value: unknown): value is LyricWordMode => (
    value === 'default' || value === 'karaoke'
);

export const parseLyricWordMode = (value: unknown): LyricWordMode => {
    // Legacy: "ktv" was a separate traditional wipe mode; fold into karaoke.
    if (value === 'ktv') return 'karaoke';
    return isLyricWordMode(value) ? value : DEFAULT_LYRIC_WORD_MODE;
};

/** Karaoke previews upcoming lines/words; default stays current-line only. */
export const shouldShowUpcomingLyrics = (mode: LyricWordMode): boolean => (
    mode === 'karaoke'
);

/** Per-grapheme LTR wipe fill — the true KTV sing-along reveal. */
export const shouldUseKaraokeWipe = (mode: LyricWordMode): boolean => mode === 'karaoke';

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

/** Intra-line waiting words: hidden in default mode, readable preview in karaoke. */
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
 * Waiting must differ for default vs karaoke so toggles re-trigger variants.
 */
export type LyricWordMotionStatus = 'waiting' | 'active' | 'passed';

export const resolveLyricWordAnimateKey = (
    status: LyricWordMotionStatus,
    mode: LyricWordMode,
): string => {
    if (status !== 'waiting') return status;
    return shouldShowUpcomingLyrics(mode) ? 'waiting-karaoke' : 'waiting-default';
};

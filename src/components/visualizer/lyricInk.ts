import type { Theme } from '../../types';
import { resolveWordColor } from './wordColoring';
import { colorWithAlpha } from './colorMix';
import {
    LYRIC_LINE_OPACITY,
    resolveLyricStageInkColors,
} from '../../utils/theme/lyricColorPresets';

// src/components/visualizer/lyricInk.ts
// Shared one-hue lyric fills: same primary body, contrast via opacity only.

export type LyricInkFills = {
    /** Full-opacity body / sung fill. */
    body: string;
    /** Alias of body for wipe / active fill (never a second hue). */
    sung: string;
    /** Dimmed underlay for unsung tokens on the active line. */
    unsung: string;
    /** Dimmed fill for waiting / passed neighbor lines. */
    inactive: string;
    /** Translation / meta chrome. */
    meta: string;
};

/** Resolves stage lyric fills from theme — one hue, opacity steps only. */
export const resolveLyricInkFills = (
    theme: Pick<Theme, 'primaryColor' | 'accentColor' | 'secondaryColor'>,
    inactiveAlpha: number = LYRIC_LINE_OPACITY.waitingNear,
): LyricInkFills => {
    const { titleColor, hintColor } = resolveLyricStageInkColors(theme);
    return {
        body: titleColor,
        sung: titleColor,
        unsung: colorWithAlpha(titleColor, LYRIC_LINE_OPACITY.karaokeUnsung),
        inactive: colorWithAlpha(titleColor, inactiveAlpha),
        meta: hintColor,
    };
};

/** Active / keyword word fill — falls back to primary body, never accent white. */
export const resolveLyricActiveWordColor = (
    wordText: string,
    theme: Pick<Theme, 'primaryColor' | 'wordColors'>,
    options?: { keywordColoringEnabled?: boolean },
): string => (
    resolveWordColor(wordText, theme.wordColors, theme.primaryColor, {
        keywordColoringEnabled: options?.keywordColoringEnabled,
        cjkMatchMode: 'exact',
    })
);

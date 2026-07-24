import type { Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';
import { resolveWordColor } from '../wordColoring';
import {
    LYRIC_LINE_OPACITY,
    resolveLyricStageInkColors,
} from '../../../utils/theme/lyricColorPresets';
import type { MonetVisibleLineEntry } from './monetLyricsModel';

// src/components/visualizer/monet/monetLineTone.ts
// Active / inactive lyric opacity + fill (kept out of MonetLyricsRail so HMR can refresh the rail).

export type MonetRailPresentation = 'monet' | 'karaoke';

export type MonetLineTone = {
    opacity: number;
    scale: number;
    blurPx: number;
    baseColor: string;
    fontWeight: number;
    zIndex: number;
    /** Extra tracking in px — inactive rows open up so active feels denser / heavier. */
    letterSpacingPx: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Resolve keyword / body color for a Monet token. */
export const resolveMonetWordColor = (
    wordText: string,
    theme: Theme,
    fallbackColor: string,
    keywordColoringEnabled = true,
): string => {
    return resolveWordColor(wordText, theme.wordColors, fallbackColor, {
        keywordColoringEnabled,
        cjkMatchMode: 'exact',
    });
};

/**
 * Active row owns size / weight / opacity; neighbors step down clearly in form and fill.
 * Alpha is baked into baseColor (wrapper opacity alone is too weak with wipe / stroke layers).
 */
export const resolveMonetLineTone = (
    entry: MonetVisibleLineEntry,
    theme: Theme,
    inactiveScale: number,
    presentation: MonetRailPresentation = 'monet',
    immersiveLyrics: boolean = false,
): MonetLineTone => {
    const { titleColor } = resolveLyricStageInkColors(theme);
    const bodyColor = titleColor;
    const weightBoost = immersiveLyrics ? 100 : 0;

    if (presentation === 'karaoke') {
        if (entry.status === 'active') {
            return {
                opacity: LYRIC_LINE_OPACITY.active,
                scale: immersiveLyrics ? 1.16 : 1.1,
                blurPx: 0,
                baseColor: colorWithAlpha(bodyColor, LYRIC_LINE_OPACITY.karaokeUnsung),
                fontWeight: Math.min(800 + weightBoost, 900),
                zIndex: 4,
                letterSpacingPx: immersiveLyrics ? -0.6 : -0.35,
            };
        }

        const distance = Math.max(Math.abs(entry.offset), 1);
        const isWaiting = entry.status === 'waiting';
        const waitingNear = Math.min(LYRIC_LINE_OPACITY.waitingNear, 0.5);
        const passedNear = Math.min(LYRIC_LINE_OPACITY.passedNear, 0.38);
        const lineAlpha = isWaiting
            ? clamp(
                waitingNear - (distance - 1) * LYRIC_LINE_OPACITY.waitingStep,
                LYRIC_LINE_OPACITY.waitingFar,
                waitingNear,
            )
            : clamp(
                passedNear - (distance - 1) * LYRIC_LINE_OPACITY.passedStep,
                LYRIC_LINE_OPACITY.passedFar,
                passedNear,
            );
        return {
            opacity: 1,
            scale: clamp(0.82 * Math.pow(0.94, distance - 1), 0.68, 0.82),
            // Keep blur off — size / weight / tracking carry the form contrast without GPU cost.
            blurPx: 0,
            baseColor: colorWithAlpha(bodyColor, lineAlpha),
            fontWeight: Math.min(isWaiting ? 500 + weightBoost : 420 + weightBoost, 700),
            zIndex: isWaiting ? 3 - distance : 2 - distance,
            letterSpacingPx: 0.8 + (distance - 1) * 0.35,
        };
    }

    if (entry.status === 'active') {
        return {
            opacity: LYRIC_LINE_OPACITY.active,
            scale: immersiveLyrics ? 1.14 : 1.1,
            blurPx: 0,
            baseColor: colorWithAlpha(bodyColor, LYRIC_LINE_OPACITY.karaokeUnsung),
            fontWeight: Math.min((immersiveLyrics ? 900 : 850) + weightBoost, 900),
            zIndex: 4,
            letterSpacingPx: immersiveLyrics ? -0.7 : -0.4,
        };
    }

    const distance = Math.max(Math.abs(entry.offset), 1);
    const isWaiting = entry.status === 'waiting';
    // Smaller base + steeper falloff so current line size contrast is obvious.
    const scale = clamp(inactiveScale * Math.pow(0.9, distance - 1), 0.64, 0.8);
    const waitingNear = Math.min(LYRIC_LINE_OPACITY.waitingNear, 0.5);
    const passedNear = Math.min(LYRIC_LINE_OPACITY.passedNear, 0.4);
    const lineAlpha = isWaiting
        ? clamp(
            waitingNear - (distance - 1) * LYRIC_LINE_OPACITY.waitingStep,
            LYRIC_LINE_OPACITY.waitingFar,
            waitingNear,
        )
        : clamp(
            passedNear - (distance - 1) * LYRIC_LINE_OPACITY.passedStep,
            LYRIC_LINE_OPACITY.passedFar,
            passedNear,
        );

    return {
        opacity: 1,
        scale,
        blurPx: 0,
        baseColor: colorWithAlpha(bodyColor, lineAlpha),
        fontWeight: Math.min((isWaiting ? 480 : 420) + (weightBoost / 2), 600),
        zIndex: isWaiting ? 3 - distance : 2 - distance,
        letterSpacingPx: 1.1 + (distance - 1) * 0.4,
    };
};

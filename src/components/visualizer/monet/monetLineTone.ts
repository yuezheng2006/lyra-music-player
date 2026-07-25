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
        const waitingNear = LYRIC_LINE_OPACITY.waitingNear;
        const passedNear = LYRIC_LINE_OPACITY.passedNear;
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
            scale: clamp(0.78 * Math.pow(0.92, distance - 1), 0.62, 0.78),
            // Keep blur off — size / weight / tracking carry the form contrast without GPU cost.
            blurPx: 0,
            baseColor: colorWithAlpha(bodyColor, lineAlpha),
            fontWeight: Math.min(isWaiting ? 480 + weightBoost : 400 + weightBoost, 650),
            zIndex: isWaiting ? 3 - distance : 2 - distance,
            letterSpacingPx: 1 + (distance - 1) * 0.4,
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
    const scale = clamp(inactiveScale * Math.pow(0.88, distance - 1), 0.58, 0.76);
    const waitingNear = LYRIC_LINE_OPACITY.waitingNear;
    const passedNear = LYRIC_LINE_OPACITY.passedNear;
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
        fontWeight: Math.min((isWaiting ? 440 : 380) + (weightBoost / 2), 560),
        zIndex: isWaiting ? 3 - distance : 2 - distance,
        letterSpacingPx: 1.25 + (distance - 1) * 0.45,
    };
};

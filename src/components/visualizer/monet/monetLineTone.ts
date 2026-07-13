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
 * Opacity ladder for Monet rows — reference: bright active, stepped fade on neighbors.
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
                scale: immersiveLyrics ? 1.08 : 1.04,
                blurPx: 0,
                baseColor: colorWithAlpha(bodyColor, LYRIC_LINE_OPACITY.karaokeUnsung),
                fontWeight: Math.min(700 + weightBoost, 900),
                zIndex: 4,
            };
        }

        const distance = Math.max(Math.abs(entry.offset), 1);
        const isWaiting = entry.status === 'waiting';
        const lineAlpha = isWaiting
            ? clamp(
                LYRIC_LINE_OPACITY.waitingNear - (distance - 1) * LYRIC_LINE_OPACITY.waitingStep,
                LYRIC_LINE_OPACITY.waitingFar,
                LYRIC_LINE_OPACITY.waitingNear,
            )
            : clamp(
                LYRIC_LINE_OPACITY.passedNear - (distance - 1) * LYRIC_LINE_OPACITY.passedStep,
                LYRIC_LINE_OPACITY.passedFar,
                LYRIC_LINE_OPACITY.passedNear,
            );
        return {
            opacity: 1,
            scale: clamp(0.9 * Math.pow(0.96, distance - 1), 0.8, 0.9),
            blurPx: 0,
            baseColor: colorWithAlpha(bodyColor, lineAlpha),
            fontWeight: Math.min(isWaiting ? 600 + weightBoost : 500 + weightBoost, 900),
            zIndex: isWaiting ? 3 - distance : 2 - distance,
        };
    }

    if (entry.status === 'active') {
        return {
            opacity: LYRIC_LINE_OPACITY.active,
            scale: immersiveLyrics ? 1.06 : 1.02,
            blurPx: 0,
            baseColor: colorWithAlpha(bodyColor, LYRIC_LINE_OPACITY.karaokeUnsung),
            fontWeight: Math.min((immersiveLyrics ? 800 : 750) + weightBoost, 900),
            zIndex: 4,
        };
    }

    const distance = Math.max(Math.abs(entry.offset), 1);
    const isWaiting = entry.status === 'waiting';
    const scale = clamp(inactiveScale * Math.pow(0.93, distance - 1), 0.76, 0.9);
    const lineAlpha = isWaiting
        ? clamp(
            LYRIC_LINE_OPACITY.waitingNear - (distance - 1) * LYRIC_LINE_OPACITY.waitingStep,
            LYRIC_LINE_OPACITY.waitingFar,
            LYRIC_LINE_OPACITY.waitingNear,
        )
        : clamp(
            LYRIC_LINE_OPACITY.passedNear - (distance - 1) * LYRIC_LINE_OPACITY.passedStep,
            LYRIC_LINE_OPACITY.passedFar,
            LYRIC_LINE_OPACITY.passedNear,
        );

    return {
        opacity: 1,
        scale,
        blurPx: 0,
        baseColor: colorWithAlpha(bodyColor, lineAlpha),
        fontWeight: Math.min((isWaiting ? 550 : 500) + (weightBoost / 2), 900),
        zIndex: isWaiting ? 3 - distance : 2 - distance,
    };
};

// src/components/visualizer/resolveLyricContainerFit.ts
// Shared safe-area / font sizing for DOM lyric modes (classic / partita).

export type LyricContainerFitInput = {
    /** Measured lyric stage width in CSS pixels. */
    containerWidth: number;
    /** User lyrics font scale (typically ~0.85–1.4). */
    lyricsFontScale?: number;
    /** Horizontal padding as a fraction of container width (each side). */
    sidePaddingRatio?: number;
    /** Minimum padding per side in px. */
    minSidePaddingPx?: number;
    /** Preferred fluid size as a fraction of usable width. */
    preferredWidthRatio?: number;
    /** Absolute min/max font size in px before scale. */
    minFontPx?: number;
    maxFontPx?: number;
};

export type LyricContainerFit = {
    sidePaddingPx: number;
    usableWidth: number;
    fontPx: number;
    /** CSS font-size string using px so it never tracks the wrong viewport. */
    fontSizeCss: string;
};

const DEFAULT_SIDE_PADDING_RATIO = 0.08;
const DEFAULT_MIN_SIDE_PADDING_PX = 28;
const DEFAULT_PREFERRED_WIDTH_RATIO = 0.072;
const DEFAULT_MIN_FONT_PX = 22;
const DEFAULT_MAX_FONT_PX = 56;

/**
 * Resolve lyric font size from the real stage container, not window.innerWidth / vw.
 * Keeps clear padding from sidebar / chrome / DevTools edges.
 */
export const resolveLyricContainerFit = (input: LyricContainerFitInput): LyricContainerFit => {
    const containerWidth = Math.max(0, input.containerWidth || 0);
    const lyricsFontScale = Math.min(1.6, Math.max(0.7, input.lyricsFontScale ?? 1));
    const sidePaddingRatio = Math.min(0.18, Math.max(0.04, input.sidePaddingRatio ?? DEFAULT_SIDE_PADDING_RATIO));
    const minSidePaddingPx = Math.max(12, input.minSidePaddingPx ?? DEFAULT_MIN_SIDE_PADDING_PX);
    const preferredWidthRatio = Math.min(0.12, Math.max(0.04, input.preferredWidthRatio ?? DEFAULT_PREFERRED_WIDTH_RATIO));
    const minFontPx = Math.max(14, input.minFontPx ?? DEFAULT_MIN_FONT_PX);
    const maxFontPx = Math.max(minFontPx, input.maxFontPx ?? DEFAULT_MAX_FONT_PX);

    const sidePaddingPx = Math.max(minSidePaddingPx, Math.round(containerWidth * sidePaddingRatio));
    const usableWidth = Math.max(120, containerWidth - sidePaddingPx * 2);
    const rawFontPx = usableWidth * preferredWidthRatio * lyricsFontScale;
    const fontPx = Math.min(maxFontPx * lyricsFontScale, Math.max(minFontPx, rawFontPx));

    return {
        sidePaddingPx,
        usableWidth,
        fontPx,
        fontSizeCss: `${fontPx.toFixed(2)}px`,
    };
};

/** Clamp a word's horizontal offset so it cannot walk past the safe area. */
export const clampLyricWordOffsetX = (
    offsetX: number,
    wordWidthPx: number,
    usableWidth: number,
    scale = 1.4,
): number => {
    const halfUsable = usableWidth * 0.5;
    const halfWord = (wordWidthPx * Math.max(1, scale)) * 0.5;
    const maxAbs = Math.max(0, halfUsable - halfWord - 8);
    return Math.max(-maxAbs, Math.min(maxAbs, offsetX));
};

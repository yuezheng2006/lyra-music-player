// src/components/visualizer/resolveLyricContainerFit.ts
// Shared safe-area / font sizing for DOM lyric modes (classic / partita / dazibao).

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
    /**
     * Extra shrink so post-layout transforms (LyricRhythmStage scale) stay on-screen.
     * Use resolveLyricRhythmScaleHeadroom(theme.lyricRhythmScaleMultiplier).
     */
    scaleHeadroom?: number;
    /** Extra inset per side for drop-shadow / bloom that paints past glyph bounds. */
    glowInsetPx?: number;
};

export type LyricContainerFit = {
    sidePaddingPx: number;
    usableWidth: number;
    fontPx: number;
    /** CSS font-size string using px so it never tracks the wrong viewport. */
    fontSizeCss: string;
    /** Effective headroom applied when resolving this fit. */
    scaleHeadroom: number;
};

export type LyricVerticalSafeArea = {
    /** Max stage height as a fraction of the shell (after rhythm scale must still fit). */
    maxHeightRatio: number;
    topPaddingPx: number;
    bottomPaddingPx: number;
    usableHeight: number;
    /**
     * Extra top inset on the centering wrapper so lyrics sit slightly below geometric center
     * (clears back button / top chrome without hugging the ceiling).
     */
    opticalTopBiasPx: number;
};

const DEFAULT_SIDE_PADDING_RATIO = 0.08;
const DEFAULT_MIN_SIDE_PADDING_PX = 28;
const DEFAULT_PREFERRED_WIDTH_RATIO = 0.072;
const DEFAULT_MIN_FONT_PX = 22;
const DEFAULT_MAX_FONT_PX = 56;

/**
 * mapRhythmScaleBoost peaks near ~1.16 with full beat/punch; keep a little slack for glow.
 * LyricRhythmStage multiplies this by lyricRhythmScaleMultiplier (up to ~1.6).
 */
export const LYRIC_RHYTHM_BEAT_SCALE_HEADROOM = 1.18;

/** Resolve how much narrower layout must be so rhythm scale never clips the stage. */
export const resolveLyricRhythmScaleHeadroom = (
    scaleMultiplier = 1,
    options: { includeBeatHeadroom?: boolean } = {},
): number => {
    const multiplier = Math.min(2.2, Math.max(1, Number.isFinite(scaleMultiplier) ? scaleMultiplier : 1));
    const beat = options.includeBeatHeadroom === false ? 1 : LYRIC_RHYTHM_BEAT_SCALE_HEADROOM;
    return multiplier * beat;
};

/** Uniform shrink so a measured line stays inside the usable stage width. */
export const resolveLyricLineFitScale = (
    contentWidth: number,
    usableWidth: number,
): number => {
    if (!(contentWidth > 0) || !(usableWidth > 0)) return 1;
    return Math.min(1, usableWidth / contentWidth);
};

/**
 * Vertical safe area for DOM lyric stages.
 * LyricRhythmStage scales from the shell center — a tall 70vh block overflows the top/bottom
 * once scaleHeadroom > 1, so cap height and pad glyphs away from the clip edge.
 */
export const resolveLyricVerticalSafeArea = (input: {
    containerHeight: number;
    scaleHeadroom?: number;
    glowInsetPx?: number;
    minPaddingPx?: number;
    fontPx?: number;
    /** Soft cap before headroom (classic default ~0.70). */
    preferredMaxHeightRatio?: number;
}): LyricVerticalSafeArea => {
    const containerHeight = Math.max(0, input.containerHeight || 0);
    const scaleHeadroom = Math.min(2.5, Math.max(1, input.scaleHeadroom ?? 1));
    const glowInsetPx = Math.max(0, input.glowInsetPx ?? 0);
    const minPaddingPx = Math.max(24, input.minPaddingPx ?? 48);
    const fontPx = Math.max(0, input.fontPx ?? 0);
    const preferredMaxHeightRatio = Math.min(
        0.78,
        Math.max(0.4, input.preferredMaxHeightRatio ?? 0.7),
    );

    // After scale S, visual height = layoutHeight * S must stay inside the shell with glow slack.
    const glowRatio = containerHeight > 0
        ? Math.min(0.14, (glowInsetPx * 2) / containerHeight)
        : 0.08;
    const maxHeightRatio = Math.min(
        preferredMaxHeightRatio,
        Math.max(0.36, (1 - glowRatio) / scaleHeadroom),
    );

    const layoutHeight = containerHeight > 0
        ? Math.max(160, Math.round(containerHeight * maxHeightRatio))
        : 0;
    // Inner pad keeps scatter / neon bloom off the stage edge (headroom already in maxHeightRatio).
    const pad = Math.max(
        minPaddingPx,
        glowInsetPx,
        Math.round(fontPx * 0.55),
    );
    // Bias lyrics below true center so they clear the back button and never read as "stuck to the ceiling".
    const opticalTopBiasPx = Math.max(
        28,
        Math.round(containerHeight * 0.07),
        Math.round(fontPx * 0.35),
    );

    return {
        maxHeightRatio,
        topPaddingPx: pad,
        bottomPaddingPx: pad,
        usableHeight: Math.max(120, layoutHeight - pad * 2),
        opticalTopBiasPx,
    };
};

/** Clamp a word's vertical offset so scatter / float cannot walk into the top/bottom safe edge. */
export const clampLyricWordOffsetY = (
    offsetY: number,
    wordHeightPx: number,
    usableHeight: number,
    scale = 1.4,
): number => {
    const halfUsable = usableHeight * 0.5;
    const halfWord = (wordHeightPx * Math.max(1, scale)) * 0.5;
    const maxAbs = Math.max(0, halfUsable - halfWord - 12);
    return Math.max(-maxAbs, Math.min(maxAbs, offsetY));
};

/**
 * Resolve lyric font size from the real stage container, not window.innerWidth / vw.
 * Keeps clear padding from sidebar / chrome / DevTools edges and rhythm scale.
 */
export const resolveLyricContainerFit = (input: LyricContainerFitInput): LyricContainerFit => {
    const containerWidth = Math.max(0, input.containerWidth || 0);
    const lyricsFontScale = Math.min(1.6, Math.max(0.7, input.lyricsFontScale ?? 1));
    const sidePaddingRatio = Math.min(0.18, Math.max(0.04, input.sidePaddingRatio ?? DEFAULT_SIDE_PADDING_RATIO));
    const minSidePaddingPx = Math.max(12, input.minSidePaddingPx ?? DEFAULT_MIN_SIDE_PADDING_PX);
    const preferredWidthRatio = Math.min(0.12, Math.max(0.04, input.preferredWidthRatio ?? DEFAULT_PREFERRED_WIDTH_RATIO));
    const minFontPx = Math.max(14, input.minFontPx ?? DEFAULT_MIN_FONT_PX);
    const maxFontPx = Math.max(minFontPx, input.maxFontPx ?? DEFAULT_MAX_FONT_PX);
    const scaleHeadroom = Math.min(2.5, Math.max(1, input.scaleHeadroom ?? 1));
    const glowInsetPx = Math.max(0, input.glowInsetPx ?? 0);

    // Reserve space for LyricRhythmStage scale + bloom so glyphs never meet the clip edge.
    const safeWidth = Math.max(120, containerWidth - glowInsetPx * 2);
    const layoutWidth = Math.max(120, safeWidth / scaleHeadroom);
    const ratioPaddingPx = Math.round(layoutWidth * sidePaddingRatio);
    const headroomPaddingPx = Math.max(0, Math.round((containerWidth - layoutWidth) / 2));
    const sidePaddingPx = Math.max(minSidePaddingPx, ratioPaddingPx, headroomPaddingPx);
    const usableWidth = Math.max(120, containerWidth - sidePaddingPx * 2);
    const rawFontPx = usableWidth * preferredWidthRatio * lyricsFontScale;
    const fontPx = Math.min(maxFontPx * lyricsFontScale, Math.max(minFontPx, rawFontPx));

    return {
        sidePaddingPx,
        usableWidth,
        fontPx,
        fontSizeCss: `${fontPx.toFixed(2)}px`,
        scaleHeadroom,
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

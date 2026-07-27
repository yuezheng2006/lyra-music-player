// src/utils/lyrics/resolveLyricStageLayoutSizeMath.ts
// Resolve lyric stage layout size from shell/node measurements without stamping a fake narrow width.

/** Below this, treat width as unlaid-out (do not Math.max(floor, 0) → fake 240px stages). */
export const LYRIC_STAGE_MIN_RELIABLE_WIDTH_PX = 64;
export const LYRIC_STAGE_MIN_RELIABLE_HEIGHT_PX = 120;

export type LyricStageLayoutSizeInput = {
    nodeWidth: number;
    shellWidth: number;
    shellHeight: number;
    /** Keep previous / window estimate when the node is not laid out yet. */
    fallbackWidth: number;
    fallbackHeight: number;
};

export type LyricStageLayoutSize = {
    width: number;
    height: number;
    /** True when width came from a real shell/node measure. */
    widthFromMeasure: boolean;
};

/**
 * Prefer shell clientWidth (full stage), ignore 0-width frames that used to clamp to 240px
 * and crush classic lyric max-width / font-size.
 */
export const resolveLyricStageLayoutSize = (
    input: LyricStageLayoutSizeInput,
): LyricStageLayoutSize => {
    const shellWidth = Math.max(0, Math.round(input.shellWidth || 0));
    const nodeWidth = Math.max(0, Math.round(input.nodeWidth || 0));
    const measuredWidth = Math.max(shellWidth, nodeWidth);
    const measuredHeight = Math.max(0, Math.round(input.shellHeight || 0));
    const fallbackWidth = Math.max(320, Math.round(input.fallbackWidth || 960));
    const fallbackHeight = Math.max(280, Math.round(input.fallbackHeight || 720));

    const widthFromMeasure = measuredWidth >= LYRIC_STAGE_MIN_RELIABLE_WIDTH_PX;
    const width = widthFromMeasure ? measuredWidth : fallbackWidth;
    const height = measuredHeight >= LYRIC_STAGE_MIN_RELIABLE_HEIGHT_PX
        ? measuredHeight
        : fallbackHeight;

    return { width, height, widthFromMeasure };
};

import type { CSSProperties } from 'react';
import type { VisualizerMode } from '../../../types';

// src/components/visualizer/geometric/resolveInteractive3dStageContainment.ts
// Keeps the WebGL canvas stage inside a safe region when DOM lyrics own the left column.

/** Modes whose lyric chrome sits on the left and must not be covered by the 3D stage. */
const LEFT_LYRIC_COLUMN_MODES: ReadonlySet<VisualizerMode> = new Set(['monet']);

const DEFAULT_LYRIC_COLUMN_END_RATIO = 0.48;

const clampRatio = (value: number, min: number, max: number) => (
    Math.min(max, Math.max(min, value))
);

/**
 * Build a right-weighted mask from the measured lyric-column end (0–1 of stage width).
 * Adapts when the sidebar collapses, the window goes fullscreen, or the stage aspect changes.
 */
export const buildInteractive3dStageContainmentMask = (
    lyricColumnEndRatio = DEFAULT_LYRIC_COLUMN_END_RATIO,
): string => {
    const end = clampRatio(lyricColumnEndRatio, 0.28, 0.72);
    const softStart = clampRatio(end * 0.42, 0.08, 0.36);
    const softMid = clampRatio(end * 0.72, softStart + 0.06, end - 0.04);
    const hardStart = clampRatio(end + 0.04, softMid + 0.04, 0.92);

    return [
        'linear-gradient(90deg',
        `rgba(0,0,0,0) 0%`,
        `rgba(0,0,0,0.06) ${(softStart * 100).toFixed(1)}%`,
        `rgba(0,0,0,0.45) ${(softMid * 100).toFixed(1)}%`,
        `rgba(0,0,0,1) ${(hardStart * 100).toFixed(1)}%`,
        'rgba(0,0,0,1) 100%)',
    ].join(', ');
};

/**
 * Right-weighted mask so cover particles stay in the stage pane and fade before
 * overlapping Monet (and similar) left-column lyrics.
 */
export const resolveInteractive3dStageContainmentStyle = (
    visualizerMode?: VisualizerMode,
    lyricColumnEndRatio?: number,
): CSSProperties | undefined => {
    if (!visualizerMode || !LEFT_LYRIC_COLUMN_MODES.has(visualizerMode)) {
        return undefined;
    }

    const mask = buildInteractive3dStageContainmentMask(lyricColumnEndRatio);
    return {
        WebkitMaskImage: mask,
        maskImage: mask,
    };
};

export const shouldContainInteractive3dStageForMode = (
    visualizerMode?: VisualizerMode,
): boolean => Boolean(visualizerMode && LEFT_LYRIC_COLUMN_MODES.has(visualizerMode));

/** Measure lyric-column right edge as a fraction of the stage container width. */
export const measureLyricColumnEndRatio = (
    stageEl: HTMLElement,
    lyricColumnEl: HTMLElement | null,
): number | undefined => {
    if (!lyricColumnEl) return undefined;
    const stageRect = stageEl.getBoundingClientRect();
    const columnRect = lyricColumnEl.getBoundingClientRect();
    if (!(stageRect.width > 0) || !(columnRect.width > 0)) return undefined;
    const end = (columnRect.right - stageRect.left) / stageRect.width;
    if (!Number.isFinite(end)) return undefined;
    return clampRatio(end, 0.2, 0.85);
};

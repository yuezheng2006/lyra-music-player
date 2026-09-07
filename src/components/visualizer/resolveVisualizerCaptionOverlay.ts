import type { Line } from '../../types';

// src/components/visualizer/resolveVisualizerCaptionOverlay.ts
// Caption overlay copy, window, and dock clearance — kept pure so tests lock the subtitle look.

export const VISUALIZER_CAPTION_WAVEFORM_GAP_PX = 56;
export const VISUALIZER_CAPTION_BEFORE = 2;
export const VISUALIZER_CAPTION_AFTER = 4;

export type VisualizerCaptionRowKind = 'past' | 'current' | 'upcoming';

export interface VisualizerCaptionRow {
    index: number;
    text: string;
    kind: VisualizerCaptionRowKind;
}

const normalizeCaptionText = (text: string | undefined): string => (
    String(text || '').replace(/\s+/g, ' ').trim()
);

export const resolveVisualizerCaptionBottom = (isPlayerChromeHidden: boolean): string => (
    isPlayerChromeHidden
        ? 'max(4.5rem, 10vh)'
        : `calc(var(--app-player-bar-height, 72px) + ${VISUALIZER_CAPTION_WAVEFORM_GAP_PX}px + env(safe-area-inset-bottom, 0px))`
);

export const resolveVisualizerCaptionIndex = (
    lines: Line[],
    currentLineIndex: number,
): number => {
    if (!lines.length) return -1;
    if (Number.isFinite(currentLineIndex) && currentLineIndex >= 0) {
        return Math.min(currentLineIndex, lines.length - 1);
    }
    return -1;
};

export const resolveVisualizerCaptionText = (
    lines: Line[],
    currentLineIndex: number,
): string | null => {
    const index = resolveVisualizerCaptionIndex(lines, currentLineIndex);
    return normalizeCaptionText(lines[index]?.fullText) || null;
};

/** Sliding window around the active cue: past rows + current + upcoming. */
export const resolveVisualizerCaptionRows = (
    lines: Line[],
    currentLineIndex: number,
    before = VISUALIZER_CAPTION_BEFORE,
    after = VISUALIZER_CAPTION_AFTER,
): VisualizerCaptionRow[] => {
    const active = resolveVisualizerCaptionIndex(lines, currentLineIndex);
    if (active < 0) return [];

    const start = Math.max(0, active - before);
    const end = Math.min(lines.length - 1, active + after);
    const rows: VisualizerCaptionRow[] = [];
    for (let index = start; index <= end; index += 1) {
        const text = normalizeCaptionText(lines[index]?.fullText);
        if (!text) continue;
        rows.push({
            index,
            text,
            kind: index === active ? 'current' : index < active ? 'past' : 'upcoming',
        });
    }
    return rows;
};

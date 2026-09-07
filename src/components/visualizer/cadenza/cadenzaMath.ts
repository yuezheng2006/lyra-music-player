// src/components/visualizer/cadenza/cadenzaMath.ts
// Shared cadenza scalars and grapheme split. Keep out of the React render path.

export const ACTIVE_PULSE_FREQUENCY = 10;

const graphemeSegmenter = typeof Intl !== 'undefined'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

export const splitGraphemes = (text: string) => {
    if (!text) return [] as string[];
    if (graphemeSegmenter) {
        return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
    }
    return Array.from(text);
};

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
export const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);
export const easeInOutQuad = (value: number) => {
    const normalized = clamp(value, 0, 1);
    return normalized < 0.5
        ? 2 * normalized * normalized
        : 1 - Math.pow(-2 * normalized + 2, 2) / 2;
};

export const isCJK = (text: string) => /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(text);

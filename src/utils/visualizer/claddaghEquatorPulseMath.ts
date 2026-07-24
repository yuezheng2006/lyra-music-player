// src/utils/visualizer/claddaghEquatorPulseMath.ts
// Quantize equator SVG pulse so DOM attrs are not rewritten every animation frame.

export const CLADDAGH_EQUATOR_PULSE_MIN_INTERVAL_MS = 40; // ~25fps
export const CLADDAGH_EQUATOR_COLOR_QUANTUM = 0.04;

export type CladdaghEquatorPulseSnapshot = {
    colorRatioQ: number;
    breathQ: number;
    shimmerQ: number;
    dashA: number;
    dashB: number;
};

/** Quantize audio-driven equator pulse for dirty-check skipping. */
export const resolveCladdaghEquatorPulseSnapshot = (
    bassPower: number,
    vocalPower: number,
    shimmerPhase: number,
): CladdaghEquatorPulseSnapshot => {
    const bass = Math.max(0, Math.min(1, bassPower));
    const vocal = Math.max(0, Math.min(1, vocalPower));
    const colorPower = Math.max(bass, vocal);
    const colorRatio = Math.min(1, Math.max(0, colorPower - 0.02) / 0.58);
    const quantum = CLADDAGH_EQUATOR_COLOR_QUANTUM;
    const colorRatioQ = Math.round(colorRatio / quantum) * quantum;
    const breath = 1 + (bass * bass) * 0.018;
    const breathQ = Math.round(breath * 500) / 500;
    const shimmerQ = Math.round(shimmerPhase * 2) / 2;
    return {
        colorRatioQ,
        breathQ,
        shimmerQ,
        dashA: Math.round(18 + colorRatioQ * 10),
        dashB: Math.round(26 - colorRatioQ * 8),
    };
};

export const isCladdaghEquatorPulseUnchanged = (
    prev: CladdaghEquatorPulseSnapshot | null,
    next: CladdaghEquatorPulseSnapshot,
): boolean => (
    Boolean(prev)
    && prev!.colorRatioQ === next.colorRatioQ
    && prev!.breathQ === next.breathQ
    && prev!.shimmerQ === next.shimmerQ
    && prev!.dashA === next.dashA
    && prev!.dashB === next.dashB
);

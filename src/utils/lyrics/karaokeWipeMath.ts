import type { GraphemeTiming } from './graphemeTiming';

// src/utils/lyrics/karaokeWipeMath.ts
// Pure karaoke wipe progress: fill width + hard-edge LTR mask for traditional KTV fill.

export type ResolveKaraokeWipeFillWidthInput = {
    time: number;
    startTime: number;
    endTime: number;
    graphemeOffsets: readonly number[];
    graphemeTimings?: readonly GraphemeTiming[];
    /** When false, wipe stays at 0 (inactive / waiting line). */
    active?: boolean;
};

/** Cumulative fill width in px for the sung edge at `time`. */
export const resolveKaraokeWipeFillWidth = ({
    time,
    startTime,
    endTime,
    graphemeOffsets,
    graphemeTimings = [],
    active = true,
}: ResolveKaraokeWipeFillWidthInput): number => {
    const fullWidth = graphemeOffsets[graphemeOffsets.length - 1] ?? 0;
    if (!active || time <= startTime) return 0;
    if (time >= endTime) return fullWidth;

    const timingCount = Math.min(graphemeTimings.length, Math.max(graphemeOffsets.length - 1, 0));
    if (timingCount > 0) {
        for (let index = 0; index < timingCount; index += 1) {
            const timing = graphemeTimings[index];
            const timingStart = Math.max(startTime, timing.startTime);
            const timingEnd = Math.max(timingStart, timing.endTime);
            const startWidth = graphemeOffsets[index] ?? 0;
            const endWidth = graphemeOffsets[index + 1] ?? startWidth;

            if (time < timingStart) {
                return startWidth;
            }

            if (time <= timingEnd) {
                const duration = Math.max(0.001, timingEnd - timingStart);
                const progress = (time - timingStart) / duration;
                return startWidth + (endWidth - startWidth) * progress;
            }
        }

        return graphemeOffsets[timingCount] ?? fullWidth;
    }

    const progress = (time - startTime) / Math.max(0.001, endTime - startTime);
    if (progress <= 0) return 0;
    if (progress >= 1) return fullWidth;
    const graphemeCount = Math.max(graphemeOffsets.length - 1, 0);
    if (graphemeCount <= 0) return fullWidth;
    const floatIndex = progress * graphemeCount;
    const wholeIndex = Math.floor(floatIndex);
    const fractional = floatIndex - wholeIndex;
    const startWidth = graphemeOffsets[Math.min(wholeIndex, graphemeOffsets.length - 1)] ?? 0;
    const endWidth = graphemeOffsets[Math.min(wholeIndex + 1, graphemeOffsets.length - 1)] ?? startWidth;
    return startWidth + (endWidth - startWidth) * fractional;
};

/** Hard wipe edge mask — soft feather reads as blur on CJK strokes. */
export const buildKaraokeWipeMaskImage = (fillWidthPx: number, fontPx: number): string => {
    const edgeSoftness = Math.max(Math.min(fontPx * 0.12, 4), 1.5);
    const solidEnd = Math.max(fillWidthPx - edgeSoftness, 0);
    return `linear-gradient(90deg, #000 0px, #000 ${solidEnd}px, transparent ${fillWidthPx}px, transparent 100%)`;
};

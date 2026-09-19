// src/utils/visualizer/turntable/vinylSpinRuntime.ts
// Wall-clock spin while playing; re-anchor on seek so media clock stays honest.

import { VINYL_SPIN_DEGREES_PER_SECOND, vinylSpinDegreesFromTime } from './vinylSurfaceMath';

export type VinylSpinAnchor = {
    mediaSec: number;
    wallMs: number;
};

export const createVinylSpinAnchor = (
    mediaSec: number,
    wallMs: number,
): VinylSpinAnchor => ({
    mediaSec: Number.isFinite(mediaSec) ? Math.max(0, mediaSec) : 0,
    wallMs,
});

/** Large media jump (seek / track change) should reset the wall-clock anchor. */
export const shouldReanchorVinylSpin = (
    previousMediaSec: number,
    nextMediaSec: number,
    thresholdSec = 0.35,
): boolean => {
    if (!Number.isFinite(nextMediaSec)) return false;
    if (!Number.isFinite(previousMediaSec)) return true;
    return Math.abs(nextMediaSec - previousMediaSec) > thresholdSec;
};

/** Degrees while playing: media snapshot + wall elapsed; paused: freeze on media. */
export const resolveVinylSpinDegrees = (input: {
    playing: boolean;
    mediaSec: number;
    wallMs: number;
    anchor: VinylSpinAnchor;
    degreesPerSecond?: number;
}): number => {
    const rate = input.degreesPerSecond ?? VINYL_SPIN_DEGREES_PER_SECOND;
    if (!input.playing) {
        return vinylSpinDegreesFromTime(input.mediaSec, rate);
    }
    const elapsedSec = Math.max(0, (input.wallMs - input.anchor.wallMs) / 1000);
    return vinylSpinDegreesFromTime(input.anchor.mediaSec + elapsedSec, rate);
};

// src/utils/visualizer/coverParticleYieldFramePolicy.ts
// Decide whether a yielded (paused) cover-particle runtime should still paint.

/** Skip continuous ticks while yielded, unless a preset morph needs frames. */
export const shouldSkipCoverParticleFrameWhileYielded = (input: {
    paused: boolean;
    morphLive: boolean;
}): boolean => input.paused && !input.morphLive;

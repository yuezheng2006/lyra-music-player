// src/utils/visualizer/coverParticleFrameSkipMath.ts
// Resolves effective cover-particle paint stride for Electron / idle playback.

/** Merge quality-tier skip with Electron Retina floor and idle playback backoff. */
export const resolveCoverParticleEffectiveFrameSkip = (input: {
    profileFrameSkip: number;
    isElectron: boolean;
    devicePixelRatio: number;
    musicActive: boolean;
}): number => {
    const frameSkip = Math.max(1, input.profileFrameSkip || 1);
    const retinaElectron = input.isElectron && (input.devicePixelRatio || 1) >= 2;
    // Retina Electron: paint rarely — lyric DOM already owns the GPU budget.
    let effective = Math.max(frameSkip, retinaElectron ? 8 : input.isElectron ? 4 : 1);
    if (!input.musicActive) {
        // Paused / idle tracks keep the last frame longer to cut GPU helper load.
        effective = Math.max(effective * 2, effective + 4);
    }
    return effective;
};

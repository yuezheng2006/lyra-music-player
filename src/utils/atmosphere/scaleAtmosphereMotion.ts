// src/utils/atmosphere/scaleAtmosphereMotion.ts
// Applies scene-tuning sensitivity / punch strength to atmosphere motion samples.

export type AtmosphereMotionSample = {
    beatPulse: number;
    cameraPunch: number;
    atmosphereEnergy: number;
};

export type AtmosphereMotionScaleTuning = {
    atmosphereSensitivity?: number;
    cameraPunchStrength?: number;
};

/** Scales beat/energy by sensitivity and camera punch by punch strength. */
export const scaleAtmosphereMotionSample = (
    sample: AtmosphereMotionSample,
    tuning: AtmosphereMotionScaleTuning = {},
): AtmosphereMotionSample => {
    const sensitivity = Number.isFinite(tuning.atmosphereSensitivity)
        ? Math.max(0, tuning.atmosphereSensitivity as number)
        : 1;
    const punchStrength = Number.isFinite(tuning.cameraPunchStrength)
        ? Math.max(0, tuning.cameraPunchStrength as number)
        : 1;

    return {
        beatPulse: sample.beatPulse * sensitivity,
        cameraPunch: sample.cameraPunch * punchStrength * sensitivity,
        atmosphereEnergy: sample.atmosphereEnergy * sensitivity,
    };
};

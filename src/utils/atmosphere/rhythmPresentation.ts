import { clamp01 } from './math';

// src/utils/atmosphere/rhythmPresentation.ts
// Shared rhythm presentation curves for lyrics and 3D background.

export const RHYTHM_BEAT_HIT_THRESHOLD = 0.52;
export const RHYTHM_SMOOTH_ATTACK_TAU = 0.09;
export const RHYTHM_SMOOTH_RELEASE_TAU = 0.16;

export type RhythmPresentationInput = {
    beatPulse: number;
    cameraPunch: number;
    cinemaScale: number;
    atmosphereEnergy: number;
};

export const synthesizeBeatPulseFromAudioPower = (audioPower: number) =>
    Math.pow(clamp01(audioPower / 160), 1.35) * 0.72;

export const resolvePresentationBeatPulse = (
    beatPulse: number,
    audioPowerFallback = 0,
) => (beatPulse > 0.02 ? beatPulse : synthesizeBeatPulseFromAudioPower(audioPowerFallback));

export const mapRhythmOrbitBoost = ({
    beatPulse,
    cameraPunch,
}: Pick<RhythmPresentationInput, 'beatPulse' | 'cameraPunch'>) =>
    beatPulse * 0.22 + cameraPunch * 0.16;

export const mapRhythmScaleBoost = ({
    beatPulse,
    cameraPunch,
    cinemaScale,
}: RhythmPresentationInput) =>
    1
    + beatPulse * 0.10
    + cameraPunch * 0.05
    + Math.max(0, cinemaScale - 0.82) * 0.035;

export const mapRhythmGlow = ({
    beatPulse,
    cameraPunch,
    atmosphereEnergy,
}: RhythmPresentationInput) =>
    0.18 + beatPulse * 0.32 + cameraPunch * 0.16 + atmosphereEnergy * 0.10;

export const mapRhythmAuraAlpha = ({
    beatPulse,
    atmosphereEnergy,
}: Pick<RhythmPresentationInput, 'beatPulse' | 'atmosphereEnergy'>) =>
    0.42 + beatPulse * 0.28 + atmosphereEnergy * 0.12;

export const shouldTriggerBeatBurst = (currentPulse: number, previousPulse: number) =>
    currentPulse >= RHYTHM_BEAT_HIT_THRESHOLD && previousPulse < RHYTHM_BEAT_HIT_THRESHOLD;

export const buildRhythmPresentation = (
    beatPulse: number,
    cameraPunch: number,
    cinemaScale: number,
    atmosphereEnergy: number,
    audioPowerFallback = 0,
) => {
    const input: RhythmPresentationInput = {
        beatPulse: resolvePresentationBeatPulse(beatPulse, audioPowerFallback),
        cameraPunch: clamp01(cameraPunch),
        cinemaScale: cinemaScale || 0.82,
        atmosphereEnergy: clamp01(atmosphereEnergy),
    };

    return {
        ...input,
        orbitBoost: mapRhythmOrbitBoost(input),
        scaleBoost: mapRhythmScaleBoost(input),
        glow: mapRhythmGlow(input),
        auraAlpha: mapRhythmAuraAlpha(input),
    };
};

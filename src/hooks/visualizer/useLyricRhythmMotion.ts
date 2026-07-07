import { useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import {
    buildRhythmPresentation,
    mapRhythmGlow,
    mapRhythmScaleBoost,
    resolvePresentationBeatPulse,
} from '../../utils/atmosphere/rhythmPresentation';

// src/hooks/visualizer/useLyricRhythmMotion.ts
// Applies the same rhythm presentation curves used by the 3D background to lyrics.

type UseLyricRhythmMotionParams = {
    audioPower: MotionValue<number>;
    beatPulse?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
};

export const useLyricRhythmMotion = ({
    audioPower,
    beatPulse,
    cameraPunch,
    cinemaScale,
    atmosphereEnergy,
}: UseLyricRhythmMotionParams) => {
    const zero = useMotionValue(0);
    const defaultCinema = useMotionValue(0.82);
    const defaultEnergy = useMotionValue(0.42);
    const pulseSource = beatPulse ?? audioPower;

    const scale = useTransform(
        [pulseSource, cameraPunch ?? zero, cinemaScale ?? defaultCinema, atmosphereEnergy ?? defaultEnergy, audioPower],
        ([pulse, punch, cinema, energy, power]: number[]) => mapRhythmScaleBoost({
            beatPulse: resolvePresentationBeatPulse(
                beatPulse ? (pulse || 0) : 0,
                power || 0,
            ),
            cameraPunch: beatPulse ? (punch || 0) : 0,
            cinemaScale: beatPulse ? (cinema || 0.82) : 0.82,
            atmosphereEnergy: beatPulse ? (energy || 0.42) : 0.42,
        }),
    );

    const glowShadow = useTransform(
        [pulseSource, cameraPunch ?? zero, atmosphereEnergy ?? defaultEnergy, audioPower],
        ([pulse, punch, energy, power]: number[]) => {
            const glow = mapRhythmGlow({
                beatPulse: resolvePresentationBeatPulse(
                    beatPulse ? (pulse || 0) : 0,
                    power || 0,
                ),
                cameraPunch: beatPulse ? (punch || 0) : 0,
                cinemaScale: 0.82,
                atmosphereEnergy: beatPulse ? (energy || 0.42) : 0.42,
            });
            return `drop-shadow(0 0 ${8 + glow * 24}px rgba(255,255,255,${0.08 + glow * 0.12}))`;
        },
    );

    const presentation = useTransform(
        [pulseSource, cameraPunch ?? zero, cinemaScale ?? defaultCinema, atmosphereEnergy ?? defaultEnergy, audioPower],
        ([pulse, punch, cinema, energy, power]: number[]) => buildRhythmPresentation(
            beatPulse ? (pulse || 0) : 0,
            beatPulse ? (punch || 0) : 0,
            beatPulse ? (cinema || 0.82) : 0.82,
            beatPulse ? (energy || 0.42) : 0.42,
            power || 0,
        ),
    );

    return { scale, glowShadow, presentation };
};

import { useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { colorWithAlpha } from '../../components/visualizer/colorMix';
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
    scaleMultiplier?: number;
    glowColor?: string | null;
};

export const useLyricRhythmMotion = ({
    audioPower,
    beatPulse,
    cameraPunch,
    cinemaScale,
    atmosphereEnergy,
    scaleMultiplier = 1,
    glowColor = null,
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
        }) * scaleMultiplier,
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
            const glowAlpha = glowColor ? 0.18 + glow * 0.38 : 0.12 + glow * 0.28;
            const shadowColor = glowColor
                ? colorWithAlpha(glowColor, glowAlpha)
                : `rgba(255,255,255,${0.08 + glow * 0.12})`;
            const tightGlow = `drop-shadow(0 0 ${6 + glow * 14}px ${shadowColor})`;
            const bloomGlow = `drop-shadow(0 0 ${16 + glow * 34}px ${shadowColor})`;
            return `${tightGlow} ${bloomGlow}`;
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

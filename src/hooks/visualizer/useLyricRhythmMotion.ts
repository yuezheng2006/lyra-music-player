import { useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { resolveLyricRhythmScaleHeadroom } from '../../components/visualizer/resolveLyricContainerFit';
import {
    mapRhythmScaleBoost,
    resolvePresentationBeatPulse,
} from '../../utils/atmosphere/rhythmPresentation';

// src/hooks/visualizer/useLyricRhythmMotion.ts
// Beat scale only. Per-frame CSS filter on the lyric tree re-rasters every glyph (Folia keeps lyrics filter-free).

type UseLyricRhythmMotionParams = {
    audioPower: MotionValue<number>;
    beatPulse?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    scaleMultiplier?: number;
};

export const useLyricRhythmMotion = ({
    audioPower,
    beatPulse,
    cameraPunch,
    cinemaScale,
    atmosphereEnergy,
    scaleMultiplier = 1,
}: UseLyricRhythmMotionParams) => {
    const zero = useMotionValue(0);
    const defaultCinema = useMotionValue(0.82);
    const defaultEnergy = useMotionValue(0.42);
    const pulseSource = beatPulse ?? audioPower;
    const scaleCap = resolveLyricRhythmScaleHeadroom(scaleMultiplier);

    const scale = useTransform(
        [pulseSource, cameraPunch ?? zero, cinemaScale ?? defaultCinema, atmosphereEnergy ?? defaultEnergy, audioPower],
        ([pulse, punch, cinema, energy, power]: number[]) => {
            const raw = mapRhythmScaleBoost({
                beatPulse: resolvePresentationBeatPulse(
                    beatPulse ? (pulse || 0) : 0,
                    power || 0,
                ),
                cameraPunch: beatPulse ? (punch || 0) : 0,
                cinemaScale: beatPulse ? (cinema || 0.82) : 0.82,
                atmosphereEnergy: beatPulse ? (energy || 0.42) : 0.42,
            }) * scaleMultiplier;
            return Math.min(scaleCap, raw);
        },
    );

    return { scale };
};

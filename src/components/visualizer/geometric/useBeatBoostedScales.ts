import { useMotionValue, useTransform, useSpring, type MotionValue } from 'framer-motion';
import type { AudioBands } from '../../../types';
import {
    mapRhythmScaleBoost,
    resolvePresentationBeatPulse,
} from '../../../utils/atmosphere/rhythmPresentation';
import type { ScaleKey } from './types';

// src/components/visualizer/geometric/useBeatBoostedScales.ts
// Builds band-reactive scales with Mineradio-style beat/cinema boost.

const useBandScale = (source: MotionValue<number>) => {
    const spring = useSpring(source, { stiffness: 300, damping: 30 }) as unknown as MotionValue<number>;
    return useTransform(spring, [10, 200], [0.95, 1.45]);
};

const useBoostedScale = (scale: MotionValue<number>, beatBoost: MotionValue<number>) =>
    useTransform([scale, beatBoost], ([base, boost]: number[]) => (base || 1) * (boost || 1));

export const useBeatBoostedScales = (
    audioPower: MotionValue<number>,
    audioBands: AudioBands | undefined,
    beatPulse: MotionValue<number> | undefined,
    cinemaScale: MotionValue<number> | undefined,
    cameraPunch: MotionValue<number> | undefined,
    enabled = true,
): Record<ScaleKey, MotionValue<number>> => {
    const staticScale = useMotionValue(1);
    const beatBoost = useTransform(
        [beatPulse ?? audioPower, cinemaScale ?? audioPower, cameraPunch ?? audioPower, audioPower],
        ([pulse, cinema, punch, power]: number[]) => mapRhythmScaleBoost({
            beatPulse: resolvePresentationBeatPulse(
                beatPulse ? (pulse || 0) : 0,
                power || 0,
            ),
            cameraPunch: beatPulse ? (punch || 0) : 0,
            cinemaScale: beatPulse ? (cinema || 0.82) : 0.82,
            atmosphereEnergy: 0.42,
        }),
    );

    const bass = useBandScale(enabled ? (audioBands?.bass ?? audioPower) : staticScale);
    const lowMid = useBandScale(enabled ? (audioBands?.lowMid ?? audioPower) : staticScale);
    const mid = useBandScale(enabled ? (audioBands?.mid ?? audioPower) : staticScale);
    const vocal = useBandScale(enabled ? (audioBands?.vocal ?? audioPower) : staticScale);
    const treble = useBandScale(enabled ? (audioBands?.treble ?? audioPower) : staticScale);
    const fallback = useBandScale(enabled ? audioPower : staticScale);

    return {
        bass: useBoostedScale(bass, beatBoost),
        lowMid: useBoostedScale(lowMid, beatBoost),
        mid: useBoostedScale(mid, beatBoost),
        vocal: useBoostedScale(vocal, beatBoost),
        treble: useBoostedScale(treble, beatBoost),
        default: useBoostedScale(fallback, beatBoost),
    };
};

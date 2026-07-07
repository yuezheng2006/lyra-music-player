import { useEffect } from 'react';
import { useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { computeCinemaDrift } from '../../../utils/atmosphere/cinemaDrift';
import {
    mapRhythmGlow,
    mapRhythmScaleBoost,
    resolvePresentationBeatPulse,
} from '../../../utils/atmosphere/rhythmPresentation';
import { subscribeGeometricCanvasFrame } from './geometricCanvasRuntime';

// src/components/visualizer/geometric/useInteractiveSceneTransforms.ts
// Shared camera transforms for the 3D background and lyric stage.

export type InteractiveSceneTransformInput = {
    audioPower: MotionValue<number>;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    beatPulse?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    sceneParallaxX?: MotionValue<number>;
    sceneParallaxY?: MotionValue<number>;
    sceneRoll?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    cinemaShake?: number;
    rhythmIntensity?: number;
    userRotateX?: MotionValue<number>;
    userRotateY?: MotionValue<number>;
    suppressPointerTilt?: boolean;
    enabled?: boolean;
};

export type InteractiveSceneTransforms = {
    sceneX: MotionValue<number>;
    sceneY: MotionValue<number>;
    sceneRotate: MotionValue<number>;
    sceneScale: MotionValue<number>;
    tiltX: MotionValue<number>;
    tiltY: MotionValue<number>;
    lyricDepth: MotionValue<number>;
    lyricGlow: MotionValue<number>;
};

const idleDriftAt = (time: number, cinemaShake: number) => computeCinemaDrift(
    time,
    cinemaShake,
    { thetaKick: 0, phiKick: 0, radiusKick: 0 },
);

export const useInteractiveSceneTransforms = ({
    audioPower,
    pointerX,
    pointerY,
    beatPulse,
    cinemaScale,
    cameraPunch,
    sceneParallaxX,
    sceneParallaxY,
    sceneRoll,
    atmosphereEnergy,
    cinemaShake = 0.5,
    rhythmIntensity = 0.85,
    userRotateX,
    userRotateY,
    suppressPointerTilt = false,
    enabled = true,
}: InteractiveSceneTransformInput): InteractiveSceneTransforms => {
    const zero = useMotionValue(0);
    const defaultCinema = useMotionValue(0.82);
    const defaultEnergy = useMotionValue(0.42);
    const cinemaTime = useMotionValue(0);
    const pulse = beatPulse ?? audioPower;
    const punch = cameraPunch ?? zero;
    const scale = cinemaScale ?? defaultCinema;
    const roll = sceneRoll ?? zero;
    const energy = atmosphereEnergy ?? defaultEnergy;

    useEffect(() => {
        if (!enabled) return undefined;
        const start = performance.now();
        return subscribeGeometricCanvasFrame(({ timestamp }) => {
            cinemaTime.set((timestamp - start) * 0.001);
        });
    }, [cinemaTime, enabled]);

    const idleDriftX = useTransform(cinemaTime, time => idleDriftAt(time, cinemaShake).thetaKick * 900);
    const idleDriftY = useTransform(cinemaTime, time => -idleDriftAt(time, cinemaShake).radiusKick * 520);

    const sceneX = useTransform(
        [sceneParallaxX ?? pointerX, punch, idleDriftX],
        ([parallax, punchValue, idleX]: number[]) => ((parallax ?? 0.5) - 0.5) * 28 + (punchValue || 0) * 8 + (idleX || 0),
    );
    const sceneY = useTransform(
        [sceneParallaxY ?? pointerY, punch, idleDriftY],
        ([parallax, punchValue, idleY]: number[]) => ((parallax ?? 0.5) - 0.5) * 18 - (punchValue || 0) * 6 + (idleY || 0),
    );
    const sceneRotate = useTransform(roll, value => (value || 0) * 2.4);
    const sceneScale = useTransform(
        [pulse, punch, scale, energy, audioPower],
        ([pulseValue, punchValue, scaleValue, energyValue, powerValue]: number[]) => mapRhythmScaleBoost({
            beatPulse: resolvePresentationBeatPulse(
                beatPulse ? (pulseValue || 0) : 0,
                powerValue || 0,
            ) * rhythmIntensity,
            cameraPunch: beatPulse ? (punchValue || 0) * rhythmIntensity : 0,
            cinemaScale: beatPulse ? (scaleValue || 0.82) : 0.82,
            atmosphereEnergy: beatPulse ? (energyValue || 0.42) : 0.42,
        }),
    );
    const tiltX = useTransform(
        suppressPointerTilt
            ? [userRotateX ?? zero]
            : [pointerY, userRotateX ?? zero],
        (values: number[]) => {
            const pointerTilt = suppressPointerTilt ? 0 : ((values[0] ?? 0.5) * 14 - 7);
            const userTilt = suppressPointerTilt ? (values[0] ?? 0) : (values[1] ?? 0);
            return pointerTilt + userTilt;
        },
    );
    const tiltY = useTransform(
        suppressPointerTilt
            ? [userRotateY ?? zero]
            : [pointerX, userRotateY ?? zero],
        (values: number[]) => {
            const pointerTilt = suppressPointerTilt ? 0 : ((values[0] ?? 0.5) * 16 - 8);
            const userTilt = suppressPointerTilt ? (values[0] ?? 0) : (values[1] ?? 0);
            return pointerTilt + userTilt;
        },
    );
    const lyricDepth = useTransform(pulse, [0, 1], [52, 108]);
    const lyricGlow = useTransform(
        [pulse, punch, energy, audioPower],
        ([pulseValue, punchValue, energyValue, powerValue]: number[]) => {
            const glow = mapRhythmGlow({
                beatPulse: resolvePresentationBeatPulse(
                    beatPulse ? (pulseValue || 0) : 0,
                    powerValue || 0,
                ) * rhythmIntensity,
                cameraPunch: beatPulse ? (punchValue || 0) * rhythmIntensity : 0,
                cinemaScale: 0.82,
                atmosphereEnergy: beatPulse ? (energyValue || 0.42) : 0.42,
            });
            return 8 + glow * 28;
        },
    );

    return {
        sceneX,
        sceneY,
        sceneRotate,
        sceneScale,
        tiltX,
        tiltY,
        lyricDepth,
        lyricGlow,
    };
};

export const LYRIC_SCENE_FOCAL_Y = 0.44;

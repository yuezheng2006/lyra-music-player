import { colorWithAlpha } from '../colorMix';
import { clamp } from './cadenzaMath';
import type { CadenzaWordStatus, WordPlacement } from './cadenzaTypes';

// src/components/visualizer/cadenza/cadenzaPlacementPose.ts
// Discrete pose for one cadenza word. RAF interpolates these targets; no React state.

export type CadenzaPlacementPoseInput = {
    placement: WordPlacement;
    status: CadenzaWordStatus;
    parkAtRest: boolean;
    waitingOpacity: number;
    waitingBlurPx: number;
    isInstantWordReveal: boolean;
    passedAlpha: number;
    pulse: number;
    passedDriftProgress: number;
    width: number;
    focusY: number;
    localFloatX: number;
    localFloatY: number;
};

export type CadenzaPlacementPose = {
    x: number;
    y: number;
    rotation: number;
    rotateX: number;
    z: number;
    scale: number;
    bodyAlpha: number;
    blur: number;
};

/** Folia-style waiting fly-in + CSS 3D depth. Karaoke parks at rest. */
export const resolveCadenzaPlacementPose = (input: CadenzaPlacementPoseInput): CadenzaPlacementPose => {
    const {
        placement,
        status,
        parkAtRest,
        waitingOpacity,
        waitingBlurPx,
        isInstantWordReveal,
        passedAlpha,
        pulse,
        passedDriftProgress,
        width,
        focusY,
        localFloatX,
        localFloatY,
    } = input;
    const parked = parkAtRest || isInstantWordReveal;

    const scale = status === 'waiting'
        ? parked
            ? placement.scale
            : Math.max(placement.scale * 0.5, 0.5)
        : status === 'active'
            ? isInstantWordReveal
                ? placement.scale
                : placement.scale * 1.3 * pulse
            : placement.scale;

    const rotation = status === 'waiting'
        ? parked
            ? placement.rotate
            : placement.rotate + 20
        : status === 'passed'
            ? isInstantWordReveal
                ? placement.rotate
                : placement.rotate + placement.passedRotate * passedDriftProgress
            : placement.rotate;

    const rotateX = status === 'waiting' && !parked
        ? placement.rotateX + 16
        : status === 'passed'
            ? placement.rotateX * 0.35
            : placement.rotateX;

    const z = status === 'waiting' && !parked
        ? placement.z - 72
        : status === 'passed'
            ? placement.z * 0.4
            : placement.z;

    const waitingEntryX = status === 'waiting' && !parked ? placement.entryOffsetX : 0;
    const waitingEntryY = status === 'waiting' && !parked ? placement.entryOffsetY : 0;
    const passedDriftX = status === 'passed' ? placement.passedDriftX * passedDriftProgress : 0;
    const passedDriftY = status === 'passed' ? placement.passedDriftY * passedDriftProgress : 0;

    return {
        x: width / 2 + placement.x + localFloatX + passedDriftX + waitingEntryX,
        y: focusY + placement.y + localFloatY + passedDriftY + waitingEntryY,
        rotation,
        rotateX,
        z,
        scale,
        bodyAlpha: status === 'waiting' ? waitingOpacity : status === 'active' ? 1 : passedAlpha,
        blur: status === 'waiting' && !isInstantWordReveal ? waitingBlurPx : 0,
    };
};

export const buildCadenzaOverlayTransform = (pose: Pick<CadenzaPlacementPose, 'rotation' | 'rotateX' | 'z' | 'scale'>, x: number, y: number) => (
    `translate3d(${x}px, ${y}px, ${pose.z}px) rotateX(${pose.rotateX}deg) rotate(${pose.rotation}deg) scale(${pose.scale})`
);

export const buildDomTextShadow = (color: string, intensity: number, _blurScale = 1) => {
    const glow = clamp(intensity, 0, 1.6);
    if (glow <= 0.01) {
        return 'none';
    }

    return [
        `0 0 40px ${colorWithAlpha(color, Math.min(0.98, glow))}`,
        `0 0 40px ${colorWithAlpha(color, Math.min(0.92, glow * 0.92))}`,
        `0 0 40px ${colorWithAlpha(color, Math.min(0.35, glow * 0.26))}`,
    ].join(', ');
};

// src/utils/playback/adjustVolumeByStepMath.ts
// Pure volume-step math for keyboard / command-palette adjustments.

import { clampMediaVolume } from '@/utils/appPlaybackHelpers';

/** Mineradio-compatible keyboard volume step (5%). */
export const KEYBOARD_VOLUME_STEP = 0.05;

export type AdjustVolumeByStepInput = {
    volume: number;
    isMuted: boolean;
    delta: number;
};

export type AdjustVolumeByStepResult = {
    nextVolume: number;
    volumeChanged: boolean;
    shouldUnmute: boolean;
};

/** Resolve the next volume and whether mute should clear on a step up. */
export function resolveVolumeStepAdjustment({
    volume,
    isMuted,
    delta,
}: AdjustVolumeByStepInput): AdjustVolumeByStepResult {
    const nextVolume = clampMediaVolume(volume + delta);
    const volumeChanged = Math.abs(nextVolume - clampMediaVolume(volume)) > 1e-6;
    const shouldUnmute = isMuted && delta > 0 && nextVolume > 0;
    return { nextVolume, volumeChanged, shouldUnmute };
}

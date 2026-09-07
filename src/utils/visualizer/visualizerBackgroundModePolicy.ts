import type { VisualizerBackgroundMode, VisualizerMode } from '../../types';
import { migrateVisualizerBackgroundMode } from './retiredVisualizerBackgroundModes';

// src/utils/visualizer/visualizerBackgroundModePolicy.ts
// Background-mode policy only. Playback clocks live in mediaClockIsolationMath.

/** After GPU crash: demote heavy backgrounds so compositor can recover. */
export const resolveGpuCrashVisualizerFallback = (
    current: VisualizerBackgroundMode | null | undefined,
): VisualizerBackgroundMode | null => {
    if (!current || current === 'common') return null;
    if (
        current === 'interactive3d'
        || current === 'latent'
        || current === 'nomand'
        || current === 'monet'
        || current === 'url'
        || current === 'sora'
        || current === 'turntable'
    ) {
        return 'common';
    }
    return 'common';
};

/**
 * Boot clamp: retired 3D and GPU-unstable sessions land on common.
 */
export const resolveElectronSafeVisualizerBackgroundMode = (input: {
    mode: VisualizerBackgroundMode;
    isElectron: boolean;
    devicePixelRatio: number;
    gpuUnstable: boolean;
    interactive3dOptIn: boolean;
}): VisualizerBackgroundMode => {
    const mode = migrateVisualizerBackgroundMode(input.mode) ?? 'common';
    void input.devicePixelRatio;
    void input.interactive3dOptIn;
    if (!input.isElectron) return mode;
    if (input.gpuUnstable && mode !== 'common') return 'common';
    return mode;
};

/**
 * User selection: retired interactive3d maps to common. Other heavy modes stay
 * shielded while GPU is marked unstable.
 */
export const resolveUserSelectedVisualizerBackgroundMode = (input: {
    requested: VisualizerBackgroundMode;
    isElectron: boolean;
    gpuUnstable: boolean;
}): VisualizerBackgroundMode => {
    const requested = migrateVisualizerBackgroundMode(input.requested) ?? 'common';
    if (!input.isElectron || !input.gpuUnstable) return requested;
    return 'common';
};

/** Lyric style is never demoted by GPU crash — only background mode is. */
export const resolveGpuCrashVisualizerModeFallback = (
    _current: VisualizerMode | null | undefined,
): VisualizerMode | null => null;

export const resolveElectronSafeVisualizerMode = (input: {
    mode: VisualizerMode;
    isElectron: boolean;
    gpuUnstable: boolean;
}): VisualizerMode => {
    void input.isElectron;
    void input.gpuUnstable;
    return input.mode;
};

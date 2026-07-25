import type { VisualizerBackgroundMode, VisualizerMode } from '../../types';

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
        || current === 'monet'
        || current === 'url'
        || current === 'sora'
    ) {
        return 'common';
    }
    return 'common';
};

/**
 * Boot clamp: prior GPU deaths → common; Retina needs explicit 3D opt-in.
 */
export const resolveElectronSafeVisualizerBackgroundMode = (input: {
    mode: VisualizerBackgroundMode;
    isElectron: boolean;
    devicePixelRatio: number;
    gpuUnstable: boolean;
    interactive3dOptIn: boolean;
}): VisualizerBackgroundMode => {
    if (!input.isElectron) return input.mode;
    if (input.gpuUnstable && input.mode !== 'common') return 'common';
    if (input.mode !== 'interactive3d') return input.mode;
    if (input.devicePixelRatio >= 2 && !input.interactive3dOptIn) return 'common';
    return input.mode;
};

/**
 * User selection: interactive3d is the first-class retry entry under gpuUnstable.
 * Other heavy modes stay shielded.
 */
export const resolveUserSelectedVisualizerBackgroundMode = (input: {
    requested: VisualizerBackgroundMode;
    isElectron: boolean;
    gpuUnstable: boolean;
}): VisualizerBackgroundMode => {
    if (!input.isElectron || !input.gpuUnstable) return input.requested;
    if (input.requested === 'common' || input.requested === 'interactive3d') {
        return input.requested;
    }
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

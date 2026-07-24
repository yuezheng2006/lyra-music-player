import type { GeometricQualityTier } from '../../components/visualizer/geometric/geometricQuality';
import type { VisualizerBackgroundMode, VisualizerMode } from '../../types';

// src/utils/performance/electronInteractive3dGuardMath.ts
// Pure guards for Electron interactive3d GPU thrash / process crashes.

const TIER_ORDER: Record<GeometricQualityTier, number> = {
    lite: 0,
    balanced: 1,
    high: 2,
};

/**
 * Electron + Retina WebGL (emily cover particles) can peg the GPU helper at
 * 100% and crash with exit_code=512, freezing the whole window. Cap the auto
 * quality ceiling so high is never the default on Electron.
 */
export const resolveElectronQualityCeiling = (input: {
    isElectron: boolean;
    devicePixelRatio: number;
    prefersReducedMotion?: boolean;
}): GeometricQualityTier | null => {
    if (!input.isElectron) return null;
    if (input.prefersReducedMotion || input.devicePixelRatio >= 2) return 'lite';
    return 'balanced';
};

export const clampGeometricTierToCeiling = (
    tier: GeometricQualityTier,
    ceiling: GeometricQualityTier | null | undefined,
): GeometricQualityTier => {
    if (!ceiling) return tier;
    return TIER_ORDER[tier] > TIER_ORDER[ceiling] ? ceiling : tier;
};

/**
 * After a GPU helper crash, leave any heavy background so the compositor can recover.
 * interactive3d / latent / monet have all been observed thrashing Retina Electron GPUs.
 */
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

/** Reload the renderer after this many GPU helper deaths in one session. */
export const GPU_CRASH_RELOAD_THRESHOLD = 2;

export const INTERACTIVE3D_OPT_IN_STORAGE_KEY = 'lyra_interactive3d_opt_in_v1';

export const readInteractive3dOptIn = (storage: Pick<Storage, 'getItem'> | null | undefined): boolean => (
    storage?.getItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY) === '1'
);

export const writeInteractive3dOptIn = (
    storage: Pick<Storage, 'setItem' | 'removeItem'> | null | undefined,
    optedIn: boolean,
) => {
    if (!storage) return;
    if (optedIn) storage.setItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY, '1');
    else storage.removeItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY);
};

/**
 * Electron Retina + interactive3d pegs the GPU helper (~100% CPU) and freezes input.
 * Boot into a safer background unless the user explicitly re-selects 3D (opt-in).
 */
export const resolveElectronSafeVisualizerBackgroundMode = (input: {
    mode: VisualizerBackgroundMode;
    isElectron: boolean;
    devicePixelRatio: number;
    gpuUnstable: boolean;
    interactive3dOptIn: boolean;
}): VisualizerBackgroundMode => {
    if (!input.isElectron) return input.mode;
    // Prior GPU deaths (incl. monet/latent thrash) → always boot on common.
    if (input.gpuUnstable && input.mode !== 'common') return 'common';
    if (input.mode !== 'interactive3d') return input.mode;
    // Retina first-run / restored sessions: never auto-start on interactive3d.
    if (input.devicePixelRatio >= 2 && !input.interactive3dOptIn) return 'common';
    return input.mode;
};

/**
 * Do not force lyric style away from Monet after a GPU crash.
 * Background→common + Monet Electron lite path keeps lyrics usable; wiping
 * visualizerMode made Monet look “completely broken” after any crash.
 */
export const resolveGpuCrashVisualizerModeFallback = (
    _current: VisualizerMode | null | undefined,
): VisualizerMode | null => null;

/** Boot-time mode clamp — lyric style is no longer demoted by gpuUnstable. */
export const resolveElectronSafeVisualizerMode = (input: {
    mode: VisualizerMode;
    isElectron: boolean;
    gpuUnstable: boolean;
}): VisualizerMode => {
    void input.isElectron;
    void input.gpuUnstable;
    return input.mode;
};

export const GPU_UNSTABLE_STORAGE_KEY = 'lyra_gpu_unstable_v1';

export const readGpuUnstableFlag = (storage: Pick<Storage, 'getItem'> | null | undefined): boolean => (
    storage?.getItem(GPU_UNSTABLE_STORAGE_KEY) === '1'
);

export const writeGpuUnstableFlag = (
    storage: Pick<Storage, 'setItem'> | null | undefined,
    unstable: boolean,
) => {
    if (!storage) return;
    storage.setItem(GPU_UNSTABLE_STORAGE_KEY, unstable ? '1' : '0');
};

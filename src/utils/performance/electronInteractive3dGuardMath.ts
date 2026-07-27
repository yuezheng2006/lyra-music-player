import type { GeometricQualityTier } from '../../components/visualizer/geometric/geometricQuality';

// src/utils/performance/electronInteractive3dGuardMath.ts
// Electron quality ceiling + compatibility re-exports.
// Background-mode policy → visualizerBackgroundModePolicy.ts
// GPU flag storage → gpuUnstableStorage.ts
// 3D opt-in storage → interactive3dOptInStorage.ts

const TIER_ORDER: Record<GeometricQualityTier, number> = {
    lite: 0,
    balanced: 1,
    high: 2,
};

/** Prefer relaunch after this many GPU helper deaths (macOS main process uses 1). */
export const GPU_CRASH_RELOAD_THRESHOLD = 1;

/**
 * Electron cover WebGL always uses lite so visuals yield before playback.
 */
export const resolveElectronQualityCeiling = (input: {
    isElectron: boolean;
    devicePixelRatio: number;
    prefersReducedMotion?: boolean;
}): GeometricQualityTier | null => {
    if (!input.isElectron) return null;
    void input.devicePixelRatio;
    void input.prefersReducedMotion;
    return 'lite';
};

export const clampGeometricTierToCeiling = (
    tier: GeometricQualityTier,
    ceiling: GeometricQualityTier | null | undefined,
): GeometricQualityTier => {
    if (!ceiling) return tier;
    return TIER_ORDER[tier] > TIER_ORDER[ceiling] ? ceiling : tier;
};

export {
    GPU_UNSTABLE_STORAGE_KEY,
    readGpuUnstableFlag,
    writeGpuUnstableFlag,
} from './gpuUnstableStorage';

export {
    INTERACTIVE3D_OPT_IN_STORAGE_KEY,
    readInteractive3dOptIn,
    writeInteractive3dOptIn,
} from '../visualizer/interactive3dOptInStorage';

export {
    resolveElectronSafeVisualizerBackgroundMode,
    resolveElectronSafeVisualizerMode,
    resolveGpuCrashVisualizerFallback,
    resolveGpuCrashVisualizerModeFallback,
    resolveUserSelectedVisualizerBackgroundMode,
} from '../visualizer/visualizerBackgroundModePolicy';

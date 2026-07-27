import {
    clampGeometricTierToCeiling,
    resolveElectronQualityCeiling,
} from '../../../utils/performance/electronInteractive3dGuardMath';

// src/components/visualizer/geometric/geometricQuality.ts
// Adaptive quality tiers for the interactive geometric background runtime.

export type GeometricQualityTier = 'high' | 'balanced' | 'lite';

export interface GeometricQualityProfile {
    tier: GeometricQualityTier;
    particleTarget: number;
    maxBeatParticles: number;
    devicePixelRatioCap: number;
    enableRipples: boolean;
    enableBeatBursts: boolean;
    enableDomShapes: boolean;
    shapeCount: number;
    frameSkip: number;
}

const TIER_PROFILES: Record<GeometricQualityTier, Omit<GeometricQualityProfile, 'tier'>> = {
    high: {
        particleTarget: 420,
        maxBeatParticles: 36,
        // Non-Electron Retina sharpening; Electron still hard-caps DPR to 1 in cover runtime.
        devicePixelRatioCap: 1.25,
        enableRipples: true,
        enableBeatBursts: true,
        enableDomShapes: true,
        shapeCount: 12,
        // Skip every other frame — full-frame + dense grids thrash Electron GPU helper.
        frameSkip: 2,
    },
    balanced: {
        particleTarget: 260,
        maxBeatParticles: 22,
        devicePixelRatioCap: 1,
        enableRipples: true,
        enableBeatBursts: true,
        enableDomShapes: false,
        shapeCount: 0,
        // Electron auto-ceiling is balanced; keep skip so Retina stays under ~100% GPU.
        frameSkip: 2,
    },
    lite: {
        // Safe retry profile for Electron Retina: one-pixel render target,
        // sparse geometry, and infrequent draws keep lyrics independent.
        particleTarget: 72,
        maxBeatParticles: 4,
        devicePixelRatioCap: 1,
        enableRipples: false,
        enableBeatBursts: false,
        enableDomShapes: false,
        shapeCount: 0,
        frameSkip: 6,
    },
};

const readDeviceMemory = () => {
    if (typeof navigator === 'undefined') return 8;
    return (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
};

const readHardwareConcurrency = () => {
    if (typeof navigator === 'undefined') return 8;
    return navigator.hardwareConcurrency ?? 8;
};

const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const readIsElectronRenderer = () => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as Window & { electron?: unknown }).electron);
};

const readDevicePixelRatio = () => {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
};

// Picks a runtime profile from device capability and accessibility preferences.
// Bias toward balanced — high is reserved for strong machines on modest viewports.
export const resolveGeometricQualityProfile = (
    viewportArea = 921600,
    overrideTier?: GeometricQualityTier,
): GeometricQualityProfile => {
    const electronCeiling = resolveElectronQualityCeiling({
        isElectron: readIsElectronRenderer(),
        devicePixelRatio: readDevicePixelRatio(),
        prefersReducedMotion: prefersReducedMotion(),
    });

    if (overrideTier) {
        const tier = clampGeometricTierToCeiling(overrideTier, electronCeiling);
        return { tier, ...TIER_PROFILES[tier] };
    }

    if (prefersReducedMotion()) {
        return { tier: 'lite', ...TIER_PROFILES.lite };
    }

    const memory = readDeviceMemory();
    const cores = readHardwareConcurrency();
    const isLargeDisplay = viewportArea > 1_400_000;

    let tier: GeometricQualityTier = 'lite';
    if (memory >= 16 && cores >= 12 && !isLargeDisplay) {
        tier = 'high';
    } else if (memory >= 4 && cores >= 4) {
        tier = 'balanced';
    }

    tier = clampGeometricTierToCeiling(tier, electronCeiling);
    return { tier, ...TIER_PROFILES[tier] };
};

export const scaleParticleTarget = (profile: GeometricQualityProfile, viewportArea: number) => (
    Math.min(
        profile.particleTarget,
        Math.max(160, Math.round(viewportArea / (profile.tier === 'high' ? 5200 : 6800))),
    )
);

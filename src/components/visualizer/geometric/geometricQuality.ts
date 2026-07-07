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
        particleTarget: 760,
        maxBeatParticles: 56,
        devicePixelRatioCap: 1.35,
        enableRipples: true,
        enableBeatBursts: true,
        enableDomShapes: true,
        shapeCount: 15,
        frameSkip: 1,
    },
    balanced: {
        particleTarget: 520,
        maxBeatParticles: 36,
        devicePixelRatioCap: 1.15,
        enableRipples: true,
        enableBeatBursts: true,
        enableDomShapes: true,
        shapeCount: 12,
        frameSkip: 1,
    },
    lite: {
        particleTarget: 280,
        maxBeatParticles: 20,
        devicePixelRatioCap: 1,
        enableRipples: false,
        enableBeatBursts: true,
        enableDomShapes: false,
        shapeCount: 0,
        frameSkip: 2,
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

// Picks a runtime profile from device capability and accessibility preferences.
export const resolveGeometricQualityProfile = (
    viewportArea = 921600,
    overrideTier?: GeometricQualityTier,
): GeometricQualityProfile => {
    if (overrideTier) {
        return { tier: overrideTier, ...TIER_PROFILES[overrideTier] };
    }

    if (prefersReducedMotion()) {
        return { tier: 'lite', ...TIER_PROFILES.lite };
    }

    const memory = readDeviceMemory();
    const cores = readHardwareConcurrency();
    const isLargeDisplay = viewportArea > 1_600_000;

    if (memory >= 8 && cores >= 8 && !isLargeDisplay) {
        return { tier: 'high', ...TIER_PROFILES.high };
    }

    if (memory >= 4 && cores >= 4) {
        return { tier: 'balanced', ...TIER_PROFILES.balanced };
    }

    return { tier: 'lite', ...TIER_PROFILES.lite };
};

export const scaleParticleTarget = (profile: GeometricQualityProfile, viewportArea: number) => (
    Math.min(
        profile.particleTarget,
        Math.max(180, Math.round(viewportArea / (profile.tier === 'high' ? 4200 : 5600))),
    )
);

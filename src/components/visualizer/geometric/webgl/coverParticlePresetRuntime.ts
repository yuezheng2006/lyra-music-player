import type { MineradioVisualPresetId } from '../../../../types';

// src/components/visualizer/geometric/webgl/coverParticlePresetRuntime.ts
// Per-preset camera and particle tuning for Mineradio-style rhythm presentation.

export interface CoverParticlePresetRuntimeProfile {
    speedMul: number;
    pointScale: number;
    cameraZ: number;
    fov: number;
    bassCameraPunch: number;
}

const PROFILES: Record<MineradioVisualPresetId, CoverParticlePresetRuntimeProfile> = {
    emily: {
        speedMul: 1,
        pointScale: 1.05,
        cameraZ: 5.2,
        fov: 45,
        bassCameraPunch: 0.08,
    },
    tunnel: {
        speedMul: 1.12,
        pointScale: 1.14,
        cameraZ: 4.35,
        fov: 58,
        bassCameraPunch: 0.42,
    },
    starfield: {
        speedMul: 1.18,
        pointScale: 1.08,
        cameraZ: 5.85,
        fov: 50,
        bassCameraPunch: 0.18,
    },
};

export const resolveCoverParticlePresetRuntime = (
    preset: MineradioVisualPresetId = 'emily',
): CoverParticlePresetRuntimeProfile => PROFILES[preset] ?? PROFILES.emily;

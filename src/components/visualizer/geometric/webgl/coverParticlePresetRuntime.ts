import type { MineradioVisualPresetId } from '../../../../types';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';

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
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 6.60,
        fov: 45,
        bassCameraPunch: 0.08,
    },
    tunnel: {
        speedMul: 1.24,
        pointScale: 1.28,
        cameraZ: 5.72,
        fov: 52,
        bassCameraPunch: 0.32,
    },
    nebula: {
        speedMul: 1.16,
        pointScale: 1.34,
        cameraZ: 5.38,
        fov: 50,
        bassCameraPunch: 0.22,
    },
    terrain: {
        speedMul: 1.28,
        pointScale: 1.24,
        cameraZ: 5.82,
        fov: 54,
        bassCameraPunch: 0.36,
    },
    quantumCube: {
        speedMul: 1.10,
        pointScale: 1.30,
        cameraZ: 5.48,
        fov: 48,
        bassCameraPunch: 0.28,
    },
    aurora: {
        speedMul: 1.02,
        pointScale: 1.18,
        cameraZ: 5.60,
        fov: 50,
        bassCameraPunch: 0.20,
    },
    mineradioTunnel: {
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 6.20,
        fov: 45,
        bassCameraPunch: 0.32,
    },
    mineradioOrbit: {
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 7.00,
        fov: 45,
        bassCameraPunch: 0.24,
    },
    mineradioVoid: {
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 8.00,
        fov: 45,
        bassCameraPunch: 0.02,
    },
    mineradioVinyl: {
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 6.50,
        fov: 45,
        bassCameraPunch: 0.20,
    },
    mineradioGalaxy: {
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 9.40,
        fov: 45,
        bassCameraPunch: 0.16,
    },
    starfield: {
        speedMul: 1.12,
        pointScale: 1.16,
        cameraZ: 5.62,
        fov: 48,
        bassCameraPunch: 0.18,
    },
};

export const resolveCoverParticlePresetRuntime = (
    preset: unknown = 'emily',
): CoverParticlePresetRuntimeProfile => PROFILES[normalizeInteractive3dVisualPreset(preset)] ?? PROFILES.emily;

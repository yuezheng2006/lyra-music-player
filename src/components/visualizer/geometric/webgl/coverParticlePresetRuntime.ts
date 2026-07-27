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
    immersivePhiOffset?: number;
    immersiveRadiusOffset?: number;
    immersiveFovOffset?: number;
}

const PROFILES: Record<MineradioVisualPresetId, CoverParticlePresetRuntimeProfile> = {
    emily: {
        speedMul: 1.00,
        // Slightly fuller at balanced ~159² so the field stays solid without 221² cost.
        pointScale: 1.14,
        // Slightly closer than Mineradio 6.6 so the cover plane uses more screen samples.
        cameraZ: 6.20,
        fov: 45,
        bassCameraPunch: 0.08,
    },
    nebula: {
        speedMul: 1.16,
        pointScale: 1.34,
        cameraZ: 5.38,
        fov: 50,
        bassCameraPunch: 0.22,
    },
    quantumCube: {
        speedMul: 1.10,
        pointScale: 1.30,
        cameraZ: 5.48,
        fov: 48,
        bassCameraPunch: 0.28,
    },
    aurora: {
        speedMul: 1.04,
        pointScale: 1.22,
        cameraZ: 5.80,
        fov: 50,
        bassCameraPunch: 0.18,
    },
    mineradioTunnel: {
        speedMul: 1.06,
        pointScale: 1.04,
        cameraZ: 6.05,
        fov: 48,
        bassCameraPunch: 0.36,
    },
    mineradioOrbit: {
        speedMul: 1.00,
        pointScale: 1.02,
        // Fallback before viewport fit; runtime overrides via resolveOrbitFitCameraRadius.
        cameraZ: 8.80,
        fov: 45,
        bassCameraPunch: 0.12,
    },
    mineradioVoid: {
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 8.00,
        fov: 45,
        bassCameraPunch: 0.02,
    },
    /** Retired vinyl — unused after normalize maps to emily. */
    mineradioVinyl: {
        speedMul: 1.00,
        pointScale: 1.00,
        cameraZ: 6.50,
        fov: 45,
        bassCameraPunch: 0.22,
    },
    mineradioGalaxy: {
        speedMul: 1.04,
        pointScale: 1.06,
        cameraZ: 9.20,
        fov: 48,
        bassCameraPunch: 0.20,
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

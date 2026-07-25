import type { MineradioVisualPresetId } from '../../../../types';
import {
    MINERADIO_ORBIT_FIT_FILL,
    MINERADIO_ORBIT_SPHERE_RADIUS,
    resolveOrbitFitCameraRadius,
} from '../interactiveCamera/interactiveCameraMath';

// src/components/visualizer/geometric/webgl/coverParticleViewportFitMath.ts
// Per-preset content radius → orbit camera distance so layouts stay fully on-screen.

/** Approximate content half-extent (world units) each preset is authored against. */
export const COVER_PARTICLE_FIT_CONTENT_RADIUS: Partial<Record<MineradioVisualPresetId, number>> = {
    mineradioOrbit: MINERADIO_ORBIT_SPHERE_RADIUS,
};

/** Higher fill = closer camera = larger on-screen presence. */
export const COVER_PARTICLE_FIT_FILL: Partial<Record<MineradioVisualPresetId, number>> = {
    mineradioOrbit: MINERADIO_ORBIT_FIT_FILL,
};

/** Resolve orbit radius from content size + current viewport, or null if preset uses fixed baseline. */
export const resolveCoverParticleFitCameraRadius = ({
    preset,
    fovDeg,
    aspect,
}: {
    preset: MineradioVisualPresetId | null | undefined;
    fovDeg: number;
    aspect: number;
}): number | null => {
    if (!preset) return null;
    const contentRadius = COVER_PARTICLE_FIT_CONTENT_RADIUS[preset];
    if (contentRadius == null) return null;
    return resolveOrbitFitCameraRadius({
        sphereRadius: contentRadius,
        fovDeg,
        aspect,
        fillFraction: COVER_PARTICLE_FIT_FILL[preset] ?? MINERADIO_ORBIT_FIT_FILL,
    });
};

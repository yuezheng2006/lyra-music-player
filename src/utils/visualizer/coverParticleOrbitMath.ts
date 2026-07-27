// src/utils/visualizer/coverParticleOrbitMath.ts
// Pure helpers mirroring mineradioOrbit uniform sphere breath (no silhouette warp).

/** Must stay synced with GLSL `baseR` and `MINERADIO_ORBIT_SPHERE_RADIUS`. */
export const ORBIT_SPHERE_BASE_RADIUS = 2;

export type OrbitBreathInput = {
    bass?: number;
    beat?: number;
    mid?: number;
    intensity?: number;
};

/** Uniform radial breath factor added to 1.0 (clamped). */
export const resolveOrbitUniformBreath = (input: OrbitBreathInput = {}): number => {
    const K = (input.intensity ?? 1) * 1.6;
    const bass = input.bass ?? 0;
    const beat = input.beat ?? 0;
    const mid = input.mid ?? 0;
    const raw = bass * 0.085 * K + beat * 0.045 * K + mid * 0.018 * K;
    return Math.max(0, Math.min(0.12, raw));
};

/** Final sphere radius after breath. */
export const resolveOrbitSphereRadius = (input: OrbitBreathInput = {}): number => (
    ORBIT_SPHERE_BASE_RADIUS * (1 + resolveOrbitUniformBreath(input))
);

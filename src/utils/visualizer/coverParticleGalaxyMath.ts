// src/utils/visualizer/coverParticleGalaxyMath.ts
// Pure helpers mirroring mineradioGalaxy vertex-shader spiral / core-pull tuning.

/** Spiral ribbon lane share before star-dust lane (matches GLSL `lane < 0.80`). */
export const GALAXY_RIBBON_LANE_END = 0.8;

/** Approximate spiral arm count used when packing bandCoord. */
export const GALAXY_SPIRAL_ARM_BANDS = 5.65;

export type GalaxySpiralSampleInput = {
    /** Particle UV.x in [0, 1]. */
    u: number;
    /** Ribbon band normalized in [0, 1]. */
    bandN: number;
    /** Per-band seed in [0, 1]. */
    seed: number;
    /** Shader time * speed. */
    t: number;
    /** Bass [0, 1] after audio smoother. */
    bass?: number;
    /** Beat pulse [0, 1]. */
    beat?: number;
};

export type GalaxySpiralSample = {
    arc: number;
    spiralRadius: number;
    /** Differential rotation add-on applied to arc (inner arms lead). */
    differentialSpin: number;
    /** Radial collapse toward core (black-hole pulse). */
    corePull: number;
};

/** Differential spin: inner arms rotate faster than outer halo. */
export const resolveGalaxyDifferentialSpin = (bandN: number, t: number, seed: number): number => {
    const n = Math.max(0, Math.min(1, bandN));
    const innerLead = 1.15 / (0.28 + n * 0.95);
    return t * (0.014 + innerLead * 0.022) + seed * 0.35;
};

/** Core pull amount; bass/beat swell the accretion well. */
export const resolveGalaxyCorePull = (
    spiralRadius: number,
    bass = 0,
    beat = 0,
): number => {
    const r2 = spiralRadius * spiralRadius;
    const well = Math.exp(-r2 * 0.0036);
    return well * (0.28 + bass * 0.55 + beat * 0.32);
};

/** Sample spiral arc / radius / core pull for a ribbon particle (TS mirror of GLSL). */
export const sampleGalaxySpiral = (input: GalaxySpiralSampleInput): GalaxySpiralSample => {
    const bandN = Math.max(0, Math.min(1, input.bandN));
    const seed = Math.max(0, Math.min(1, input.seed));
    const flow = ((input.u % 1) + 1) % 1;
    const differentialSpin = resolveGalaxyDifferentialSpin(bandN, input.t, seed);
    const arc = (flow - 0.5) * Math.PI * (1.35 + bandN * 0.72 + seed * 0.24) + differentialSpin;
    const spiralRadius = 9.2 + bandN * 11.8 + seed * 6.0;
    const corePull = resolveGalaxyCorePull(spiralRadius, input.bass ?? 0, input.beat ?? 0);
    return { arc, spiralRadius, differentialSpin, corePull };
};

/** Cover vs synthetic aurora mix on ribbon ridges (lower = more album color). */
export const resolveGalaxyCoverColorMix = (ridge: number): number => (
    0.34 + Math.max(0, Math.min(1, ridge)) * 0.20
);

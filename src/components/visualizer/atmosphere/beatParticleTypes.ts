import type { MutableRefObject } from 'react';

// src/components/visualizer/atmosphere/beatParticleTypes.ts
// Shared beat particle contracts for atmosphere canvas rendering.

export interface BeatParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    alpha: number;
    useAccent: boolean;
}

export interface BeatParticleRuntimeRefs {
    particlesRef: MutableRefObject<BeatParticle[]>;
    cinemaScaleRef: MutableRefObject<number>;
    energyRef: MutableRefObject<number>;
}

export const MAX_BEAT_PARTICLES = 48;
export const BEAT_PARTICLE_SPAWN_THRESHOLD = 0.58;

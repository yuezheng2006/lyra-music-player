import { createSeededRandom } from './seededRandom';

// src/components/visualizer/geometric/buildOrbitParticles.ts
// Mineradio wallpaper-style orbit particles with precomputed motion coefficients.

export interface OrbitParticle {
    seed: number;
    x: number;
    y: number;
    lane: number;
    z: number;
    size: number;
    speedBase: number;
    wobbleFreq: number;
    twinkleFreq: number;
    angleBias: number;
}

export const orbitRand = (seed: number) => Math.abs(Math.sin(seed * 3187.917) * 43758.5453) % 1;

export const buildOrbitParticles = (
    seed: string | number = 'orbit',
    targetCount = 520,
): OrbitParticle[] => {
    const rand = createSeededRandom(seed);
    const particles: OrbitParticle[] = [];

    for (let i = 0; i < targetCount; i += 1) {
        const particleSeed = i * 11.37 + 1;
        particles.push({
            seed: particleSeed,
            x: rand(),
            y: rand(),
            lane: rand(),
            z: rand(),
            size: 0.6 + rand() * 2.4,
            speedBase: 0.009 + orbitRand(particleSeed) * 0.021,
            wobbleFreq: 0.22 + orbitRand(particleSeed) * 0.18,
            twinkleFreq: 0.5 + orbitRand(particleSeed) * 0.42,
            angleBias: orbitRand(particleSeed * 2) * 0.16,
        });
    }

    return particles;
};

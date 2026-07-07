// src/components/visualizer/geometric/effects/bloomParticle/buildBloomParticles.ts
// Soft additive bloom particles inspired by Mineradio bloomParticles.

export interface BloomParticle {
    angle: number;
    ring: number;
    z: number;
    seed: number;
    size: number;
    lane: number;
    wobbleFreq: number;
    twinkleFreq: number;
}

export const buildBloomParticles = (count: number, seed: string | number = 'bloom'): BloomParticle[] => {
    const numericSeed = typeof seed === 'number'
        ? seed
        : Array.from(String(seed)).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const particles: BloomParticle[] = [];

    for (let i = 0; i < count; i += 1) {
        const rand = Math.sin((numericSeed + i) * 12.9898) * 43758.5453;
        const unit = rand - Math.floor(rand);
        particles.push({
            angle: unit * Math.PI * 2,
            ring: 0.12 + (1 - Math.pow(Math.random(), 0.8)) * 0.88,
            z: (Math.random() - 0.5) * 0.6,
            seed: unit * 19.17 + i * 0.013,
            size: 1.2 + Math.random() * 2.8,
            lane: Math.random(),
            wobbleFreq: 0.11 + Math.random() * 0.08,
            twinkleFreq: 0.34 + Math.random() * 0.22,
        });
    }

    return particles;
};

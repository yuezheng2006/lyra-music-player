// src/components/visualizer/geometric/effects/floatingParticle/buildFloatingParticles.ts
// Slow-drifting halo particles ported from Mineradio float layer distribution.

export interface FloatingParticle {
    baseX: number;
    baseY: number;
    phaseX: number;
    phaseY: number;
    phaseZ: number;
    amp: number;
    seed: number;
    halo: boolean;
}

export const buildFloatingParticles = (count: number, seed: string | number = 'float'): FloatingParticle[] => {
    const numericSeed = typeof seed === 'number'
        ? seed
        : Array.from(String(seed)).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const particles: FloatingParticle[] = [];

    for (let i = 0; i < count; i += 1) {
        const halo = i < count * 0.76;
        let baseX: number;
        let baseY: number;

        if (halo) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.18 + Math.pow(Math.random(), 0.72) * 0.82;
            baseX = Math.cos(angle) * radius;
            baseY = Math.sin(angle) * radius * 0.54 + (Math.random() - 0.5) * 0.18;
        } else {
            baseX = (Math.random() - 0.5) * 1.4;
            baseY = (Math.random() - 0.5) * 1.0;
        }

        particles.push({
            baseX,
            baseY,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            phaseZ: Math.random() * Math.PI * 2,
            amp: 0.15 + Math.random() * 0.35,
            seed: Math.sin((numericSeed + i) * 7.13) * 0.5 + 0.5,
            halo,
        });
    }

    return particles;
};

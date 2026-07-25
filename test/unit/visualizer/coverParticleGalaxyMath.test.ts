import { describe, expect, it } from 'vitest';
import {
    resolveGalaxyCorePull,
    resolveGalaxyCoverColorMix,
    resolveGalaxyDifferentialSpin,
    sampleGalaxySpiral,
} from '@/utils/visualizer/coverParticleGalaxyMath';

describe('coverParticleGalaxyMath', () => {
    it('gives inner arms faster differential spin than outer halo', () => {
        const inner = resolveGalaxyDifferentialSpin(0.1, 10, 0.4);
        const outer = resolveGalaxyDifferentialSpin(0.9, 10, 0.4);
        expect(inner).toBeGreaterThan(outer);
    });

    it('swells core pull with bass and beat near the center', () => {
        const calm = resolveGalaxyCorePull(4, 0, 0);
        const loud = resolveGalaxyCorePull(4, 1, 1);
        const far = resolveGalaxyCorePull(40, 1, 1);
        expect(loud).toBeGreaterThan(calm);
        expect(calm).toBeGreaterThan(far);
    });

    it('samples spiral radius and cover mix in expected ranges', () => {
        const sample = sampleGalaxySpiral({
            u: 0.25,
            bandN: 0.4,
            seed: 0.5,
            t: 2,
            bass: 0.6,
            beat: 0.3,
        });
        expect(sample.spiralRadius).toBeGreaterThan(9);
        expect(sample.corePull).toBeGreaterThan(0);
        expect(resolveGalaxyCoverColorMix(1)).toBeCloseTo(0.54);
        expect(resolveGalaxyCoverColorMix(0)).toBeCloseTo(0.34);
    });
});

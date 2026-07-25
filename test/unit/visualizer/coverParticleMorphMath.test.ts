import { describe, expect, it } from 'vitest';
import {
    canMorphCoverParticlePresets,
    COVER_PARTICLE_MORPH_MS,
    easeCoverParticleMorph,
    mixCoverParticleMorphPosition,
    resolveCoverParticleMorphLive,
} from '@/utils/visualizer/coverParticleMorphMath';

describe('coverParticleMorphMath', () => {
    it('only allows morph between distinct shipped presets', () => {
        expect(canMorphCoverParticlePresets('emily', 'mineradioGalaxy')).toBe(true);
        expect(canMorphCoverParticlePresets('mineradioTunnel', 'mineradioOrbit')).toBe(true);
        expect(canMorphCoverParticlePresets('emily', 'emily')).toBe(false);
        expect(canMorphCoverParticlePresets(null, 'emily')).toBe(false);
        expect(canMorphCoverParticlePresets('aurora', 'emily')).toBe(false);
        expect(COVER_PARTICLE_MORPH_MS).toBeGreaterThan(500);
    });

    it('eases and mixes rest positions', () => {
        expect(easeCoverParticleMorph(0)).toBe(0);
        expect(easeCoverParticleMorph(1)).toBe(1);
        expect(easeCoverParticleMorph(0.5)).toBeCloseTo(0.5);
        const mid = mixCoverParticleMorphPosition([0, 0, 0], [10, 20, 30], 0.5);
        expect(mid[0]).toBeCloseTo(5);
        expect(mid[1]).toBeCloseTo(10);
        expect(mid[2]).toBeCloseTo(15);
    });

    it('clears morph live at the end of the tween', () => {
        expect(resolveCoverParticleMorphLive(0.4, true)).toBe(1);
        expect(resolveCoverParticleMorphLive(1, true)).toBe(0);
        expect(resolveCoverParticleMorphLive(0.2, false)).toBe(0);
    });
});

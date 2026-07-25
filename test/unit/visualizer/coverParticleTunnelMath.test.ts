import { describe, expect, it } from 'vitest';
import {
    resolveTunnelHelixTwist,
    resolveTunnelTrail,
    sampleTunnelParticle,
} from '@/utils/visualizer/coverParticleTunnelMath';

describe('coverParticleTunnelMath', () => {
    it('adds helix twist along tube flow and mid energy', () => {
        expect(resolveTunnelHelixTwist(0, 0)).toBe(0);
        expect(resolveTunnelHelixTwist(1, 1)).toBeGreaterThan(resolveTunnelHelixTwist(1, 0));
    });

    it('scales trail length with bass', () => {
        expect(resolveTunnelTrail(0)).toBe(0);
        expect(resolveTunnelTrail(1, 1)).toBeGreaterThan(0.1);
    });

    it('keeps tube radius near the Mineradio baseline before bass shrink', () => {
        const calm = sampleTunnelParticle({ u: 0.25, v: 0.5, t: 0, bass: 0, mid: 0, intensity: 1 });
        expect(calm.radius).toBeCloseTo(2, 1);
        const loud = sampleTunnelParticle({ u: 0.25, v: 0.5, t: 0, bass: 1, mid: 0.2, intensity: 1 });
        expect(loud.radius).toBeLessThan(calm.radius);
        expect(loud.helixTwist).toBeGreaterThan(0);
    });
});

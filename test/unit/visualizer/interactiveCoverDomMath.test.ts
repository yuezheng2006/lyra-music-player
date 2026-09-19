import { describe, expect, it } from 'vitest';
import {
    buildInteractiveCoverDomParticles,
    resolveInteractiveCoverDomPresetStyle,
} from '../../../src/utils/visualizer/interactiveCoverDomMath';

describe('interactiveCoverDomMath', () => {
    it('normalizes tunnel / galaxy DOM styles onto emily atmosphere', () => {
        const emily = resolveInteractiveCoverDomPresetStyle('emily', 'balanced');
        const tunnel = resolveInteractiveCoverDomPresetStyle('mineradioTunnel', 'balanced');
        const galaxy = resolveInteractiveCoverDomPresetStyle('mineradioGalaxy', 'balanced');

        expect(emily.preset).toBe('emily');
        expect(tunnel).toEqual(emily);
        expect(galaxy).toEqual(emily);
        expect(emily.coverScale).toBeGreaterThan(0);
        expect(emily.particleCount).toBeGreaterThan(0);
    });

    it('builds deterministic particles from the same seed', () => {
        const a = buildInteractiveCoverDomParticles('seed-a', 12);
        const b = buildInteractiveCoverDomParticles('seed-a', 12);
        expect(a).toEqual(b);
        expect(a).toHaveLength(12);
        expect(a[0].left).toBeGreaterThanOrEqual(4);
        expect(a[0].left).toBeLessThanOrEqual(96);
    });

    it('clamps particle budget', () => {
        expect(buildInteractiveCoverDomParticles('x', 999)).toHaveLength(48);
        expect(buildInteractiveCoverDomParticles('x', -3)).toHaveLength(0);
    });
});

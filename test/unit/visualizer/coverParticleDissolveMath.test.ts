import { describe, expect, it } from 'vitest';
import {
    resolveDissolveEdge,
    resolveDissolveLive,
    sampleDissolveEdge,
    sampleDissolveNoise,
} from '@/utils/visualizer/coverParticleDissolveMath';

describe('coverParticleDissolveMath', () => {
    it('returns no edge when dissolve is idle', () => {
        expect(resolveDissolveEdge(0.5, 0.5, 0)).toBe(0);
        expect(resolveDissolveLive(0.4, false)).toBe(0);
        expect(resolveDissolveLive(1, true)).toBe(0);
        expect(resolveDissolveLive(0.4, true)).toBe(1);
    });

    it('peaks edge when noise sits on the dissolve front', () => {
        const onFront = resolveDissolveEdge(0.5, 0.5, 1);
        const far = resolveDissolveEdge(0.05, 0.5, 1);
        expect(onFront).toBeGreaterThan(0.95);
        expect(far).toBeLessThan(onFront);
    });

    it('scales scatter with edge and burst', () => {
        const calm = sampleDissolveEdge({ noise: 0.5, dissolve: 0.5, live: 1, burstAmt: 0 });
        const loud = sampleDissolveEdge({ noise: 0.5, dissolve: 0.5, live: 1, burstAmt: 1 });
        expect(loud.scatter).toBeGreaterThan(calm.scatter);
        expect(sampleDissolveNoise(0.2, 0.3, 0.4)).toBeGreaterThanOrEqual(0);
        expect(sampleDissolveNoise(0.2, 0.3, 0.4)).toBeLessThan(1);
    });
});

import { describe, expect, it } from 'vitest';
import { resolveCadenzaGlowIntensity } from '@/utils/visualizer/cadenzaGlowMath';

// test/unit/visualizer/cadenzaGlowMath.test.ts
// Cadenza stage glow must respect the global lyric effect intensity setting.

describe('resolveCadenzaGlowIntensity', () => {
    it('scales tuning glow by visual effect intensity', () => {
        expect(resolveCadenzaGlowIntensity(1, 'subtle')).toBeLessThan(1);
        expect(resolveCadenzaGlowIntensity(1, 'strong')).toBe(1);
        expect(resolveCadenzaGlowIntensity(1, 'extreme')).toBeGreaterThan(1);
    });

    it('preserves relative tuning while applying intensity', () => {
        const subtle = resolveCadenzaGlowIntensity(0.8, 'subtle');
        const strong = resolveCadenzaGlowIntensity(0.8, 'strong');
        expect(subtle / strong).toBeCloseTo(resolveCadenzaGlowIntensity(1, 'subtle'), 5);
    });

    it('never returns negative glow', () => {
        expect(resolveCadenzaGlowIntensity(-1, 'extreme')).toBe(0);
    });
});

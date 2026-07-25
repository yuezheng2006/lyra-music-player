import { describe, expect, it } from 'vitest';
import {
    resolveSoraStarLayer,
    resolveSoraStarLayerWeights,
    SORA_STAR_COUNT,
} from '@/utils/visualizer/soraStarfieldMath';

// test/unit/visualizer/soraStarfieldMath.test.ts

describe('soraStarfieldMath', () => {
    it('keeps a star budget dense enough without turning into grain', () => {
        expect(SORA_STAR_COUNT).toBeGreaterThanOrEqual(600);
        expect(SORA_STAR_COUNT).toBeLessThanOrEqual(900);
    });

    it('splits indices into far/mid/near layers', () => {
        expect(resolveSoraStarLayer(0)).toBe('far');
        expect(resolveSoraStarLayer(Math.floor(SORA_STAR_COUNT * 0.7))).toBe('mid');
        expect(resolveSoraStarLayer(SORA_STAR_COUNT - 1)).toBe('near');
    });

    it('makes nearer stars faster and larger', () => {
        const far = resolveSoraStarLayerWeights('far');
        const near = resolveSoraStarLayerWeights('near');
        expect(near.speedMul).toBeGreaterThan(far.speedMul);
        expect(near.sizeMul).toBeGreaterThan(far.sizeMul);
        expect(near.accentChance).toBeGreaterThan(far.accentChance);
    });
});

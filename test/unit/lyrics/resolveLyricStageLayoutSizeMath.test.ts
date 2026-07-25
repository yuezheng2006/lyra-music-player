import { describe, expect, it } from 'vitest';
import { resolveLyricStageLayoutSize } from '@/utils/lyrics/resolveLyricStageLayoutSizeMath';

// test/unit/lyrics/resolveLyricStageLayoutSizeMath.test.ts

describe('resolveLyricStageLayoutSize', () => {
    it('does not stamp a fake 240px width when the node is unlaid-out', () => {
        const resolved = resolveLyricStageLayoutSize({
            nodeWidth: 0,
            shellWidth: 0,
            shellHeight: 0,
            fallbackWidth: 1508,
            fallbackHeight: 900,
        });
        expect(resolved.widthFromMeasure).toBe(false);
        expect(resolved.width).toBe(1508);
        expect(resolved.height).toBe(900);
    });

    it('prefers shell width once the stage is laid out', () => {
        const resolved = resolveLyricStageLayoutSize({
            nodeWidth: 240,
            shellWidth: 1508,
            shellHeight: 1012,
            fallbackWidth: 960,
            fallbackHeight: 720,
        });
        expect(resolved.widthFromMeasure).toBe(true);
        expect(resolved.width).toBe(1508);
        expect(resolved.height).toBe(1012);
    });
});

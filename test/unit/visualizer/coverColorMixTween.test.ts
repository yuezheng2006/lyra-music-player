import { describe, expect, it, vi } from 'vitest';
import {
    CoverColorMixTween,
    DEFAULT_COVER_COLOR_MIX_MS,
    EMILY_COVER_COLOR_MIX_MS,
} from '../../../src/components/visualizer/geometric/webgl/coverColorMixTween';

describe('CoverColorMixTween', () => {
    it('exposes Mineradio Emily mix timing shorter than the default', () => {
        expect(EMILY_COVER_COLOR_MIX_MS).toBe(520);
        expect(DEFAULT_COVER_COLOR_MIX_MS).toBe(720);
        expect(EMILY_COVER_COLOR_MIX_MS).toBeLessThan(DEFAULT_COVER_COLOR_MIX_MS);
    });

    it('starts cover mix at zero and can be cancelled', () => {
        const values: number[] = [];
        const tween = new CoverColorMixTween();
        const cancel = vi.fn();

        vi.stubGlobal('requestAnimationFrame', () => 7);
        vi.stubGlobal('cancelAnimationFrame', cancel);

        tween.start((mix) => values.push(mix), EMILY_COVER_COLOR_MIX_MS);
        expect(values).toEqual([0]);

        tween.cancel();
        expect(cancel).toHaveBeenCalledWith(7);

        vi.unstubAllGlobals();
    });
});

import { describe, expect, it, vi } from 'vitest';
import { CoverColorMixTween } from '../../../src/components/visualizer/geometric/webgl/coverColorMixTween';

describe('CoverColorMixTween', () => {
    it('starts cover mix at zero and can be cancelled', () => {
        const values: number[] = [];
        const tween = new CoverColorMixTween();
        const cancel = vi.fn();

        vi.stubGlobal('requestAnimationFrame', () => 7);
        vi.stubGlobal('cancelAnimationFrame', cancel);

        tween.start((mix) => values.push(mix), 720);
        expect(values).toEqual([0]);

        tween.cancel();
        expect(cancel).toHaveBeenCalledWith(7);

        vi.unstubAllGlobals();
    });
});

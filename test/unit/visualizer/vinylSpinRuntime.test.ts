import { describe, expect, it } from 'vitest';
import {
    createVinylSpinAnchor,
    resolveVinylSpinDegrees,
    shouldReanchorVinylSpin,
} from '@/utils/visualizer/turntable/vinylSpinRuntime';
import { VINYL_SPIN_DEGREES_PER_SECOND } from '@/utils/visualizer/turntable/vinylSurfaceMath';

// test/unit/visualizer/vinylSpinRuntime.test.ts

describe('vinylSpinRuntime', () => {
    it('reanchors on large media jumps', () => {
        expect(shouldReanchorVinylSpin(10, 10.1)).toBe(false);
        expect(shouldReanchorVinylSpin(10, 12)).toBe(true);
    });

    it('advances with wall clock while playing', () => {
        const anchor = createVinylSpinAnchor(4, 1000);
        const degrees = resolveVinylSpinDegrees({
            playing: true,
            mediaSec: 4,
            wallMs: 3000,
            anchor,
        });
        expect(degrees).toBe((4 + 2) * VINYL_SPIN_DEGREES_PER_SECOND);
    });

    it('freezes on media time while paused', () => {
        const anchor = createVinylSpinAnchor(4, 1000);
        const degrees = resolveVinylSpinDegrees({
            playing: false,
            mediaSec: 5.5,
            wallMs: 9000,
            anchor,
        });
        expect(degrees).toBe(5.5 * VINYL_SPIN_DEGREES_PER_SECOND);
    });
});

import { describe, expect, it } from 'vitest';
import { resolveTurntableLayout } from '@/utils/visualizer/turntable/turntableLayout';

// test/unit/visualizer/turntableLayout.test.ts

describe('resolveTurntableLayout', () => {
    it('centers a floating hero disc without a sleeve', () => {
        const layout = resolveTurntableLayout(1512, 982);
        expect(layout.sleeveSide).toBe(0);
        expect(layout.recordD / Math.min(layout.width, layout.height)).toBeGreaterThan(0.7);
        expect(layout.platterCx / layout.width).toBeCloseTo(0.48, 2);
        expect(Math.hypot(layout.pivotX - layout.platterCx, layout.pivotY - layout.platterCy))
            .toBeGreaterThan(layout.recordD * 0.5);
    });
});

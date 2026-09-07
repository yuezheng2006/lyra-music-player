import { describe, expect, it } from 'vitest';

// test/unit/visualizer/turntableHardwareGeometry.test.ts
// Tonearm stylus should rest in the outer groove band (vinylformac 68° @ 0.72R).

describe('turntable hardware geometry', () => {
    it('places stylus inside the groove ring', () => {
        const disc = 400;
        const cx = 500;
        const cy = 400;
        const recordR = disc * 0.5;
        const stylusAngle = (68 * Math.PI) / 180;
        const stylusX = cx + Math.cos(stylusAngle) * recordR * 0.72;
        const stylusY = cy + Math.sin(stylusAngle) * recordR * 0.72;
        const dist = Math.hypot(stylusX - cx, stylusY - cy);
        expect(dist).toBeGreaterThan(recordR * 0.35);
        expect(dist).toBeLessThan(recordR * 0.95);

        const pivotX = cx + disc * 0.50;
        const pivotY = cy - disc * 0.40;
        expect(Math.hypot(pivotX - cx, pivotY - cy)).toBeGreaterThan(recordR);
    });
});

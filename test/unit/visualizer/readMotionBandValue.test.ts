import { describe, expect, it } from 'vitest';
import { readMotionBandValue } from '../../../src/components/visualizer/geometric/webgl/readMotionBandValue';

describe('readMotionBandValue', () => {
    it('reads plain numbers', () => {
        expect(readMotionBandValue(0.42)).toBe(0.42);
    });

    it('reads MotionValue-like objects', () => {
        const motionLike = { get: () => 0.77 } as import('framer-motion').MotionValue<number>;
        expect(readMotionBandValue(motionLike)).toBe(0.77);
    });

    it('defaults missing values to zero', () => {
        expect(readMotionBandValue(undefined)).toBe(0);
    });
});

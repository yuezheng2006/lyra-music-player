import { describe, expect, it } from 'vitest';
import type { Theme } from '@/types';
import { getCappellaBubbleColors } from '@/components/visualizer/cappella/cappellaBubbleColors';

// test/unit/visualizer/cappellaBubbleColors.test.ts
// Guards chat-bubble contrast so left-side lyrics stay readable on light panels.

const theme: Theme = {
    name: 'test',
    backgroundColor: '#0b1020',
    primaryColor: '#f6fdff',
    accentColor: '#fff0b8',
    secondaryColor: '#a8f6ff',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};

describe('getCappellaBubbleColors', () => {
    it('uses dark ink on both sides so light lyric primaries do not disappear', () => {
        const left = getCappellaBubbleColors('left', theme);
        const right = getCappellaBubbleColors('right', theme);

        expect(left.textColor).toContain('rgba(');
        expect(right.textColor).toContain('rgba(');
        // Dark ink channels should stay low (near background / #12141a).
        const leftRgb = left.textColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
        expect(leftRgb).toBeTruthy();
        expect(Number(leftRgb?.[1])).toBeLessThan(50);
        expect(Number(leftRgb?.[2])).toBeLessThan(50);
        expect(Number(leftRgb?.[3])).toBeLessThan(60);
        expect(left.backgroundColor).not.toEqual(right.backgroundColor);
    });
});

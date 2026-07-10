import { describe, expect, it } from 'vitest';
import {
    buildInteractive3dStageContainmentMask,
    measureLyricColumnEndRatio,
    resolveInteractive3dStageContainmentStyle,
    shouldContainInteractive3dStageForMode,
} from '@/components/visualizer/geometric/resolveInteractive3dStageContainment';

// test/unit/visualizer/resolveInteractive3dStageContainment.test.ts

describe('resolveInteractive3dStageContainmentStyle', () => {
    it('masks the stage for monet so left lyrics stay clear', () => {
        expect(shouldContainInteractive3dStageForMode('monet')).toBe(true);
        const style = resolveInteractive3dStageContainmentStyle('monet');
        expect(style?.maskImage).toContain('linear-gradient(90deg');
        expect(style?.WebkitMaskImage).toBe(style?.maskImage);
    });

    it('adapts the mask to the measured lyric-column end ratio', () => {
        const narrow = buildInteractive3dStageContainmentMask(0.34);
        const wide = buildInteractive3dStageContainmentMask(0.58);

        expect(narrow).not.toBe(wide);
        expect(narrow).toContain('rgba(0,0,0,1)');
        expect(wide).toContain('rgba(0,0,0,1)');
    });

    it('leaves centered lyric modes unmasked', () => {
        expect(shouldContainInteractive3dStageForMode('classic')).toBe(false);
        expect(resolveInteractive3dStageContainmentStyle('classic')).toBeUndefined();
        expect(resolveInteractive3dStageContainmentStyle(undefined)).toBeUndefined();
    });

    it('measures lyric-column end against the stage width', () => {
        const stage = {
            getBoundingClientRect: () => ({ left: 100, width: 1000, right: 1100, top: 0, bottom: 600, height: 600, x: 100, y: 0, toJSON: () => ({}) }),
        } as HTMLElement;
        const column = {
            getBoundingClientRect: () => ({ left: 100, width: 420, right: 520, top: 0, bottom: 600, height: 600, x: 100, y: 0, toJSON: () => ({}) }),
        } as HTMLElement;

        expect(measureLyricColumnEndRatio(stage, column)).toBeCloseTo(0.42, 2);
        expect(measureLyricColumnEndRatio(stage, null)).toBeUndefined();
    });
});

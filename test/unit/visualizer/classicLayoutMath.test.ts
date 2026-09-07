import { describe, expect, it } from 'vitest';
import { DEFAULT_CLASSIC_TUNING, type Line, type Word } from '../../../src/types';
import { buildClassicWordLayout } from '../../../src/components/visualizer/classic/classicLayoutMath';
import { buildClassicLayoutVariants } from '../../../src/components/visualizer/classic/classicMotionVariants';
import { getClassicLineContainerMotion } from '../../../src/components/visualizer/classic/classicTiming';

// test/unit/visualizer/classicLayoutMath.test.ts
// Folia-parity classic scatter: default floats, karaoke stays linear.

const word = (text: string, start: number, end: number): Word => ({
    text,
    startTime: start,
    endTime: end,
});

const line = (fullText: string, words: Word[], startTime = 12.4): Line => ({
    fullText,
    startTime,
    endTime: startTime + 4,
    words,
});

const layout = (overrides: Partial<Parameters<typeof buildClassicWordLayout>[0]> = {}) => (
    buildClassicWordLayout({
        activeLine: line('你好世界', [word('你好', 12.4, 13.2), word('世界', 13.2, 16.4)]),
        displayWords: [word('你好', 12.4, 13.2), word('世界', 13.2, 16.4)],
        tuning: DEFAULT_CLASSIC_TUNING,
        intensity: 'normal',
        parkAtRest: false,
        fontPx: 48,
        fontStack: 'sans-serif',
        fontWeight: 700,
        usableWidth: 900,
        usableHeight: 420,
        ...overrides,
    })
);

describe('buildClassicWordLayout', () => {
    it('scatters default classic words with perspective and CSS 3D depth', () => {
        const result = layout();
        expect(result.lineConfig.perspective).toBe(1000);
        expect(result.wordConfigs).toHaveLength(2);
        const depths = result.wordConfigs.map(config => Math.abs(config.z) + Math.abs(config.rotateX));
        expect(depths.some(value => value > 0)).toBe(true);
        expect(result.wordConfigs.some(config => Math.abs(config.x) > 0 || Math.abs(config.y) > 0)).toBe(true);
    });

    it('uses Folia-like horizontal justify options when not karaoke', () => {
        const result = layout({ activeLine: line('散落', [word('散落', 3, 6)], 3) });
        expect([
            'justify-start',
            'justify-center',
            'justify-end',
            'justify-around',
            'justify-between',
        ]).toContain(result.lineConfig.justifyContent);
        expect(result.lineConfig.alignItems).toBe('items-center');
    });

    it('parks karaoke / calm rows without scatter or tilt', () => {
        const karaoke = layout({ parkAtRest: true });
        expect(karaoke.lineConfig.justifyContent).toBe('justify-center');
        expect(karaoke.wordConfigs.every(config => config.x === 0 && config.rotateX === 0 && config.z === 0)).toBe(true);

        const calm = layout({ intensity: 'calm' });
        expect(calm.lineConfig.justifyContent).toBe('justify-center');
        expect(calm.wordConfigs.every(config => config.rotateX === 0 && config.z === 0)).toBe(true);
    });

    it('keeps interludes centered', () => {
        const result = layout({
            activeLine: line('......', [word('......', 1, 4)], 1),
            displayWords: [word('......', 1, 4)],
        });
        expect(result.lineConfig.justifyContent).toBe('justify-center');
        expect(result.wordConfigs[0]?.x).toBe(0);
        expect(result.wordConfigs[0]?.rotateX).toBe(0);
    });
});

describe('classic motion', () => {
    it('flies waiting words in on z / rotateX then settles on active', () => {
        const variants = buildClassicLayoutVariants(true, 0.4);
        const config = {
            id: 'w',
            x: 10,
            y: 8,
            rotate: 4,
            rotateX: 9,
            z: 20,
            scale: 1.1,
            marginRight: '8px',
            alignSelf: 'auto',
            passedRotate: 12,
        };
        const waiting = (variants['waiting-default'] as (custom: { config: typeof config }) => {
            rotateX: number;
            z: number;
        })({ config });
        const active = (variants.active as (custom: { config: typeof config }) => {
            rotateX: number;
            z: number;
        })({ config });
        expect(waiting.rotateX).toBeGreaterThan(active.rotateX);
        expect(waiting.z).toBeLessThan(active.z);
        expect(active.rotateX).toBe(9);
        expect(active.z).toBe(20);
    });

    it('gives the line a 3D enter pose', () => {
        const motion = getClassicLineContainerMotion({
            renderHints: null,
            lineRenderEndTime: 4,
            lineTransitionMode: 'normal',
            wordRevealMode: 'normal',
            wordLookahead: 0.15,
        });
        expect(motion.initial).toMatchObject({ rotateX: 8, z: -36 });
        expect(motion.animate).toMatchObject({ rotateX: 0, z: 0 });
    });
});

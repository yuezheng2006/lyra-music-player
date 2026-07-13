import { describe, expect, it } from 'vitest';
import { resolveMonetLineTone } from '@/components/visualizer/monet/monetLineTone';
import type { Line } from '@/types';

// test/unit/visualizer/monetLineTone.test.ts
// Active row is bright; neighbors fade in steps (reference lyric list opacity).

const THEME = {
    name: 'Test',
    backgroundColor: '#111111',
    primaryColor: '#ff006e',
    accentColor: '#ffffff',
    secondaryColor: '#71717a',
    highlightColor: '#fbbf24',
} as const;

const line: Line = {
    startTime: 1,
    endTime: 2,
    fullText: '人生路漫漫',
    words: [],
};

const entry = (status: 'waiting' | 'active' | 'passed', offset: number) => ({
    key: `${status}-${offset}`,
    line,
    lineIndex: 0,
    index: 0,
    status,
    offset,
});

const readAlpha = (color: string) => {
    const match = color.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    return match ? Number(match[1]) : 1;
};

describe('resolveMonetLineTone', () => {
    it('keeps waiting clearly dimmer than the active unsung underlay', () => {
        const waiting = resolveMonetLineTone(entry('waiting', 1), THEME as never, 0.88, 'monet');
        const active = resolveMonetLineTone(entry('active', 0), THEME as never, 0.88, 'monet');

        expect(waiting.blurPx).toBe(0);
        expect(waiting.baseColor).toContain('255, 0, 110');
        expect(active.baseColor).toContain('255, 0, 110');
        expect(readAlpha(waiting.baseColor)).toBeLessThan(readAlpha(active.baseColor));
        expect(waiting.fontWeight).toBeLessThan(active.fontWeight);
    });

    it('never swaps inactive fills to secondary gray', () => {
        const waiting = resolveMonetLineTone(entry('waiting', 1), THEME as never, 0.88, 'monet');
        const passed = resolveMonetLineTone(entry('passed', -1), THEME as never, 0.88, 'monet');

        expect(waiting.baseColor).toContain('255, 0, 110');
        expect(passed.baseColor).toContain('255, 0, 110');
        expect(waiting.baseColor).not.toContain('113, 113, 122');
    });

    it('keeps the nearest passed line free of heavy blur and still readable', () => {
        const tone = resolveMonetLineTone(entry('passed', -1), THEME as never, 0.88, 'monet');

        expect(tone.blurPx).toBe(0);
        expect(readAlpha(tone.baseColor)).toBeGreaterThanOrEqual(0.28);
        expect(readAlpha(tone.baseColor)).toBeLessThanOrEqual(0.45);
    });

    it('dims the active underlay so the same-hue wipe can read', () => {
        const tone = resolveMonetLineTone(entry('active', 0), THEME as never, 0.88, 'monet');

        expect(tone.blurPx).toBe(0);
        expect(tone.opacity).toBe(1);
        expect(readAlpha(tone.baseColor)).toBeGreaterThanOrEqual(0.55);
        expect(readAlpha(tone.baseColor)).toBeLessThan(1);
        expect(tone.baseColor).toContain('255, 0, 110');
    });

    it('steps waiting opacity down with distance like the reference list', () => {
        const near = resolveMonetLineTone(entry('waiting', 1), THEME as never, 0.88, 'monet');
        const mid = resolveMonetLineTone(entry('waiting', 2), THEME as never, 0.88, 'monet');
        const far = resolveMonetLineTone(entry('waiting', 4), THEME as never, 0.88, 'monet');
        expect(near.blurPx).toBe(0);
        expect(far.blurPx).toBe(0);
        expect(readAlpha(mid.baseColor)).toBeLessThan(readAlpha(near.baseColor));
        expect(readAlpha(far.baseColor)).toBeLessThan(readAlpha(mid.baseColor));
        expect(readAlpha(near.baseColor)).toBeGreaterThanOrEqual(0.4);
    });

    it('dims karaoke unsung base with the same brand hue', () => {
        const tone = resolveMonetLineTone(entry('active', 0), THEME as never, 0.88, 'karaoke');
        expect(tone.blurPx).toBe(0);
        expect(readAlpha(tone.baseColor)).toBeLessThan(1);
        expect(readAlpha(tone.baseColor)).toBeGreaterThanOrEqual(0.55);
        expect(tone.baseColor).toContain('255, 0, 110');
    });

    it('keeps a clear gap between full active wipe and nearby waiting', () => {
        const waiting = resolveMonetLineTone(entry('waiting', 1), THEME as never, 0.88, 'monet');
        expect(1 - readAlpha(waiting.baseColor)).toBeGreaterThanOrEqual(0.45);
        expect(readAlpha(waiting.baseColor)).toBeGreaterThanOrEqual(0.4);
    });
});

import { describe, expect, it } from 'vitest';
import {
    buildKaraokeWipeMaskImage,
    resolveKaraokeWipeFillWidth,
} from '@/utils/lyrics/karaokeWipeMath';

// test/unit/lyrics/karaokeWipeMath.test.ts

const offsets = [0, 20, 40, 60];

describe('karaokeWipeMath', () => {
    it('stays at 0 before the word and when inactive', () => {
        expect(resolveKaraokeWipeFillWidth({
            time: 0.5,
            startTime: 1,
            endTime: 3,
            graphemeOffsets: offsets,
            active: true,
        })).toBe(0);

        expect(resolveKaraokeWipeFillWidth({
            time: 2,
            startTime: 1,
            endTime: 3,
            graphemeOffsets: offsets,
            active: false,
        })).toBe(0);
    });

    it('fills full width after the word ends', () => {
        expect(resolveKaraokeWipeFillWidth({
            time: 3.2,
            startTime: 1,
            endTime: 3,
            graphemeOffsets: offsets,
        })).toBe(60);
    });

    it('interpolates within grapheme timings', () => {
        // Midpoint of first glyph (0→20px over 1–2s) at t=1.5.
        const fill = resolveKaraokeWipeFillWidth({
            time: 1.5,
            startTime: 1,
            endTime: 3,
            graphemeOffsets: offsets,
            graphemeTimings: [
                { char: '你', startTime: 1, endTime: 2 },
                { char: '好', startTime: 2, endTime: 3 },
            ],
        });
        expect(fill).toBe(10);
    });

    it('falls back to even progress when timings are missing', () => {
        const fill = resolveKaraokeWipeFillWidth({
            time: 2,
            startTime: 1,
            endTime: 3,
            graphemeOffsets: offsets,
            graphemeTimings: [],
        });
        // Midpoint of 2s word across 3 grapheme slots → halfway through second glyph.
        expect(fill).toBeCloseTo(30, 5);
    });

    it('applies renderLeadSec so the wipe leads the sampled clock', () => {
        const withoutLead = resolveKaraokeWipeFillWidth({
            time: 0.98,
            startTime: 1,
            endTime: 3,
            graphemeOffsets: offsets,
        });
        const withLead = resolveKaraokeWipeFillWidth({
            time: 0.98,
            startTime: 1,
            endTime: 3,
            graphemeOffsets: offsets,
            renderLeadSec: 0.033,
        });

        expect(withoutLead).toBe(0);
        expect(withLead).toBeGreaterThan(0);
    });

    it('builds a hard-edge LTR mask string', () => {
        const mask = buildKaraokeWipeMaskImage(40, 48);
        expect(mask).toContain('linear-gradient(90deg');
        expect(mask).toContain('transparent 40px');
        expect(mask).toContain('#000');
    });
});

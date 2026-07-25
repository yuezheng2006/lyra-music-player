import { describe, expect, it } from 'vitest';
import {
    isCladdaghEquatorPulseUnchanged,
    resolveCladdaghEquatorPulseSnapshot,
} from '@/utils/visualizer/claddaghEquatorPulseMath';
import { shouldWriteCladdaghGlyphDom } from '@/utils/visualizer/claddaghGlyphDomMath';

// test/unit/visualizer/claddaghEquatorPulseMath.test.ts

describe('claddagh equator / glyph DOM dirty checks', () => {
    it('quantizes pulse so tiny audio jitter does not dirty the snapshot', () => {
        const a = resolveCladdaghEquatorPulseSnapshot(0.2, 0.21, 10);
        const b = resolveCladdaghEquatorPulseSnapshot(0.205, 0.208, 10.1);
        expect(isCladdaghEquatorPulseUnchanged(a, b)).toBe(true);
    });

    it('keeps the energy arc as sparse micro-dots across the audio range', () => {
        const idle = resolveCladdaghEquatorPulseSnapshot(0, 0, 0);
        const peak = resolveCladdaghEquatorPulseSnapshot(1, 1, 0);

        expect({ dashA: idle.dashA, dashB: idle.dashB }).toEqual({ dashA: 1, dashB: 18 });
        expect({ dashA: peak.dashA, dashB: peak.dashB }).toEqual({ dashA: 2, dashB: 14 });
    });

    it('marks glyph DOM dirty only past write thresholds', () => {
        const prev = { x: 10, y: 20, rot: 5, scale: 1, opacity: 0.5, color: '#fff' };
        expect(shouldWriteCladdaghGlyphDom(prev, { ...prev, x: 10.1 })).toBe(false);
        expect(shouldWriteCladdaghGlyphDom(prev, { ...prev, x: 10.5 })).toBe(true);
        expect(shouldWriteCladdaghGlyphDom(prev, { ...prev, color: '#eee' })).toBe(true);
    });
});

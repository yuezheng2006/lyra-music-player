import { describe, expect, it } from 'vitest';
import { shouldApplyLyricRhythmToVisualizerMode } from '@/components/visualizer/resolveInteractive3dFumeLayering';

// test/unit/visualizer/lyricRhythmLayering.test.ts
// Monet lyric rail must skip rhythm scale to avoid clipping.

describe('shouldApplyLyricRhythmToVisualizerMode', () => {
    it('disables rhythm scaling for Monet lyric rails', () => {
        expect(shouldApplyLyricRhythmToVisualizerMode('monet')).toBe(false);
    });

    it('keeps rhythm scaling for other visualizer modes', () => {
        expect(shouldApplyLyricRhythmToVisualizerMode('classic')).toBe(true);
        expect(shouldApplyLyricRhythmToVisualizerMode('cadenza')).toBe(true);
        expect(shouldApplyLyricRhythmToVisualizerMode('fume')).toBe(true);
        expect(shouldApplyLyricRhythmToVisualizerMode('karaoke')).toBe(true);
    });
});

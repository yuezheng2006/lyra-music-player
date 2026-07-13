import { describe, expect, it } from 'vitest';
import { resolveLyricContainerFit } from '@/components/visualizer/resolveLyricContainerFit';

// test/unit/visualizer/dazibaoFit.test.ts
// Billboard mode uses a larger stage font clamp than classic.

describe('dazibao lyric fit', () => {
    it('resolves a much larger hero font than classic defaults', () => {
        const classic = resolveLyricContainerFit({
            containerWidth: 1100,
            lyricsFontScale: 1,
            preferredWidthRatio: 0.068,
            minFontPx: 22,
            maxFontPx: 52,
        });
        const dazibao = resolveLyricContainerFit({
            containerWidth: 1100,
            lyricsFontScale: 1,
            sidePaddingRatio: 0.06,
            preferredWidthRatio: 0.11,
            minFontPx: 36,
            maxFontPx: 92,
            // Billboard tests compare base font clamps without rhythm headroom.
            scaleHeadroom: 1,
        });

        expect(dazibao.fontPx).toBeGreaterThan(classic.fontPx * 1.4);
        expect(dazibao.fontPx).toBeGreaterThanOrEqual(80);
    });
});

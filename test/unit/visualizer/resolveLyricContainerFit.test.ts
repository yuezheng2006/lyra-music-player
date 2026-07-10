import { describe, expect, it } from 'vitest';
import {
  clampLyricWordOffsetX,
  resolveLyricContainerFit,
} from '@/components/visualizer/resolveLyricContainerFit';

// test/unit/visualizer/resolveLyricContainerFit.test.ts

describe('resolveLyricContainerFit', () => {
  it('sizes from container width, not full window', () => {
    const wide = resolveLyricContainerFit({ containerWidth: 1400, lyricsFontScale: 1 });
    const narrow = resolveLyricContainerFit({ containerWidth: 520, lyricsFontScale: 1 });
    expect(narrow.fontPx).toBeLessThan(wide.fontPx);
    expect(narrow.sidePaddingPx).toBeGreaterThanOrEqual(28);
    expect(narrow.usableWidth + narrow.sidePaddingPx * 2).toBeLessThanOrEqual(520 + 1);
  });

  it('keeps clear side padding on narrow stages', () => {
    const fit = resolveLyricContainerFit({
      containerWidth: 480,
      lyricsFontScale: 1.2,
      sidePaddingRatio: 0.09,
      minSidePaddingPx: 32,
    });
    expect(fit.sidePaddingPx).toBeGreaterThanOrEqual(32);
    expect(fit.fontPx).toBeLessThanOrEqual(52 * 1.2);
  });

  it('clamps word offsets inside the usable area', () => {
    expect(clampLyricWordOffsetX(200, 80, 300, 1.4)).toBeLessThan(120);
    expect(clampLyricWordOffsetX(-200, 80, 300, 1.4)).toBeGreaterThan(-120);
    expect(clampLyricWordOffsetX(0, 40, 400, 1)).toBe(0);
  });
});

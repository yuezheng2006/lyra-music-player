import { describe, expect, it } from 'vitest';
import {
  clampLyricWordOffsetX,
  resolveLyricContainerFit,
  resolveLyricLineFitScale,
  resolveLyricRhythmScaleHeadroom,
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

  it('reserves rhythm scale headroom so long neon lines stay inside the stage', () => {
    const plain = resolveLyricContainerFit({
      containerWidth: 1100,
      lyricsFontScale: 1,
      preferredWidthRatio: 0.068,
      maxFontPx: 52,
    });
    const neon = resolveLyricContainerFit({
      containerWidth: 1100,
      lyricsFontScale: 1,
      preferredWidthRatio: 0.068,
      maxFontPx: 52,
      scaleHeadroom: resolveLyricRhythmScaleHeadroom(1.6),
      glowInsetPx: 36,
    });
    expect(neon.usableWidth).toBeLessThan(plain.usableWidth);
    expect(neon.sidePaddingPx).toBeGreaterThan(plain.sidePaddingPx);
    // After rhythm scale (~1.6 * 1.18), visual width must still fit the container.
    expect(neon.usableWidth * neon.scaleHeadroom).toBeLessThanOrEqual(1100 + 1);
  });

  it('clamps word offsets inside the usable area', () => {
    expect(clampLyricWordOffsetX(200, 80, 300, 1.4)).toBeLessThan(120);
    expect(clampLyricWordOffsetX(-200, 80, 300, 1.4)).toBeGreaterThan(-120);
    expect(clampLyricWordOffsetX(0, 40, 400, 1)).toBe(0);
  });
});

describe('resolveLyricRhythmScaleHeadroom', () => {
  it('includes beat headroom on top of the color-preset multiplier', () => {
    expect(resolveLyricRhythmScaleHeadroom(1)).toBeGreaterThan(1);
    expect(resolveLyricRhythmScaleHeadroom(1.6)).toBeGreaterThan(1.6);
    expect(resolveLyricRhythmScaleHeadroom(1.6, { includeBeatHeadroom: false })).toBeCloseTo(1.6, 5);
  });
});

describe('resolveLyricLineFitScale', () => {
  it('shrinks only when content exceeds the usable width', () => {
    expect(resolveLyricLineFitScale(900, 720)).toBeCloseTo(720 / 900, 5);
    expect(resolveLyricLineFitScale(400, 720)).toBe(1);
  });
});

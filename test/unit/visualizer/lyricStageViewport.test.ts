import { describe, expect, it } from 'vitest';
import {
  LYRIC_STAGE_CAMERA_DISTANCE,
  resolveLyricStageFitScale,
  resolveLyricStageMaxWorldWidth,
} from '@/components/visualizer/geometric/mineradio/lyrics/resolveLyricStageViewport';
import { wrapLyricLines } from '@/components/visualizer/geometric/mineradio/lyrics/wrapLyricLines';

// test/unit/visualizer/lyricStageViewport.test.ts

const createMeasureCtx = (charWidth = 48): CanvasRenderingContext2D => {
  const ctx = {
    font: '',
    textAlign: 'left',
    measureText: (text: string) => ({ width: Array.from(text).length * charWidth }),
  };
  return ctx as unknown as CanvasRenderingContext2D;
};

describe('resolveLyricStageMaxWorldWidth', () => {
  it('keeps a clear edge inset on typical player aspects', () => {
    const wide = resolveLyricStageMaxWorldWidth({
      aspect: 16 / 9,
      fovDeg: 45,
      cameraDistance: LYRIC_STAGE_CAMERA_DISTANCE,
    });
    const narrow = resolveLyricStageMaxWorldWidth({
      aspect: 9 / 16,
      fovDeg: 45,
      cameraDistance: LYRIC_STAGE_CAMERA_DISTANCE,
    });
    expect(narrow).toBeLessThan(wide);
    expect(narrow).toBeGreaterThanOrEqual(0.9);
    expect(wide).toBeLessThanOrEqual(4.8);
    // Usable width should stay well below full frustum (~6.2 at 16:9 / 4.2m / 45deg).
    expect(wide).toBeLessThan(5.0);
  });

  it('edge inset reduces usable width vs margin alone', () => {
    const withoutInset = resolveLyricStageMaxWorldWidth({
      aspect: 16 / 9,
      fovDeg: 45,
      cameraDistance: LYRIC_STAGE_CAMERA_DISTANCE,
      margin: 0.8,
      edgeInset: 0,
    });
    const withInset = resolveLyricStageMaxWorldWidth({
      aspect: 16 / 9,
      fovDeg: 45,
      cameraDistance: LYRIC_STAGE_CAMERA_DISTANCE,
      margin: 0.8,
      edgeInset: 0.1,
    });
    expect(withInset).toBeLessThan(withoutInset);
  });

  it('fits long text world width into the viewport', () => {
    expect(resolveLyricStageFitScale(7.2, 4.0)).toBeCloseTo(4 / 7.2, 5);
    expect(resolveLyricStageFitScale(3.0, 4.0)).toBe(1);
  });
});

describe('wrapLyricLines', () => {
  it('balances two-line wraps instead of leaving a short orphan', () => {
    const ctx = createMeasureCtx(48);
    const text = '在星光路旁再次说晚安';
    const maxWidth = 48 * 6;
    const wrapped = wrapLyricLines(ctx, text, 96, maxWidth, 2);
    expect(wrapped.lines.length).toBe(2);
    expect(Math.abs(wrapped.lines[0].length - wrapped.lines[1].length)).toBeLessThanOrEqual(2);
    expect(wrapped.widest).toBeLessThanOrEqual(maxWidth + 1);
  });

  it('wraps long CJK titles into at most two lines', () => {
    const ctx = createMeasureCtx(48);
    const long = '改变常改变 - 林子祥 (George Lam)';
    const maxWidth = 48 * 12;
    const wrapped = wrapLyricLines(ctx, long, 96, maxWidth, 2);
    expect(wrapped.lines.length).toBe(2);
    expect(wrapped.widest).toBeLessThanOrEqual(maxWidth + 1);
    expect(wrapped.lines.join('')).toBe(long.replace(/\s+/g, ' ').trim());
  });

  it('keeps short lines unwrapped', () => {
    const ctx = createMeasureCtx(40);
    const wrapped = wrapLyricLines(ctx, '林子祥', 96, 800, 2);
    expect(wrapped.lines).toEqual(['林子祥']);
  });
});

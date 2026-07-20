import { describe, expect, it } from 'vitest';
import {
  CHARACTER_DOCK_SIZE,
  resolveCharacterStageDockLayout,
  resolveCharacterStageDockStyle,
} from '../../../src/components/character/characterStageDockMath';

// test/unit/character/characterStageDockMath.test.ts

describe('characterStageDockMath', () => {
  it('keeps the corner companion under the 240px cap', () => {
    const layout = resolveCharacterStageDockLayout(false);
    expect(layout.width).toBe(CHARACTER_DOCK_SIZE);
    expect(layout.height).toBe(CHARACTER_DOCK_SIZE);
    expect(layout.bottom).toContain('--app-player-bar-height');
  });

  it('does not invent a larger fox mode in immersive fullscreen', () => {
    const layout = resolveCharacterStageDockLayout(true);
    expect(layout.width).toBe(CHARACTER_DOCK_SIZE);
    expect(layout.height).toBe(CHARACTER_DOCK_SIZE);
    expect(layout.bottom).not.toContain('--app-player-bar-height');
    expect(layout.bottom).toContain('20px');
  });

  it('maps layout into absolute dock style', () => {
    const style = resolveCharacterStageDockStyle(true);
    expect(style.width).toBe(CHARACTER_DOCK_SIZE);
    expect(style.pointerEvents).toBe('auto');
  });
});

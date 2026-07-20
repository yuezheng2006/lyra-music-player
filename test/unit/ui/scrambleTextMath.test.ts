import { describe, expect, it } from 'vitest';
import { buildScrambleFrame, scrambleRevealedCount } from '../../../src/utils/ui/scrambleTextMath';

// test/unit/ui/scrambleTextMath.test.ts

describe('scrambleTextMath', () => {
  it('reveals graphemes by progress', () => {
    expect(scrambleRevealedCount('治愈', 0)).toBe(0);
    expect(scrambleRevealedCount('治愈', 0.5)).toBe(1);
    expect(scrambleRevealedCount('治愈', 1)).toBe(2);
  });

  it('keeps spaces and revealed prefix', () => {
    let i = 0;
    const glyphs = ['A', 'B', 'C', 'D'];
    const frame = buildScrambleFrame('a b', 1, () => glyphs[i++ % glyphs.length]);
    expect(frame[0]).toBe('a');
    expect(frame[1]).toBe(' ');
    expect(frame[2]).toMatch(/[A-D]/);
  });
});

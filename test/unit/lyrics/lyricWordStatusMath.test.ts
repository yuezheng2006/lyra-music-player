import { describe, expect, it } from 'vitest';
import { resolveLyricWordStatus } from '@/utils/lyrics/lyricWordStatusMath';

describe('resolveLyricWordStatus', () => {
  it('activates with lookahead before startTime', () => {
    expect(resolveLyricWordStatus(0.93, 1, 1.4, 0.08)).toBe('active');
    expect(resolveLyricWordStatus(0.9, 1, 1.4, 0.08)).toBe('waiting');
  });

  it('marks passed after endTime', () => {
    expect(resolveLyricWordStatus(1.41, 1, 1.4, 0.08)).toBe('passed');
  });

  it('keeps short words active for at least 100ms', () => {
    expect(resolveLyricWordStatus(1.05, 1, 1.02, 0)).toBe('active');
    expect(resolveLyricWordStatus(1.11, 1, 1.02, 0)).toBe('passed');
  });
});

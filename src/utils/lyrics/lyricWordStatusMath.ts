// src/utils/lyrics/lyricWordStatusMath.ts
// Pure waiting/active/passed resolution for word-level karaoke timing.

export type LyricWordStatus = 'waiting' | 'active' | 'passed';

/**
 * Resolve discrete word status from lyric clock time.
 * Lookahead pulls active slightly early so entrance animation lands nearer the beat.
 */
export function resolveLyricWordStatus(
  latestSec: number,
  startTime: number,
  endTime: number,
  lookaheadSec = 0.08,
): LyricWordStatus {
  const activeEnd = Math.max(endTime, startTime + 0.1);
  if (latestSec >= startTime - lookaheadSec && latestSec <= activeEnd) {
    return 'active';
  }
  if (latestSec > activeEnd) {
    return 'passed';
  }
  return 'waiting';
}

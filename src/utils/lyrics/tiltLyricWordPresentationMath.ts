import { LYRIC_LINE_OPACITY } from '../theme/lyricColorPresets';
import type { LyricWordStatus } from './lyricWordStatusMath';

// src/utils/lyrics/tiltLyricWordPresentationMath.ts
// Maps waiting/active/passed + lyricWordMode waiting opacity onto Tilt glyph alpha.

/** Opacity for one Tilt grapheme under the current lyric word mode. */
export const resolveTiltCharWordOpacity = (
    status: LyricWordStatus,
    waitingOpacity: number,
    passedOpacity = LYRIC_LINE_OPACITY.passedNear,
): number => {
    if (status === 'active') return LYRIC_LINE_OPACITY.active;
    if (status === 'passed') return passedOpacity;
    return Math.max(0, Math.min(1, waitingOpacity));
};

import { describe, expect, it } from 'vitest';
import { LYRIC_LINE_OPACITY } from '@/utils/theme/lyricColorPresets';
import { resolveTiltCharWordOpacity } from '@/utils/lyrics/tiltLyricWordPresentationMath';
import { resolveWaitingWordPresentation } from '@/utils/lyrics/lyricWordMode';

// test/unit/lyrics/tiltLyricWordPresentationMath.test.ts

describe('resolveTiltCharWordOpacity', () => {
    it('hides waiting glyphs in default mode and shows them in karaoke', () => {
        const defaultWaiting = resolveWaitingWordPresentation('default').opacity;
        const karaokeWaiting = resolveWaitingWordPresentation('karaoke').opacity;

        expect(resolveTiltCharWordOpacity('waiting', defaultWaiting)).toBe(0);
        expect(resolveTiltCharWordOpacity('waiting', karaokeWaiting)).toBeCloseTo(
            LYRIC_LINE_OPACITY.karaokeUnsung,
        );
        expect(resolveTiltCharWordOpacity('active', defaultWaiting)).toBe(1);
        expect(resolveTiltCharWordOpacity('passed', karaokeWaiting)).toBe(
            LYRIC_LINE_OPACITY.passedNear,
        );
    });
});

import { describe, expect, it } from 'vitest';
import { formatTime } from '../../../src/utils/appPlaybackHelpers';
import { resolveProgressFillPercentForUi } from '../../../src/utils/playback/mediaClockIsolationMath';

// test/unit/components/progressBarEdge.test.ts
// Edge progress tooltip copy follows Qishui "current / total" formatting.

describe('progress edge tooltip formatting', () => {
    it('formats scrubber tooltip as mm:ss / mm:ss', () => {
        expect(`${formatTime(156)} / ${formatTime(324)}`).toBe('02:36 / 05:24');
        expect(`${formatTime(0)} / ${formatTime(65)}`).toBe('00:00 / 01:05');
    });

    it('shows a frozen scrubber while audio source loading is active', () => {
        expect(resolveProgressFillPercentForUi(90, 180, true)).toBe(0);
    });
});

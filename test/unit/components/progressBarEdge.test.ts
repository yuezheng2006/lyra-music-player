import { describe, expect, it } from 'vitest';
import { formatTime } from '../../../src/utils/appPlaybackHelpers';

// test/unit/components/progressBarEdge.test.ts
// Edge progress tooltip copy follows Qishui "current / total" formatting.

describe('progress edge tooltip formatting', () => {
    it('formats scrubber tooltip as mm:ss / mm:ss', () => {
        expect(`${formatTime(156)} / ${formatTime(324)}`).toBe('02:36 / 05:24');
        expect(`${formatTime(0)} / ${formatTime(65)}`).toBe('00:00 / 01:05');
    });
});

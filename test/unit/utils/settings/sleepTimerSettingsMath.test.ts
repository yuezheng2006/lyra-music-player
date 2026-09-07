import { describe, expect, it } from 'vitest';
import { formatSleepTimerRemaining } from '@/utils/settings/sleepTimerSettingsMath';

// test/unit/utils/settings/sleepTimerSettingsMath.test.ts

describe('sleep timer remaining format', () => {
    it('formats hours, minutes, and seconds with zero padding', () => {
        expect(formatSleepTimerRemaining(0)).toBe('0:00:00');
        expect(formatSleepTimerRemaining(1000)).toBe('0:00:01');
        expect(formatSleepTimerRemaining((90 * 60 + 5) * 1000)).toBe('1:30:05');
    });
});

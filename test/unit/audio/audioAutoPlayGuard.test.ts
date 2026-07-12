import { describe, expect, it } from 'vitest';
import { shouldPreserveAutoPlayOnPause } from '@/utils/audioAutoPlayGuard';

// test/unit/audio/audioAutoPlayGuard.test.ts

describe('shouldPreserveAutoPlayOnPause', () => {
    it('preserves autoplay when src was cleared during reload', () => {
        expect(shouldPreserveAutoPlayOnPause(true, '', 0)).toBe(true);
        expect(shouldPreserveAutoPlayOnPause(true, '', 1)).toBe(true);
    });

    it('does not preserve when user paused a loaded track', () => {
        expect(shouldPreserveAutoPlayOnPause(true, 'https://cdn.example/a.mp3', 4)).toBe(false);
        expect(shouldPreserveAutoPlayOnPause(false, '', 0)).toBe(false);
    });
});

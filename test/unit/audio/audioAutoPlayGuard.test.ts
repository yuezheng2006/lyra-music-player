import { describe, expect, it } from 'vitest';
import { shouldPreserveAutoPlayOnPause } from '@/utils/audioAutoPlayGuard';

// test/unit/audio/audioAutoPlayGuard.test.ts

describe('shouldPreserveAutoPlayOnPause', () => {
    it('preserves autoplay whenever it is armed', () => {
        expect(shouldPreserveAutoPlayOnPause(true)).toBe(true);
    });

    it('does not preserve when autoplay is not armed', () => {
        expect(shouldPreserveAutoPlayOnPause(false)).toBe(false);
    });
});

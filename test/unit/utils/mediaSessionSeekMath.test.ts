import { describe, expect, it } from 'vitest';
import { resolveMediaSessionSeekTime } from '../../../src/utils/mediaSessionSeekMath';

// test/unit/utils/mediaSessionSeekMath.test.ts

describe('resolveMediaSessionSeekTime', () => {
    it('seeks backward and forward by the default offset', () => {
        expect(resolveMediaSessionSeekTime(40, 200, null, 'backward')).toBe(30);
        expect(resolveMediaSessionSeekTime(40, 200, null, 'forward')).toBe(50);
    });

    it('honors seekto and clamps to duration', () => {
        expect(resolveMediaSessionSeekTime(40, 200, { seekTime: 12 }, 'to')).toBe(12);
        expect(resolveMediaSessionSeekTime(40, 200, { seekTime: 900 }, 'to')).toBe(200);
    });
});

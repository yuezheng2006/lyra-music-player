import { describe, expect, it } from 'vitest';
import { isSameTrackId } from '@/components/gridView/isSameTrackId';

// test/unit/gridView/isSameTrackId.test.ts

describe('isSameTrackId', () => {
    it('matches number and string forms of the same id', () => {
        expect(isSameTrackId(12345, '12345')).toBe(true);
        expect(isSameTrackId('12345', 12345)).toBe(true);
        expect(isSameTrackId(12345, 12345)).toBe(true);
    });

    it('rejects nullish or different ids', () => {
        expect(isSameTrackId(null, 1)).toBe(false);
        expect(isSameTrackId(1, undefined)).toBe(false);
        expect(isSameTrackId(1, 2)).toBe(false);
    });
});

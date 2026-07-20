import { describe, expect, it } from 'vitest';
import {
    shouldShowHomePeerLegalNotice,
    shouldShowHomePeerShortcuts,
} from '../../../src/utils/ui/homePeerSectionMath';

// test/unit/ui/homePeerSectionMath.test.ts

describe('homePeerSectionMath', () => {
    it('hides the legal banner on home because peer tiles already mirror enabled filter pills', () => {
        expect(shouldShowHomePeerLegalNotice(5)).toBe(false);
        expect(shouldShowHomePeerLegalNotice(0)).toBe(false);
    });

    it('keeps peer shortcuts only when the fold has no personal library yet', () => {
        expect(shouldShowHomePeerShortcuts(0)).toBe(false);
        expect(shouldShowHomePeerShortcuts(3, 0)).toBe(true);
        expect(shouldShowHomePeerShortcuts(3, 2)).toBe(false);
    });
});

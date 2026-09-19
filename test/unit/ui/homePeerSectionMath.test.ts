import { describe, expect, it } from 'vitest';
import {
    shouldShowHomePeerLegalNotice,
    shouldShowHomePeerLibrary,
} from '../../../src/utils/ui/homePeerSectionMath';

// test/unit/ui/homePeerSectionMath.test.ts

describe('homePeerSectionMath', () => {
    it('hides the legal banner on home because peer tiles already mirror enabled filter pills', () => {
        expect(shouldShowHomePeerLegalNotice(5)).toBe(false);
        expect(shouldShowHomePeerLegalNotice(0)).toBe(false);
    });

    it('keeps per-source chip rows off the fold so the listening desk owns guest discovery', () => {
        expect(shouldShowHomePeerLibrary(0)).toBe(false);
        expect(shouldShowHomePeerLibrary(3, 0)).toBe(false);
        expect(shouldShowHomePeerLibrary(3, 2)).toBe(false);
    });
});

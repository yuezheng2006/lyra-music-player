import { describe, expect, it } from 'vitest';
import {
    resolveLyricPhraseKind,
    resolveLyricPhrasePresentation,
} from '../../../src/utils/lyrics/lyricPhrasePresentationMath';

// test/unit/lyrics/lyricPhrasePresentationMath.test.ts

describe('lyricPhrasePresentationMath', () => {
    it('classifies chorus over breath when both signals exist', () => {
        expect(resolveLyricPhraseKind({ isChorus: true, timingClass: 'micro' })).toBe('chorus');
    });

    it('classifies short/micro lines as breath', () => {
        expect(resolveLyricPhraseKind({ timingClass: 'short' })).toBe('breath');
        expect(resolveLyricPhraseKind({ timingClass: 'micro' })).toBe('breath');
        expect(resolveLyricPhraseKind({ timingClass: 'normal' })).toBe('verse');
    });

    it('keeps chorus presentation restrained but above verse', () => {
        const verse = resolveLyricPhrasePresentation('verse');
        const chorus = resolveLyricPhrasePresentation({ isChorus: true });

        expect(chorus.fontScaleMul).toBeGreaterThan(verse.fontScaleMul);
        expect(chorus.fontScaleMul).toBeLessThanOrEqual(1.12);
        expect(chorus.wordActiveScale).toBeGreaterThan(verse.wordActiveScale);
        expect(chorus.wordActiveScale).toBeLessThanOrEqual(1.14);
        expect(chorus.letterSpacingMul).toBeGreaterThan(1);
        expect(chorus.wordGapMul).toBeGreaterThan(1);
    });

    it('softens breath lines vs verse', () => {
        const verse = resolveLyricPhrasePresentation('verse');
        const breath = resolveLyricPhrasePresentation({ timingClass: 'short' });

        expect(breath.fontScaleMul).toBeLessThan(verse.fontScaleMul);
        expect(breath.letterSpacingMul).toBeLessThan(1);
        expect(breath.wordGapMul).toBeLessThan(1);
        expect(breath.wordActiveScale).toBeLessThan(verse.wordActiveScale);
        expect(breath.lineEnterDuration).toBeLessThan(verse.lineEnterDuration);
        expect(breath.lineEnterFromScale).toBeGreaterThan(verse.lineEnterFromScale);
    });
});

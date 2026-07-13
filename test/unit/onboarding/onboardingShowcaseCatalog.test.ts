import { describe, expect, it } from 'vitest';
import { SHOWCASE_LYRICS, SHOWCASE_TRACKS, getShowcaseTrack } from '@/components/onboarding/onboardingShowcaseCatalog';

describe('onboardingShowcaseCatalog', () => {
    it('resolves known tracks and falls back safely', () => {
        expect(getShowcaseTrack('glass').title).toBe('Glass Harbor');
        expect(getShowcaseTrack('missing').id).toBe(SHOWCASE_TRACKS[0].id);
    });

    it('keeps lyric lines linked to real tracks', () => {
        for (const line of SHOWCASE_LYRICS) {
            expect(SHOWCASE_TRACKS.some(track => track.id === line.trackId)).toBe(true);
        }
    });
});

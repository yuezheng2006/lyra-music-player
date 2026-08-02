import { describe, expect, it } from 'vitest';
import { cleanArtistForLrclib, cleanTitleForLrclib } from '@/utils/lyrics/cleanTitleForLrclib';

describe('cleanTitleForLrclib', () => {
    it('strips youtube promotional wrappers', () => {
        expect(cleanTitleForLrclib('Blinding Lights (Official Music Video)', 'The Weeknd'))
            .toBe('Blinding Lights');
    });

    it('drops artist prefix and feat tags', () => {
        expect(cleanTitleForLrclib('Drake - Passionfruit (Lyric Video)', 'Drake'))
            .toBe('Passionfruit');
        expect(cleanArtistForLrclib('Drake ft. Future')).toBe('Drake');
    });
});

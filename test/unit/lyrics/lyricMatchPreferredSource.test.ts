import { describe, expect, it } from 'vitest';
import {
    LYRIC_MATCH_PRIORITY_OPTIONS,
    mapPlaybackProviderToLyricSource,
    resolveLyricMatchPreferredSource,
    resolveLyricMatchPreferredSourceForSong,
} from '@/utils/lyrics/lyricMatchPreferredSource';

// test/unit/lyrics/lyricMatchPreferredSource.test.ts

describe('lyricMatchPreferredSource', () => {
    it('maps current providers onto lyric sources', () => {
        expect(mapPlaybackProviderToLyricSource('qq')).toBe('qq');
        expect(mapPlaybackProviderToLyricSource('kugou')).toBe('kugou');
        expect(mapPlaybackProviderToLyricSource('qishui')).toBe('netease');
    });

    it('keeps an explicit source and follows the platform for auto', () => {
        expect(resolveLyricMatchPreferredSource('qq', 'netease')).toBe('qq');
        expect(resolveLyricMatchPreferredSource('auto', 'qq')).toBe('qq');
        expect(resolveLyricMatchPreferredSource('auto', 'kugou')).toBe('kugou');
        expect(resolveLyricMatchPreferredSourceForSong('auto', { musicProvider: 'qq' }, 'netease')).toBe('qq');
        expect(resolveLyricMatchPreferredSourceForSong('auto', null, 'kugou')).toBe('kugou');
    });

    it('lists follow-current-platform first', () => {
        expect(LYRIC_MATCH_PRIORITY_OPTIONS[0]).toBe('auto');
    });
});

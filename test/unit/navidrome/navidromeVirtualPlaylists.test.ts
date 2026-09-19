import { describe, expect, it } from 'vitest';
import {
    NAVIDROME_VIRTUAL_PLAYLIST_ID,
    resolveNavidromeVirtualPlaylistKind,
} from '../../../src/components/navidrome/navidromeVirtualPlaylists';

// test/unit/navidrome/navidromeVirtualPlaylists.test.ts
// Virtual Navidrome playlist ids used by carousel and Grid3D.

describe('navidromeVirtualPlaylists', () => {
    it('resolves recently added and recently played cards', () => {
        expect(resolveNavidromeVirtualPlaylistKind(NAVIDROME_VIRTUAL_PLAYLIST_ID.recentlyAdded)).toBe('recentlyAdded');
        expect(resolveNavidromeVirtualPlaylistKind(NAVIDROME_VIRTUAL_PLAYLIST_ID.recentlyPlayed)).toBe('recentlyPlayed');
        expect(resolveNavidromeVirtualPlaylistKind(NAVIDROME_VIRTUAL_PLAYLIST_ID.random)).toBe('random');
        expect(resolveNavidromeVirtualPlaylistKind('real-playlist')).toBeNull();
    });
});

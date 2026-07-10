import { describe, expect, it } from 'vitest';
import {
    COCO_DEFAULT_PLAYLIST_ID,
    QISHUI_DEFAULT_PLAYLIST_ID,
    buildEnabledDefaultPlaylists,
    isProviderDefaultPlaylist,
} from '@/utils/onlineDefaultPlaylists';

// test/unit/utils/onlineDefaultPlaylists.test.ts

describe('onlineDefaultPlaylists', () => {
    it('builds qishui and coco defaults when enabled', () => {
        const playlists = buildEnabledDefaultPlaylists({
            coco: true,
            qishui: true,
            netease: true,
            qq: true,
        });

        expect(playlists).toHaveLength(2);
        expect(playlists[0].id).toBe(QISHUI_DEFAULT_PLAYLIST_ID);
        expect(playlists[0].musicProvider).toBe('qishui');
        expect(playlists[0].coverImgUrl).toBeTruthy();
        expect(playlists[1].id).toBe(COCO_DEFAULT_PLAYLIST_ID);
        expect(playlists[1].musicProvider).toBe('coco');
        expect(playlists[1].coverImgUrl).toBeTruthy();
        expect(playlists.every(isProviderDefaultPlaylist)).toBe(true);
    });

    it('returns empty when peer defaults are disabled', () => {
        expect(buildEnabledDefaultPlaylists({ coco: false, qishui: false })).toEqual([]);
    });
});

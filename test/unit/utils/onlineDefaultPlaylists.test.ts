import { describe, expect, it } from 'vitest';
import {
    COCO_DEFAULT_PLAYLIST_ID,
    buildEnabledDefaultPlaylists,
    isProviderDefaultPlaylist,
} from '@/utils/onlineDefaultPlaylists';

// test/unit/utils/onlineDefaultPlaylists.test.ts

describe('onlineDefaultPlaylists', () => {
    it('builds coco default only when enabled', () => {
        const playlists = buildEnabledDefaultPlaylists({
            coco: true,
            netease: true,
            qq: true,
        });

        expect(playlists).toHaveLength(1);
        expect(playlists[0].id).toBe(COCO_DEFAULT_PLAYLIST_ID);
        expect(playlists[0].musicProvider).toBe('coco');
        expect(playlists.every(isProviderDefaultPlaylist)).toBe(true);
        expect(playlists[0].description).not.toMatch(/免登录|guest|汽水|qishui/i);
    });

    it('returns empty when coco is disabled', () => {
        expect(buildEnabledDefaultPlaylists({ coco: false })).toEqual([]);
    });
});

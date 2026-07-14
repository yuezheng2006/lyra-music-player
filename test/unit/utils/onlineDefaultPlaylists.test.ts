import { describe, expect, it } from 'vitest';
import {
    BILIBILI_DEFAULT_PLAYLIST_ID,
    COCO_DEFAULT_PLAYLIST_ID,
    KUGOU_DEFAULT_PLAYLIST_ID,
    QISHUI_DEFAULT_PLAYLIST_ID,
    buildEnabledDefaultPlaylists,
    isProviderDefaultPlaylist,
    resolveProviderDefaultChannel,
} from '@/utils/onlineDefaultPlaylists';

// test/unit/utils/onlineDefaultPlaylists.test.ts

describe('onlineDefaultPlaylists', () => {
    it('builds all enabled peer defaults with distinct providers and covers', () => {
        const playlists = buildEnabledDefaultPlaylists({
            coco: true,
            qishui: true,
            kugou: true,
            bilibili: true,
            netease: true,
            qq: true,
        });

        expect(playlists).toHaveLength(4);
        expect(playlists.map(p => p.musicProvider)).toEqual(['qishui', 'coco', 'kugou', 'bilibili']);
        expect(playlists.map(p => p.id)).toEqual([
            QISHUI_DEFAULT_PLAYLIST_ID,
            COCO_DEFAULT_PLAYLIST_ID,
            KUGOU_DEFAULT_PLAYLIST_ID,
            BILIBILI_DEFAULT_PLAYLIST_ID,
        ]);
        expect(new Set(playlists.map(p => p.coverImgUrl)).size).toBe(4);
        expect(playlists.every(p => Boolean(p.coverImgUrl))).toBe(true);
        expect(playlists.every(isProviderDefaultPlaylist)).toBe(true);
    });

    it('returns empty when peer defaults are disabled', () => {
        expect(buildEnabledDefaultPlaylists({
            coco: false,
            qishui: false,
            kugou: false,
            bilibili: false,
        })).toEqual([]);
    });

    it('resolves peer channel from musicProvider or default id', () => {
        expect(resolveProviderDefaultChannel({
            specialType: 'provider-default',
            id: KUGOU_DEFAULT_PLAYLIST_ID,
            musicProvider: 'kugou',
        })).toBe('kugou');
        expect(resolveProviderDefaultChannel({
            specialType: 'provider-default',
            id: BILIBILI_DEFAULT_PLAYLIST_ID,
        })).toBe('bilibili');
    });
});

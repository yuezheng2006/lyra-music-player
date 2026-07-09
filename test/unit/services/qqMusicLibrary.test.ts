import { describe, expect, it } from 'vitest';
import {
    extractQQPlaylistSongs,
    mapQQPlaylistItem,
    mapQQPlaylistSong,
    qqPlaylistNumericId,
    resolveQQPlaylistId,
    resolveQQPlaylistName,
} from '@/services/musicProviders/qqMusicLibrary';

describe('qqMusicLibrary', () => {
    it('maps numeric dissid to negative playlist id', () => {
        expect(qqPlaylistNumericId('3462654915')).toBe(-3462654915);
    });

    it('prefers tid/dissid over dirid for playlist identity', () => {
        expect(resolveQQPlaylistId({
            dirid: 201,
            tid: 3762286720,
        })).toBe('3762286720');

        expect(resolveQQPlaylistId({
            dirId: 201,
            tid: 0,
            dissid: '7457283664',
        })).toBe('7457283664');

        expect(resolveQQPlaylistId({
            dirid: 201,
        })).toBe('');
    });

    it('maps GetPlaylistByUin camelCase fields', () => {
        const playlist = mapQQPlaylistItem({
            dirId: 201,
            dirName: '我喜欢',
            tid: 3762286720,
            songNum: 165,
            picUrl: 'http://y.gtimg.cn/mediastyle/y/img/cover_love_300.jpg',
            dirShow: 1,
        });

        expect(playlist).toMatchObject({
            musicProvider: 'qq',
            providerPlaylistId: '3762286720',
            name: '我喜欢',
            trackCount: 165,
            coverImgUrl: 'https://y.gtimg.cn/mediastyle/y/img/cover_love_300.jpg',
        });
        expect(playlist?.id).toBe(-3762286720);
    });

    it('does not treat dir_show visibility flag as playlist name', () => {
        expect(resolveQQPlaylistName({
            dir_show: 1,
            dissname: '滚石40年',
        })).toBe('滚石40年');

        const playlist = mapQQPlaylistItem({
            dissid: 7457283664,
            dissname: '滚石40年',
            songnum: 27,
            logo: 'http://example.com/cover.jpg',
            dir_show: 1,
        });
        expect(playlist?.name).toBe('滚石40年');
        expect(playlist?.trackCount).toBe(27);
    });

    it('filters qzone background playlists', () => {
        expect(mapQQPlaylistItem({
            tid: 1,
            diss_name: 'QZone背景音乐',
            song_cnt: 6,
        })).toBeNull();
    });

    it('maps qq playlist song payload into SongResult', () => {
        const song = mapQQPlaylistSong({
            songid: 123,
            songmid: '001abc',
            songname: 'Test Song',
            singer: [{ id: 1, name: 'Artist' }],
            albumname: 'Album',
            albummid: 'abc123',
            interval: 245,
            strMediaMid: 'media001',
        });

        expect(song.musicProvider).toBe('qq');
        expect(song.qqMid).toBe('001abc');
        expect(song.qqMediaMid).toBe('media001');
        expect(song.providerSongId).toBe('001abc');
        expect(song.name).toBe('Test Song');
        expect(song.duration).toBe(245000);
        expect(song.ar?.[0]?.name).toBe('Artist');
        expect(song.al?.name).toBe('Album');
        expect(song.id).toBeGreaterThan(0);
    });

    it('keeps distinct ids when songid is missing', () => {
        const a = mapQQPlaylistSong({ songmid: 'midA', songname: 'A', interval: 10 });
        const b = mapQQPlaylistSong({ songmid: 'midB', songname: 'B', interval: 10 });
        expect(a.id).not.toBe(0);
        expect(b.id).not.toBe(0);
        expect(a.id).not.toBe(b.id);
    });

    it('extracts songlist from DissInfo payload shapes', () => {
        expect(extractQQPlaylistSongs({
            songlist: [{ songmid: 'a' }],
        })).toEqual([{ songmid: 'a' }]);

        expect(extractQQPlaylistSongs({
            dissinfo: { songlist: [{ songmid: 'b' }] },
        })).toEqual([{ songmid: 'b' }]);

        expect(extractQQPlaylistSongs({
            cdlist: [{ songlist: [{ songmid: 'c' }] }],
        })).toEqual([{ songmid: 'c' }]);

        expect(extractQQPlaylistSongs({ songlist: [] })).toEqual([]);
    });
});

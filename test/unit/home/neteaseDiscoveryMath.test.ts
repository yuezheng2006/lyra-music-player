import { describe, expect, it } from 'vitest';
import { NETEASE_RADAR_PLAYLIST_IDS } from '../../../src/data/neteaseDiscovery/radarPlaylists';
import { extractIntelligenceSongs } from '../../../src/services/neteaseDiscoveryService';
import {
    pickHeartbeatSeedId,
    resolveNeteaseLikedPlaylist,
    splitRadarPlaylistName,
} from '../../../src/utils/home/neteaseDiscoveryMath';
import { playDiscoverySongs } from '../../../src/utils/home/startNeteaseDiscoveryPlayback';
import type { NeteasePlaylist, SongResult } from '../../../src/types';

const playlist = (name: string, id: number, extra: Partial<NeteasePlaylist> = {}): NeteasePlaylist => ({
    id,
    name,
    coverImgUrl: '',
    trackCount: 1,
    playCount: 0,
    updateTime: 0,
    trackUpdateTime: 0,
    creator: { userId: 1, nickname: 'u', avatarUrl: '' },
    ...extra,
});

describe('neteaseDiscoveryMath', () => {
    it('splits official radar names on the last pipe', () => {
        expect(splitRadarPlaylistName('今天从《海阔天空》听起|私人雷达')).toEqual({
            title: '私人雷达',
            subtitle: '今天从《海阔天空》听起',
        });
        expect(splitRadarPlaylistName('私人雷达')).toEqual({
            title: '私人雷达',
            subtitle: null,
        });
    });

    it('prefers the liked-songs playlist by name', () => {
        const liked = resolveNeteaseLikedPlaylist([
            playlist('自建', 2, { creator: { userId: 9, nickname: 'me', avatarUrl: '' } }),
            playlist('我喜欢的音乐', 1),
        ], { userId: 9 });
        expect(liked?.id).toBe(1);
    });

    it('picks a heartbeat seed inside the liked id list', () => {
        expect(pickHeartbeatSeedId([11, 22, 33], () => 0.9)).toBe(33);
        expect(pickHeartbeatSeedId([])).toBeNull();
    });

    it('keeps the official radar catalog ids', () => {
        expect(NETEASE_RADAR_PLAYLIST_IDS).toEqual([3136952023, 2829883282, 2829816518, 2829896389]);
    });
});

describe('extractIntelligenceSongs', () => {
    it('unwraps songInfo rows from the sidecar payload', () => {
        const songs = extractIntelligenceSongs({
            data: [
                { songInfo: { id: 7, name: 'A' } },
                { id: 8, name: 'B' },
            ],
        });
        expect(songs.map(song => song.id)).toEqual([7, 8]);
    });
});

describe('playDiscoverySongs', () => {
    it('plays the first song with the full queue', () => {
        const played: Array<{ id: number; fm: boolean; queueLen: number }> = [];
        const songs = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] as SongResult[];
        const ok = playDiscoverySongs(songs, (song, queue, isFmCall) => {
            played.push({ id: song.id, fm: Boolean(isFmCall), queueLen: queue?.length ?? 0 });
        }, true);
        expect(ok).toBe(true);
        expect(played).toEqual([{ id: 1, fm: true, queueLen: 2 }]);
    });
});

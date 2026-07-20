import type { OnlineMusicProviderId, SongResult } from '../../types';
import { getOnlineSongCacheKey, isCloudSong, neteaseApi } from '../netease';
import { bilibiliMusicProvider } from './bilibiliMusicProvider';
import { cocoMusicProvider } from './cocoMusicProvider';
import { kugouMusicProvider } from './kugouMusicProvider';
import { kuwoMusicProvider } from './kuwoMusicProvider';
import { qishuiMusicProvider } from './qishuiMusicProvider';
import { qqMusicProvider } from './qqMusicProvider';
import type { MusicProvider, ProviderAudioResult } from './types';

// src/services/musicProviders/registry.ts

const normalizeAudioUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
};

const neteaseProvider: MusicProvider = {
    id: 'netease',
    search: async (query, options) => {
        const response = await neteaseApi.cloudSearch(query, options.limit, options.offset);
        const songs = ((response.result?.songs || []) as SongResult[]).map(song => ({
            ...song,
            musicProvider: song.musicProvider ?? 'netease',
        }));
        const total = response.result?.songCount || 0;
        return {
            songs,
            total,
            hasMore: options.offset + songs.length < total,
        };
    },
    getAudioUrl: async (song, options): Promise<ProviderAudioResult> => {
        const urlRes = await neteaseApi.getSongUrl(song.id, options.quality);
        const url = normalizeAudioUrl(urlRes.data?.[0]?.url);
        return url ? { kind: 'ok', audioUrl: url } : { kind: 'unavailable' };
    },
    getLyrics: async () => null,
};

const providers: Record<OnlineMusicProviderId, MusicProvider> = {
    netease: neteaseProvider,
    qq: qqMusicProvider,
    qishui: qishuiMusicProvider,
    coco: cocoMusicProvider,
    kugou: kugouMusicProvider,
    bilibili: bilibiliMusicProvider,
    kuwo: kuwoMusicProvider,
};

export const getSongMusicProviderId = (song?: Pick<SongResult, 'musicProvider' | 't'> | null): OnlineMusicProviderId => {
    if (song?.musicProvider) {
        return song.musicProvider;
    }
    return 'netease';
};

export const isNeteaseOnlineSong = (song?: Pick<SongResult, 'musicProvider' | 't'> | null): boolean =>
    getSongMusicProviderId(song) === 'netease';

export const getMusicProvider = (providerId: OnlineMusicProviderId): MusicProvider => providers[providerId];

export const getMusicProviderForSong = (song: SongResult): MusicProvider =>
    getMusicProvider(getSongMusicProviderId(song));

export const getProviderSongCacheKey = (
    kind: 'audio' | 'lyric' | 'cover',
    song: Pick<SongResult, 'id' | 't' | 'musicProvider'>
) => {
    const providerId = getSongMusicProviderId(song);
    if (providerId === 'netease') {
        return getOnlineSongCacheKey(kind, song);
    }
    return `${kind}_${providerId}_${song.id}`;
};

export const isProviderCloudSong = (song?: Pick<SongResult, 'musicProvider' | 't'> | null): boolean =>
    isNeteaseOnlineSong(song) && isCloudSong(song);

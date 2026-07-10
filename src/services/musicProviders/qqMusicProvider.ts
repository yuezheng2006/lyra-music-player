import { getQQMusicAuth } from './qqMusicAuth';
import { qqMusicLocalProvider } from './qqMusicLocalProvider';
import {
    requestSidecarAudioUrl,
    requestSidecarLyrics,
    requestSidecarSearch,
} from './sidecarProviderClient';
import type { MusicProvider } from './types';

// src/services/musicProviders/qqMusicProvider.ts
// Sidecar-first QQ provider with renderer fallback for login cookies and open API.

const hasSidecarSearchResults = (result: Awaited<ReturnType<typeof requestSidecarSearch>>) =>
    result.songs.length > 0;

export const qqMusicProvider: MusicProvider = {
    id: 'qq',
    search: async (query, options) => {
        try {
            const sidecarResult = await requestSidecarSearch('qq', query, options);
            if (hasSidecarSearchResults(sidecarResult)) {
                return {
                    ...sidecarResult,
                    songs: sidecarResult.songs.map(song => ({
                        ...song,
                        musicProvider: 'qq' as const,
                        providerSongId: song.qqMid || song.providerSongId || String(song.id),
                    })),
                };
            }
        } catch (error) {
            console.warn('[QQMusic] Sidecar search failed, falling back to local provider', error);
        }

        return qqMusicLocalProvider.search(query, options);
    },
    getAudioUrl: async (song, options) => {
        try {
            const sidecarResult = await requestSidecarAudioUrl('qq', song, options);
            // Sidecar already tried official + open API; only fall back on transport failure.
            if (sidecarResult.kind === 'ok' || sidecarResult.kind === 'unavailable') {
                return sidecarResult;
            }
        } catch (error) {
            console.warn('[QQMusic] Sidecar audio lookup failed, falling back to local provider', error);
        }

        return qqMusicLocalProvider.getAudioUrl(song, options);
    },
    getLyrics: async (song) => {
        try {
            const sidecarLyrics = await requestSidecarLyrics('qq', song);
            if (sidecarLyrics) {
                return sidecarLyrics;
            }
        } catch (error) {
            console.warn('[QQMusic] Sidecar lyrics lookup failed, falling back to local provider', error);
        }

        return qqMusicLocalProvider.getLyrics(song);
    },
};

export const getQQMusicSidecarAuthPayload = () => {
    const auth = getQQMusicAuth();
    return {
        cookieHeader: auth.cookieHeader,
        guid: auth.guid,
        isLoggedIn: auth.isLoggedIn,
        musicKey: auth.musicKey,
        uin: auth.uin,
    };
};

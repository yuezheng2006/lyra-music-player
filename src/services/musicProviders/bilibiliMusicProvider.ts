import { requestSidecarAudioUrl, requestSidecarLyrics, requestSidecarSearch } from './sidecarProviderClient';
import type { MusicProvider } from './types';

// src/services/musicProviders/bilibiliMusicProvider.ts
// Bilibili video-audio peer channel backed by the music-provider sidecar.

export const bilibiliMusicProvider: MusicProvider = {
    id: 'bilibili',
    search: (query, options) => requestSidecarSearch('bilibili', query, options),
    getAudioUrl: (song, options) => requestSidecarAudioUrl('bilibili', song, options),
    getLyrics: song => requestSidecarLyrics('bilibili', song),
};

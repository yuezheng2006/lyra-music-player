import { requestSidecarAudioUrl, requestSidecarLyrics, requestSidecarSearch } from './sidecarProviderClient';
import type { MusicProvider } from './types';

// src/services/musicProviders/kugouMusicProvider.ts
// Kugou peer channel backed by the music-provider sidecar.

export const kugouMusicProvider: MusicProvider = {
    id: 'kugou',
    search: (query, options) => requestSidecarSearch('kugou', query, options),
    getAudioUrl: (song, options) => requestSidecarAudioUrl('kugou', song, options),
    getLyrics: song => requestSidecarLyrics('kugou', song),
};

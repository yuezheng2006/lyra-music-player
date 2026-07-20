import { requestSidecarAudioUrl, requestSidecarLyrics, requestSidecarSearch } from './sidecarProviderClient';
import type { MusicProvider } from './types';

// src/services/musicProviders/kuwoMusicProvider.ts
// Kuwo peer channel backed by the music-provider sidecar.

export const kuwoMusicProvider: MusicProvider = {
    id: 'kuwo',
    search: (query, options) => requestSidecarSearch('kuwo', query, options),
    getAudioUrl: (song, options) => requestSidecarAudioUrl('kuwo', song, options),
    getLyrics: song => requestSidecarLyrics('kuwo', song),
};

import { requestSidecarAudioUrl, requestSidecarLyrics, requestSidecarSearch } from './sidecarProviderClient';
import type { MusicProvider } from './types';

// src/services/musicProviders/cocoMusicProvider.ts
// Free guest search/playback channel backed by the music-provider sidecar.

export const cocoMusicProvider: MusicProvider = {
    id: 'coco',
    search: (query, options) => requestSidecarSearch('coco', query, options),
    getAudioUrl: (song, options) => requestSidecarAudioUrl('coco', song, options),
    getLyrics: song => requestSidecarLyrics('coco', song),
};

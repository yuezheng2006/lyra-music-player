import { requestSidecarAudioUrl, requestSidecarLyrics, requestSidecarSearch } from './sidecarProviderClient';
import type { MusicProvider } from './types';

// src/services/musicProviders/qishuiMusicProvider.ts

export const qishuiMusicProvider: MusicProvider = {
    id: 'qishui',
    search: (query, options) => requestSidecarSearch('qishui', query, options),
    getAudioUrl: (song, options) => requestSidecarAudioUrl('qishui', song, options),
    getLyrics: song => requestSidecarLyrics('qishui', song),
};

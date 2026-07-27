import type { OnlineMusicProviderId } from '../../types';
import {
  requestSidecarAudioUrl,
  requestSidecarLyrics,
  requestSidecarSearch,
} from './sidecarProviderClient';
import type { MusicProvider } from './types';

// src/services/musicProviders/createSidecarMusicProvider.ts
// Generic MusicProvider backed entirely by the sidecar plugin protocol.

export const createSidecarMusicProvider = (id: OnlineMusicProviderId): MusicProvider => ({
  id,
  search: (query, options) => requestSidecarSearch(id, query, options),
  getAudioUrl: (song, options) => requestSidecarAudioUrl(id, song, options),
  getLyrics: (song) => requestSidecarLyrics(id, song),
});

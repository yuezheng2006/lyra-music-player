import type { MusicProvider, ProviderAudioResult } from './types';
import { loadPodcastEpisodeLyrics } from '../podcast/loadPodcastEpisodeLyrics';

// src/services/musicProviders/rssPodcastProvider.ts
// Direct enclosure URLs from public podcast RSS feeds.

export const RSS_PODCAST_PROVIDER_ID = 'rss' as const;

const normalizeAudioUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
};

export const rssPodcastProvider: MusicProvider = {
    id: RSS_PODCAST_PROVIDER_ID,
    search: async () => ({ songs: [], total: 0, hasMore: false }),
    getAudioUrl: async (song): Promise<ProviderAudioResult> => {
        const url = normalizeAudioUrl(song.audioUrl);
        if (!url || !/^https:\/\//i.test(url)) {
            return { kind: 'unavailable' };
        }
        return { kind: 'ok', audioUrl: url };
    },
    getLyrics: async (song) => loadPodcastEpisodeLyrics(song),
};

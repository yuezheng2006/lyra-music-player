import type { SongResult } from '../../types';
import {
    fetchHotPodcasts as fetchNeteaseHotPodcasts,
    fetchPodcastPrograms as fetchNeteasePodcastPrograms,
    searchPodcasts as searchNeteasePodcasts,
    type NeteasePodcastRadio,
} from '../neteasePodcast';
import { fetchAppleTopPodcasts, searchApplePodcasts } from './applePodcastCatalog';
import { fetchRssPodcastPrograms } from './rssPodcastFeed';

// src/services/podcast/podcastCatalog.ts
// Apple/RSS first; NetEase djradio remains a fallback when Apple is empty or down.

export type { NeteasePodcastRadio };

export const fetchHotPodcasts = async (limit = 24, offset = 0): Promise<NeteasePodcastRadio[]> => {
    try {
        const apple = await fetchAppleTopPodcasts(limit);
        if (apple.length > 0) return apple;
    } catch {
        // Fall through to NetEase when Apple charts/lookup fail.
    }
    return fetchNeteaseHotPodcasts(limit, offset);
};

export const searchPodcasts = async (keywords: string, limit = 18): Promise<NeteasePodcastRadio[]> => {
    const trimmed = keywords.trim();
    if (!trimmed) return [];
    try {
        const apple = await searchApplePodcasts(trimmed, limit);
        if (apple.length > 0) return apple;
    } catch {
        // Fall through to NetEase when Apple search fails.
    }
    return searchNeteasePodcasts(trimmed, limit);
};

export const fetchPodcastPrograms = async (
    radio: NeteasePodcastRadio,
    limit = 40,
    offset = 0,
): Promise<{ radio: NeteasePodcastRadio | null; programs: SongResult[] }> => {
    if (radio.feedUrl) {
        return fetchRssPodcastPrograms(radio, limit);
    }
    return fetchNeteasePodcastPrograms(radio.id, limit, offset);
};

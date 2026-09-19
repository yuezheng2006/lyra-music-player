import type { NeteasePodcastRadio } from '../neteasePodcast';
import { fetchPodcastRemoteJson } from './fetchPodcastRemote';
import { collectItunesPodcastResults, collectItunesTopChartIds } from './mapApplePodcast';

// src/services/podcast/applePodcastCatalog.ts
// Apple iTunes Search / top charts → shows that still publish a public RSS feed.

const APPLE_COUNTRY = 'cn';
const LOOKUP_CHUNK = 20;

const itunesSearchUrl = (term: string, limit: number) => (
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&country=${APPLE_COUNTRY}&limit=${limit}`
);

const itunesTopUrl = (limit: number) => (
    `https://itunes.apple.com/${APPLE_COUNTRY}/rss/toppodcasts/limit=${limit}/explicit=true/json`
);

const itunesLookupUrl = (ids: string[]) => (
    `https://itunes.apple.com/lookup?id=${ids.join(',')}&entity=podcast&country=${APPLE_COUNTRY}`
);

const chunk = <T>(items: T[], size: number): T[][] => {
    const groups: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        groups.push(items.slice(i, i + size));
    }
    return groups;
};

export const searchApplePodcasts = async (term: string, limit = 36): Promise<NeteasePodcastRadio[]> => {
    const trimmed = term.trim();
    if (!trimmed) return [];
    const payload = await fetchPodcastRemoteJson(itunesSearchUrl(trimmed, limit));
    return collectItunesPodcastResults(payload);
};

export const fetchAppleTopPodcasts = async (limit = 36): Promise<NeteasePodcastRadio[]> => {
    const chart = await fetchPodcastRemoteJson(itunesTopUrl(limit));
    const ids = collectItunesTopChartIds(chart).slice(0, limit);
    if (ids.length === 0) return [];
    const shows: NeteasePodcastRadio[] = [];
    for (const group of chunk(ids, LOOKUP_CHUNK)) {
        const payload = await fetchPodcastRemoteJson(itunesLookupUrl(group));
        shows.push(...collectItunesPodcastResults(payload));
    }
    return shows;
};

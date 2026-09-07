import type { NeteasePodcastRadio } from '../neteasePodcast';

// src/services/podcast/mapApplePodcast.ts
// Map iTunes Search / Lookup / top-chart JSON into podcast show cards.

type ItunesPodcastResult = {
    collectionId?: number;
    trackId?: number;
    collectionName?: string;
    trackName?: string;
    artistName?: string;
    artworkUrl600?: string;
    artworkUrl100?: string;
    artworkUrl60?: string;
    feedUrl?: string;
    trackCount?: number;
    primaryGenreName?: string;
};

const toHttps = (url?: string | null): string => {
    if (!url) return '';
    return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url;
};

const asArray = <T>(value: T | T[] | undefined): T[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

export const mapItunesPodcastResult = (raw: ItunesPodcastResult | null | undefined): NeteasePodcastRadio | null => {
    const collectionId = Number(raw?.collectionId || raw?.trackId || 0);
    const feedUrl = String(raw?.feedUrl || '').trim();
    const name = String(raw?.collectionName || raw?.trackName || '').trim();
    if (!collectionId || !feedUrl || !name) return null;
    const cover = toHttps(raw?.artworkUrl600 || raw?.artworkUrl100 || raw?.artworkUrl60 || '');
    return {
        id: collectionId,
        rid: collectionId,
        name,
        cover,
        desc: '',
        djName: String(raw?.artistName || '').trim(),
        category: String(raw?.primaryGenreName || '').trim(),
        programCount: Number(raw?.trackCount || 0),
        subCount: 0,
        feedUrl,
        catalogSource: 'apple',
    };
};

export const collectItunesPodcastResults = (payload: unknown): NeteasePodcastRadio[] => {
    const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
    const raw = asArray(root?.results as ItunesPodcastResult[] | undefined);
    const seen = new Set<number>();
    const shows: NeteasePodcastRadio[] = [];
    for (const item of raw) {
        const mapped = mapItunesPodcastResult(item);
        if (!mapped || seen.has(mapped.id)) continue;
        seen.add(mapped.id);
        shows.push(mapped);
    }
    return shows;
};

export const collectItunesTopChartIds = (payload: unknown): string[] => {
    const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
    const feed = root?.feed && typeof root.feed === 'object' ? root.feed as Record<string, unknown> : null;
    const fromMarketing = asArray(feed?.results as Array<{ id?: string }> | undefined)
        .map((item) => String(item?.id || '').trim())
        .filter(Boolean);
    if (fromMarketing.length > 0) return fromMarketing;

    const entries = asArray(feed?.entry as Array<{
        id?: { attributes?: { 'im:id'?: string }; label?: string };
    }> | undefined);
    return entries
        .map((entry) => String(entry?.id?.attributes?.['im:id'] || '').trim())
        .filter(Boolean);
};

import type { OnlineMusicProviderId, UnifiedSong } from '../../types';

// src/utils/search/searchResultCache.ts

export type CachedSearchPage = {
    results: UnifiedSong[];
    hasMore: boolean;
    nextOffset: number;
};

type CacheEntry = {
    result: CachedSearchPage;
    storedAt: number;
};

const FRESH_TTL_MS = 30_000;
const STALE_TTL_MS = 5 * 60_000;
const MAX_ENTRIES = 40;

const resultCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, {
    request: Promise<CachedSearchPage>;
    signal?: AbortSignal;
}>();

export const buildSearchCacheKey = (
    providerId: OnlineMusicProviderId,
    query: string,
    limit: number,
    offset: number,
): string => `${providerId}|${query.trim()}|${offset}|${limit}`;

export const readSearchCache = (
    key: string,
    now = Date.now(),
): { result: CachedSearchPage; freshness: 'fresh' | 'stale' } | null => {
    const entry = resultCache.get(key);
    if (!entry) return null;

    const age = Math.max(0, now - entry.storedAt);
    if (age > STALE_TTL_MS) {
        resultCache.delete(key);
        return null;
    }

    resultCache.delete(key);
    resultCache.set(key, entry);
    return {
        result: entry.result,
        freshness: age <= FRESH_TTL_MS ? 'fresh' : 'stale',
    };
};

export const writeSearchCache = (
    key: string,
    result: CachedSearchPage,
    now = Date.now(),
) => {
    resultCache.delete(key);
    resultCache.set(key, { result, storedAt: now });
    while (resultCache.size > MAX_ENTRIES) {
        const oldestKey = resultCache.keys().next().value;
        if (typeof oldestKey !== 'string') break;
        resultCache.delete(oldestKey);
    }
};

export const getSearchInflight = (key: string) => {
    const entry = inflightRequests.get(key);
    if (!entry) return undefined;
    if (entry.signal?.aborted) {
        inflightRequests.delete(key);
        return undefined;
    }
    return entry.request;
};

export const setSearchInflight = (
    key: string,
    request: Promise<CachedSearchPage>,
    signal?: AbortSignal,
) => {
    inflightRequests.set(key, { request, signal });
};

export const clearSearchInflight = (key: string, request: Promise<CachedSearchPage>) => {
    if (inflightRequests.get(key)?.request === request) {
        inflightRequests.delete(key);
    }
};

export const resetSearchResultCacheForTests = () => {
    resultCache.clear();
    inflightRequests.clear();
};

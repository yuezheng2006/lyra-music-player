import { beforeEach, describe, expect, it } from 'vitest';
import {
    buildSearchCacheKey,
    clearSearchInflight,
    getSearchInflight,
    readSearchCache,
    resetSearchResultCacheForTests,
    setSearchInflight,
    writeSearchCache,
    type CachedSearchPage,
} from '@/utils/search/searchResultCache';

// test/unit/search/searchResultCache.test.ts

const page = (name: string): CachedSearchPage => ({
    results: [{
        id: name.length,
        name,
        artists: [],
        album: { id: 0, name: '' },
        duration: 1,
        musicProvider: 'qishui',
    }],
    hasMore: false,
    nextOffset: 1,
});

describe('searchResultCache', () => {
    beforeEach(() => {
        resetSearchResultCacheForTests();
    });

    it('builds provider and page isolated keys', () => {
        expect(buildSearchCacheKey('qishui', '  大头针 ', 30, 0))
            .toBe('qishui|大头针|0|30');
        expect(buildSearchCacheKey('coco', '大头针', 30, 0))
            .not.toBe(buildSearchCacheKey('qishui', '大头针', 30, 0));
    });

    it('returns fresh, stale, then expired entries', () => {
        const key = buildSearchCacheKey('qishui', '大头针', 30, 0);
        writeSearchCache(key, page('hit'), 1_000);

        expect(readSearchCache(key, 20_000)?.freshness).toBe('fresh');
        expect(readSearchCache(key, 90_000)?.freshness).toBe('stale');
        expect(readSearchCache(key, 400_000)).toBeNull();
    });

    it('evicts the least recently used entry above capacity', () => {
        for (let index = 0; index < 40; index += 1) {
            writeSearchCache(`key-${index}`, page(String(index)), index);
        }
        expect(readSearchCache('key-0', 40)).not.toBeNull();

        writeSearchCache('key-40', page('40'), 40);

        expect(readSearchCache('key-1', 40)).toBeNull();
        expect(readSearchCache('key-0', 40)).not.toBeNull();
    });

    it('only clears the matching in-flight promise', async () => {
        const first = Promise.resolve(page('first'));
        const second = Promise.resolve(page('second'));
        setSearchInflight('key', first);

        clearSearchInflight('key', second);
        expect(getSearchInflight('key')).toBe(first);

        clearSearchInflight('key', first);
        expect(getSearchInflight('key')).toBeUndefined();
    });

    it('does not reuse an aborted in-flight request', () => {
        const controller = new AbortController();
        const request = Promise.resolve(page('first'));
        setSearchInflight('key', request, controller.signal);

        controller.abort();

        expect(getSearchInflight('key')).toBeUndefined();
    });
});

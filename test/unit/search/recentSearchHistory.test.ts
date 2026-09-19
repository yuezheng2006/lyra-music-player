import { describe, expect, it, vi } from 'vitest';
import {
    addRecentSearch,
    buildRecentSearchChannelKey,
    clearRecentSearchChannel,
    readRecentSearchHistory,
    writeRecentSearchHistory,
    type RecentSearchHistory,
} from '@/utils/search/recentSearchHistory';

// test/unit/search/recentSearchHistory.test.ts

const createStorage = (initial: string | null = null) => {
    let value = initial;
    return {
        getItem: vi.fn(() => value),
        setItem: vi.fn((_key: string, next: string) => {
            value = next;
        }),
    };
};

describe('recentSearchHistory', () => {
    it('builds stable isolated channel keys', () => {
        expect(buildRecentSearchChannelKey('qishui', ['qishui'])).toBe('qishui');
        expect(buildRecentSearchChannelKey('qq', ['qishui', 'qq', 'coco']))
            .toBe('coco+qishui+qq');
        expect(buildRecentSearchChannelKey('local', [])).toBe('local');
    });

    it('deduplicates queries and moves the latest search first', () => {
        let history: RecentSearchHistory = {};
        history = addRecentSearch(history, 'qishui', {
            query: '大头针',
            displayQuery: '大头针',
            searchedAt: 1,
        });
        history = addRecentSearch(history, 'qishui', {
            query: '孤勇者',
            displayQuery: '孤勇者',
            searchedAt: 2,
        });
        history = addRecentSearch(history, 'qishui', {
            query: ' 大头针 ',
            displayQuery: ' 大头针 ',
            searchedAt: 3,
        });

        expect(history.qishui).toEqual([
            { query: '大头针', displayQuery: '大头针', searchedAt: 3 },
            { query: '孤勇者', displayQuery: '孤勇者', searchedAt: 2 },
        ]);
    });

    it('collapses prefixed and bare queries that share a display label', () => {
        let history: RecentSearchHistory = {};
        history = addRecentSearch(history, 'qishui', {
            query: 'cat:AI周杰伦',
            displayQuery: 'AI周杰伦',
            searchedAt: 1,
        });
        history = addRecentSearch(history, 'qishui', {
            query: 'AI周杰伦',
            displayQuery: 'AI周杰伦',
            searchedAt: 2,
        });

        expect(history.qishui).toEqual([
            { query: 'AI周杰伦', displayQuery: 'AI周杰伦', searchedAt: 2 },
        ]);
    });

    it('collapses duplicate display labels when reading stored history', () => {
        const storage = createStorage(JSON.stringify({
            version: 1,
            channels: {
                qishui: [
                    { query: '周杰伦', displayQuery: '周杰伦', searchedAt: 3 },
                    { query: 'AI周杰伦', displayQuery: 'AI周杰伦', searchedAt: 2 },
                    { query: 'cat:AI周杰伦', displayQuery: 'AI周杰伦', searchedAt: 1 },
                ],
            },
        }));

        expect(readRecentSearchHistory(storage)).toEqual({
            qishui: [
                { query: '周杰伦', displayQuery: '周杰伦', searchedAt: 3 },
                { query: 'AI周杰伦', displayQuery: 'AI周杰伦', searchedAt: 2 },
            ],
        });
    });

    it('keeps only eight entries per channel', () => {
        let history: RecentSearchHistory = {};
        for (let index = 0; index < 10; index += 1) {
            history = addRecentSearch(history, 'coco', {
                query: `query-${index}`,
                displayQuery: `query-${index}`,
                searchedAt: index,
            });
        }

        expect(history.coco).toHaveLength(8);
        expect(history.coco[0].query).toBe('query-9');
        expect(history.coco[7].query).toBe('query-2');
    });

    it('ignores empty queries and HTTP share links', () => {
        const history = addRecentSearch({}, 'qishui', {
            query: 'https://qishui.douyin.com/s/abc123',
            displayQuery: 'share',
            searchedAt: 1,
        });

        expect(addRecentSearch(history, 'qishui', {
            query: '   ',
            displayQuery: '',
            searchedAt: 2,
        })).toEqual({});
    });

    it('round-trips versioned storage and rejects malformed payloads', () => {
        const storage = createStorage();
        const history: RecentSearchHistory = {
            qishui: [{ query: '大头针', displayQuery: '大头针', searchedAt: 1 }],
        };

        writeRecentSearchHistory(history, storage);
        expect(readRecentSearchHistory(storage)).toEqual(history);

        expect(readRecentSearchHistory(createStorage('{broken'))).toEqual({});
        expect(readRecentSearchHistory(createStorage(JSON.stringify({
            version: 2,
            channels: history,
        })))).toEqual({});
    });

    it('clears only the selected channel and tolerates storage failures', () => {
        const history: RecentSearchHistory = {
            qishui: [{ query: '大头针', displayQuery: '大头针', searchedAt: 1 }],
            coco: [{ query: '孤勇者', displayQuery: '孤勇者', searchedAt: 2 }],
        };
        expect(clearRecentSearchChannel(history, 'qishui')).toEqual({
            coco: history.coco,
        });

        const brokenStorage = {
            getItem: vi.fn(() => {
                throw new Error('denied');
            }),
            setItem: vi.fn(() => {
                throw new Error('quota');
            }),
        };
        expect(readRecentSearchHistory(brokenStorage)).toEqual({});
        expect(() => writeRecentSearchHistory(history, brokenStorage)).not.toThrow();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSearchNavigationStore } from '@/stores/useSearchNavigationStore';
import { neteaseApi } from '@/services/netease';
import { getMusicProvider } from '@/services/musicProviders/registry';
import { resetSearchResultCacheForTests } from '@/utils/search/searchResultCache';
import type { MusicProviderSearchResult } from '@/services/musicProviders/types';

vi.mock('@/services/netease', () => ({
    neteaseApi: {
        cloudSearch: vi.fn(),
    },
}));

vi.mock('@/services/musicProviders/registry', () => ({
    getMusicProvider: vi.fn(),
    getMusicProviderForSong: vi.fn(),
    getProviderSongCacheKey: vi.fn(),
    isNeteaseOnlineSong: vi.fn(),
}));

vi.mock('@/services/navidromeService', () => ({
    getNavidromeConfig: vi.fn(() => null),
    navidromeApi: {
        search: vi.fn(),
        toNavidromeSong: vi.fn(),
    },
}));

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
};

describe('useSearchNavigationStore', () => {
    const cloudSearchMock = vi.mocked(neteaseApi.cloudSearch);
    const getMusicProviderMock = vi.mocked(getMusicProvider);
    const deps = {
        localSongs: [],
        t: (_key: string, fallback?: string) => fallback || '',
    };

    beforeEach(() => {
        resetSearchResultCacheForTests();
        cloudSearchMock.mockReset();
        getMusicProviderMock.mockReset();
        getMusicProviderMock.mockImplementation((providerId) => {
            if (providerId === 'netease') {
                return {
                    id: 'netease',
                    search: vi.fn(async (query, options) => {
                        const response = await cloudSearchMock(query, options.limit, options.offset);
                        const songs = response.result?.songs || [];
                        const total = response.result?.songCount || 0;
                        return {
                            songs,
                            total,
                            hasMore: options.offset + songs.length < total,
                        };
                    }),
                    getAudioUrl: vi.fn(),
                    getLyrics: vi.fn(),
                };
            }

            if (providerId === 'qishui') {
                return {
                    id: 'qishui',
                    search: vi.fn(async (query, options) => {
                        const params = new URLSearchParams({
                            q: query,
                            limit: String(options.limit),
                            offset: String(options.offset),
                        });
                        const response = await fetch(`http://127.0.0.1:3002/providers/qishui/search?${params.toString()}`);
                        const data = await response.json();
                        const rawSongs = Array.isArray(data?.songs) ? data.songs : [];
                        return {
                            songs: rawSongs.map((song: any) => ({
                                id: 1,
                                providerSongId: String(song.id),
                                musicProvider: 'qishui',
                                name: song.title,
                                artists: (song.artists || []).map((name: string, index: number) => ({ id: index, name })),
                                album: { id: 0, name: song.album || 'Unknown Album', picUrl: song.coverUrl },
                                duration: song.durationMs || 0,
                            })),
                            total: data.total,
                            hasMore: data.hasMore,
                        };
                    }),
                    getAudioUrl: vi.fn(),
                    getLyrics: vi.fn(),
                };
            }

            return {
                id: providerId,
                search: vi.fn(async () => ({ songs: [], hasMore: false })),
                getAudioUrl: vi.fn(),
                getLyrics: vi.fn(),
            };
        });
        vi.unstubAllGlobals();
        useSearchNavigationStore.setState({
            homeViewTab: 'playlist',
            homeSearchQuery: '',
            searchQuery: '',
            peerSearchQueries: { coco: '', qishui: '', kugou: '', bilibili: '', kuwo: '' },
            recentSearchHistory: {},
            searchSourceTab: 'playlist',
            searchProviders: [],
            searchResults: null,
            searchReturnView: 'home',
            isSearchOpen: false,
            isSearching: false,
            isLoadingMore: false,
            offset: 0,
            limit: 30,
            hasMore: false,
            scrollTop: 0,
        });
    });

    it('submits a local search and opens the overlay', async () => {
        const didSearch = await useSearchNavigationStore.getState().submitSearch({
            query: 'world',
            sourceTab: 'local',
            deps: {
                ...deps,
                localSongs: [
                    {
                        id: '1',
                        fileName: 'hello.mp3',
                        filePath: '/tmp/hello.mp3',
                        duration: 120000,
                        fileSize: 10,
                        mimeType: 'audio/mpeg',
                        addedAt: 1,
                        title: 'Hello World',
                        artist: 'Singer',
                        album: 'Album',
                    },
                ],
            },
        });

        const state = useSearchNavigationStore.getState();

        expect(didSearch).toBe(true);
        expect(state.isSearchOpen).toBe(true);
        expect(state.searchQuery).toBe('world');
        expect(state.searchSourceTab).toBe('local');
        expect(state.searchResults).toHaveLength(1);
        expect(state.hasMore).toBe(false);
    });

    it('keeps displayQuery in searchQuery while routing with the prefixed query', async () => {
        const searchMock = vi.fn(async () => ({
            songs: [{
                id: 301,
                name: 'Category Hit',
                artists: [{ id: 1, name: 'Artist' }],
                album: { id: 2, name: 'Album' },
                duration: 180000,
                musicProvider: 'qishui' as const,
            }],
            hasMore: false,
        }));
        getMusicProviderMock.mockReturnValue({
            id: 'qishui',
            search: searchMock,
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });

        useSearchNavigationStore.setState({
            isSearchOpen: true,
            searchSourceTab: 'qishui',
            searchProviders: ['qishui'],
            searchQuery: '',
            peerSearchQueries: { coco: '', qishui: '', kugou: '', bilibili: '', kuwo: '' },
        });

        const didSearch = await useSearchNavigationStore.getState().submitSearch({
            query: 'cat:周杰伦',
            displayQuery: '周杰伦',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });

        const state = useSearchNavigationStore.getState();

        expect(didSearch).toBe(true);
        expect(searchMock).toHaveBeenCalledWith('cat:周杰伦', expect.objectContaining({ limit: 30, offset: 0 }));
        expect(state.searchQuery).toBe('周杰伦');
        expect(state.peerSearchQueries.qishui).toBe('cat:周杰伦');
        expect(state.searchSourceTab).toBe('qishui');
    });

    it('stores raw and display queries in the active channel history', async () => {
        getMusicProviderMock.mockReturnValue({
            id: 'qishui',
            search: vi.fn(async () => ({ songs: [], hasMore: false })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });

        await useSearchNavigationStore.getState().submitSearch({
            query: 'cat:周杰伦',
            displayQuery: '周杰伦',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });

        expect(useSearchNavigationStore.getState().recentSearchHistory.qishui).toEqual([
            expect.objectContaining({
                query: 'cat:周杰伦',
                displayQuery: '周杰伦',
            }),
        ]);
    });

    it('isolates peer and stable multi-provider histories', async () => {
        getMusicProviderMock.mockImplementation((providerId) => ({
            id: providerId,
            search: vi.fn(async () => ({ songs: [], hasMore: false })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        }));

        await useSearchNavigationStore.getState().submitSearch({
            query: '大头针',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });
        await useSearchNavigationStore.getState().submitSearch({
            query: '孤勇者',
            sourceTab: 'coco',
            providers: ['coco'],
            deps,
        });
        await useSearchNavigationStore.getState().submitSearch({
            query: '周杰伦',
            sourceTab: 'qq',
            providers: ['qishui', 'qq', 'coco'],
            deps,
        });

        const history = useSearchNavigationStore.getState().recentSearchHistory;
        expect(history.qishui?.[0].query).toBe('大头针');
        expect(history.coco?.[0].query).toBe('孤勇者');
        expect(history['coco+qishui+qq']?.[0].query).toBe('周杰伦');
    });

    it('does not store share links and clears only one channel', async () => {
        const storage = {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
        };
        vi.stubGlobal('window', { localStorage: storage });
        getMusicProviderMock.mockReturnValue({
            id: 'qishui',
            search: vi.fn(async () => ({ songs: [], hasMore: false })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });
        useSearchNavigationStore.setState({
            recentSearchHistory: {
                qishui: [{ query: '大头针', displayQuery: '大头针', searchedAt: 1 }],
                coco: [{ query: '孤勇者', displayQuery: '孤勇者', searchedAt: 2 }],
            },
        });

        await useSearchNavigationStore.getState().submitSearch({
            query: 'https://qishui.douyin.com/s/abc123',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });
        useSearchNavigationStore.getState().clearRecentSearchHistory('qishui');

        expect(useSearchNavigationStore.getState().recentSearchHistory).toEqual({
            coco: [{ query: '孤勇者', displayQuery: '孤勇者', searchedAt: 2 }],
        });
        expect(storage.setItem).toHaveBeenCalled();
    });

    it('submits a QQ Music provider search', async () => {
        getMusicProviderMock.mockReturnValue({
            id: 'qq',
            search: vi.fn(async () => ({
                songs: [{
                    id: 201,
                    qqMid: 'qq-mid-201',
                    providerSongId: 'qq-mid-201',
                    name: 'QQ Track',
                    artists: [{ id: 1, name: 'QQ Artist' }],
                    album: { id: 2, name: 'QQ Album' },
                    duration: 180000,
                    musicProvider: 'qq' as const,
                }],
                hasMore: false,
            })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });

        const didSearch = await useSearchNavigationStore.getState().submitSearch({
            query: 'qq track',
            sourceTab: 'qq',
            deps,
        });

        const state = useSearchNavigationStore.getState();

        expect(didSearch).toBe(true);
        expect(getMusicProviderMock).toHaveBeenCalledWith('qq');
        expect(state.searchSourceTab).toBe('qq');
        expect(state.searchResults?.[0]).toEqual(expect.objectContaining({
            musicProvider: 'qq',
            providerSongId: 'qq-mid-201',
        }));
        expect(state.hasMore).toBe(false);
    });

    it('aggregates results across enabled online providers', async () => {
        getMusicProviderMock.mockImplementation((providerId) => ({
            id: providerId,
            search: vi.fn(async () => ({
                songs: [{
                    id: providerId === 'netease' ? 1 : providerId === 'qq' ? 2 : 3,
                    name: `${providerId} hit`,
                    artists: [{ id: 1, name: 'Artist' }],
                    album: { id: 1, name: 'Album' },
                    duration: 1000,
                    musicProvider: providerId,
                    providerSongId: `${providerId}-1`,
                }],
                hasMore: false,
            })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        }));

        const didSearch = await useSearchNavigationStore.getState().submitSearch({
            query: '哈哈',
            sourceTab: 'coco',
            providers: ['netease', 'qq', 'coco'],
            deps,
        });

        const state = useSearchNavigationStore.getState();
        expect(didSearch).toBe(true);
        expect(getMusicProviderMock).toHaveBeenCalledWith('netease');
        expect(getMusicProviderMock).toHaveBeenCalledWith('qq');
        expect(getMusicProviderMock).toHaveBeenCalledWith('coco');
        expect(state.searchProviders).toEqual(['netease', 'qq', 'coco']);
        expect(state.searchResults?.map(song => song.musicProvider)).toEqual(['netease', 'qq', 'coco']);
    });

    it('publishes the first provider batch before slower providers finish', async () => {
        const fast = deferred<MusicProviderSearchResult>();
        const slow = deferred<MusicProviderSearchResult>();
        getMusicProviderMock.mockImplementation((providerId) => ({
            id: providerId,
            search: vi.fn(() => providerId === 'qq' ? fast.promise : slow.promise),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        }));

        const submit = useSearchNavigationStore.getState().submitSearch({
            query: '周杰伦',
            sourceTab: 'qq',
            providers: ['qq', 'qishui'],
            deps,
        });
        fast.resolve({
            songs: [{
                id: 1,
                name: '晴天',
                artists: [],
                album: { id: 0, name: '' },
                duration: 1,
                musicProvider: 'qq',
            }],
            hasMore: false,
        });

        await vi.waitFor(() => {
            expect(useSearchNavigationStore.getState().searchResults?.map(song => song.musicProvider))
                .toEqual(['qq']);
        });
        expect(useSearchNavigationStore.getState().isSearching).toBe(true);

        slow.resolve({
            songs: [{
                id: 2,
                name: '七里香',
                artists: [],
                album: { id: 0, name: '' },
                duration: 1,
                musicProvider: 'qishui',
            }],
            hasMore: false,
        });
        await submit;

        expect(useSearchNavigationStore.getState().searchResults?.map(song => song.musicProvider))
            .toEqual(['qq', 'qishui']);
        expect(useSearchNavigationStore.getState().isSearching).toBe(false);
    });

    it('keeps existing results visible while a replacement search runs', async () => {
        const pending = deferred<MusicProviderSearchResult>();
        getMusicProviderMock.mockReturnValue({
            id: 'qishui',
            search: vi.fn(() => pending.promise),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });
        useSearchNavigationStore.setState({
            searchResults: [{
                id: 1,
                name: '旧结果',
                artists: [],
                album: { id: 0, name: '' },
                duration: 1,
                musicProvider: 'qishui',
            }],
        });

        const submit = useSearchNavigationStore.getState().submitSearch({
            query: '新结果',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });

        expect(useSearchNavigationStore.getState().searchResults?.[0].name).toBe('旧结果');
        pending.resolve({ songs: [], hasMore: false });
        await submit;
    });

    it('deduplicates identical provider requests in flight', async () => {
        const pending = deferred<MusicProviderSearchResult>();
        const search = vi.fn(() => pending.promise);
        getMusicProviderMock.mockReturnValue({
            id: 'qishui',
            search,
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });

        const first = useSearchNavigationStore.getState().submitSearch({
            query: '大头针',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });
        const second = useSearchNavigationStore.getState().submitSearch({
            query: '大头针',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });

        expect(search).toHaveBeenCalledTimes(1);
        pending.resolve({ songs: [], hasMore: false });
        await Promise.all([first, second]);
    });

    it('aborts the previous provider signal when a new query starts', async () => {
        const requests: Array<{
            signal?: AbortSignal;
            deferred: ReturnType<typeof deferred<MusicProviderSearchResult>>;
        }> = [];
        getMusicProviderMock.mockReturnValue({
            id: 'qishui',
            search: vi.fn((_query, options) => {
                const request = deferred<MusicProviderSearchResult>();
                requests.push({ signal: options.signal, deferred: request });
                return request.promise;
            }),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });

        void useSearchNavigationStore.getState().submitSearch({
            query: '第一次',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });
        const second = useSearchNavigationStore.getState().submitSearch({
            query: '第二次',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });

        expect(requests[0]?.signal?.aborted).toBe(true);
        requests[0]?.deferred.resolve({ songs: [], hasMore: false });
        requests[1]?.deferred.resolve({ songs: [], hasMore: false });
        await second;
    });

    it('clears loading state when hiding an in-flight search', () => {
        useSearchNavigationStore.setState({
            isSearchOpen: true,
            isSearching: true,
            isLoadingMore: true,
        });

        useSearchNavigationStore.getState().hideSearchOverlay();

        expect(useSearchNavigationStore.getState()).toMatchObject({
            isSearchOpen: false,
            isSearching: false,
            isLoadingMore: false,
        });
    });

    it('submits a Qishui share-link provider search through sidecar', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({
                songs: [
                    {
                        id: 'https://qishui.douyin.com/s/abc123',
                        title: 'Qishui Track',
                        artists: ['Qishui Artist'],
                        album: 'Qishui Album',
                        durationMs: 200000,
                        coverUrl: 'https://example.com/cover.jpg',
                    },
                ],
                total: 1,
                hasMore: false,
            }),
        })) as any);

        const didSearch = await useSearchNavigationStore.getState().submitSearch({
            query: 'https://qishui.douyin.com/s/abc123',
            sourceTab: 'qishui',
            deps,
        });

        const state = useSearchNavigationStore.getState();

        expect(didSearch).toBe(true);
        expect(fetch).toHaveBeenCalledWith(
            'http://127.0.0.1:3002/providers/qishui/search?q=https%3A%2F%2Fqishui.douyin.com%2Fs%2Fabc123&limit=30&offset=0',
        );
        expect(state.searchSourceTab).toBe('qishui');
        expect(state.searchResults?.[0]).toEqual(expect.objectContaining({
            musicProvider: 'qishui',
            providerSongId: 'https://qishui.douyin.com/s/abc123',
            name: 'Qishui Track',
        }));
    });

    it('appends more netease results when loading the next page', async () => {
        cloudSearchMock
            .mockResolvedValueOnce({
                result: {
                    songs: [
                        { id: 1, name: 'Track 1', artists: [], album: { id: 1, name: 'Album 1' }, duration: 1000 },
                        { id: 2, name: 'Track 2', artists: [], album: { id: 2, name: 'Album 2' }, duration: 1000 },
                    ],
                    songCount: 4,
                },
            } as any)
            .mockResolvedValueOnce({
                result: {
                    songs: [
                        { id: 3, name: 'Track 3', artists: [], album: { id: 3, name: 'Album 3' }, duration: 1000 },
                        { id: 4, name: 'Track 4', artists: [], album: { id: 4, name: 'Album 4' }, duration: 1000 },
                    ],
                    songCount: 4,
                },
            } as any);

        await useSearchNavigationStore.getState().submitSearch({
            query: 'folio',
            sourceTab: 'playlist',
            deps,
        });

        await useSearchNavigationStore.getState().loadMoreSearchResults({ deps });

        const state = useSearchNavigationStore.getState();

        expect(cloudSearchMock).toHaveBeenNthCalledWith(1, 'folio', 30, 0);
        expect(cloudSearchMock).toHaveBeenNthCalledWith(2, 'folio', 30, 2);
        expect(state.searchResults).toHaveLength(4);
        expect(state.hasMore).toBe(false);
        expect(state.offset).toBe(4);
    });

    it('restores the search view without clearing cached results', () => {
        useSearchNavigationStore.setState({
            searchResults: [{ id: 9, name: 'Cached', artists: [], album: { id: 1, name: 'Album' }, duration: 1000 }],
            isSearchOpen: false,
        });

        useSearchNavigationStore.getState().restoreSearch({
            query: 'cached',
            sourceTab: 'playlist',
        });

        const state = useSearchNavigationStore.getState();
        expect(state.isSearchOpen).toBe(true);
        expect(state.searchQuery).toBe('cached');
        expect(state.searchResults).toHaveLength(1);
    });

    it('does not collapse multi-source results when navigation re-asserts the same query', () => {
        useSearchNavigationStore.setState({
            homeSearchQuery: '周杰伦',
            searchQuery: '周杰伦',
            searchSourceTab: 'qq',
            searchProviders: ['qq', 'qishui', 'coco'],
            searchResults: [
                { id: 1, name: '晴天', artists: [], album: { id: 1, name: 'A' }, duration: 1000, musicProvider: 'qq' },
                { id: 2, name: '屋顶', artists: [], album: { id: 1, name: 'A' }, duration: 1000, musicProvider: 'coco' },
            ],
            isSearchOpen: true,
            isSearching: false,
        });

        useSearchNavigationStore.getState().restoreSearch({
            query: '周杰伦',
            sourceTab: 'qq',
        });

        const state = useSearchNavigationStore.getState();
        expect(state.searchProviders).toEqual(['qq', 'qishui', 'coco']);
        expect(state.searchResults).toHaveLength(2);
    });

    it('restores explicit multi-source providers from history payload', () => {
        useSearchNavigationStore.setState({
            searchQuery: '',
            searchProviders: [],
            searchResults: null,
            isSearchOpen: false,
        });

        useSearchNavigationStore.getState().restoreSearch({
            query: '周杰伦',
            sourceTab: 'qq',
            providers: ['qq', 'qishui', 'coco'],
        });

        const state = useSearchNavigationStore.getState();
        expect(state.isSearchOpen).toBe(true);
        expect(state.searchProviders).toEqual(['qq', 'qishui', 'coco']);
        expect(state.searchQuery).toBe('周杰伦');
    });

    it('syncs searchProviders when restoring a peer channel like qishui', () => {
        useSearchNavigationStore.setState({
            searchProviders: ['coco'],
            searchSourceTab: 'coco',
            isSearchOpen: false,
        });

        useSearchNavigationStore.getState().restoreSearch({
            query: '',
            sourceTab: 'qishui',
        });

        const state = useSearchNavigationStore.getState();
        expect(state.isSearchOpen).toBe(true);
        expect(state.searchSourceTab).toBe('qishui');
        expect(state.searchProviders).toEqual(['qishui']);
    });

    it('clears the search input and cached results together', () => {
        useSearchNavigationStore.setState({
            searchQuery: '孤勇者',
            searchResults: [{ id: 1, name: '孤勇者', artists: [], album: { id: 1, name: 'Album' }, duration: 1000 }],
            offset: 20,
            hasMore: true,
            isSearching: false,
        });

        useSearchNavigationStore.getState().clearSearchInput();

        const state = useSearchNavigationStore.getState();
        expect(state.searchQuery).toBe('');
        expect(state.searchResults).toBeNull();
        expect(state.offset).toBe(0);
        expect(state.hasMore).toBe(false);
    });

    it('clears cached results when restoring a different peer channel', () => {
        useSearchNavigationStore.setState({
            searchQuery: '孤勇者',
            searchSourceTab: 'qishui',
            searchProviders: ['qishui'],
            searchResults: [{ id: 1, name: '汽水结果', artists: [], album: { id: 1, name: 'Album' }, duration: 1000 }],
            isSearchOpen: true,
        });

        useSearchNavigationStore.getState().restoreSearch({
            query: '孤勇者',
            sourceTab: 'coco',
        });

        const state = useSearchNavigationStore.getState();
        expect(state.searchSourceTab).toBe('coco');
        expect(state.searchProviders).toEqual(['coco']);
        expect(state.searchResults).toBeNull();
    });

    it('keeps coco submitSearch from fanning into qishui', async () => {
        const searchMock = vi.fn(async () => ({
            songs: [{ id: 11, name: 'Coco Hit', artists: [], album: { id: 1, name: 'A' }, duration: 1000 }],
            hasMore: false,
            total: 1,
        }));
        getMusicProviderMock.mockImplementation((providerId) => {
            if (providerId === 'coco') {
                return { search: searchMock } as any;
            }
            return {
                search: vi.fn(async () => ({ songs: [{ id: 99, name: 'Leak', artists: [], album: { id: 1, name: 'A' }, duration: 1000 }], hasMore: false })),
            } as any;
        });

        await useSearchNavigationStore.getState().submitSearch({
            query: '孤勇者',
            sourceTab: 'coco',
            providers: ['coco'],
            deps,
        });

        const state = useSearchNavigationStore.getState();
        expect(searchMock).toHaveBeenCalled();
        expect(state.searchProviders).toEqual(['coco']);
        expect(state.searchResults).toHaveLength(1);
        expect(state.searchResults?.[0].name).toBe('Coco Hit');
    });

    it('keeps home aggregate submitSearch with coco and qishui together', async () => {
        getMusicProviderMock.mockImplementation((providerId) => ({
            id: providerId,
            search: vi.fn(async () => ({
                songs: [{ id: 1, name: `${providerId} hit`, artists: [], album: { id: 1, name: 'A' }, duration: 1000 }],
                hasMore: false,
            })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        }));

        await useSearchNavigationStore.getState().submitSearch({
            query: '你好',
            sourceTab: 'qq',
            providers: ['qq', 'qishui', 'coco'],
            deps,
        });

        const state = useSearchNavigationStore.getState();
        expect(state.searchProviders).toEqual(['qq', 'qishui', 'coco']);
        expect(state.searchResults?.map(song => song.musicProvider)).toEqual(['qq', 'qishui', 'coco']);
    });

    it('keeps peer channel keywords isolated when opening another peer', async () => {
        getMusicProviderMock.mockImplementation((providerId) => ({
            id: providerId,
            search: vi.fn(async () => ({
                songs: [{ id: 1, name: `${providerId} hit`, artists: [], album: { id: 1, name: 'A' }, duration: 1000 }],
                hasMore: false,
            })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        }));

        await useSearchNavigationStore.getState().submitSearch({
            query: '大头针',
            sourceTab: 'qishui',
            providers: ['qishui'],
            deps,
        });
        useSearchNavigationStore.getState().hideSearchOverlay();

        useSearchNavigationStore.getState().openPeerSearchChannel({
            sourceTab: 'coco',
            returnView: 'home',
        });

        let state = useSearchNavigationStore.getState();
        expect(state.searchSourceTab).toBe('coco');
        expect(state.searchQuery).toBe('');
        expect(state.peerSearchQueries.qishui).toBe('大头针');
        expect(state.peerSearchQueries.coco).toBe('');
        expect(state.searchResults).toBeNull();

        useSearchNavigationStore.getState().openPeerSearchChannel({
            sourceTab: 'qishui',
            returnView: 'home',
        });

        state = useSearchNavigationStore.getState();
        expect(state.searchSourceTab).toBe('qishui');
        expect(state.searchQuery).toBe('大头针');
        expect(state.peerSearchQueries.qishui).toBe('大头针');
    });

    it('does not let the home bar overwrite a closed peer channel keyword', () => {
        useSearchNavigationStore.setState({
            homeSearchQuery: '',
            searchQuery: '大头针',
            peerSearchQueries: { coco: '', qishui: '大头针', kugou: '', bilibili: '', kuwo: '' },
            searchSourceTab: 'qishui',
            searchProviders: ['qishui'],
            isSearchOpen: false,
        });

        useSearchNavigationStore.getState().setHomeSearchQuery('孤勇者');
        useSearchNavigationStore.getState().openPeerSearchChannel({
            sourceTab: 'coco',
        });

        const state = useSearchNavigationStore.getState();
        expect(state.homeSearchQuery).toBe('孤勇者');
        expect(state.searchQuery).toBe('');
        expect(state.peerSearchQueries.qishui).toBe('大头针');
        expect(state.peerSearchQueries.coco).toBe('');
    });

    it('keeps the home bar draft isolated from overlay and peer channels', () => {
        useSearchNavigationStore.setState({
            homeSearchQuery: '你好',
            searchQuery: '',
            peerSearchQueries: { coco: '', qishui: '', kugou: '', bilibili: '', kuwo: '' },
            isSearchOpen: false,
        });

        useSearchNavigationStore.getState().openPeerSearchChannel({
            sourceTab: 'qishui',
        });
        useSearchNavigationStore.getState().setSearchQuery('大头针');
        useSearchNavigationStore.getState().hideSearchOverlay();

        const state = useSearchNavigationStore.getState();
        expect(state.homeSearchQuery).toBe('你好');
        expect(state.peerSearchQueries.qishui).toBe('大头针');
        expect(state.isSearchOpen).toBe(false);
    });

    it('does not write home fan-out keywords into peer channel memory', async () => {
        getMusicProviderMock.mockImplementation((providerId) => ({
            id: providerId,
            search: vi.fn(async () => ({
                songs: [{ id: 1, name: `${providerId} hit`, artists: [], album: { id: 1, name: 'A' }, duration: 1000 }],
                hasMore: false,
            })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        }));

        await useSearchNavigationStore.getState().submitSearch({
            query: '你好',
            sourceTab: 'coco',
            providers: ['qq', 'coco'],
            deps,
        });

        const state = useSearchNavigationStore.getState();
        expect(state.searchQuery).toBe('你好');
        expect(state.peerSearchQueries.coco).toBe('');
        expect(state.peerSearchQueries.qishui).toBe('');
    });
});

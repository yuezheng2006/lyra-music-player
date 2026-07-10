import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSearchNavigationStore } from '@/stores/useSearchNavigationStore';
import { neteaseApi } from '@/services/netease';
import { getMusicProvider } from '@/services/musicProviders/registry';

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

describe('useSearchNavigationStore', () => {
    const cloudSearchMock = vi.mocked(neteaseApi.cloudSearch);
    const getMusicProviderMock = vi.mocked(getMusicProvider);
    const deps = {
        localSongs: [],
        t: (_key: string, fallback?: string) => fallback || '',
    };

    beforeEach(() => {
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
            searchQuery: '',
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
});

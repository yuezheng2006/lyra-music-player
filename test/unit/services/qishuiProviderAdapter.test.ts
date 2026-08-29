import { afterEach, describe, expect, it, vi } from 'vitest';

// test/unit/services/qishuiProviderAdapter.test.ts
// Covers Qishui category (playlist) vs track search routing.

const adapterUrl = new URL(
    '../../../scripts/music-provider-adapters/qishui-provider-adapter.mjs',
    import.meta.url,
).href;

const loadAdapter = async () => import(`${adapterUrl}?t=${Date.now()}`);

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
});

describe('qishui-provider-adapter', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('parses cat:/分类: category intents and song:/歌曲: track intents', async () => {
        const adapter = await loadAdapter();
        expect(adapter.parseQishuiSearchIntent('cat:AI歌曲')).toEqual({
            mode: 'category',
            query: 'AI歌曲',
        });
        expect(adapter.parseQishuiSearchIntent('分类:大头针')).toEqual({
            mode: 'category',
            query: '大头针',
        });
        expect(adapter.parseQishuiSearchIntent('song:周杰伦 晴天')).toEqual({
            mode: 'track',
            query: '周杰伦 晴天',
        });
        expect(adapter.parseQishuiSearchIntent('周杰伦 晴天')).toEqual({
            mode: 'auto',
            query: '周杰伦 晴天',
        });
        expect(adapter.parseQishuiSearchIntent('周杰伦')).toEqual({
            mode: 'auto',
            query: '周杰伦',
        });
        expect(adapter.parseQishuiSearchIntent('AI周杰伦')).toEqual({
            mode: 'category',
            query: 'AI周杰伦',
        });
        expect(adapter.parseQishuiSearchIntent('song:AI周杰伦')).toEqual({
            mode: 'track',
            query: 'AI周杰伦',
        });
    });

    it('routes category queries through playlist search and expands tracks', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/search/artist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'artists',
                        data: [{
                            entity: {
                                artist: {
                                    id: '7455245030981634098',
                                    name: '大头针',
                                    count_tracks: 2,
                                },
                            },
                        }],
                    }],
                });
            }
            if (url.includes('/search/playlist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'playlists',
                        data: [{
                            entity: {
                                playlist: {
                                    id: '7579480277417525291',
                                    title: '大头针50首歌曲',
                                    count_tracks: 2,
                                },
                            },
                        }],
                    }],
                });
            }
            if (url.includes('/playlist/detail?')) {
                return jsonResponse({
                    playlist: { title: '大头针50首歌曲', count_tracks: 2 },
                    media_resources: [
                        {
                            entity: {
                                track_wrapper: {
                                    track: {
                                        id: '7578838498515142696',
                                        name: '都是我不好（男版）',
                                        artists: [{ name: '大头针' }],
                                        album: { name: 'AI' },
                                        duration: 210000,
                                    },
                                },
                            },
                        },
                    ],
                });
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: 'cat:大头针', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('category');
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0].title).toBe('都是我不好（男版）');
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/playlist?'))).toBe(true);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/playlist/detail?'))).toBe(true);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/track?'))).toBe(false);
    });

    it('filters artist category playlists to tracks that include the matched artist', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/search/artist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'artists',
                        data: [{
                            entity: {
                                artist: {
                                    id: '6681166129722824706',
                                    name: '周杰伦',
                                    count_tracks: 20,
                                },
                            },
                        }],
                    }],
                });
            }
            if (url.includes('/search/playlist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'playlists',
                        data: [
                            {
                                entity: {
                                    playlist: {
                                        id: '7459000753408213019',
                                        title: '周杰伦合集',
                                        count_tracks: 3,
                                    },
                                },
                            },
                            {
                                entity: {
                                    playlist: {
                                        id: '7532035153447649318',
                                        title: '周杰伦全部歌曲',
                                        count_tracks: 3,
                                    },
                                },
                            },
                        ],
                    }],
                });
            }
            if (url.includes('/playlist/detail?')) {
                return jsonResponse({
                    playlist: { title: '周杰伦全部歌曲', count_tracks: 3 },
                    media_resources: [
                        {
                            entity: {
                                track_wrapper: {
                                    track: {
                                        id: '1',
                                        name: '说好的幸福呢',
                                        artists: [{ name: '浪花兄弟' }],
                                        album: { name: 'A' },
                                        duration: 234000,
                                    },
                                },
                            },
                        },
                        {
                            entity: {
                                track_wrapper: {
                                    track: {
                                        id: '2',
                                        name: '因为爱情',
                                        artists: [{ name: '周杰伦' }, { name: '那英' }],
                                        album: { name: 'B' },
                                        duration: 260000,
                                    },
                                },
                            },
                        },
                        {
                            entity: {
                                track_wrapper: {
                                    track: {
                                        id: '3',
                                        name: '晴天',
                                        artists: [{ name: '周杰伦' }],
                                        album: { name: 'C' },
                                        duration: 269000,
                                    },
                                },
                            },
                        },
                    ],
                });
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: 'cat:周杰伦', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('category');
        expect(result.artist).toBe('周杰伦');
        expect(result.playlist?.title).toBe('周杰伦全部歌曲');
        expect(result.songs.map(song => song.title)).toEqual(['因为爱情', '晴天']);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/artist?'))).toBe(true);
    });

    it('routes a top exact artist name through playlist search instead of mixed track hits', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/search/artist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'artists',
                        data: [{
                            entity: {
                                artist: {
                                    id: '6681166129722824706',
                                    name: '周杰伦',
                                    count_tracks: 10,
                                },
                            },
                        }],
                    }],
                });
            }
            if (url.includes('/search/playlist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'playlists',
                        data: [{
                            entity: {
                                playlist: {
                                    id: '7532035153447649318',
                                    title: '周杰伦全部歌曲',
                                    count_tracks: 1,
                                },
                            },
                        }],
                    }],
                });
            }
            if (url.includes('/playlist/detail?')) {
                return jsonResponse({
                    playlist: { title: '周杰伦全部歌曲', count_tracks: 1 },
                    media_resources: [{
                        entity: {
                            track_wrapper: {
                                track: {
                                    id: '3',
                                    name: '晴天',
                                    artists: [{ name: '周杰伦' }],
                                    album: { name: '叶惠美' },
                                    duration: 269000,
                                },
                            },
                        },
                    }],
                });
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '周杰伦', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('category');
        expect(result.artist).toBe('周杰伦');
        expect(result.songs.map(song => song.title)).toEqual(['晴天']);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/playlist?'))).toBe(true);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/track?'))).toBe(false);
    });

    it('keeps song-title queries on track search when the top artist is someone else', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/search/artist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'artists',
                        data: [{
                            entity: {
                                artist: {
                                    id: '1',
                                    name: '周杰伦',
                                    count_tracks: 10,
                                },
                            },
                        }, {
                            entity: {
                                artist: {
                                    id: '2',
                                    name: '晴天',
                                    count_tracks: 199,
                                },
                            },
                        }],
                    }],
                });
            }
            if (url.includes('/luna/search/track?') && !url.includes('/luna/pc/search/track?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'tracks',
                        has_more: false,
                        data: [{
                            entity: {
                                track: {
                                    id: '7678897838486882344',
                                    name: '晴天（杰伦）',
                                    artists: [{ name: '哇欣' }],
                                    album: { name: '晴天' },
                                    duration: 200000,
                                },
                            },
                        }],
                    }],
                });
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '晴天', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('track');
        expect(result.songs[0].title).toBe('晴天（杰伦）');
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/luna/search/track?'))).toBe(true);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/luna/pc/search/track?'))).toBe(false);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/playlist?'))).toBe(false);
    });

    it('routes title-like queries through the working Luna track endpoint', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/search/artist?')) {
                return jsonResponse({ result_groups: [{ id: 'artists', data: [] }] });
            }
            if (url.includes('/luna/search/track?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'tracks',
                        has_more: false,
                        data: [{
                            entity: {
                                track: {
                                    id: '7547915581162145801',
                                    name: '晴天',
                                    artists: [{ name: '周杰伦' }],
                                    album: { name: '叶惠美' },
                                    duration: 269000,
                                },
                            },
                        }],
                    }],
                });
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '周杰伦 晴天', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('track');
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0].title).toBe('晴天');
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/luna/search/track?'))).toBe(true);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/luna/pc/search/track?'))).toBe(false);
    });

    it('treats an empty official track body as no hits instead of failing the search', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/luna/search/track?')) {
                return new Response('', {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: 'song:晴天', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('track');
        expect(result.songs).toEqual([]);
    });

    it('routes bare AI queries through playlist search instead of empty track hits', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/search/playlist?')) {
                return jsonResponse({
                    result_groups: [{
                        id: 'playlists',
                        data: [{
                            entity: {
                                playlist: {
                                    id: '7579480277417525291',
                                    title: 'AI周杰伦',
                                    count_tracks: 1,
                                },
                            },
                        }],
                    }],
                });
            }
            if (url.includes('/playlist/detail?')) {
                return jsonResponse({
                    playlist: { count_tracks: 1 },
                    media_resources: [{
                        entity: {
                            track_wrapper: {
                                track: {
                                    id: '1',
                                    name: '晴天',
                                    artists: [{ name: 'AI周杰伦' }],
                                    album: { name: 'AI' },
                                    duration: 269000,
                                },
                            },
                        },
                    }],
                });
            }
            throw new Error(`Unexpected fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: 'AI周杰伦', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('category');
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0].title).toBe('晴天');
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/playlist?'))).toBe(true);
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/search/track?'))).toBe(false);
    });
});

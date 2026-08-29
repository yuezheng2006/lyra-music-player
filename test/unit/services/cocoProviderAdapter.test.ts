import { afterEach, describe, expect, it, vi } from 'vitest';

// test/unit/services/cocoProviderAdapter.test.ts
// Covers Coco adapter empty-result retries across flaky upstream source/count pairs.

const adapterUrl = new URL(
    '../../../scripts/music-provider-adapters/coco-provider-adapter.mjs',
    import.meta.url,
).href;

const loadAdapter = async () => import(`${adapterUrl}?t=${Date.now()}`);

describe('coco-provider-adapter search resilience', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('retries empty upstream pages and returns songs from a working source', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            const parsed = new URL(url);
            const types = parsed.searchParams.get('types');
            const source = parsed.searchParams.get('source');
            const count = parsed.searchParams.get('count');

            if (types === 'pic') {
                return new Response(JSON.stringify({ url: 'https://example.com/cover.jpg' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // First preferred source/count pairs often come back empty from upstream.
            if (source === 'netease' && (count === '30' || count === '20')) {
                return new Response(JSON.stringify([]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            if (source === 'joox' && count === '25') {
                return new Response(JSON.stringify([
                    {
                        id: '5257138',
                        name: '屋顶',
                        artist: ['周杰伦', '温岚'],
                        album: '男女情歌对唱冠军全记录',
                        pic_id: '109951165671182684',
                        source: 'joox',
                    },
                ]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '杰伦', limit: 30, offset: 0 });

        expect(result.songs).toHaveLength(1);
        expect(result.songs[0].title).toBe('屋顶');
        expect(result.songs[0].artists).toEqual(['周杰伦', '温岚']);
        expect(result.songs[0].source).toBe('joox');
        expect(fetchMock.mock.calls.some(([url]) => new URL(String(url)).searchParams.get('types') === 'pic')).toBe(false);
        expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    });

    it('strips leftover cat:/song: prefixes before hitting upstream', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const parsed = new URL(String(input));
            if (parsed.searchParams.get('types') !== 'search') {
                return new Response(JSON.stringify([]), { status: 200 });
            }
            return new Response(JSON.stringify([
                { id: '1', name: '晴天', artist: ['周杰伦'], source: 'netease' },
            ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        expect(adapter.parseCocoSearchQuery('cat:周杰伦')).toBe('周杰伦');
        expect(adapter.parseCocoSearchQuery('song:晴天')).toBe('晴天');

        await adapter.search({ query: 'cat:周杰伦', limit: 10, offset: 0 });
        const names = fetchMock.mock.calls
            .map(([url]) => new URL(String(url)).searchParams.get('name'))
            .filter(Boolean);
        expect(names.length).toBeGreaterThan(0);
        expect(names.every((name) => name === '周杰伦')).toBe(true);
    });

    it('merges sources and ranks a solo artist track above collabs and live hits', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const parsed = new URL(String(input));
            if (parsed.searchParams.get('types') !== 'search') {
                return new Response(JSON.stringify([]), { status: 200 });
            }
            const source = parsed.searchParams.get('source');
            if (source === 'netease') {
                return new Response(JSON.stringify([
                    { id: '1', name: '想你就写信 (Live)', artist: ['周杰伦', '李硕'], source: 'netease' },
                    { id: '3', name: '布拉格广场', artist: ['蔡依林', '周杰伦'], source: 'netease' },
                ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (source === 'joox') {
                return new Response(JSON.stringify([
                    { id: '2', name: '晴天', artist: ['周杰倫'], source: 'joox' },
                ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify([]), { status: 200 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '周杰伦', limit: 10, offset: 0 });
        expect(result.songs.map((song: { title: string }) => song.title)).toEqual([
            '晴天',
            '布拉格广场',
            '想你就写信 (Live)',
        ]);
    });

    it('dedupes traditional and simplified titles for the same artist', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const parsed = new URL(String(input));
            if (parsed.searchParams.get('types') !== 'search') {
                return new Response(JSON.stringify([]), { status: 200 });
            }
            const source = parsed.searchParams.get('source');
            if (source === 'joox') {
                return new Response(JSON.stringify([
                    { id: 'j1', name: '擱淺', artist: ['周杰倫'], source: 'joox' },
                ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (source === 'kuwo') {
                return new Response(JSON.stringify([
                    { id: 'k1', name: '搁浅', artist: ['周杰伦'], source: 'kuwo' },
                ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify([]), { status: 200 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '周杰伦', limit: 10, offset: 0 });
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0].title).toBe('擱淺');
    });

    it('falls back across audio sources when preferred source has no playable url', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const parsed = new URL(String(input));
            const types = parsed.searchParams.get('types');
            const source = parsed.searchParams.get('source');
            const id = parsed.searchParams.get('id');

            if (types === 'url' && source === 'kuwo') {
                return new Response(JSON.stringify({ url: '', br: -1 }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            if (types === 'url' && source === 'netease' && id === '228908') {
                return new Response(JSON.stringify({ url: '' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            if (types === 'url' && source === 'joox' && id === '228908') {
                return new Response(JSON.stringify({
                    url: 'https://example.com/joox.mp3',
                    br: 128,
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ url: '' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.audio({
            id: '228908',
            song: {
                providerSongId: '228908',
                providerCatalogSource: 'kuwo',
                name: '晴天',
            },
        });

        expect(result.audioUrl).toBe('https://example.com/joox.mp3');
    });

    it('returns empty when every source/count attempt stays empty', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }));
        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '杰伦', limit: 30, offset: 0 });

        expect(result).toEqual({ songs: [], total: 0, hasMore: false });
        expect(fetchMock.mock.calls.length).toBeGreaterThan(3);
    });
});

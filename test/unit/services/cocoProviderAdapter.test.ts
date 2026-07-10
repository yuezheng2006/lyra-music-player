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
        expect(result.songs[0].coverUrl).toBe('https://example.com/cover.jpg');
        expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
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

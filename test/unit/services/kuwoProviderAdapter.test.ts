import { afterEach, describe, expect, it, vi } from 'vitest';

// test/unit/services/kuwoProviderAdapter.test.ts
// Covers Kuwo search normalization, free-tier audio, and LRC conversion.

const adapterUrl = new URL(
    '../../../scripts/music-provider-adapters/kuwo-provider-adapter.mjs',
    import.meta.url,
).href;

const loadAdapter = async () => import(`${adapterUrl}?t=${Date.now()}`);

describe('kuwo-provider-adapter', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('normalizes search hits and strips MUSIC_ prefix', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('artistpicserver')) {
                return new Response('http://img1.kwcdn.kuwo.cn/star/albumcover/300/demo.jpg', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' },
                });
            }
            return new Response(JSON.stringify({
                TOTAL: '1',
                abslist: [{
                    MUSICRID: 'MUSIC_3195905',
                    SONGNAME: '红尘客栈',
                    ARTIST: '周杰伦',
                    ALBUM: '十二新作',
                    DURATION: '274',
                }],
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '红尘客栈', limit: 20, offset: 0 });

        expect(result.songs).toHaveLength(1);
        expect(result.songs[0]).toMatchObject({
            id: '3195905',
            title: '红尘客栈',
            artists: ['周杰伦'],
            album: '十二新作',
            durationMs: 274000,
            coverUrl: 'https://img1.kwcdn.kuwo.cn/star/albumcover/300/demo.jpg',
            source: 'kuwo',
        });
        expect(result.total).toBe(1);
    });

    it('returns audio url for anti.s convert responses', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            code: 200,
            url: 'http://nf-sycdn.kuwo.cn/demo.mp3',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }));

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.audio({
            id: '3195905',
            song: { providerSongId: 'MUSIC_3195905' },
        });

        expect(result.audioUrl).toBe('https://nf-sycdn.kuwo.cn/demo.mp3');
    });

    it('returns unavailable when anti.s has empty url', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            code: 200,
            url: '',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }));

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.audio({ id: '1', song: { providerSongId: '1' } });
        expect(result.audioUrl).toBeNull();
    });

    it('converts lrclist into LRC text', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            data: {
                lrclist: [
                    { lineLyric: '天涯的尽头是风沙', time: '22.23' },
                    { lineLyric: '红尘的故事叫牵挂', time: '27.5' },
                ],
            },
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }));

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.lyrics({ id: '3195905', song: { providerSongId: '3195905' } });
        expect(result.lyrics).toContain('[00:22.23]天涯的尽头是风沙');
        expect(result.lyrics).toContain('[00:27.50]红尘的故事叫牵挂');
    });
});

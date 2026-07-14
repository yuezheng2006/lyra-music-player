import { afterEach, describe, expect, it, vi } from 'vitest';

// test/unit/services/kugouProviderAdapter.test.ts
// Covers Kugou search normalization, free-tier audio, and LRC lyrics decoding.

const adapterUrl = new URL(
    '../../../scripts/music-provider-adapters/kugou-provider-adapter.mjs',
    import.meta.url,
).href;

const loadAdapter = async () => import(`${adapterUrl}?t=${Date.now()}`);

describe('kugou-provider-adapter', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('normalizes search hits and encodes hash:albumId', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            data: {
                total: 1,
                lists: [{
                    FileHash: 'ABC123',
                    AlbumID: '966846',
                    SongName: '<em>晴天</em>',
                    SingerName: '周杰伦',
                    AlbumName: '叶惠美',
                    Duration: 269,
                    Image: 'http://imge.kugou.com/stdmusic/{size}/cover.jpg',
                }],
            },
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }));

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '晴天', limit: 20, offset: 0 });

        expect(result.songs).toHaveLength(1);
        expect(result.songs[0]).toMatchObject({
            id: 'ABC123:966846',
            title: '晴天',
            artists: ['周杰伦'],
            album: '叶惠美',
            durationMs: 269000,
            coverUrl: 'https://imge.kugou.com/stdmusic/240/cover.jpg',
            source: 'kugou',
        });
        expect(result.total).toBe(1);
    });

    it('returns audio url for free-tier playInfo responses', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            url: 'http://sharefs.kugou.com/demo.mp3',
            bitRate: 128,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }));

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.audio({
            id: 'HASH1:1',
            song: { providerSongId: 'HASH1:1' },
        });

        expect(result.audioUrl).toBe('https://sharefs.kugou.com/demo.mp3');
        expect(result.bitrate).toBe(128);
    });

    it('returns unavailable when playInfo has empty url (VIP / blocked)', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            url: '',
            errcode: 0,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        }));

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.audio({ id: 'VIPHASH' });
        expect(result.audioUrl).toBeNull();
    });

    it('decodes base64 LRC lyrics from krcs download', async () => {
        const lrc = '[00:00.00]hello\n[00:01.00]world';
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('lyrics.kugou.com/search')) {
                return new Response(JSON.stringify({
                    status: 200,
                    candidates: [{ id: '1', accesskey: 'key' }],
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            if (url.includes('lyrics.kugou.com/download')) {
                return new Response(JSON.stringify({
                    content: Buffer.from(lrc, 'utf8').toString('base64'),
                    fmt: 'lrc',
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return new Response('{}', { status: 404 });
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.lyrics({
            id: 'HASH1',
            title: '小苹果',
            artist: '儿歌',
            song: { durationMs: 186000 },
        });

        expect(result.lyricsText).toContain('[00:00.00]hello');
    });
});

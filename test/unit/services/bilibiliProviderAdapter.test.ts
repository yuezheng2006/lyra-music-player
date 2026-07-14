import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetBilibiliWbiCache } from '../../../scripts/music-provider-adapters/bilibili-wbi.mjs';

// test/unit/services/bilibiliProviderAdapter.test.ts
// Covers Bilibili UP / video search → cid resolve → DASH audio / durl fallback.

const adapterUrl = new URL(
    '../../../scripts/music-provider-adapters/bilibili-provider-adapter.mjs',
    import.meta.url,
).href;

const loadAdapter = async () => import(`${adapterUrl}?t=${Date.now()}`);

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
});

describe('bilibili-provider-adapter', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        resetBilibiliWbiCache();
    });

    it('parses up:/@/mid: account search intents', async () => {
        const adapter = await loadAdapter();
        expect(adapter.parseBilibiliSearchIntent('up:天花板上吊着猫')).toEqual({
            mode: 'user',
            query: '天花板上吊着猫',
        });
        expect(adapter.parseBilibiliSearchIntent('@溪谷之风')).toEqual({
            mode: 'user',
            query: '溪谷之风',
        });
        expect(adapter.parseBilibiliSearchIntent('mid:1091')).toEqual({
            mode: 'user',
            query: '1091',
            mid: 1091,
        });
        expect(adapter.parseBilibiliSearchIntent('晴天')).toEqual({
            mode: 'auto',
            query: '晴天',
        });
    });

    it('uses space videos when query exactly matches an UP name', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/finger/spi')) {
                return jsonResponse({ code: 0, data: { b_3: 'buvid3-test', b_4: 'buvid4-test' } });
            }
            if (url.includes('search_type=bili_user')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        result: [
                            { mid: 1091, uname: '天花板上吊着猫' },
                            { mid: 2, uname: '其他UP' },
                        ],
                    },
                });
            }
            if (url.includes('/x/web-interface/nav')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        wbi_img: {
                            img_url: 'https://i0.hdslb.com/bfs/wbi/img.png',
                            sub_url: 'https://i0.hdslb.com/bfs/wbi/sub.png',
                        },
                    },
                });
            }
            if (url.includes('/x/space/wbi/arc/search')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        list: {
                            vlist: [{
                                bvid: 'BV1up1111111',
                                title: '[SUNO] 明明就',
                                author: '天花板上吊着猫',
                                pic: '//i0.hdslb.com/bfs/cover-up.jpg',
                                length: '04:16',
                            }],
                        },
                        page: { count: 1 },
                    },
                });
            }
            if (url.includes('/x/web-interface/view')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        title: '[SUNO] 明明就',
                        pic: 'https://i0.hdslb.com/bfs/cover-up.jpg',
                        owner: { name: '天花板上吊着猫' },
                        pages: [{ cid: 555, duration: 256 }],
                    },
                });
            }
            return jsonResponse({}, 404);
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '天花板上吊着猫', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('user');
        expect(result.uploader).toEqual({ mid: 1091, uname: '天花板上吊着猫' });
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0]).toMatchObject({
            id: 'BV1up1111111|555',
            title: '[SUNO] 明明就',
            artists: ['天花板上吊着猫'],
            durationMs: 256000,
            source: 'bilibili',
        });
        expect(fetchMock.mock.calls.some(([input]) => String(input).includes('search_type=video'))).toBe(false);
    });

    it('falls back to mid-filtered videos when space API is blocked', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/finger/spi')) {
                return jsonResponse({ code: 0, data: { b_3: 'buvid3-test' } });
            }
            if (url.includes('search_type=bili_user')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        result: [{
                            mid: 1091,
                            uname: '天花板上吊着猫',
                            videos: 20,
                            res: [{ bvid: 'BV1recent0001', title: 'recent only', author: '天花板上吊着猫', duration: '1:00' }],
                        }],
                    },
                });
            }
            if (url.includes('/x/web-interface/nav')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        wbi_img: {
                            img_url: 'https://i0.hdslb.com/bfs/wbi/img.png',
                            sub_url: 'https://i0.hdslb.com/bfs/wbi/sub.png',
                        },
                    },
                });
            }
            if (url.includes('/x/space/wbi/arc/search')) {
                return jsonResponse({ code: -352, message: '风控校验失败' });
            }
            if (url.includes('search_type=video')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        numResults: 2,
                        result: [
                            {
                                bvid: 'BV1upAAAAAAA',
                                title: '本UP投稿',
                                author: '天花板上吊着猫',
                                mid: 1091,
                                pic: '//i0.hdslb.com/bfs/a.jpg',
                                duration: 120,
                            },
                            {
                                bvid: 'BV1other0000',
                                title: '天花板装修',
                                author: '路人',
                                mid: 999,
                                pic: '//i0.hdslb.com/bfs/b.jpg',
                                duration: 60,
                            },
                        ],
                    },
                });
            }
            if (url.includes('/x/web-interface/view')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        pages: [{ cid: 1, duration: 120 }],
                        owner: { name: '天花板上吊着猫' },
                        pic: 'https://i0.hdslb.com/bfs/a.jpg',
                    },
                });
            }
            return jsonResponse({}, 404);
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '天花板上吊着猫', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('user');
        expect(result.songs.map((song: { bvid?: string }) => song.bvid)).toEqual(['BV1upAAAAAAA']);
        expect(result.songs[0].artists).toEqual(['天花板上吊着猫']);
    });

    it('falls back to video keyword search when no exact UP match', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/finger/spi')) {
                return jsonResponse({ code: 0, data: { b_3: 'buvid3-test' } });
            }
            if (url.includes('search_type=bili_user')) {
                return jsonResponse({
                    code: 0,
                    data: { result: [{ mid: 99, uname: '晴天乐队' }] },
                });
            }
            if (url.includes('search_type=video')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        numResults: 1,
                        result: [{
                            bvid: 'BV1xx411c7mD',
                            title: '<em class="keyword">晴天</em> 现场',
                            author: '测试UP',
                            pic: '//i0.hdslb.com/bfs/cover.jpg',
                        }],
                    },
                });
            }
            if (url.includes('/x/web-interface/view')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        title: '晴天 现场',
                        pic: 'https://i0.hdslb.com/bfs/cover.jpg',
                        owner: { name: '测试UP' },
                        pages: [{ cid: 12345, duration: 200 }],
                    },
                });
            }
            return jsonResponse({}, 404);
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.search({ query: '晴天', limit: 10, offset: 0 });

        expect(result.searchMode).toBe('video');
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0]).toMatchObject({
            id: 'BV1xx411c7mD|12345',
            title: '晴天 现场',
            artists: ['测试UP'],
            coverUrl: 'https://i0.hdslb.com/bfs/cover.jpg',
            durationMs: 200000,
            source: 'bilibili',
        });
    });

    it('returns dash audio and video urls together when both exist', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/finger/spi')) {
                return jsonResponse({ code: 0, data: { b_3: 'buvid3-test' } });
            }
            if (url.includes('fnval=16')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        dash: {
                            audio: [
                                { id: 30216, bandwidth: 48000, baseUrl: 'https://upos.bilivideo.com/a.m4s' },
                                { id: 30232, bandwidth: 128000, baseUrl: 'https://upos.bilivideo.com/b.m4s' },
                            ],
                            video: [
                                { id: 16, bandwidth: 300000, baseUrl: 'https://upos.bilivideo.com/v360.m4s', codecs: 'avc1' },
                                { id: 32, bandwidth: 500000, baseUrl: 'https://upos.bilivideo.com/v480.m4s', codecs: 'avc1' },
                                { id: 64, bandwidth: 1200000, baseUrl: 'https://upos.bilivideo.com/v720.m4s', codecs: 'avc1' },
                            ],
                        },
                    },
                });
            }
            return jsonResponse({}, 404);
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.audio({
            id: 'BV1xx411c7mD|12345',
            song: { providerSongId: 'BV1xx411c7mD|12345' },
        });

        expect(result.audioUrl).toBe('https://upos.bilivideo.com/b.m4s');
        // Prefer 360p AVC over 720p to keep dual audio+video decode light.
        expect(result.videoUrl).toBe('https://upos.bilivideo.com/v360.m4s');
    });

    it('falls back to progressive audio only (no second muxed decoder)', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes('/finger/spi')) {
                return jsonResponse({ code: 0, data: { b_3: 'buvid3-test' } });
            }
            if (url.includes('fnval=16') || url.includes('fnval=80')) {
                return jsonResponse({ code: 0, data: {} });
            }
            if (url.includes('fnval=1') || url.includes('fnval=0')) {
                return jsonResponse({
                    code: 0,
                    data: {
                        durl: [{ url: 'http://upos.bilivideo.com/clip.mp4' }],
                    },
                });
            }
            return jsonResponse({}, 404);
        });

        vi.stubGlobal('fetch', fetchMock);

        const adapter = await loadAdapter();
        const result = await adapter.audio({ id: 'BV1xx411c7mD|99' });
        expect(result.audioUrl).toBe('https://upos.bilivideo.com/clip.mp4');
        expect(result.videoUrl).toBeNull();
    });

    it('returns null lyrics', async () => {
        const adapter = await loadAdapter();
        const result = await adapter.lyrics();
        expect(result.lyrics).toBeNull();
    });
});

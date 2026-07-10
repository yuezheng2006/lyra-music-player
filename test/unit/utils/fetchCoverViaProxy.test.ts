import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCoverViaProxy } from '@/utils/fetchCoverViaProxy';

// test/unit/utils/fetchCoverViaProxy.test.ts

describe('fetchCoverViaProxy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses Electron IPC and decodes base64 image bodies', async () => {
    const fetchLyricProxy = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'image/jpeg' },
      bodyText: '',
      bodyBase64: btoa('fake-jpeg'),
      bodyEncoding: 'base64' as const,
    }));

    vi.stubGlobal('window', {
      electron: { fetchLyricProxy },
    });

    const response = await fetchCoverViaProxy('https://p1.music.126.net/cover.jpg');
    expect(fetchLyricProxy).toHaveBeenCalledWith(
      'https://p1.music.126.net/cover.jpg',
      expect.objectContaining({
        headers: expect.objectContaining({
          Referer: 'https://music.163.com/',
        }),
      }),
    );
    expect(response.ok).toBe(true);
    expect(await response.text()).toBe('fake-jpeg');
  });

  it('falls back to /api/lyric-proxy in the browser', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', fetchMock);

    await fetchCoverViaProxy('https://y.gtimg.cn/music/photo_new/T002.jpg');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/lyric-proxy?url=https%3A%2F%2Fy.gtimg.cn%2Fmusic%2Fphoto_new%2FT002.jpg',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Proxy-Referer': 'https://y.qq.com/',
        }),
      }),
    );
  });
});

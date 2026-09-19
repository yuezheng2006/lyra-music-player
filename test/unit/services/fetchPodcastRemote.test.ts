import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPodcastRemoteText } from '@/services/podcast/fetchPodcastRemote';

// test/unit/services/fetchPodcastRemote.test.ts

describe('fetchPodcastRemoteText', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('uses Electron podcast IPC in the desktop shell', async () => {
        const fetchPodcastProxy = vi.fn(async () => ({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            bodyText: '{"ok":true}',
            bodyBase64: '',
            bodyEncoding: 'text' as const,
        }));
        vi.stubGlobal('window', { electron: { fetchPodcastProxy } });
        await expect(fetchPodcastRemoteText('https://itunes.apple.com/search?term=a')).resolves.toBe('{"ok":true}');
        expect(fetchPodcastProxy).toHaveBeenCalledWith('https://itunes.apple.com/search?term=a');
    });

    it('falls back to /api/podcast-proxy in the browser', async () => {
        const fetchMock = vi.fn(async () => new Response('<rss/>', { status: 200 }));
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', fetchMock);
        await expect(fetchPodcastRemoteText('https://feeds.example.com/show.xml')).resolves.toBe('<rss/>');
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/podcast-proxy?url=https%3A%2F%2Ffeeds.example.com%2Fshow.xml',
            expect.objectContaining({ credentials: 'omit' }),
        );
    });
});

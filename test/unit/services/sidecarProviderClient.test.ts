import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    requestSidecarAudioUrl,
    requestSidecarSearch,
    resetSidecarProviderClientCacheForTests,
} from '@/services/musicProviders/sidecarProviderClient';

// test/unit/services/sidecarProviderClient.test.ts
// Covers 4xx unavailable vs 5xx transport failure for QQ audio lookup.

vi.mock('@/services/musicProviders/qqMusicAuth', () => ({
    getQQMusicAuth: () => ({
        cookieHeader: 'uin=123; qm_keyst=key',
        guid: '10000',
        isLoggedIn: true,
        musicKey: 'key',
        uin: '123',
    }),
}));

describe('requestSidecarAudioUrl', () => {
    const song = {
        id: 1,
        name: 'Song',
        artists: [],
        album: { id: 0, name: '' },
        duration: 1000,
        qqMid: 'song-mid',
        musicProvider: 'qq' as const,
        providerSongId: 'song-mid',
    };

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.stubEnv('VITE_MUSIC_PROVIDER_API_BASE', 'http://127.0.0.1:3002');
        resetSidecarProviderClientCacheForTests();
    });

    afterEach(() => {
        resetSidecarProviderClientCacheForTests();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('returns unavailable for 404 without throwing', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({ error: 'Audio URL unavailable' }),
        } as Response);

        await expect(requestSidecarAudioUrl('qq', song, { quality: 'exhigh' }))
            .resolves.toEqual({ kind: 'unavailable' });
    });

    it('throws on 5xx so callers can fall back to local providers', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: 'adapter missing' }),
        } as Response);

        await expect(requestSidecarAudioUrl('qq', song, { quality: 'hires' }))
            .rejects.toThrow(/500/);
    });

    it('returns ok when sidecar provides an audio URL', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ audioUrl: 'https://example.com/a.mp3' }),
        } as Response);

        await expect(requestSidecarAudioUrl('qq', song, { quality: 'standard' }))
            .resolves.toEqual({ kind: 'ok', audioUrl: 'https://example.com/a.mp3' });
    });

    it('forceRefresh bypasses negative cache and issues a new sidecar lookup', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ error: 'Audio URL unavailable' }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ audioUrl: 'https://example.com/fresh.mp3' }),
            } as Response);

        await expect(requestSidecarAudioUrl('qq', song, { quality: 'standard' }))
            .resolves.toEqual({ kind: 'unavailable' });

        await expect(requestSidecarAudioUrl('qq', song, { quality: 'standard' }))
            .resolves.toEqual({ kind: 'unavailable' });

        await expect(requestSidecarAudioUrl('qq', song, { quality: 'standard', forceRefresh: true }))
            .resolves.toEqual({ kind: 'ok', audioUrl: 'https://example.com/fresh.mp3' });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('resolves the Electron sidecar port once across searches', async () => {
        vi.unstubAllEnvs();
        const getMusicProviderPort = vi.fn().mockResolvedValue(43123);
        vi.stubGlobal('window', { electron: { getMusicProviderPort } });
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ songs: [], total: 0, hasMore: false }),
        } as Response);

        await requestSidecarSearch('qishui', '大头针', { limit: 30, offset: 0 });
        await requestSidecarSearch('qishui', '孤勇者', { limit: 30, offset: 0 });

        expect(getMusicProviderPort).toHaveBeenCalledTimes(1);
    });

    it('forwards an abort signal to sidecar search fetch', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ songs: [], total: 0, hasMore: false }),
        } as Response);
        const controller = new AbortController();

        await requestSidecarSearch('qishui', '大头针', {
            limit: 30,
            offset: 0,
            signal: controller.signal,
        });

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ signal: controller.signal }),
        );
    });

    it('uses a short search retry budget for sidecar search', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const source = fs.readFileSync(
            path.resolve(
                path.dirname(fileURLToPath(import.meta.url)),
                '../../../src/services/musicProviders/sidecarProviderClient.ts',
            ),
            'utf8',
        );
        expect(source).toContain('maxAttempts: 2');
        expect(source).toContain('backoffMs: [200]');
    });
});

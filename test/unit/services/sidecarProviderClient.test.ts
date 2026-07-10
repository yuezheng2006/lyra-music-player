import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestSidecarAudioUrl } from '@/services/musicProviders/sidecarProviderClient';

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
    });

    afterEach(() => {
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
            .rejects.toThrow(/sidecar audio failed: 500/);
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
});

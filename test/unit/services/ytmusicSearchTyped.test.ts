import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// test/unit/services/ytmusicSearchTyped.test.ts

describe('ytmusic typed search', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('passes type song for track search and playlist for playlist search', async () => {
        const ytmusicSearch = vi.fn(async (payload: { type?: string }) => {
            if (payload.type === 'playlist') {
                return {
                    ok: true,
                    tracks: [],
                    playlists: [{ playlistId: 'PL1', title: 'Mix', coverUrl: null }],
                };
            }
            return {
                ok: true,
                tracks: [{ videoId: 'v1', title: 'Song', artist: 'A', durationMs: 1000 }],
                playlists: [],
            };
        });
        vi.stubGlobal('window', {
            electron: {
                ytmusicSearch,
                ytmusicResolveStream: vi.fn(),
            },
        });

        const { searchYtmusicTracks, searchYtmusicPlaylists } = await import('@/services/ytmusicService');
        const tracks = await searchYtmusicTracks('jay', 10);
        const playlists = await searchYtmusicPlaylists('jay', 10);

        expect(tracks).toHaveLength(1);
        expect(playlists).toHaveLength(1);
        expect(ytmusicSearch).toHaveBeenCalledWith(
            expect.objectContaining({ query: 'jay', limit: 10, type: 'song' }),
        );
        expect(ytmusicSearch).toHaveBeenCalledWith(
            expect.objectContaining({ query: 'jay', limit: 10, type: 'playlist' }),
        );
    });
});

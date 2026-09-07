import { describe, expect, it } from 'vitest';
import type { SongResult } from '../../../src/types';
import { resolveAddToPlaylistAvailability, resolveAddToPlaylistSongKind } from '../../../src/utils/addToPlaylistAvailability';

// test/unit/addToPlaylist/addToPlaylistAvailability.test.ts

const song = (overrides: Partial<SongResult> & Record<string, unknown> = {}): SongResult => ({
    id: 1,
    name: 'Track',
    ...overrides,
} as SongResult);

describe('resolveAddToPlaylistSongKind', () => {
    it('treats local and navidrome songs as addable kinds', () => {
        expect(resolveAddToPlaylistSongKind(song({ isLocal: true }))).toBe('local');
        expect(resolveAddToPlaylistSongKind(song({ isNavidrome: true }))).toBe('navidrome');
        expect(resolveAddToPlaylistSongKind(song())).toBe('netease');
    });

    it('rejects stage and ytm songs', () => {
        expect(resolveAddToPlaylistSongKind(song({ isStage: true }))).toBe('none');
        expect(resolveAddToPlaylistSongKind(song({ isYtm: true }))).toBe('none');
        expect(resolveAddToPlaylistSongKind(song(), true)).toBe('none');
        expect(resolveAddToPlaylistSongKind(null)).toBe('none');
    });
});

describe('resolveAddToPlaylistAvailability', () => {
    it('lets local and navidrome create a playlist when the list is empty', () => {
        expect(resolveAddToPlaylistAvailability({
            song: song({ isLocal: true }),
            neteasePlaylistCount: 0,
        })).toEqual({ isApplicable: true, canAdd: true, disabledReason: undefined });

        expect(resolveAddToPlaylistAvailability({
            song: song({ isNavidrome: true }),
            neteasePlaylistCount: 0,
        }).canAdd).toBe(true);
    });

    it('blocks netease-shaped songs when there is no playlist to pick', () => {
        expect(resolveAddToPlaylistAvailability({
            song: song(),
            neteasePlaylistCount: 0,
            noPlaylistsReason: 'none yet',
        })).toEqual({
            isApplicable: true,
            canAdd: false,
            disabledReason: 'none yet',
        });

        expect(resolveAddToPlaylistAvailability({
            song: song(),
            neteasePlaylistCount: 2,
        }).canAdd).toBe(true);
    });
});

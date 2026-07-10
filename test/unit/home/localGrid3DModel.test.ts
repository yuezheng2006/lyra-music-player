import { describe, expect, it } from 'vitest';
import { buildLocalGrid3DGroups } from '@/components/app/home/localGrid3DModel';
import { createLocalAllSongsCover } from '@/utils/coverPlaceholders';
import type { LocalSong } from '@/types';

// test/unit/home/localGrid3DModel.test.ts
// Ensures the virtual All Songs group keeps a dedicated cover.

const t = ((key: string) => {
    const labels: Record<string, string> = {
        'localMusic.allSongs': 'All Songs',
        'localMusic.folder': 'Local',
        'localMusic.unknownAlbum': 'Unknown Album',
        'localMusic.unknownArtist': 'Unknown Artist',
        'localMusic.artists': 'Artists',
        'localMusic.favoritePlaylist': 'Favorites',
        'home.playlists': 'Playlists',
    };
    return labels[key] || key;
}) as any;

const makeSong = (overrides: Partial<LocalSong> = {}): LocalSong => ({
    id: 'song-1',
    fileName: 'track.mp3',
    filePath: 'datouzhen/track.mp3',
    duration: 120000,
    fileSize: 1024,
    mimeType: 'audio/mpeg',
    folderName: 'datouzhen',
    addedAt: 100,
    title: 'Track',
    artist: 'Artist',
    album: 'Album',
    matchedCoverUrl: 'https://img.test/shared-cover.jpg',
    ...overrides,
});

describe('buildLocalGrid3DGroups', () => {
    it('uses a dedicated cover for All Songs instead of track art', () => {
        const song = makeSong();
        const { folders } = buildLocalGrid3DGroups([song], [], t);

        const allSongs = folders.find(group => group.id === 'folder-__all-songs__');
        const folder = folders.find(group => group.id === 'folder-datouzhen');

        expect(allSongs?.coverUrl).toBe(createLocalAllSongsCover());
        expect(folder?.coverUrl).toBe('https://img.test/shared-cover.jpg');
        expect(allSongs?.coverUrl).not.toBe(folder?.coverUrl);
    });
});

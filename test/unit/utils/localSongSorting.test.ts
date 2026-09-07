import { describe, expect, it } from 'vitest';
import type { LocalSong } from '@/types';
import { formatLocalAlbumTrackLabel, sortLocalAlbumSongs, sortLocalFolderSongs } from '@/utils/localSongSorting';

// test/unit/utils/localSongSorting.test.ts
// Local folder and album ordering without coupling tests to React views.

const createSong = (fileName: string, patch: Partial<LocalSong> = {}): LocalSong => ({
    id: fileName,
    fileName,
    filePath: `Music/${fileName}`,
    title: fileName.replace(/\.[^.]+$/, ''),
    duration: 0,
    fileSize: 0,
    mimeType: 'audio/mpeg',
    addedAt: 0,
    ...patch,
});

const createAlbumSong = (fileName: string, albumName: string, patch: Partial<LocalSong> = {}): LocalSong => (
    createSong(fileName, { album: albumName, ...patch })
);

describe('localSongSorting', () => {
    it('sorts folder songs by file name using natural numeric order', () => {
        const songs = [
            createSong('Track 10.mp3'),
            createSong('Track 2.mp3'),
            createSong('Track 1.mp3'),
        ];

        expect(sortLocalFolderSongs(songs).map(song => song.fileName)).toEqual([
            'Track 1.mp3',
            'Track 2.mp3',
            'Track 10.mp3',
        ]);
        expect(songs[0].fileName).toBe('Track 10.mp3');
    });

    it('sorts folder songs by modified date in either direction', () => {
        const songs = [
            createSong('older.mp3', { fileLastModified: 100 }),
            createSong('newer.mp3', { fileLastModified: 300 }),
            createSong('middle.mp3', { fileLastModified: 200 }),
        ];

        expect(sortLocalFolderSongs(songs, 'fileLastModified').map(song => song.fileName)).toEqual([
            'older.mp3',
            'middle.mp3',
            'newer.mp3',
        ]);
        expect(sortLocalFolderSongs(songs, 'fileLastModified', 'desc').map(song => song.fileName)).toEqual([
            'newer.mp3',
            'middle.mp3',
            'older.mp3',
        ]);
    });

    it('sorts folder songs by album track number, discs first', () => {
        const songs = [
            createSong('c.mp3', { discNumber: 2, trackNumber: 1 }),
            createSong('b.mp3', { discNumber: 1, trackNumber: 10 }),
            createSong('a.mp3', { discNumber: 1, trackNumber: 2 }),
        ];

        expect(sortLocalFolderSongs(songs, 'albumTrack').map(song => song.fileName)).toEqual([
            'a.mp3',
            'b.mp3',
            'c.mp3',
        ]);
    });

    it('keeps unnumbered tracks last in both directions', () => {
        const songs = [
            createSong('no-number-b.mp3'),
            createSong('two.mp3', { trackNumber: 2 }),
            createSong('no-number-a.mp3'),
            createSong('one.mp3', { trackNumber: 1 }),
        ];

        expect(sortLocalFolderSongs(songs, 'albumTrack').map(song => song.fileName)).toEqual([
            'one.mp3',
            'two.mp3',
            'no-number-a.mp3',
            'no-number-b.mp3',
        ]);
        expect(sortLocalFolderSongs(songs, 'albumTrack', 'desc').map(song => song.fileName)).toEqual([
            'two.mp3',
            'one.mp3',
            'no-number-b.mp3',
            'no-number-a.mp3',
        ]);
    });

    it('groups by album before track number', () => {
        const songs = [
            createAlbumSong('b1.mp3', 'Beta', { trackNumber: 1 }),
            createAlbumSong('a2.mp3', 'Alpha', { trackNumber: 2 }),
            createAlbumSong('b2.mp3', 'Beta', { trackNumber: 2 }),
            createAlbumSong('a1.mp3', 'Alpha', { trackNumber: 1 }),
        ];

        expect(sortLocalFolderSongs(songs, 'albumTrack').map(song => song.fileName)).toEqual([
            'a1.mp3',
            'a2.mp3',
            'b1.mp3',
            'b2.mp3',
        ]);
        expect(sortLocalFolderSongs(songs, 'albumTrack', 'desc').map(song => song.fileName)).toEqual([
            'b2.mp3',
            'b1.mp3',
            'a2.mp3',
            'a1.mp3',
        ]);
    });

    it('keeps same-named albums apart when the caller resolves album entities', () => {
        const songs = [
            createAlbumSong('b1.mp3', 'Greatest Hits', { id: 'b1', trackNumber: 1 }),
            createAlbumSong('a2.mp3', 'Greatest Hits', { id: 'a2', trackNumber: 2 }),
            createAlbumSong('a1.mp3', 'Greatest Hits', { id: 'a1', trackNumber: 1 }),
            createAlbumSong('b2.mp3', 'Greatest Hits', { id: 'b2', trackNumber: 2 }),
        ];
        const entityIdBySongId: Record<string, string> = {
            a1: 'album-a', a2: 'album-a', b1: 'album-b', b2: 'album-b',
        };
        const resolveAlbumGroup = (song: LocalSong) => ({
            entityId: entityIdBySongId[song.id],
            name: 'Greatest Hits',
        });

        expect(sortLocalFolderSongs(songs, 'albumTrack', 'asc', resolveAlbumGroup).map(song => song.fileName)).toEqual([
            'a1.mp3',
            'a2.mp3',
            'b1.mp3',
            'b2.mp3',
        ]);
    });

    it('keeps numbered tracks without an album name after the named albums', () => {
        const songs = [
            createSong('loose.mp3', { trackNumber: 1 }),
            createSong('untagged.mp3'),
            createAlbumSong('album.mp3', 'Alpha', { trackNumber: 9 }),
        ];

        expect(sortLocalFolderSongs(songs, 'albumTrack').map(song => song.fileName)).toEqual([
            'album.mp3',
            'loose.mp3',
            'untagged.mp3',
        ]);
        expect(sortLocalFolderSongs(songs, 'albumTrack', 'desc').map(song => song.fileName)).toEqual([
            'album.mp3',
            'loose.mp3',
            'untagged.mp3',
        ]);
    });

    it('falls back to the file name when two tracks claim the same number', () => {
        const songs = [
            createSong('b.mp3', { trackNumber: 1 }),
            createSong('a.mp3', { trackNumber: 1 }),
        ];

        expect(sortLocalFolderSongs(songs, 'albumTrack').map(song => song.fileName)).toEqual([
            'a.mp3',
            'b.mp3',
        ]);
    });

    it('sorts album songs by disc and track number before title', () => {
        const songs = [
            createSong('z.mp3', { title: 'Finale', discNumber: 2, trackNumber: 1 }),
            createSong('b.mp3', { title: 'Second', discNumber: 1, trackNumber: 2 }),
            createSong('a.mp3', { title: 'First', discNumber: 1, trackNumber: 1 }),
        ];

        expect(sortLocalAlbumSongs(songs).map(song => song.title)).toEqual([
            'First',
            'Second',
            'Finale',
        ]);
    });

    it('places numbered tracks first and naturally sorts unnumbered tracks by title', () => {
        const songs = [
            createSong('bonus-10.mp3', { title: 'Bonus 10' }),
            createSong('main.mp3', { title: 'Main', trackNumber: 1 }),
            createSong('bonus-2.mp3', { title: 'Bonus 2' }),
        ];

        expect(sortLocalAlbumSongs(songs).map(song => song.title)).toEqual([
            'Main',
            'Bonus 2',
            'Bonus 10',
        ]);
    });
});

describe('formatLocalAlbumTrackLabel', () => {
    it('names the track number on its own for a single-disc album', () => {
        expect(formatLocalAlbumTrackLabel(createSong('a.mp3', { trackNumber: 7 }))).toBe('7');
        expect(formatLocalAlbumTrackLabel(createSong('a.mp3', { trackNumber: 7, discNumber: 1 }))).toBe('7');
    });

    it('names the disc once there is more than one', () => {
        expect(formatLocalAlbumTrackLabel(createSong('a.mp3', { trackNumber: 3, discNumber: 2 }))).toBe('2-3');
    });

    it('is null when the file carries no number', () => {
        expect(formatLocalAlbumTrackLabel(createSong('a.mp3'))).toBeNull();
        expect(formatLocalAlbumTrackLabel(createSong('a.mp3', { discNumber: 2 }))).toBeNull();
    });
});

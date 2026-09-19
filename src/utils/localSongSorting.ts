import type { LocalSong } from '../types';

// src/utils/localSongSorting.ts
// Shared ordering for local-library views and their playback queues.

export type LocalSongFolderSortField = 'fileName' | 'fileLastModified' | 'albumTrack';
export type LocalSongFolderSortDirection = 'asc' | 'desc';

const naturalCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

const compareText = (left: string, right: string): number => naturalCollator.compare(left, right);

const getSongName = (song: LocalSong): string => song.title?.trim() || song.fileName;

export const compareLocalSongsByFileName = (left: LocalSong, right: LocalSong): number => (
    compareText(left.fileName, right.fileName)
    || compareText(left.filePath, right.filePath)
);

const compareLocalSongsByLastModified = (left: LocalSong, right: LocalSong): number => (
    (left.fileLastModified ?? 0) - (right.fileLastModified ?? 0)
    || compareLocalSongsByFileName(left, right)
);

const compareTrackPosition = (left: LocalSong, right: LocalSong): number => (
    (left.discNumber ?? 1) - (right.discNumber ?? 1)
    || (left.trackNumber ?? 0) - (right.trackNumber ?? 0)
);

export type LocalAlbumGroupKey = {
    entityId?: string;
    name: string;
};

export type LocalAlbumGroupResolver = (song: LocalSong) => LocalAlbumGroupKey | undefined;

const getImportedAlbumName = (song: LocalSong): string => (
    song.matchedAlbumName || song.album || song.embeddedAlbum || ''
);

const resolveImportedAlbumGroup: LocalAlbumGroupResolver = song => ({
    entityId: song.matchedAlbumId != null ? String(song.matchedAlbumId) : undefined,
    name: getImportedAlbumName(song),
});

const compareAlbumGroup = (
    leftGroup: LocalAlbumGroupKey | undefined,
    rightGroup: LocalAlbumGroupKey | undefined,
): number => (
    compareText(leftGroup?.name || '', rightGroup?.name || '')
    || compareText(leftGroup?.entityId || '', rightGroup?.entityId || '')
);

const compareLocalSongsByAlbumTrack = (
    left: LocalSong,
    right: LocalSong,
    direction: LocalSongFolderSortDirection,
    resolveAlbumGroup: LocalAlbumGroupResolver,
): number => {
    const leftNumbered = typeof left.trackNumber === 'number';
    const rightNumbered = typeof right.trackNumber === 'number';
    if (leftNumbered !== rightNumbered) {
        return leftNumbered ? -1 : 1;
    }

    if (!leftNumbered) {
        const unnumbered = compareLocalSongsByFileName(left, right);
        return direction === 'desc' ? -unnumbered : unnumbered;
    }

    const leftGroup = resolveAlbumGroup(left);
    const rightGroup = resolveAlbumGroup(right);
    if (Boolean(leftGroup?.name) !== Boolean(rightGroup?.name)) {
        return leftGroup?.name ? -1 : 1;
    }

    const result = compareAlbumGroup(leftGroup, rightGroup)
        || compareTrackPosition(left, right)
        || compareLocalSongsByFileName(left, right);

    return direction === 'desc' ? -result : result;
};

export const compareLocalFolderSongs = (
    left: LocalSong,
    right: LocalSong,
    field: LocalSongFolderSortField = 'fileName',
    direction: LocalSongFolderSortDirection = 'asc',
    resolveAlbumGroup: LocalAlbumGroupResolver = resolveImportedAlbumGroup,
): number => {
    if (field === 'albumTrack') {
        return compareLocalSongsByAlbumTrack(left, right, direction, resolveAlbumGroup);
    }

    const result = field === 'fileLastModified'
        ? compareLocalSongsByLastModified(left, right)
        : compareLocalSongsByFileName(left, right);

    return direction === 'desc' ? -result : result;
};

export const compareLocalAlbumSongs = (left: LocalSong, right: LocalSong): number => {
    const leftHasTrackNumber = typeof left.trackNumber === 'number';
    const rightHasTrackNumber = typeof right.trackNumber === 'number';

    if (leftHasTrackNumber !== rightHasTrackNumber) {
        return leftHasTrackNumber ? -1 : 1;
    }

    if (leftHasTrackNumber && rightHasTrackNumber) {
        const positionDifference = compareTrackPosition(left, right);
        if (positionDifference !== 0) {
            return positionDifference;
        }
    }

    return compareText(getSongName(left), getSongName(right))
        || compareLocalSongsByFileName(left, right);
};

export const sortLocalFolderSongs = (
    songs: LocalSong[],
    field: LocalSongFolderSortField = 'fileName',
    direction: LocalSongFolderSortDirection = 'asc',
    resolveAlbumGroup?: LocalAlbumGroupResolver,
): LocalSong[] => [...songs].sort((left, right) => (
    compareLocalFolderSongs(left, right, field, direction, resolveAlbumGroup)
));

export const sortLocalAlbumSongs = (songs: LocalSong[]): LocalSong[] => (
    [...songs].sort(compareLocalAlbumSongs)
);

/** Album-list label, or null when the file carries no track number. */
export const formatLocalAlbumTrackLabel = (song: LocalSong): string | null => {
    if (typeof song.trackNumber !== 'number') return null;
    const disc = song.discNumber;
    return typeof disc === 'number' && disc > 1
        ? `${disc}-${song.trackNumber}`
        : String(song.trackNumber);
};

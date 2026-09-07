import type { SongResult } from '../../types';

// src/utils/queue/queueSectionMath.ts
// Splits a play queue into now-playing and up-next rows for the queue panel.

export type QueueListRow =
    | { kind: 'header'; key: string; titleKey: string }
    | { kind: 'song'; key: string; song: SongResult; index: number };

export const buildQueueListRows = (
    queue: readonly SongResult[],
    currentSongId: number | null | undefined,
): QueueListRow[] => {
    if (queue.length === 0) return [];
    const currentIndex = currentSongId == null
        ? -1
        : queue.findIndex(song => song.id === currentSongId);
    const rows: QueueListRow[] = [];

    if (currentIndex > 0) {
        rows.push({ kind: 'header', key: 'header-played', titleKey: 'queue.played' });
        for (let index = 0; index < currentIndex; index += 1) {
            const song = queue[index];
            rows.push({
                kind: 'song',
                key: `song-${index}-${song.id}`,
                song,
                index,
            });
        }
    }

    if (currentIndex >= 0) {
        rows.push({ kind: 'header', key: 'header-now', titleKey: 'queue.nowPlaying' });
        rows.push({
            kind: 'song',
            key: `song-${currentIndex}-${queue[currentIndex].id}`,
            song: queue[currentIndex],
            index: currentIndex,
        });
    }

    const upcomingStart = currentIndex >= 0 ? currentIndex + 1 : 0;
    if (upcomingStart < queue.length) {
        rows.push({ kind: 'header', key: 'header-next', titleKey: 'queue.upNext' });
        for (let index = upcomingStart; index < queue.length; index += 1) {
            const song = queue[index];
            rows.push({
                kind: 'song',
                key: `song-${index}-${song.id}`,
                song,
                index,
            });
        }
    }

    return rows;
};

export const QUEUE_HEADER_ROW_HEIGHT = 28;
export const QUEUE_SONG_ROW_HEIGHT = 50;

export const getQueueRowHeight = (row: QueueListRow | undefined) => (
    !row || row.kind === 'header' ? QUEUE_HEADER_ROW_HEIGHT : QUEUE_SONG_ROW_HEIGHT
);

export const listUpcomingQueueSongs = (
    queue: readonly SongResult[],
    currentSongId: number | null | undefined,
    limit = 8,
) => {
    if (queue.length === 0) return [];
    const currentIndex = currentSongId == null
        ? -1
        : queue.findIndex(song => song.id === currentSongId);
    const start = currentIndex >= 0 ? currentIndex + 1 : 0;
    return queue.slice(start, start + limit);
};

import type { SongResult } from '../../types';
import type { QueueQueryAction } from './parseQueueQuery';
import type { QueueQueryMatch } from './evaluateQueueQuery';

// src/utils/queue/applyQueueQueryAction.ts
// Applies Folia-style queue DSL actions by original queue index.

export type ApplyQueueQueryActionResult = {
    nextQueue: SongResult[];
    changed: boolean;
    playSong: SongResult | null;
};

const uniqueSortedIndexes = (matches: readonly QueueQueryMatch[]): number[] => (
    [...new Set(matches.map(match => match.index))].sort((left, right) => left - right)
);

const queuesEqual = (left: readonly SongResult[], right: readonly SongResult[]): boolean => (
    left.length === right.length && left.every((song, index) => song === right[index])
);

export const applyQueueQueryAction = ({
    queue,
    currentSong,
    matches,
    action,
}: {
    queue: readonly SongResult[];
    currentSong: SongResult | null;
    matches: readonly QueueQueryMatch[];
    action: QueueQueryAction;
}): ApplyQueueQueryActionResult => {
    if (action === 'play') {
        return {
            nextQueue: [...queue],
            changed: false,
            playSong: matches[0]?.song ?? null,
        };
    }

    const currentIndex = currentSong
        ? queue.findIndex(song => song.id === currentSong.id)
        : -1;
    const matchedIndexes = uniqueSortedIndexes(matches);

    if (action === 'remove') {
        const removeSet = new Set(
            matchedIndexes.filter(index => index !== currentIndex),
        );
        const nextQueue = queue.filter((_, index) => !removeSet.has(index));
        return {
            nextQueue,
            changed: !queuesEqual(queue, nextQueue),
            playSong: null,
        };
    }

    const moveIndexes = matchedIndexes.filter(index => index !== currentIndex);
    const moving = moveIndexes
        .map(index => queue[index])
        .filter((song): song is SongResult => Boolean(song));
    const remaining = queue.filter((_, index) => !moveIndexes.includes(index));

    if (moving.length === 0) {
        return { nextQueue: [...queue], changed: false, playSong: null };
    }

    if (action === 'end') {
        const nextQueue = [...remaining, ...moving];
        return {
            nextQueue,
            changed: !queuesEqual(queue, nextQueue),
            playSong: null,
        };
    }

    const anchorIndex = currentSong
        ? remaining.findIndex(song => song.id === currentSong.id)
        : -1;
    const nextQueue = anchorIndex === -1
        ? [...moving, ...remaining]
        : [
            ...remaining.slice(0, anchorIndex + 1),
            ...moving,
            ...remaining.slice(anchorIndex + 1),
        ];

    return {
        nextQueue,
        changed: !queuesEqual(queue, nextQueue),
        playSong: null,
    };
};

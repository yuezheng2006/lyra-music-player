import { describe, expect, it } from 'vitest';
import { parseQueueQuery } from '../../../src/utils/queue/parseQueueQuery';
import { evaluateQueueQuery } from '../../../src/utils/queue/evaluateQueueQuery';
import { applyQueueQueryAction } from '../../../src/utils/queue/applyQueueQueryAction';
import type { SongResult } from '../../../src/types';

// test/unit/queue/parseQueueQuery.test.ts
// Folia-style queue DSL: #index, ranges, artist:/album: facets.

const song = (id: number, name: string, artist: string, album: string): SongResult => ({
    id,
    name,
    artists: [{ id, name: artist }],
    album: { id, name: album },
    duration: 180000,
    ar: [{ id, name: artist }],
    al: { id, name: album },
});

describe('parseQueueQuery', () => {
    it('parses #index', () => {
        expect(parseQueueQuery('#3')).toMatchObject({ index: 3, text: '', range: null });
    });

    it('parses inclusive ranges', () => {
        expect(parseQueueQuery('3-7')).toMatchObject({ range: { from: 3, to: 7 } });
        expect(parseQueueQuery('3..7 leftover')).toMatchObject({
            range: { from: 3, to: 7 },
            text: 'leftover',
        });
    });

    it('parses --remove/--next/--end actions', () => {
        expect(parseQueueQuery('3-7 --remove')).toMatchObject({
            range: { from: 3, to: 7 },
            action: 'remove',
            text: '',
        });
        expect(parseQueueQuery('artist:yoasobi --next')).toMatchObject({
            facetKind: 'artist',
            action: 'next',
        });
        expect(parseQueueQuery('#2 --end leftover')).toMatchObject({
            index: 2,
            action: 'end',
            text: 'leftover',
        });
        expect(parseQueueQuery('--rm 1-2')).toMatchObject({
            range: { from: 1, to: 2 },
            action: 'remove',
        });
    });

    it('parses artist and album facets', () => {
        expect(parseQueueQuery('artist:yoasobi')).toMatchObject({
            facetKind: 'artist',
            facetValue: 'yoasobi',
        });
        expect(parseQueueQuery('@artist:yoasobi')).toMatchObject({
            facetKind: 'artist',
            facetValue: 'yoasobi',
        });
        expect(parseQueueQuery('al:"The Album" night')).toMatchObject({
            facetKind: 'album',
            facetValue: 'The Album',
            text: 'night',
        });
    });
});

describe('evaluateQueueQuery', () => {
    const queue = [
        song(1, 'Idol', 'YOASOBI', 'Idol'),
        song(2, 'Night Dancer', 'imase', 'Night Dancer'),
        song(3, 'Tracing That Dream', 'YOASOBI', 'The Book 2'),
        song(4, 'Gunjo', 'YOASOBI', 'The Book'),
    ];

    it('matches a one-based #index', () => {
        const { matches } = evaluateQueueQuery(queue, '#2');
        expect(matches.map(item => item.song.name)).toEqual(['Night Dancer']);
    });

    it('matches a range', () => {
        const { matches } = evaluateQueueQuery(queue, '3-4');
        expect(matches.map(item => item.index).sort()).toEqual([2, 3]);
    });

    it('matches an artist facet plus leftover text', () => {
        const { matches } = evaluateQueueQuery(queue, 'artist:yoasobi dream');
        expect(matches.map(item => item.song.name)).toEqual(['Tracing That Dream']);
    });
});

describe('applyQueueQueryAction', () => {
    const queue = [
        song(1, 'Idol', 'YOASOBI', 'Idol'),
        song(2, 'Night Dancer', 'imase', 'Night Dancer'),
        song(3, 'Tracing That Dream', 'YOASOBI', 'The Book 2'),
        song(4, 'Gunjo', 'YOASOBI', 'The Book'),
    ];

    it('removes matched indexes but keeps the current track', () => {
        const { matches } = evaluateQueueQuery(queue, '1-3 --remove');
        const result = applyQueueQueryAction({
            queue,
            currentSong: queue[1],
            matches,
            action: 'remove',
        });
        expect(result.changed).toBe(true);
        expect(result.nextQueue.map(item => item.name)).toEqual(['Night Dancer', 'Gunjo']);
    });

    it('moves matches to play next after the current track', () => {
        const { matches } = evaluateQueueQuery(queue, '4 --next');
        const result = applyQueueQueryAction({
            queue,
            currentSong: queue[0],
            matches,
            action: 'next',
        });
        expect(result.nextQueue.map(item => item.name)).toEqual([
            'Idol',
            'Gunjo',
            'Night Dancer',
            'Tracing That Dream',
        ]);
    });

    it('moves matches to the end of the queue', () => {
        const { matches } = evaluateQueueQuery(queue, '1-2 --end');
        const result = applyQueueQueryAction({
            queue,
            currentSong: queue[2],
            matches,
            action: 'end',
        });
        expect(result.nextQueue.map(item => item.name)).toEqual([
            'Tracing That Dream',
            'Gunjo',
            'Idol',
            'Night Dancer',
        ]);
    });
});

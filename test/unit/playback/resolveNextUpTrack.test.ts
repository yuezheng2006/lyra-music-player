import { describe, expect, it } from 'vitest';
import { resolveNextUpTrack } from '@/components/app/overlays/now-playing-toast/resolveNextUpTrack';
import type { SongResult } from '@/types';

// test/unit/playback/resolveNextUpTrack.test.ts
// Next-up preview must follow handleNextTrack's index rules: a wrong successor is worse than none.

const song = (id: number, name: string): SongResult => ({
    id,
    name,
    artists: [],
    album: {} as SongResult['album'],
    duration: 1000,
} as SongResult);

const queue = [song(1, 'Alpha'), song(2, 'Bravo'), song(3, 'Charlie')];

const resolve = (overrides: Partial<Parameters<typeof resolveNextUpTrack>[0]> = {}) => (
    resolveNextUpTrack({
        playQueue: queue,
        song: queue[1],
        loopMode: 'off',
        isFmMode: false,
        isStageActive: false,
        ...overrides,
    })
);

describe('resolveNextUpTrack', () => {
    it('returns the following track in the middle of the queue', () => {
        expect(resolve()?.name).toBe('Charlie');
    });

    it('returns null at the tail when loop is off', () => {
        expect(resolve({ song: queue[2] })).toBeNull();
    });

    it('wraps to the queue head at the tail when loopMode is all', () => {
        expect(resolve({ song: queue[2], loopMode: 'all' })?.name).toBe('Alpha');
    });

    it('returns null for loopMode one', () => {
        expect(resolve({ loopMode: 'one' })).toBeNull();
    });

    it('returns null while the stage is active', () => {
        expect(resolve({ isStageActive: true })).toBeNull();
    });

    it('returns null without a base song or with an empty queue', () => {
        expect(resolve({ song: null })).toBeNull();
        expect(resolve({ playQueue: [] })).toBeNull();
    });

    it('returns null on the last FM track', () => {
        expect(resolve({ song: queue[2], isFmMode: true })).toBeNull();
    });

    it('previews the known successor on the penultimate FM track', () => {
        expect(resolve({ song: queue[1], isFmMode: true })?.name).toBe('Charlie');
    });

    it('does not offer the FM queue head as the successor of the last track', () => {
        expect(resolve({ song: queue[2], isFmMode: true, loopMode: 'all' })).toBeNull();
    });

    it('still previews further from the FM tail', () => {
        expect(resolve({ song: queue[0], isFmMode: true })?.name).toBe('Bravo');
    });

    it('only falls back to the queue head for an off-queue song when asked', () => {
        const outsider = song(99, 'Outsider');
        expect(resolve({ song: outsider })).toBeNull();
        expect(resolve({ song: outsider, fallbackToQueueHead: true })?.name).toBe('Alpha');
    });
});

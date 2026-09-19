import { describe, expect, it } from 'vitest';
import { shouldQueryNowPlayingRestProgress } from '@/utils/nowPlaying/nowPlayingRestProgressMath';

// test/unit/nowPlaying/nowPlayingRestProgressMath.test.ts

describe('nowPlayingRestProgressMath', () => {
    it('uses REST when no precise websocket progress has arrived', () => {
        expect(shouldQueryNowPlayingRestProgress({
            lastPreciseWsAtMs: 0,
            nowMs: 10_000,
            reason: 'poll',
        })).toBe(true);
    });

    it('skips REST while websocket progress is fresh', () => {
        expect(shouldQueryNowPlayingRestProgress({
            lastPreciseWsAtMs: 9_000,
            nowMs: 10_000,
            reason: 'poll',
        })).toBe(false);
        expect(shouldQueryNowPlayingRestProgress({
            lastPreciseWsAtMs: 9_000,
            nowMs: 10_000,
            reason: 'pause-boundary',
        })).toBe(false);
    });

    it('falls back to REST after websocket progress goes stale', () => {
        expect(shouldQueryNowPlayingRestProgress({
            lastPreciseWsAtMs: 1_000,
            nowMs: 10_000,
            reason: 'poll',
        })).toBe(true);
        expect(shouldQueryNowPlayingRestProgress({
            lastPreciseWsAtMs: 1_000,
            nowMs: 10_000,
            reason: 'resume-boundary',
        })).toBe(true);
    });
});

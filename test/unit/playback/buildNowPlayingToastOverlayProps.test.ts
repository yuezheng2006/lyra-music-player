import { describe, expect, it, vi } from 'vitest';
import { buildNowPlayingToastOverlayProps } from '@/components/app/overlays/now-playing-toast/buildNowPlayingToastOverlayProps';
import type { SongResult } from '@/types';

// test/unit/playback/buildNowPlayingToastOverlayProps.test.ts
// Visibility and next-up swap for the lyrics-page now-playing card.

const song = (id: number, name: string): SongResult => ({
    id,
    name,
    artists: [{ name: 'Artist' }],
    album: {} as SongResult['album'],
    duration: 1000,
} as SongResult);

const queue = [song(1, 'Alpha'), song(2, 'Bravo')];

const build = (overrides: Partial<Parameters<typeof buildNowPlayingToastOverlayProps>[0]> = {}) => (
    buildNowPlayingToastOverlayProps({
        currentSong: queue[0],
        playQueue: queue,
        loopMode: 'off',
        isFmMode: false,
        isStageActive: false,
        isDaylight: false,
        currentView: 'player',
        stageTrackPillMode: 'auto',
        stageTrackPillTimeoutSec: 10,
        stageTrackPillOnHome: false,
        countdownActive: false,
        onOpenPlayer: vi.fn(),
        onOpenSongCard: vi.fn(),
        openPlayerLabel: 'Open player',
        openSongCardLabel: 'Open card',
        ...overrides,
    })
);

describe('buildNowPlayingToastOverlayProps', () => {
    it('returns null when the mode is never', () => {
        expect(build({ stageTrackPillMode: 'never' })).toBeNull();
    });

    it('returns null on home unless the home opt-in is on', () => {
        expect(build({ currentView: 'home', stageTrackPillOnHome: false })).toBeNull();
        expect(build({ currentView: 'home', stageTrackPillOnHome: true })?.song.title).toBe('Alpha');
    });

    it('swaps to next-up when the countdown is active', () => {
        const props = build({ countdownActive: true });
        expect(props?.isNextUp).toBe(true);
        expect(props?.nextUp?.title).toBe('Bravo');
    });

    it('keeps the current song when there is no successor', () => {
        const props = build({ playQueue: [queue[0]], countdownActive: true });
        expect(props?.isNextUp).toBe(false);
        expect(props?.song.title).toBe('Alpha');
    });
});

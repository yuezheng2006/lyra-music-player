import { describe, expect, it } from 'vitest';
import { buildPlayerViewFlags } from '@/components/app/presentation/buildPlayerViewFlags';

// test/unit/playback/buildPlayerViewFlags.test.ts

describe('buildPlayerViewFlags', () => {
    const base = {
        currentView: 'home',
        disableHomeDynamicBackground: true,
        hidePlayerTranslationSubtitle: false,
        hidePlayerRightPanelButton: false,
        isNowPlayingControlDisabled: false,
        activePlaybackContext: 'main' as const,
        stageActiveEntryKind: null,
        duration: 0,
    };

    it('disables play when there is no audio and no current song', () => {
        expect(buildPlayerViewFlags({
            ...base,
            audioSrc: null,
            hasCurrentSong: false,
        }).canToggleCurrentPlayback).toBe(false);
    });

    it('keeps play clickable when session restored a song without audioSrc yet', () => {
        expect(buildPlayerViewFlags({
            ...base,
            audioSrc: null,
            hasCurrentSong: true,
        }).canToggleCurrentPlayback).toBe(true);
    });

    it('enables play when audioSrc is present', () => {
        expect(buildPlayerViewFlags({
            ...base,
            audioSrc: 'https://example.test/a.mp3',
            hasCurrentSong: false,
        }).canToggleCurrentPlayback).toBe(true);
    });
});

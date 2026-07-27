import { describe, expect, it } from 'vitest';
import { resolvePlayToggleAction } from '@/utils/playback/resolvePlayToggleActionMath';

// test/unit/playback/resolvePlayToggleActionMath.test.ts

describe('resolvePlayToggleAction', () => {
    it('replays the current song when stage lyrics has metadata but no audioSrc', () => {
        expect(resolvePlayToggleAction({
            isNowPlayingStageActive: false,
            hasCurrentSong: true,
            hasAudioSrc: false,
            canReplayCurrentSong: true,
            activePlaybackContext: 'stage',
            stageActiveEntryKind: 'lyrics',
            playerStateIsPlaying: false,
            audioIsActivelyPlaying: false,
        })).toBe('replay-song');
    });

    it('does not trap GPU-restore empty-src sessions in synthetic play/pause', () => {
        expect(resolvePlayToggleAction({
            isNowPlayingStageActive: false,
            hasCurrentSong: true,
            hasAudioSrc: false,
            canReplayCurrentSong: true,
            activePlaybackContext: 'stage',
            stageActiveEntryKind: 'lyrics',
            playerStateIsPlaying: true,
            audioIsActivelyPlaying: false,
        })).toBe('replay-song');
    });

    it('keeps lyrics-only synthetic toggle when there is no song to restore', () => {
        expect(resolvePlayToggleAction({
            isNowPlayingStageActive: false,
            hasCurrentSong: false,
            hasAudioSrc: false,
            canReplayCurrentSong: false,
            activePlaybackContext: 'stage',
            stageActiveEntryKind: 'lyrics',
            playerStateIsPlaying: false,
            audioIsActivelyPlaying: false,
        })).toBe('synthetic-resume');
    });

    it('pauses/resumes the media element when audioSrc exists', () => {
        expect(resolvePlayToggleAction({
            isNowPlayingStageActive: false,
            hasCurrentSong: true,
            hasAudioSrc: true,
            canReplayCurrentSong: true,
            activePlaybackContext: 'main',
            stageActiveEntryKind: null,
            playerStateIsPlaying: true,
            audioIsActivelyPlaying: true,
        })).toBe('audio-pause');

        expect(resolvePlayToggleAction({
            isNowPlayingStageActive: false,
            hasCurrentSong: true,
            hasAudioSrc: true,
            canReplayCurrentSong: true,
            activePlaybackContext: 'stage',
            stageActiveEntryKind: 'lyrics',
            playerStateIsPlaying: false,
            audioIsActivelyPlaying: false,
        })).toBe('audio-resume');
    });

    it('pauses when dock playerState is playing even if the audio element is briefly paused', () => {
        expect(resolvePlayToggleAction({
            isNowPlayingStageActive: false,
            hasCurrentSong: true,
            hasAudioSrc: true,
            canReplayCurrentSong: true,
            activePlaybackContext: 'main',
            stageActiveEntryKind: null,
            playerStateIsPlaying: true,
            audioIsActivelyPlaying: false,
        })).toBe('audio-pause');
    });
});

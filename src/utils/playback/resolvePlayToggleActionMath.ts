// src/utils/playback/resolvePlayToggleActionMath.ts
// Decide whether play toggle should restore audio, drive lyrics-only clock, or control the media element.

export type PlayToggleAction =
    | 'noop'
    | 'replay-song'
    | 'synthetic-pause'
    | 'synthetic-resume'
    | 'audio-pause'
    | 'audio-resume';

type ResolvePlayToggleActionInput = {
    isNowPlayingStageActive: boolean;
    hasCurrentSong: boolean;
    hasAudioSrc: boolean;
    canReplayCurrentSong: boolean;
    activePlaybackContext: 'main' | 'stage';
    stageActiveEntryKind: string | null;
    playerStateIsPlaying: boolean;
    audioIsActivelyPlaying: boolean;
};

/** Pure play-toggle routing — restore real audio before lyrics-only synthetic clock. */
export function resolvePlayToggleAction(input: ResolvePlayToggleActionInput): PlayToggleAction {
    if (input.isNowPlayingStageActive) {
        return 'noop';
    }

    // GPU relaunch / failed restore often leaves song metadata without audioSrc.
    // Prefer rehydrating the stream over fake "playing" lyrics clock at 00:00.
    if (!input.hasAudioSrc && input.hasCurrentSong && input.canReplayCurrentSong) {
        return 'replay-song';
    }

    if (
        input.activePlaybackContext === 'stage'
        && input.stageActiveEntryKind === 'lyrics'
        && !input.hasAudioSrc
    ) {
        return input.playerStateIsPlaying ? 'synthetic-pause' : 'synthetic-resume';
    }

    if (!input.hasAudioSrc) {
        return 'noop';
    }

    // Prefer playerState for the dock button: UI can show Pause while the element
    // is briefly paused (stubbed play, fade, or src attach), and must still pause.
    return (input.playerStateIsPlaying || input.audioIsActivelyPlaying)
        ? 'audio-pause'
        : 'audio-resume';
}

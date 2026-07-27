import { findLatestActiveLineIndex } from '../appPlaybackHelpers';
import type { LyricData } from '../../types';

// src/utils/playback/syncLyricPlaybackClock.ts
// Shared lyric clock math for RAF + audio timeupdate backup paths.

export const resolveLyricPlaybackTimes = (input: {
    audioCurrentTimeSec: number;
    lyricTimelineOffsetMs: number;
}): { currentTimeSec: number; lyricTimeSec: number } => {
    const currentTimeSec = input.audioCurrentTimeSec;
    const lyricTimeSec = currentTimeSec - input.lyricTimelineOffsetMs / 1000;
    return { currentTimeSec, lyricTimeSec };
};

/** Resolve the active lyric line index for an audio/lyric clock pair. */
export const resolveLyricLineIndexForTime = (
    lyrics: LyricData | null | undefined,
    lyricTimeSec: number,
): number => {
    if (!lyrics?.lines?.length) return -1;
    return findLatestActiveLineIndex(lyrics.lines, lyricTimeSec);
};

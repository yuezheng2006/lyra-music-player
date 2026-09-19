import { findLatestActiveLineIndex } from '../appPlaybackHelpers';
import type { LyricData } from '../../types';

// src/utils/playback/syncLyricPlaybackClock.ts
// Shared lyric clock math for RAF + audio timeupdate backup paths.

export const resolveLyricPlaybackTimes = (input: {
    audioCurrentTimeSec: number;
    lyricTimelineOffsetMs: number;
    globalLyricTimelineOffsetMs?: number;
}): { currentTimeSec: number; lyricTimeSec: number } => {
    const currentTimeSec = input.audioCurrentTimeSec;
    const totalOffsetMs = input.lyricTimelineOffsetMs + (input.globalLyricTimelineOffsetMs ?? 0);
    const lyricTimeSec = currentTimeSec - totalOffsetMs / 1000;
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

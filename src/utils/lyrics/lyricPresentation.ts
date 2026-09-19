import type { Line, LyricData, LyricPresentation, SongResult } from '../../types';

// src/utils/lyrics/lyricPresentation.ts
// Podcast / talk tracks use caption presentation instead of the lyric visualizer rail.

export const isCaptionLyricPresentation = (
    presentation: LyricPresentation | null | undefined,
): boolean => presentation === 'captions';

export const resolveLyricPresentation = (
    lyrics: Pick<LyricData, 'presentation'> | null | undefined,
    song?: Pick<SongResult, 'contentType' | 'musicProvider'> | null,
): LyricPresentation => {
    if (lyrics?.presentation === 'captions' || lyrics?.presentation === 'lyrics') {
        return lyrics.presentation;
    }
    if (song?.contentType === 'podcast' || song?.musicProvider === 'rss') {
        return 'captions';
    }
    return 'lyrics';
};

export const resolveVisualizerLyricStageLines = (
    lines: Line[],
    presentation: LyricPresentation | null | undefined,
): Line[] => (isCaptionLyricPresentation(presentation) ? [] : lines);

export const stampCaptionPresentation = (lyrics: LyricData | null): LyricData | null => {
    if (!lyrics?.lines.length) return null;
    return {
        ...lyrics,
        isWordByWord: false,
        presentation: 'captions',
    };
};

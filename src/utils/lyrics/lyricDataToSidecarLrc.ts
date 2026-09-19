// src/utils/lyrics/lyricDataToSidecarLrc.ts
// Serialize parsed LyricData into sidecar LRC text for local-library matching.

import type { LyricData } from '../../types';

export const formatLrcTimestamp = (seconds: number): string => {
    const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const mm = Math.floor(t / 60);
    const remainder = t - mm * 60;
    const ss = Math.floor(remainder);
    const cs = Math.round((remainder - ss) * 100);
    const carry = cs === 100;
    const whole = carry ? ss + 1 : ss;
    const frac = carry ? 0 : cs;
    const minutes = whole >= 60 ? mm + 1 : mm;
    const secs = whole >= 60 ? 0 : whole;
    return `[${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(frac).padStart(2, '0')}]`;
};

const lineText = (fullText: string | undefined, words: Array<{ text: string }> | undefined): string => {
    const fromFull = String(fullText || '').trim();
    if (fromFull) return fromFull;
    return (words || []).map((word) => word.text).join('').trim();
};

/** Build main + translation sidecar LRC from in-session parsed lyrics. */
export const lyricDataToSidecarLrc = (
    lyrics: LyricData | null | undefined,
): { lrc: string; translationLrc: string } => {
    if (!lyrics?.lines?.length) {
        return { lrc: '', translationLrc: '' };
    }

    const lrcLines: string[] = [];
    const translationLines: string[] = [];

    for (const line of lyrics.lines) {
        const text = lineText(line.fullText, line.words);
        if (!text) continue;
        const stamp = formatLrcTimestamp(line.startTime);
        lrcLines.push(`${stamp}${text}`);
        const translation = String(line.translation || '').trim();
        if (translation) {
            translationLines.push(`${stamp}${translation}`);
        }
    }

    return {
        lrc: lrcLines.length > 0 ? `${lrcLines.join('\n')}\n` : '',
        translationLrc: translationLines.length > 0 ? `${translationLines.join('\n')}\n` : '',
    };
};

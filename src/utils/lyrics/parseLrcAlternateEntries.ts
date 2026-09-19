import type { LyricTimedText } from './alignLyricAlternateTracks';

// src/utils/lyrics/parseLrcAlternateEntries.ts
// Reads LRC-timed alternate tracks (romalrc / yromalrc) without using the primary format parser.

const LRC_LINE_TIME_REGEX = /^\[(\d{2}):(\d{2})[.:](\d{2,3})\]/;
const LEADING_LRC_TAGS_REGEX = /^((?:\[(?:\d{2}):(?:\d{2})[.:](?:\d{2,3})\])+)(.*)$/;

const parseTimestamp = (minute: string, second: string, fraction: string): number => {
    const min = parseInt(minute, 10);
    const sec = parseInt(second, 10);
    const ms = parseFloat(`0.${fraction}`);
    return min * 60 + sec + ms;
};

export const parseLrcAlternateEntries = (rawText: string): LyricTimedText[] => {
    if (!rawText.trim()) return [];

    const entries: LyricTimedText[] = [];
    for (const rawLine of rawText.replace(/^\uFEFF/, '').split(/\r?\n/)) {
        const line = rawLine.trim();
        const match = line.match(LEADING_LRC_TAGS_REGEX);
        if (!match) continue;
        const firstTag = match[1].match(LRC_LINE_TIME_REGEX);
        const text = match[2].trim();
        if (!firstTag || !text) continue;
        entries.push({
            startTime: parseTimestamp(firstTag[1], firstTag[2], firstTag[3]),
            text,
        });
    }
    return entries;
};

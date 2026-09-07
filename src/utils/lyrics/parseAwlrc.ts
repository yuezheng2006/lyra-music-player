import type { Line, LyricData, Word } from '../../types';
import { alignLyricAlternateTracks } from './alignLyricAlternateTracks';
import { annotateLyricLines } from './renderHints';
import type { LyricProcessingOptions } from './types';

// src/utils/lyrics/parseAwlrc.ts
// Parses LX / KuGou word-by-word `[awlrc]` tracks without touching LRC [offset:] handling.

const AWLRC_LINE_REGEX = /^\[(\d{1,3}(?::\d{1,3}){0,2})\.(\d{1,3})\](.*)$/;
const AWLRC_WORD_REGEX = /<(\d+),(\d+)(?:,\d+)?>([^<]*)/g;
const LRC_METADATA_REGEX = /^\[(ti|ar):([^\]]*)\]$/i;

type TimedTextEntry = { startTime: number; text: string };

const parseAwlrcTimestamp = (fields: string, fraction: string): number => {
    const parts = fields.split(':').map(part => parseInt(part, 10));
    while (parts.length < 3) {
        parts.unshift(0);
    }

    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + seconds + (parseInt(fraction, 10) / 1000);
};

const parseMetadataLine = (line: string, metadata: { title?: string; artist?: string }): boolean => {
    const match = line.match(LRC_METADATA_REGEX);
    if (!match) return false;
    const key = match[1].toLowerCase();
    if (key === 'ti') metadata.title = match[2];
    if (key === 'ar') metadata.artist = match[2];
    return true;
};

const parseAwlrcAlternateTrack = (content: string): TimedTextEntry[] => {
    const entries: TimedTextEntry[] = [];
    for (const rawLine of content.replace(/^\uFEFF/, '').split(/\r?\n/)) {
        const match = rawLine.trim().match(AWLRC_LINE_REGEX);
        const text = match?.[3]?.trim();
        if (!match || !text) continue;
        entries.push({ startTime: parseAwlrcTimestamp(match[1], match[2]), text });
    }
    return entries;
};

/** Parses the word-by-word track of a KuGou/LX `[awlrc:...]` container. */
export const parseAwlrc = (
    awlrcString: string,
    translationString: string = '',
    _options: LyricProcessingOptions = {},
    romanizationString: string = '',
): LyricData => {
    const metadata: { title?: string; artist?: string } = {};
    const drafts: Array<{ words: Word[]; startTime: number; endTime: number; fullText: string }> = [];

    for (const rawLine of awlrcString.replace(/^\uFEFF/, '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || parseMetadataLine(line, metadata)) continue;

        const lineMatch = line.match(AWLRC_LINE_REGEX);
        if (!lineMatch) continue;

        const startTime = parseAwlrcTimestamp(lineMatch[1], lineMatch[2]);
        const words: Word[] = [];
        let fullText = '';
        let cursorMs = 0;

        AWLRC_WORD_REGEX.lastIndex = 0;
        let wordMatch: RegExpExecArray | null;
        while ((wordMatch = AWLRC_WORD_REGEX.exec(lineMatch[3])) !== null) {
            const offsetMs = Math.max(parseInt(wordMatch[1], 10), cursorMs);
            const durationMs = Math.max(parseInt(wordMatch[2], 10), 1);
            words.push({
                text: wordMatch[3],
                startTime: startTime + (offsetMs / 1000),
                endTime: startTime + ((offsetMs + durationMs) / 1000),
            });
            cursorMs = offsetMs + durationMs;
            fullText += wordMatch[3];
        }

        if (words.length === 0 || !fullText.trim()) continue;
        drafts.push({ words, startTime, endTime: startTime + (cursorMs / 1000), fullText });
    }

    drafts.sort((left, right) => left.startTime - right.startTime);

    const startTimes = drafts.map(draft => draft.startTime);
    const translations = alignLyricAlternateTracks(startTimes, parseAwlrcAlternateTrack(translationString));
    const romanizations = alignLyricAlternateTracks(startTimes, parseAwlrcAlternateTrack(romanizationString));

    const lines: Line[] = drafts.map((draft, index) => {
        const next = drafts[index + 1];
        const endTime = next ? Math.min(draft.endTime, next.startTime) : draft.endTime;
        return {
            words: draft.words,
            startTime: draft.startTime,
            endTime: Math.max(endTime, draft.startTime),
            fullText: draft.fullText,
            translation: translations[index],
            romanization: romanizations[index],
        };
    });

    return {
        lines: annotateLyricLines(lines),
        title: metadata.title,
        artist: metadata.artist,
        isWordByWord: true,
    };
};

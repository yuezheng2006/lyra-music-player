import type { Line, LyricData } from '../../types';
import { splitPodcastCaptionCues } from './splitPodcastCaptionCues';

// src/utils/lyrics/buildPodcastCaptionLyrics.ts
// Turn RSS shownotes into timed caption lines so talk shows still drive the lyric stage.

const MIN_PARAGRAPH_CHARS = 4;

const decodeBasicEntities = (value: string): string => value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&ndash;|&#8211;/gi, '–');

export const htmlToPodcastCaptionParagraphs = (html: string): string[] => {
    const withBreaks = String(html || '')
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ');
    return decodeBasicEntities(withBreaks)
        .split(/\n+/)
        .map((part) => part.replace(/\s+/g, ' ').trim())
        .filter((part) => part.length >= MIN_PARAGRAPH_CHARS);
};

const buildCaptionLine = (text: string, startTime: number, endTime: number): Line => ({
    fullText: text,
    startTime,
    endTime,
    words: [{ text, startTime, endTime }],
});

/** Spread shownotes across the episode so Monet/classic have an active line the whole time. */
export const buildPodcastCaptionLyrics = (
    html: string,
    durationSec: number,
): LyricData | null => {
    const paragraphs = htmlToPodcastCaptionParagraphs(html);
    const cues = paragraphs.flatMap((paragraph) => splitPodcastCaptionCues(paragraph));
    if (cues.length === 0) return null;

    const safeDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : cues.length * 8;
    const weights = cues.map((part) => Math.max(part.length, MIN_PARAGRAPH_CHARS));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const lines: Line[] = [];
    let cursor = 0;
    cues.forEach((text, index) => {
        const isLast = index === cues.length - 1;
        const startTime = cursor;
        const endTime = isLast
            ? safeDuration
            : cursor + (safeDuration * weights[index] / totalWeight);
        lines.push(buildCaptionLine(text, startTime, Math.max(endTime, startTime + 0.4)));
        cursor = lines[lines.length - 1].endTime;
    });
    return { lines, isWordByWord: false, presentation: 'captions' };
};

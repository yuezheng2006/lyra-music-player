import type { LyricData, SongResult } from '../../types';
import { detectTimedLyricFormat } from '../../utils/lyrics/formatDetection';
import { buildPodcastCaptionLyrics } from '../../utils/lyrics/buildPodcastCaptionLyrics';
import { parseLyricsAsync } from '../../utils/lyrics/workerClient';
import { stampCaptionPresentation } from '../../utils/lyrics/lyricPresentation';
import { fetchPodcastRemoteText } from './fetchPodcastRemote';

// src/services/podcast/loadPodcastEpisodeLyrics.ts
// Prefer a public transcript file; otherwise time the RSS shownotes as captions.

const toFiniteTime = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    const parts = trimmed.split(':').map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part))) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
};

const collectJsonTranscriptSegments = (payload: unknown): Array<{ start: number; end: number; text: string }> => {
    const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
    const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(root?.segments)
            ? root.segments
            : Array.isArray(root?.transcripts)
                ? root.transcripts
                : Array.isArray(root?.results)
                    ? root.results
                    : [];
    const segments: Array<{ start: number; end: number; text: string }> = [];
    for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const item = row as Record<string, unknown>;
        const text = String(item.body || item.text || item.utterance || '').replace(/\s+/g, ' ').trim();
        const start = toFiniteTime(item.startTime ?? item.start ?? item.begin);
        if (!text || start == null) continue;
        const end = toFiniteTime(item.endTime ?? item.end) ?? start + 4;
        segments.push({ start, end: Math.max(end, start + 0.4), text });
    }
    return segments;
};

const lyricsFromJsonTranscript = (text: string): LyricData | null => {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
        const segments = collectJsonTranscriptSegments(JSON.parse(trimmed));
        if (segments.length === 0) return null;
        return {
            isWordByWord: false,
            lines: segments.map((segment) => ({
                fullText: segment.text,
                startTime: segment.start,
                endTime: segment.end,
                words: [{ text: segment.text, startTime: segment.start, endTime: segment.end }],
            })),
        };
    } catch {
        return null;
    }
};

/** Skip 小宇宙 private APIs; public RSS transcripts (xyzcdn / xyzfm) are allowed. */
export const shouldFetchPodcastTranscriptUrl = (url: string): boolean => {
    try {
        const host = new URL(url).hostname.toLowerCase();
        return host !== 'api.xiaoyuzhoufm.com' && !host.endsWith('.api.xiaoyuzhoufm.com');
    } catch {
        return false;
    }
};

export const loadPodcastEpisodeLyrics = async (song: SongResult): Promise<LyricData | null> => {
    const transcriptUrl = String(song.podcastTranscriptUrl || '').trim();
    if (transcriptUrl && shouldFetchPodcastTranscriptUrl(transcriptUrl)) {
        try {
            const text = await fetchPodcastRemoteText(transcriptUrl);
            const fromJson = stampCaptionPresentation(lyricsFromJsonTranscript(text));
            if (fromJson?.lines.length) return fromJson;
            const parsed = stampCaptionPresentation(
                await parseLyricsAsync(detectTimedLyricFormat(text), text),
            );
            if (parsed?.lines.length) return parsed;
        } catch {
            // Fall through to shownotes captions.
        }
    }

    const durationSec = Number(song.duration || song.dt || 0) / 1000;
    return stampCaptionPresentation(
        buildPodcastCaptionLyrics(song.podcastDescription || '', durationSec),
    );
};

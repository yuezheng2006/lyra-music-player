import { describe, expect, it } from 'vitest';
import {
    buildPodcastCaptionLyrics,
    htmlToPodcastCaptionParagraphs,
} from '@/utils/lyrics/buildPodcastCaptionLyrics';
import { shouldFetchPodcastTranscriptUrl } from '@/services/podcast/loadPodcastEpisodeLyrics';

// test/unit/lyrics/buildPodcastCaptionLyrics.test.ts
// Shownotes become timed caption cues instead of a lyric visualizer rail.

describe('htmlToPodcastCaptionParagraphs', () => {
    it('strips tags and keeps paragraph breaks', () => {
        expect(htmlToPodcastCaptionParagraphs(
            '<p>嘉宾聊围棋与漂泊。</p><p>更多节目笔记。</p>',
        )).toEqual(['嘉宾聊围棋与漂泊。', '更多节目笔记。']);
    });
});

describe('buildPodcastCaptionLyrics', () => {
    it('spreads paragraphs across the episode duration', () => {
        const lyrics = buildPodcastCaptionLyrics(
            '<p>aaaaaaaa</p><p>bbbbbbbbbbbb</p>',
            100,
        );
        expect(lyrics?.presentation).toBe('captions');
        expect(lyrics?.lines).toHaveLength(2);
        expect(lyrics?.lines[0]?.startTime).toBe(0);
        expect(lyrics?.lines[1]?.endTime).toBe(100);
        expect(lyrics?.lines[0]?.endTime).toBeGreaterThan(0);
        expect(lyrics?.lines[0]?.endTime).toBeLessThan(100);
    });

    it('returns null when shownotes are empty', () => {
        expect(buildPodcastCaptionLyrics('<p>短</p>', 60)).toBeNull();
        expect(buildPodcastCaptionLyrics('', 60)).toBeNull();
    });
});

describe('shouldFetchPodcastTranscriptUrl', () => {
    it('allows public CDNs and blocks 小宇宙 private API hosts', () => {
        expect(shouldFetchPodcastTranscriptUrl('https://cdn.example.com/ep.vtt')).toBe(true);
        expect(shouldFetchPodcastTranscriptUrl('https://media.xyzcdn.net/ep.json')).toBe(true);
        expect(shouldFetchPodcastTranscriptUrl('https://api.xiaoyuzhoufm.com/v1/transcript')).toBe(false);
        expect(shouldFetchPodcastTranscriptUrl('not-a-url')).toBe(false);
    });
});

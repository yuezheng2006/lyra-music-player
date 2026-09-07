import { describe, expect, it } from 'vitest';
import { rssPodcastProvider } from '@/services/musicProviders/rssPodcastProvider';
import { mapRssEpisodeToSong } from '@/services/podcast/rssPodcastFeed';

// test/unit/services/rssPodcastProvider.test.ts

describe('rss podcast playback mapping', () => {
    it('returns the enclosure URL without a music-provider login', async () => {
        const song = mapRssEpisodeToSong(
            {
                guid: 'ep-1',
                title: 'Episode 1',
                audioUrl: 'http://cdn.example.com/ep1.mp3',
                durationMs: 3_600_000,
                cover: 'https://cdn.example.com/ep.jpg',
                author: 'Host',
            },
            { id: 99, name: '代码时间', cover: 'https://cdn.example.com/show.jpg', djName: 'Host' },
            1,
        );
        expect(song).toMatchObject({
            name: 'Episode 1',
            contentType: 'podcast',
            musicProvider: 'rss',
            audioUrl: 'https://cdn.example.com/ep1.mp3',
            radioName: '代码时间',
            isPureMusic: false,
        });
        expect(song.id).toBeLessThan(0);
        await expect(rssPodcastProvider.getAudioUrl(song, { quality: 'exhigh' })).resolves.toEqual({
            kind: 'ok',
            audioUrl: 'https://cdn.example.com/ep1.mp3',
        });
    });

    it('turns RSS shownotes into timed caption lyrics', async () => {
        const song = mapRssEpisodeToSong(
            {
                guid: 'ep-notes',
                title: 'Episode notes',
                audioUrl: 'https://cdn.example.com/ep.mp3',
                durationMs: 600_000,
                cover: '',
                author: 'Host',
                description: '<p>第一段节目介绍，足够长。</p><p>第二段继续往下讲。</p>',
            },
            { id: 1, name: 'Show', cover: '', djName: 'Host' },
            1,
        );
        expect(song.podcastDescription).toContain('第一段');
        const lyrics = await rssPodcastProvider.getLyrics(song);
        expect(lyrics?.lines.length).toBe(2);
        expect(lyrics?.lines[0]?.fullText).toContain('第一段');
        expect(lyrics?.lines[1]?.endTime).toBe(600);
        expect(lyrics?.presentation).toBe('captions');
    });

    it('refuses songs without an https enclosure', async () => {
        const song = mapRssEpisodeToSong(
            {
                guid: 'ep-2',
                title: 'Broken',
                audioUrl: '',
                durationMs: 0,
                cover: '',
                author: '',
            },
            { id: 1, name: 'Show', cover: '', djName: '' },
            1,
        );
        song.audioUrl = 'ftp://cdn.example.com/ep.mp3';
        await expect(rssPodcastProvider.getAudioUrl(song, { quality: 'exhigh' })).resolves.toEqual({
            kind: 'unavailable',
        });
    });
});

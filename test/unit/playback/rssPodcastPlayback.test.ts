import { describe, expect, it } from 'vitest';
import {
    isRssPodcastPlaybackSong,
    resolveHtmlAudioStallTimeoutMs,
    resolveRssPodcastEnclosureUrl,
    shouldSkipFullTrackAudioCache,
    shouldUseAnonymousHtmlAudioCors,
} from '@/utils/playback/rssPodcastPlayback';

// test/unit/playback/rssPodcastPlayback.test.ts
// RSS enclosure songs must play as direct https audio, not NetEase/sidecar streams.

describe('rssPodcastPlayback', () => {
    it('treats musicProvider=rss and podcast+audioUrl as enclosure playback', () => {
        expect(isRssPodcastPlaybackSong({
            musicProvider: 'rss',
            contentType: 'podcast',
            audioUrl: 'https://cdn.example/ep.mp3',
        })).toBe(true);
        expect(isRssPodcastPlaybackSong({
            contentType: 'podcast',
            audioUrl: 'https://cdn.example/ep.mp3',
        })).toBe(true);
        expect(isRssPodcastPlaybackSong({
            contentType: 'podcast',
        })).toBe(false);
        expect(isRssPodcastPlaybackSong({
            musicProvider: 'netease',
            contentType: 'podcast',
        })).toBe(false);
    });

    it('upgrades http enclosures and rejects non-https', () => {
        expect(resolveRssPodcastEnclosureUrl({
            audioUrl: 'http://cdn.example/ep.mp3',
        })).toBe('https://cdn.example/ep.mp3');
        expect(resolveRssPodcastEnclosureUrl({
            audioUrl: 'ftp://cdn.example/ep.mp3',
        })).toBeNull();
    });

    it('drops anonymous CORS in the browser and skips full-track cache for RSS podcasts', () => {
        const song = {
            musicProvider: 'rss' as const,
            contentType: 'podcast' as const,
            audioUrl: 'https://cdn.example/ep.mp3',
        };
        expect(shouldUseAnonymousHtmlAudioCors(song)).toBe(false);
        expect(shouldUseAnonymousHtmlAudioCors(song, { isElectronRenderer: true })).toBe(true);
        expect(shouldSkipFullTrackAudioCache(song)).toBe(true);
        expect(resolveHtmlAudioStallTimeoutMs(song)).toBeGreaterThan(8_000);
        expect(shouldUseAnonymousHtmlAudioCors({ musicProvider: 'qishui' })).toBe(true);
    });
});

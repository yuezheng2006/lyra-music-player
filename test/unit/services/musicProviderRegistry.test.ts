import { describe, expect, it } from 'vitest';
import { getSongMusicProviderId } from '@/services/musicProviders/registry';

// test/unit/services/musicProviderRegistry.test.ts
// Provider id must stay rss for enclosure podcasts even when musicProvider was dropped.

describe('getSongMusicProviderId', () => {
    it('keeps explicit providers', () => {
        expect(getSongMusicProviderId({ musicProvider: 'qishui' })).toBe('qishui');
        expect(getSongMusicProviderId({ musicProvider: 'rss' })).toBe('rss');
    });

    it('infers rss from a podcast enclosure when musicProvider is missing', () => {
        expect(getSongMusicProviderId({
            contentType: 'podcast',
            audioUrl: 'https://cdn.example/ep.mp3',
        })).toBe('rss');
    });

    it('does not treat NetEase djradio rows as rss', () => {
        expect(getSongMusicProviderId({
            contentType: 'podcast',
        })).toBe('netease');
    });
});

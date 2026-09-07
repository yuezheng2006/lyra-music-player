import { describe, expect, it } from 'vitest';
import {
    isAllowedPodcastProxyUrl,
    isApplePodcastCatalogHost,
    isPrivatePodcastProxyHostname,
} from '@/utils/podcastProxyHosts';

// test/unit/utils/podcastProxyHosts.test.ts

describe('podcastProxyHosts', () => {
    it('allows Apple catalog hosts and public RSS URLs', () => {
        expect(isApplePodcastCatalogHost('itunes.apple.com')).toBe(true);
        expect(isApplePodcastCatalogHost('rss.applemarketingtools.com')).toBe(true);
        expect(isAllowedPodcastProxyUrl('https://itunes.apple.com/search?term=a')).toBe(true);
        expect(isAllowedPodcastProxyUrl('https://feeds.simplecast.com/abc.xml')).toBe(true);
        expect(isAllowedPodcastProxyUrl('http://rss.example.com/show.xml')).toBe(true);
    });

    it('blocks loopback, private, and credentialed URLs', () => {
        expect(isPrivatePodcastProxyHostname('localhost')).toBe(true);
        expect(isPrivatePodcastProxyHostname('127.0.0.1')).toBe(true);
        expect(isPrivatePodcastProxyHostname('169.254.169.254')).toBe(true);
        expect(isPrivatePodcastProxyHostname('192.168.1.9')).toBe(true);
        expect(isPrivatePodcastProxyHostname('10.0.0.8')).toBe(true);
        expect(isAllowedPodcastProxyUrl('https://127.0.0.1/feed.xml')).toBe(false);
        expect(isAllowedPodcastProxyUrl('file:///etc/passwd')).toBe(false);
        expect(isAllowedPodcastProxyUrl('https://user:pass@feeds.example.com/x.xml')).toBe(false);
    });
});

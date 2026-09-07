import { describe, expect, it } from 'vitest';
import { parseItunesDurationMs, parsePodcastRss } from '@/services/podcast/parsePodcastRss';

// test/unit/services/parsePodcastRss.test.ts

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>代码时间</title>
    <itunes:author>Host</itunes:author>
    <itunes:image href="https://cdn.example.com/show.jpg"/>
    <item>
      <title>Episode 2</title>
      <guid>ep-2</guid>
      <itunes:duration>1:01:02</itunes:duration>
      <enclosure url="http://cdn.example.com/ep2.mp3" type="audio/mpeg"/>
      <content:encoded><![CDATA[<p>嘉宾聊围棋与漂泊。</p><p>更多节目笔记。</p>]]></content:encoded>
      <podcast:transcript url="https://cdn.example.com/ep2.vtt" type="text/vtt"/>
    </item>
    <item>
      <title>Skipped HTML note</title>
      <guid>note-1</guid>
      <enclosure url="https://cdn.example.com/note.html" type="text/html"/>
    </item>
    <item>
      <title>Episode 1</title>
      <guid>ep-1</guid>
      <itunes:duration>754</itunes:duration>
      <enclosure url="https://cdn.example.com/ep1.m4a" type="audio/mp4"/>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Show</title>
  <author><name>Ada</name></author>
  <entry>
    <title>First</title>
    <id>atom-1</id>
    <link rel="enclosure" type="audio/mpeg" href="https://cdn.example.com/first.mp3"/>
  </entry>
</feed>`;

describe('parseItunesDurationMs', () => {
    it('accepts seconds and clock strings', () => {
        expect(parseItunesDurationMs('754')).toBe(754_000);
        expect(parseItunesDurationMs('12:34')).toBe(754_000);
        expect(parseItunesDurationMs('1:01:02')).toBe(3_662_000);
        expect(parseItunesDurationMs('')).toBe(0);
    });
});

describe('parsePodcastRss', () => {
    it('keeps audio enclosures and upgrades http media URLs', () => {
        const feed = parsePodcastRss(RSS, 40);
        expect(feed.title).toBe('代码时间');
        expect(feed.author).toBe('Host');
        expect(feed.cover).toBe('https://cdn.example.com/show.jpg');
        expect(feed.episodes).toHaveLength(2);
        expect(feed.episodes[0]).toMatchObject({
            guid: 'ep-2',
            title: 'Episode 2',
            audioUrl: 'https://cdn.example.com/ep2.mp3',
            durationMs: 3_662_000,
            description: '<p>嘉宾聊围棋与漂泊。</p><p>更多节目笔记。</p>',
            transcriptUrl: 'https://cdn.example.com/ep2.vtt',
        });
        expect(feed.episodes[1]?.audioUrl).toBe('https://cdn.example.com/ep1.m4a');
    });

    it('reads Atom enclosure links', () => {
        const feed = parsePodcastRss(ATOM);
        expect(feed.episodes).toEqual([
            expect.objectContaining({
                guid: 'atom-1',
                title: 'First',
                audioUrl: 'https://cdn.example.com/first.mp3',
                author: 'Ada',
            }),
        ]);
    });
});

import { DOMParser } from '@xmldom/xmldom';

// src/services/podcast/parsePodcastRss.ts
// Parse RSS 2.0 / Atom podcast feeds into enclosure-backed episodes.

export type PodcastRssEpisode = {
    guid: string;
    title: string;
    audioUrl: string;
    durationMs: number;
    cover: string;
    author: string;
    description: string;
    transcriptUrl: string;
};

export type PodcastRssFeed = {
    title: string;
    author: string;
    cover: string;
    description: string;
    episodes: PodcastRssEpisode[];
};

const AUDIO_TYPE_RE = /audio|mpeg|mp3|mp4|m4a|aac|ogg|opus|wav/i;

export const hashPodcastStableId = (value: string): number => {
    let h1 = 0x811c9dc5;
    let h2 = 0x811c9dc5;
    for (let i = 0; i < value.length; i += 1) {
        const char = value.charCodeAt(i);
        h1 ^= char;
        h1 = Math.imul(h1, 0x01000193);
        h2 ^= char;
        h2 = Math.imul(h2, 0x10a9055);
    }
    const combined = (h1 & 0x1FFFFF) * 0x100000000 + (h2 >>> 0);
    return combined === 0 ? -1 : -combined;
};

export const parseItunesDurationMs = (raw?: string | null): number => {
    const text = String(raw || '').trim();
    if (!text) return 0;
    if (/^\d+(\.\d+)?$/.test(text)) {
        const seconds = Number(text);
        return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
    }
    const parts = text.split(':').map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part))) return 0;
    if (parts.length === 3) {
        return Math.round(((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000);
    }
    if (parts.length === 2) {
        return Math.round(((parts[0] * 60) + parts[1]) * 1000);
    }
    return 0;
};

const toHttps = (url?: string | null): string => {
    if (!url) return '';
    return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url;
};

type XmlNode = {
    textContent?: string | null;
    getAttribute?: (name: string) => string | null;
    getElementsByTagName: (tag: string) => { length: number; item: (index: number) => XmlNode | null };
};

const nodeList = (root: XmlNode, tag: string): XmlNode[] => {
    const list = root.getElementsByTagName(tag);
    const items: XmlNode[] = [];
    for (let i = 0; i < list.length; i += 1) {
        const node = list.item(i);
        if (node) items.push(node);
    }
    return items;
};

const childText = (el: XmlNode, tags: string[]): string => {
    for (const tag of tags) {
        const first = nodeList(el, tag)[0];
        const text = first?.textContent?.trim();
        if (text) return text;
    }
    return '';
};

const attr = (el: XmlNode | undefined, name: string): string => {
    if (!el?.getAttribute) return '';
    return el.getAttribute(name) || el.getAttribute(name.toLowerCase()) || '';
};

const isAudioUrl = (url: string, type?: string): boolean => {
    if (!url) return false;
    if (type && AUDIO_TYPE_RE.test(type)) return true;
    return /\.(mp3|m4a|aac|ogg|opus|wav|mp4)(?:$|\?)/i.test(url);
};

const firstAudioUrl = (el: XmlNode): string => {
    for (const enclosure of nodeList(el, 'enclosure')) {
        const url = toHttps(attr(enclosure, 'url') || attr(enclosure, 'href'));
        if (isAudioUrl(url, attr(enclosure, 'type'))) return url;
    }
    for (const content of [...nodeList(el, 'media:content'), ...nodeList(el, 'content')]) {
        const url = toHttps(attr(content, 'url') || attr(content, 'href'));
        const medium = attr(content, 'medium');
        const type = attr(content, 'type');
        if (medium && medium !== 'audio') continue;
        if (isAudioUrl(url, type)) return url;
    }
    for (const link of nodeList(el, 'link')) {
        const rel = attr(link, 'rel').toLowerCase();
        const type = attr(link, 'type');
        const href = toHttps(attr(link, 'href') || link.textContent?.trim());
        if (rel === 'enclosure' && isAudioUrl(href, type)) return href;
    }
    return '';
};

const firstTranscriptUrl = (el: XmlNode): string => {
    for (const node of [...nodeList(el, 'podcast:transcript'), ...nodeList(el, 'transcript')]) {
        const href = toHttps(attr(node, 'url') || attr(node, 'href') || node.textContent?.trim());
        const type = attr(node, 'type').toLowerCase();
        if (!href) continue;
        if (!type || /json|srt|vtt|text|plain/.test(type)) return href;
    }
    return '';
};

const firstImage = (el: XmlNode): string => {
    for (const image of [...nodeList(el, 'itunes:image'), ...nodeList(el, 'image')]) {
        const href = toHttps(attr(image, 'href') || attr(image, 'url') || childText(image, ['url']));
        if (href) return href;
    }
    return '';
};

export const parsePodcastRss = (xml: string, limit = 40): PodcastRssFeed => {
    const doc = new DOMParser().parseFromString(xml, 'text/xml') as unknown as XmlNode;
    const channel = nodeList(doc, 'channel')[0]
        || nodeList(doc, 'feed')[0]
        || doc;
    const title = childText(channel, ['title']);
    const author = childText(channel, ['itunes:author', 'author', 'managingEditor'])
        || nodeList(channel, 'author').map((node) => childText(node, ['name'])).find(Boolean)
        || '';
    const cover = firstImage(channel);
    const description = childText(channel, ['description', 'subtitle', 'itunes:subtitle']);
    const entries = [...nodeList(channel, 'item'), ...nodeList(channel, 'entry')];
    const episodes: PodcastRssEpisode[] = [];
    for (const entry of entries) {
        if (episodes.length >= limit) break;
        const audioUrl = firstAudioUrl(entry);
        const episodeTitle = childText(entry, ['title']);
        if (!audioUrl || !episodeTitle) continue;
        const guid = childText(entry, ['guid', 'id']) || audioUrl;
        episodes.push({
            guid,
            title: episodeTitle,
            audioUrl,
            durationMs: parseItunesDurationMs(childText(entry, ['itunes:duration', 'duration'])),
            cover: firstImage(entry) || cover,
            author: childText(entry, ['itunes:author', 'author', 'dc:creator']) || author,
            description: childText(entry, ['content:encoded', 'description', 'itunes:summary', 'summary']),
            transcriptUrl: firstTranscriptUrl(entry),
        });
    }
    return { title, author, cover, description, episodes };
};

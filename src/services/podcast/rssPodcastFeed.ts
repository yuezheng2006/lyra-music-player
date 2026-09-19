import type { SongResult } from '../../types';
import type { NeteasePodcastRadio } from '../neteasePodcast';
import { fetchPodcastRemoteText } from './fetchPodcastRemote';
import { hashPodcastStableId, parsePodcastRss } from './parsePodcastRss';

// src/services/podcast/rssPodcastFeed.ts
// Pull a show's public RSS feed and map episodes onto playable SongResults.

const RSS_PROVIDER_ID = 'rss' as const;

const toHttps = (url?: string | null): string => {
    if (!url) return '';
    return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url;
};

export const mapRssEpisodeToSong = (
    episode: {
        guid: string;
        title: string;
        audioUrl: string;
        durationMs: number;
        cover: string;
        author: string;
        description?: string;
        transcriptUrl?: string;
    },
    show: Pick<NeteasePodcastRadio, 'id' | 'name' | 'cover' | 'djName'>,
    serialNum: number,
): SongResult => {
    const cover = toHttps(episode.cover || show.cover || '');
    const artistName = episode.author || show.djName || show.name || 'Podcast';
    return {
        id: hashPodcastStableId(episode.guid || episode.audioUrl),
        name: episode.title,
        artists: [{ id: 0, name: artistName }],
        album: {
            id: show.id,
            name: show.name,
            picUrl: cover || undefined,
        },
        duration: episode.durationMs,
        musicProvider: RSS_PROVIDER_ID,
        providerSongId: episode.guid,
        contentType: 'podcast',
        audioUrl: toHttps(episode.audioUrl),
        podcastDescription: episode.description || undefined,
        podcastTranscriptUrl: toHttps(episode.transcriptUrl) || undefined,
        radioId: show.id,
        radioName: show.name,
        serialNum,
        isPureMusic: false,
        al: {
            id: show.id,
            name: show.name,
            picUrl: cover || undefined,
        },
        ar: [{ id: 0, name: artistName }],
        dt: episode.durationMs,
    };
};

export const fetchRssPodcastPrograms = async (
    radio: NeteasePodcastRadio,
    limit = 40,
): Promise<{ radio: NeteasePodcastRadio; programs: SongResult[] }> => {
    const feedUrl = String(radio.feedUrl || '').trim();
    if (!feedUrl) {
        throw new Error('Missing podcast RSS feed');
    }
    const xml = await fetchPodcastRemoteText(feedUrl);
    const feed = parsePodcastRss(xml, limit);
    const nextRadio: NeteasePodcastRadio = {
        ...radio,
        name: radio.name || feed.title,
        djName: radio.djName || feed.author,
        cover: radio.cover || feed.cover,
        desc: radio.desc || feed.description,
        programCount: feed.episodes.length || radio.programCount,
        catalogSource: radio.catalogSource || 'apple',
        feedUrl,
    };
    const programs = feed.episodes.map((episode, index) => (
        mapRssEpisodeToSong(episode, nextRadio, index + 1)
    ));
    return { radio: nextRadio, programs };
};

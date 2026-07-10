import type { SongResult } from '../../types';
import { fetchQQLyrics, requestQQ, searchQQLyrics } from '../../utils/lyrics/providers/qqLyricProvider';
import { getQQMusicAuth } from './qqMusicAuth';
import {
    fetchQQOpenLyrics,
    resolveQQOpenAudioUrl,
    searchQQOpenApi,
} from './qqOpenApi';
import type { MusicProvider } from './types';

// src/services/musicProviders/qqMusicLocalProvider.ts
// Renderer-side QQ provider with official API first and open API fallback.

const markQqSong = (song: SongResult): SongResult => ({
    ...song,
    musicProvider: 'qq',
    providerSongId: song.qqMid || song.providerSongId || String(song.id),
});

const QQ_AUDIO_QUALITY_CANDIDATES = [
    { prefix: 'RS01', ext: '.flac', level: 'hires' },
    { prefix: 'F000', ext: '.flac', level: 'lossless' },
    { prefix: 'M800', ext: '.mp3', level: 'exhigh' },
    { prefix: 'M500', ext: '.mp3', level: 'standard' },
    { prefix: 'C400', ext: '.m4a', level: 'aac' },
];

const normalizeQualityPreference = (quality: string) => {
    const raw = quality.toLowerCase().trim();
    if (['hires', 'hi-res', 'highres'].includes(raw)) return 'hires';
    if (['lossless', 'flac', 'sq'].includes(raw)) return 'lossless';
    if (['exhigh', 'high', '320', '320k'].includes(raw)) return 'exhigh';
    if (['standard', 'normal', '128', '128k'].includes(raw)) return 'standard';
    return 'hires';
};

const getQualityCandidates = (quality: string) => {
    const preferred = normalizeQualityPreference(quality);
    const preferredIndex = QQ_AUDIO_QUALITY_CANDIDATES.findIndex(candidate => candidate.level === preferred);
    return preferredIndex <= 0
        ? QQ_AUDIO_QUALITY_CANDIDATES
        : QQ_AUDIO_QUALITY_CANDIDATES.slice(preferredIndex);
};

const resolveQqAudioUrl = async (song: SongResult, quality: string) => {
    const mid = song.qqMid || song.providerSongId;
    if (!mid) {
        return null;
    }

    const auth = getQQMusicAuth();
    if (!auth.isLoggedIn) {
        return null;
    }

    const mediaMid = song.qqMediaMid || mid;
    const mediaIds = mediaMid === mid ? [mid] : [mediaMid, mid];
    const fileCandidates = mediaIds.flatMap(mediaId =>
        getQualityCandidates(quality).map(candidate => ({
            ...candidate,
            filename: `${candidate.prefix}${mediaId}${candidate.ext}`,
        }))
    );
    const filename = fileCandidates.map(candidate => candidate.filename);
    const data = await requestQQ('CgiGetVkey', 'vkey.GetVkeyServer', {
        filename,
        guid: auth.guid,
        loginflag: 1,
        platform: '20',
        songmid: filename.map(() => mid),
        songtype: filename.map(() => 0),
        uin: auth.uin,
    }, {
        comm: {
            authst: auth.musicKey,
            ct: 19,
            cv: 0,
            format: 'json',
            uin: auth.uin,
        },
    });

    const midUrlInfo = Array.isArray(data?.midurlinfo) ? data.midurlinfo : [];
    const purl = midUrlInfo.map((item: any) => item?.purl).find((value: unknown): value is string =>
        typeof value === 'string' && value.length > 0
    );
    if (!purl) {
        return null;
    }

    const sip = Array.isArray(data?.sip) && typeof data.sip[0] === 'string'
        ? data.sip[0]
        : 'https://dl.stream.qqmusic.qq.com/';
    const url = purl.startsWith('http') ? purl : `${sip}${purl}`;
    return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
};

const searchOfficialQQ = async (query: string, options: { limit: number; offset: number }) => {
    const page = Math.floor(options.offset / options.limit) + 1;
    const songs = await searchQQLyrics(query, page, options.limit);
    return {
        songs: songs.map(markQqSong),
        hasMore: songs.length >= options.limit,
    };
};

export const qqMusicLocalProvider: MusicProvider = {
    id: 'qq',
    search: async (query, options) => {
        try {
            const official = await searchOfficialQQ(query, options);
            if (official.songs.length > 0) {
                return official;
            }
        } catch (error) {
            console.warn('[QQMusic] Official search failed, falling back to open API', error);
        }

        const openResult = await searchQQOpenApi(query, options);
        return {
            songs: openResult.songs.map(markQqSong),
            hasMore: openResult.hasMore,
        };
    },
    getAudioUrl: async (song, options) => {
        try {
            const officialUrl = await resolveQqAudioUrl(song, options.quality);
            if (officialUrl) {
                return { kind: 'ok', audioUrl: officialUrl };
            }
        } catch (error) {
            console.warn('[QQMusic] Official audio lookup failed, falling back to open API', error);
        }

        const openUrl = await resolveQQOpenAudioUrl(song, options.quality);
        return openUrl ? { kind: 'ok', audioUrl: openUrl } : { kind: 'unavailable' };
    },
    getLyrics: async (song) => {
        try {
            const officialLyrics = await fetchQQLyrics(song);
            if (officialLyrics) {
                return officialLyrics;
            }
        } catch (error) {
            console.warn('[QQMusic] Official lyrics lookup failed, falling back to open API', error);
        }

        return fetchQQOpenLyrics(song);
    },
};

import type { SongResult } from '../../types';
import { detectTimedLyricFormat } from '../../utils/lyrics/formatDetection';
import { parseLyricsAsync } from '../../utils/lyrics/workerClient';
import type { LyricData } from '../../types';

// src/services/musicProviders/qqOpenApi.ts
// Open QQ Music API fallback inspired by MusicSquare's tang endpoint.

const DEFAULT_QQ_OPEN_API_BASE = 'https://tang.api.s01s.cn/music_open_api.php';

type QQOpenSearchItem = {
    song_mid?: string;
    song_title?: string;
    singer_name?: string;
    pay?: string;
};

type QQOpenDetail = {
    song_mid?: string;
    song_title?: string;
    song_name?: string;
    singer_name?: string;
    album_name?: string;
    album_title?: string;
    album_pic?: string;
    singer_pic?: string;
    song_play_url_sq?: string;
    song_play_url_pq?: string;
    song_play_url_accom?: string;
    song_play_url_hq?: string;
    song_play_url_standard?: string;
    song_play_url_fq?: string;
    song_play_url?: string;
    song_lyric?: string;
    lyric?: string;
};

const QQ_OPEN_AUDIO_FIELDS = [
    { field: 'song_play_url_sq', level: 'hires' },
    { field: 'song_play_url_pq', level: 'lossless' },
    { field: 'song_play_url_accom', level: 'exhigh' },
    { field: 'song_play_url_hq', level: 'exhigh' },
    { field: 'song_play_url_standard', level: 'standard' },
    { field: 'song_play_url_fq', level: 'standard' },
    { field: 'song_play_url', level: 'standard' },
] as const;

const normalizeAudioUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
};

const normalizeQualityPreference = (quality: string) => {
    const raw = quality.toLowerCase().trim();
    if (['hires', 'hi-res', 'highres'].includes(raw)) return 'hires';
    if (['lossless', 'flac', 'sq'].includes(raw)) return 'lossless';
    if (['exhigh', 'high', '320', '320k'].includes(raw)) return 'exhigh';
    if (['standard', 'normal', '128', '128k'].includes(raw)) return 'standard';
    return 'hires';
};

const getQQOpenApiBase = () => {
    const configured = typeof import.meta !== 'undefined'
        ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_QQ_OPEN_API_BASE
        : undefined;
    return (configured && configured.trim()) || DEFAULT_QQ_OPEN_API_BASE;
};

const isElectronRuntime = () => typeof window !== 'undefined' && Boolean((window as Window & { electron?: unknown }).electron);

// Fetches the open QQ API through Electron or the dev lyric proxy.
const fetchQQOpenPayload = async <T>(params: Record<string, string>): Promise<T> => {
    const requestUrl = new URL(getQQOpenApiBase());
    Object.entries(params).forEach(([key, value]) => {
        requestUrl.searchParams.set(key, value);
    });

    const url = isElectronRuntime()
        ? requestUrl.toString()
        : `/api/lyric-proxy?url=${encodeURIComponent(requestUrl.toString())}`;

    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) {
        throw new Error(`QQ open API failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
};

const normalizeQQOpenSearchList = (payload: unknown): QQOpenSearchItem[] => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
        return (payload as { data: QQOpenSearchItem[] }).data;
    }
    return [];
};

export const buildQQOpenDetailKeyword = (song: Pick<SongResult, 'name' | 'artists'>) => {
    const artist = song.artists?.map(artistItem => artistItem.name).filter(Boolean).join(' ') || '';
    return `${song.name} ${artist}`.trim();
};

export const mapQQOpenSearchItem = (item: QQOpenSearchItem): SongResult | null => {
    const qqMid = String(item.song_mid || '').trim();
    if (!qqMid) {
        return null;
    }

    const title = String(item.song_title || 'Unknown Song').trim();
    const artistName = String(item.singer_name || 'Unknown Artist').trim();

    return {
        id: 0,
        name: title,
        artists: [{ id: 0, name: artistName }],
        album: {
            id: 0,
            name: 'Unknown Album',
        },
        duration: 0,
        qqMid,
        qqMediaMid: qqMid,
        musicProvider: 'qq',
        providerSongId: qqMid,
    };
};

export const searchQQOpenApi = async (
    query: string,
    options: { limit: number; offset: number }
): Promise<{ songs: SongResult[]; hasMore: boolean }> => {
    const keyword = query.trim();
    if (!keyword) {
        return { songs: [], hasMore: false };
    }

    const payload = await fetchQQOpenPayload<unknown>({
        msg: keyword,
        type: 'json',
    });
    const list = normalizeQQOpenSearchList(payload);
    const page = list
        .map(mapQQOpenSearchItem)
        .filter((song): song is SongResult => Boolean(song))
        .slice(options.offset, options.offset + options.limit);

    return {
        songs: page,
        hasMore: options.offset + page.length < list.length,
    };
};

export const fetchQQOpenSongDetail = async (
    keyword: string,
    mid: string
): Promise<QQOpenDetail | null> => {
    const normalizedKeyword = keyword.trim();
    const normalizedMid = mid.trim();
    if (!normalizedKeyword || !normalizedMid) {
        return null;
    }

    const payload = await fetchQQOpenPayload<QQOpenDetail>({
        msg: normalizedKeyword,
        type: 'json',
        mid: normalizedMid,
    });

    if (!payload || typeof payload !== 'object' || !payload.song_mid) {
        return null;
    }

    return payload;
};

export const pickQQOpenAudioUrl = (detail: QQOpenDetail, quality: string) => {
    const preferred = normalizeQualityPreference(quality);
    const preferredIndex = QQ_OPEN_AUDIO_FIELDS.findIndex(candidate => candidate.level === preferred);
    const candidates = preferredIndex <= 0
        ? QQ_OPEN_AUDIO_FIELDS
        : QQ_OPEN_AUDIO_FIELDS.slice(preferredIndex);

    for (const candidate of candidates) {
        const url = detail[candidate.field];
        if (typeof url === 'string' && url.trim()) {
            return normalizeAudioUrl(url);
        }
    }

    return null;
};

export const resolveQQOpenAudioUrl = async (song: SongResult, quality: string) => {
    const keyword = buildQQOpenDetailKeyword(song);
    const mid = String(song.qqMid || song.providerSongId || '').trim();

    // Prefer exact mid lookup when available.
    if (mid && !/^\d+$/.test(mid)) {
        const detail = await fetchQQOpenSongDetail(keyword || mid, mid);
        const url = detail ? pickQQOpenAudioUrl(detail, quality) : null;
        if (url) {
            return url;
        }
    }

    // Fallback: search by title/artist and reuse the best matching mid.
    if (!keyword) {
        return null;
    }

    try {
        const search = await searchQQOpenApi(keyword, { limit: 8, offset: 0 });
        const candidates = search.songs.filter(candidate => candidate.qqMid);
        if (candidates.length === 0) {
            return null;
        }

        const preferred = mid
            ? candidates.find(candidate => candidate.qqMid === mid)
            : null;
        const matched = preferred
            || candidates.find(candidate =>
                candidate.name === song.name
                && candidate.artists?.[0]?.name
                && song.artists?.[0]?.name
                && candidate.artists[0].name === song.artists[0].name
            )
            || candidates[0];

        const detail = await fetchQQOpenSongDetail(
            buildQQOpenDetailKeyword(matched),
            matched.qqMid || '',
        );
        return detail ? pickQQOpenAudioUrl(detail, quality) : null;
    } catch (error) {
        console.warn('[QQOpenApi] Search fallback for audio failed', error);
        return null;
    }
};

export const fetchQQOpenLyrics = async (song: SongResult): Promise<LyricData | null> => {
    const mid = song.qqMid || song.providerSongId;
    if (!mid) {
        return null;
    }

    const detail = await fetchQQOpenSongDetail(buildQQOpenDetailKeyword(song), mid);
    const lyricsText = String(detail?.song_lyric || detail?.lyric || '').trim();
    if (!lyricsText) {
        return null;
    }

    return parseLyricsAsync(detectTimedLyricFormat(lyricsText), lyricsText, '');
};

import type { SongResult } from '../types';
import { neteaseApi } from './netease';

// src/services/neteasePodcast.ts
// Netease podcast (djradio/voice) helpers adapted from Mineradio mapPodcast*.

export type NeteasePodcastRadio = {
    id: number;
    rid: number;
    name: string;
    cover: string;
    desc: string;
    djName: string;
    category: string;
    programCount: number;
    subCount: number;
};

const toHttps = (url?: string | null) => {
    if (!url) return '';
    return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url;
};

const firstArray = (obj: Record<string, unknown> | null | undefined, keys: string[]): unknown[] => {
    if (!obj) return [];
    for (const key of keys) {
        const value = obj[key];
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') {
            const nested = value as Record<string, unknown>;
            if (Array.isArray(nested.list)) return nested.list;
            if (Array.isArray(nested.data)) return nested.data;
            if (Array.isArray(nested.resources)) return nested.resources;
        }
    }
    return [];
};

export const mapPodcastRadio = (raw: any): NeteasePodcastRadio | null => {
    const r = raw || {};
    const dj = r.dj || r.djSimple || r.djUser || r.creator || {};
    const id = Number(r.id || r.rid || r.radioId || 0);
    if (!id) return null;
    return {
        id,
        rid: id,
        name: r.name || r.radioName || '',
        cover: toHttps(r.picUrl || r.picURL || r.coverUrl || r.coverImgUrl || r.avatarUrl || ''),
        desc: r.desc || r.description || r.rcmdText || '',
        djName: dj.nickname || r.djName || r.nickname || '',
        category: r.category || r.categoryName || '',
        programCount: Number(r.programCount || r.programNum || r.programCnt || 0),
        subCount: Number(r.subCount || r.subedCount || r.subscriberCount || 0),
    };
};

// Maps a dj program into a playable SongResult (mainSong.id drives getSongUrl).
export const mapPodcastProgram = (raw: any, fallbackRadio?: Partial<NeteasePodcastRadio> | null): SongResult | null => {
    const p = raw || {};
    const mainSong = p.mainSong || p.song || p.mainTrack || {};
    const radio = p.radio || fallbackRadio || {};
    const mappedRadio = mapPodcastRadio(radio) || (fallbackRadio?.id
        ? {
            id: Number(fallbackRadio.id),
            rid: Number(fallbackRadio.id),
            name: fallbackRadio.name || '',
            cover: fallbackRadio.cover || '',
            desc: '',
            djName: fallbackRadio.djName || '',
            category: '',
            programCount: 0,
            subCount: 0,
        }
        : null);
    const playableId = Number(mainSong.id || p.mainSongId || p.songId || 0);
    if (!playableId) return null;

    const artists = Array.isArray(mainSong.ar || mainSong.artists)
        ? (mainSong.ar || mainSong.artists).map((a: any) => ({
            id: Number(a?.id || 0),
            name: a?.name || '',
        })).filter((a: { name: string }) => a.name)
        : [];
    const album = mainSong.al || mainSong.album || {};
    const dj = p.dj || radio.dj || {};
    const cover = toHttps(
        p.coverUrl || p.cover || p.blurCoverUrl || mappedRadio?.cover || album.picUrl || '',
    );
    const albumName = mappedRadio?.name || album.name || 'Podcast';
    const duration = Number(p.duration || mainSong.dt || mainSong.duration || 0);
    const name = p.name || mainSong.name || '';
    if (!name) return null;

    return {
        id: playableId,
        name,
        artists: artists.length > 0
            ? artists
            : [{ id: 0, name: mappedRadio?.djName || dj.nickname || 'Podcast' }],
        album: {
            id: Number(album.id || mappedRadio?.id || 0),
            name: albumName,
            picUrl: cover || undefined,
        },
        duration,
        musicProvider: 'netease',
        sourceType: 'netease',
        contentType: 'podcast',
        programId: Number(p.id || p.programId || 0) || undefined,
        radioId: mappedRadio?.id,
        radioName: mappedRadio?.name || '',
        serialNum: Number(p.serialNum || p.serial || 0) || undefined,
        al: {
            id: Number(album.id || mappedRadio?.id || 0),
            name: albumName,
            picUrl: cover || undefined,
        },
        ar: artists.length > 0
            ? artists
            : [{ id: 0, name: mappedRadio?.djName || dj.nickname || 'Podcast' }],
        dt: duration,
        fee: typeof mainSong.fee === 'number' ? mainSong.fee : undefined,
    };
};

export type DailyRecommendFetchResult = {
    songs: SongResult[];
    code: number;
    needLogin: boolean;
    message?: string;
};

// Aligns with Mineradio: body.data.dailySongs || body.recommend.
export const fetchDailyRecommendSongs = async (): Promise<DailyRecommendFetchResult> => {
    const res = await neteaseApi.getDailyRecommendSongs();
    const code = Number(res?.code ?? 0);
    const needLogin = code === 301 || code === 401 || code === 403;
    if (needLogin) {
        return {
            songs: [],
            code,
            needLogin: true,
            message: typeof res?.msg === 'string' ? res.msg : undefined,
        };
    }

    const data = res?.data && typeof res.data === 'object' ? res.data : null;
    const raw = (data && (data.dailySongs || data.recommend))
        || res?.recommend
        || res?.dailySongs
        || [];
    const list = Array.isArray(raw) ? raw : [];
    const songs = list
        .map((item: any) => ({
            ...neteaseApi.normalizeSongResult(item),
            musicProvider: 'netease' as const,
        }))
        .filter((song: SongResult) => song.id && song.name);

    return {
        songs,
        code: code || 200,
        needLogin: false,
        message: songs.length === 0 && typeof res?.msg === 'string' ? res.msg : undefined,
    };
};

export const fetchHotPodcasts = async (limit = 24, offset = 0): Promise<NeteasePodcastRadio[]> => {
    const res = await neteaseApi.getDjHot(limit, offset);
    const raw = firstArray(res, ['djRadios', 'djradios', 'radios', 'data']);
    return raw
        .map((item) => mapPodcastRadio(item))
        .filter((item): item is NeteasePodcastRadio => Boolean(item));
};

export const searchPodcasts = async (keywords: string, limit = 18): Promise<NeteasePodcastRadio[]> => {
    const trimmed = keywords.trim();
    if (!trimmed) return [];
    const res = await neteaseApi.cloudSearchByType(trimmed, 1009, limit, 0);
    const result = res?.result || {};
    const raw = firstArray(result, ['djRadios', 'djradios', 'radios']);
    return raw
        .map((item) => mapPodcastRadio(item))
        .filter((item): item is NeteasePodcastRadio => Boolean(item));
};

export const fetchPodcastPrograms = async (
    radioId: number,
    limit = 40,
    offset = 0,
): Promise<{ radio: NeteasePodcastRadio | null; programs: SongResult[] }> => {
    const res = await neteaseApi.getDjPrograms(radioId, limit, offset);
    const fromRoot = firstArray(res, ['programs']);
    const fromData = firstArray(
        res?.data && typeof res.data === 'object' ? res.data as Record<string, unknown> : null,
        ['list', 'programs'],
    );
    const raw = fromRoot.length > 0 ? fromRoot : fromData;
    const first = raw[0] as any;
    const radio = first?.radio
        ? mapPodcastRadio(first.radio)
        : { id: radioId, rid: radioId, name: '', cover: '', desc: '', djName: '', category: '', programCount: 0, subCount: 0 };
    const programs = raw
        .map((item) => mapPodcastProgram(item, radio))
        .filter((item): item is SongResult => Boolean(item));
    return { radio, programs };
};

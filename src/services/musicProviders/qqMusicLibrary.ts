import type { NeteasePlaylist, SongResult } from '../../types';
import { requestQQ } from '../../utils/lyrics/providers/qqLyricProvider';
import { getQQMusicAuth } from './qqMusicAuth';

// src/services/musicProviders/qqMusicLibrary.ts
// Fetches QQ Music user playlists and playlist tracks for the home library surface.

type QQProxyFetchInit = {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
};

const getElectronBridge = () => {
    if (typeof window === 'undefined') return undefined;
    return window.electron;
};

/**
 * Fetch QQ public endpoints with Referer/Cookie.
 * Renderer Chromium strips those forbidden headers; Electron/main and lyric-proxy restore them.
 */
const fetchQQPublic = async (url: string, init: QQProxyFetchInit = {}): Promise<Response> => {
    const electronBridge = getElectronBridge();
    if (electronBridge?.fetchLyricProxy) {
        const proxied = await electronBridge.fetchLyricProxy(url, init);
        return new Response(proxied.bodyText, {
            status: proxied.status,
            statusText: proxied.statusText,
            headers: proxied.headers,
        });
    }

    const headers: Record<string, string> = { ...(init.headers || {}) };
    const referer = headers.Referer || headers.referer || '';
    const cookie = headers.Cookie || headers.cookie || '';
    delete headers.Referer;
    delete headers.referer;
    delete headers.Cookie;
    delete headers.cookie;
    if (referer) headers['X-Proxy-Referer'] = referer;
    if (cookie) headers['X-Proxy-Cookie'] = cookie;

    return fetch(`/api/lyric-proxy?url=${encodeURIComponent(url)}`, {
        method: init.method || 'GET',
        headers,
        body: init.body,
        credentials: 'omit',
    });
};

export const qqPlaylistNumericId = (dissid: string): number => {
    const parsed = Number(dissid);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
        return -parsed;
    }
    const hash = dissid.split('').reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
    return hash === 0 ? -1 : -Math.abs(hash);
};

const asNonEmptyString = (value: unknown): string => {
    if (typeof value === 'string') {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value) && value !== 0) {
        return String(value);
    }
    return '';
};

const asPositiveCount = (value: unknown): number => {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : 0;
};

const resolveQQCoverUrl = (item: Record<string, unknown>): string => {
    const raw = asNonEmptyString(
        item.picUrl
        || item.bigpicUrl
        || item.picurl
        || item.cover
        || item.logo
        || item.diss_cover
        || item.pic
    );
    if (!raw || raw.startsWith('?')) return '';
    if (raw.startsWith('http')) return raw.replace(/^http:/, 'https:');
    if (raw.includes('/')) return `https://y.gtimg.cn/music/photo_new/${raw}.jpg`;
    return `https://y.gtimg.cn/music/photo_new/T002R300x300M000${raw}.jpg?max_age=2592000`;
};

/** Prefer public playlist id (tid/dissid). dirId/dirid is only a local folder index. */
export const resolveQQPlaylistId = (item: Record<string, unknown>): string => {
    const candidates = [
        item.tid,
        item.dissid,
        item.disstid,
        item.diss_id,
        item.id,
    ];
    for (const candidate of candidates) {
        const value = asNonEmptyString(candidate);
        if (value && value !== '0') {
            return value;
        }
    }
    return '';
};

export const resolveQQPlaylistName = (item: Record<string, unknown>): string => {
    // dir_show / dirShow are visibility flags (0/1), never titles.
    return asNonEmptyString(
        item.dirName
        || item.diss_name
        || item.dissname
        || item.name
        || item.title
    ) || 'QQ 歌单';
};

const isQzoneBackgroundPlaylist = (item: Record<string, unknown>, name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('qzone') || name.includes('背景音乐');
};

/** Stable numeric id from QQ mid / songid so playlist tracks never collapse to 0. */
const hashQQSongId = (rawId: string): number => {
    let hash = 0x811c9dc5;
    const input = `qq:${rawId}`;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
};

export const mapQQPlaylistSong = (info: Record<string, any>): SongResult => {
    const singers = Array.isArray(info.singer) ? info.singer : [];
    const artists = singers.map((singer: Record<string, any>, index: number) => ({
        id: Number(singer.id || index),
        name: singer.name || 'Unknown Artist',
    }));
    const resolvedArtists = artists.length > 0
        ? artists
        : [{ id: 0, name: String(info.singername || info.singer?.[0]?.name || 'Unknown Artist') }];
    const albumMid = info.album?.mid || info.albummid;
    const picUrl = albumMid
        ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg?max_age=2592000`
        : undefined;

    // Public playlist payloads use songmid + strMediaMid; official APIs use mid/file.media_mid.
    const qqMid = asNonEmptyString(
        info.songmid
        || info.mid
        || info.song_mid
        || info.providerSongId
    );
    const qqMediaMid = asNonEmptyString(
        info.strMediaMid
        || info.file?.media_mid
        || info.media_mid
        || qqMid
    ) || qqMid;
    const durationMs = Number(info.interval || 0) * 1000;
    const album = {
        id: Number(info.albumid || info.album?.id || 0),
        name: info.albumname || info.album?.name || 'Unknown Album',
        picUrl,
    };
    const numericSongId = Number(info.songid || info.id || 0);
    const stableId = qqMid
        ? hashQQSongId(qqMid)
        : (Number.isFinite(numericSongId) && numericSongId > 0 ? numericSongId : hashQQSongId(String(info.songname || info.title || Date.now())));

    return {
        id: stableId,
        name: info.songname || info.title || 'Unknown Song',
        artists: resolvedArtists,
        album,
        duration: durationMs,
        ar: resolvedArtists,
        al: album,
        dt: durationMs,
        qqMid: qqMid || undefined,
        qqMediaMid: qqMediaMid || undefined,
        musicProvider: 'qq',
        providerSongId: qqMid || String(numericSongId || stableId),
    };
};

export const mapQQPlaylistItem = (item: Record<string, any>): NeteasePlaylist | null => {
    const dissid = resolveQQPlaylistId(item);
    if (!dissid) return null;

    const name = resolveQQPlaylistName(item);
    if (isQzoneBackgroundPlaylist(item, name)) {
        return null;
    }

    const updatedAt = Number(item.updateTime || item.modify_time || item.update_time || item.createtime || Date.now());
    return {
        id: qqPlaylistNumericId(dissid),
        name,
        coverImgUrl: resolveQQCoverUrl(item),
        trackCount: asPositiveCount(
            item.songNum
            ?? item.song_cnt
            ?? item.songnum
            ?? item.total_song_num
            ?? item.song_count
            ?? item.count
        ),
        playCount: asPositiveCount(
            item.play_cnt
            ?? item.listennum
            ?? item.listen_num
            ?? item.visitnum
            ?? item.play_count
        ),
        updateTime: updatedAt,
        trackUpdateTime: updatedAt,
        creator: {
            userId: 0,
            nickname: asNonEmptyString(item.nick || item.nickname || item.hostname || item.creator) || 'QQ 音乐',
            avatarUrl: '',
        },
        description: asNonEmptyString(item.desc || item.content),
        musicProvider: 'qq',
        providerPlaylistId: dissid,
    };
};

const fetchJsonWithCookie = async (url: string, cookieHeader: string, referer: string): Promise<any> => {
    const response = await fetchQQPublic(url, {
        headers: {
            Referer: referer,
            Cookie: cookieHeader,
            'User-Agent': 'Mozilla/5.0',
        },
    });
    if (!response.ok) {
        throw new Error(`QQ playlist list fetch failed: ${response.status}`);
    }
    const text = await response.text();
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return JSON.parse(trimmed);
    }
    const match = trimmed.match(/^[^(]*\(([\s\S]*)\)\s*;?\s*$/);
    if (!match?.[1]) {
        throw new Error('QQ playlist list response is not JSON');
    }
    return JSON.parse(match[1]);
};

const fetchQQPlaylistsFromPublicApis = async (uin: string, cookieHeader: string): Promise<NeteasePlaylist[]> => {
    const createdUrl = `https://c.y.qq.com/rsc/fcgi-bin/fcg_user_created_diss?hostUin=0&hostuin=${encodeURIComponent(uin)}&sin=0&size=200&g_tk=5381&loginUin=${encodeURIComponent(uin)}&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`;
    const collectUrl = `https://c.y.qq.com/fav/fcgi-bin/fcg_get_profile_order_asset.fcg?ct=20&cid=205360956&userid=${encodeURIComponent(uin)}&reqtype=3&sin=0&ein=80`;

    const [createdResult, collectResult] = await Promise.allSettled([
        fetchJsonWithCookie(createdUrl, cookieHeader, 'https://y.qq.com/portal/profile.html'),
        fetchJsonWithCookie(collectUrl, cookieHeader, 'https://y.qq.com/portal/profile.html'),
    ]);

    const created = createdResult.status === 'fulfilled' && Array.isArray(createdResult.value?.data?.disslist)
        ? createdResult.value.data.disslist
        : [];
    const collected = collectResult.status === 'fulfilled' && Array.isArray(collectResult.value?.data?.cdlist)
        ? collectResult.value.data.cdlist
        : [];

    if (createdResult.status === 'rejected') {
        console.warn('[QQMusic] created playlist API failed', createdResult.reason);
    }
    if (collectResult.status === 'rejected') {
        console.warn('[QQMusic] collected playlist API failed', collectResult.reason);
    }

    return [...created, ...collected]
        .map((item: Record<string, any>) => mapQQPlaylistItem(item))
        .filter((playlist): playlist is NeteasePlaylist => Boolean(playlist));
};

const fetchQQPlaylistsFromUinApi = async (uin: string, musicKey: string): Promise<NeteasePlaylist[]> => {
    const data = await requestQQ('GetPlaylistByUin', 'music.musicasset.PlaylistBaseRead', {
        uin,
    }, {
        comm: {
            authst: musicKey,
            ct: 19,
            cv: 2111,
            format: 'json',
            uin,
        },
    });

    const merged = [
        ...(Array.isArray(data?.v_playlist) ? data.v_playlist : []),
        ...(Array.isArray(data?.v_totpl) ? data.v_totpl : []),
    ];

    return merged
        .map((item: Record<string, any>) => mapQQPlaylistItem(item))
        .filter((playlist): playlist is NeteasePlaylist => Boolean(playlist));
};

export async function fetchQQUserPlaylists(): Promise<NeteasePlaylist[]> {
    const auth = getQQMusicAuth();
    if (!auth.isLoggedIn) {
        return [];
    }

    const deduped = new Map<string, NeteasePlaylist>();
    const ingest = (items: NeteasePlaylist[]) => {
        items.forEach((playlist) => {
            if (!playlist.providerPlaylistId || deduped.has(playlist.providerPlaylistId)) {
                return;
            }
            deduped.set(playlist.providerPlaylistId, playlist);
        });
    };

    // Authenticated Uin API first: field-complete for owned playlists.
    try {
        ingest(await fetchQQPlaylistsFromUinApi(auth.uin, auth.musicKey));
    } catch (error) {
        console.warn('[QQMusic] GetPlaylistByUin failed', error);
    }

    // Public profile APIs with cookie: adds collected playlists and fills gaps.
    try {
        ingest(await fetchQQPlaylistsFromPublicApis(auth.uin, auth.cookieHeader));
    } catch (error) {
        console.warn('[QQMusic] Public playlist APIs failed', error);
    }

    return Array.from(deduped.values());
}

const fetchQQPlaylistTracksFromPublicApi = async (
    normalizedId: string,
    uin: string,
    cookieHeader: string,
): Promise<SongResult[]> => {
    const url = `https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&disstid=${encodeURIComponent(normalizedId)}&loginUin=${encodeURIComponent(uin || '0')}&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`;
    const response = await fetchQQPublic(url, {
        headers: {
            Referer: `https://y.qq.com/n/yqq/playlist/${normalizedId}.html`,
            Cookie: cookieHeader,
            'User-Agent': 'Mozilla/5.0',
        },
    });
    if (!response.ok) {
        throw new Error(`QQ playlist fetch failed: ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.code !== 0 || Number(payload?.subcode) !== 0) {
        throw new Error(`QQ playlist API error: ${payload?.msg || `code ${payload?.code}/${payload?.subcode}`}`);
    }

    const cdlist = Array.isArray(payload?.cdlist) ? payload.cdlist[0] : null;
    const songlist = Array.isArray(cdlist?.songlist) ? cdlist.songlist : [];
    return songlist.map((song: Record<string, any>) => mapQQPlaylistSong(song));
};

export const extractQQPlaylistSongs = (payload: any): Record<string, any>[] => {
    const candidates = [
        payload?.songlist,
        payload?.dissinfo?.songlist,
        payload?.cdlist?.[0]?.songlist,
        payload?.dirinfo?.songlist,
        payload?.list,
    ];
    for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
            return candidate;
        }
    }
    return [];
};

const fetchQQPlaylistTracksFromDissInfo = async (
    normalizedId: string,
): Promise<SongResult[]> => {
    const disstid = Number(normalizedId);
    if (!Number.isFinite(disstid) || disstid <= 0) {
        return [];
    }

    const pageSize = 300;
    const collected: Record<string, any>[] = [];
    let songBegin = 0;
    let safety = 0;

    while (safety < 20) {
        safety += 1;
        const data = await requestQQ('uniform_get_Dissinfo', 'music.srfDissInfo.aiDissInfo', {
            disstid,
            tag: 1,
            userinfo: 1,
            song_begin: songBegin,
            song_num: pageSize,
        });
        const chunk = extractQQPlaylistSongs(data);
        if (chunk.length === 0) {
            break;
        }
        collected.push(...chunk);
        if (chunk.length < pageSize) {
            break;
        }
        songBegin += chunk.length;
    }

    if (collected.length === 0) {
        // Legacy method name still used by some clients.
        const legacy = await requestQQ('CgiGetDiss', 'music.srfDissInfo.aiDissInfo', {
            disstid,
            onlysonglist: 1,
            userinfo: 0,
        });
        collected.push(...extractQQPlaylistSongs(legacy));
    }

    return collected.map((song) => mapQQPlaylistSong(song));
};

export async function fetchQQPlaylistTracks(dissid: string): Promise<SongResult[]> {
    const normalizedId = dissid.trim();
    if (!normalizedId) {
        return [];
    }

    const auth = getQQMusicAuth();

    // Public playlist API first: works for many open lists without mobile DissInfo.
    try {
        const songs = await fetchQQPlaylistTracksFromPublicApi(
            normalizedId,
            auth.uin,
            auth.cookieHeader,
        );
        if (songs.length > 0) {
            return songs;
        }
    } catch (error) {
        console.warn('[QQMusic] Public playlist API failed, trying DissInfo', error);
    }

    try {
        const songs = await fetchQQPlaylistTracksFromDissInfo(normalizedId);
        if (songs.length > 0) {
            return songs;
        }
    } catch (error) {
        console.warn('[QQMusic] DissInfo playlist fetch failed', error);
    }

    return [];
}

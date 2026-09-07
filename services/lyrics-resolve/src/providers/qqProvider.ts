// services/lyrics-resolve/src/providers/qqProvider.ts
// Node-direct QQ Music search + QRC lyric fetch (Cookie via env when needed).

import { parseLyricsByFormat } from '@lyra/utils/lyrics/parserCore';
import { detectTimedLyricFormat } from '@lyra/utils/lyrics/formatDetection';
import { qrcDecrypt } from '@lyra/utils/lyrics/providers/qrcDecrypt';
import type { LyricData } from '@lyra/types';
import type { FetchedLyricPayload, LyricSourcePort, ResolveCandidate } from './types';

function toBase64(str: string): string {
    return Buffer.from(str, 'utf8').toString('base64');
}

function detectIsQrc(content: string): boolean {
    return content.includes('(') && content.includes(')') && /\[\d+,\d+\]/.test(content);
}

async function requestQQ(method: string, module: string, param: Record<string, unknown>): Promise<any> {
    const cookie = process.env.QQ_MUSIC_COOKIE || '';
    const uin = process.env.QQ_MUSIC_UIN || '0';
    const payload = {
        comm: {
            ct: 11,
            cv: '1003006',
            v: '1003006',
            os_ver: '15',
            phonetype: '24122RKC7C',
            rom: 'Redmi/miro/miro:15/AE3A.240806.005/OS2.0.102.0.VOMCNXM:user/release-keys',
            tmeAppID: 'qqmusiclight',
            nettype: 'NETWORK_WIFI',
            udid: '0',
            uid: uin,
        },
        request: { method, module, param },
    };

    const response = await fetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {}),
            'User-Agent': 'okhttp/3.14.9',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
        throw new Error(`QQ Music API request failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.code !== 0 || data.request?.code !== 0) {
        throw new Error(`QQ Music API error: code ${data.code || data.request?.code}`);
    }
    return data.request.data;
}

export function createQqProvider(): LyricSourcePort {
    return {
        id: 'qq',
        search: async (query, limit) => {
            const safeKeyword = query.trim();
            if (!safeKeyword) return [];
            try {
                const data = await requestQQ('DoSearchForQQMusicLite', 'music.search.SearchCgiService', {
                    search_id: String(Math.floor(Math.random() * 1e14 + Date.now() % 86400000)),
                    remoteplace: 'search.android.keyboard',
                    query: safeKeyword.length > 60 ? safeKeyword.slice(0, 60) : safeKeyword,
                    search_type: 0,
                    num_per_page: limit,
                    page_num: 1,
                    highlight: 0,
                    nqc_flag: 0,
                    page_id: 1,
                    grp: 1,
                });
                const songs = data?.body?.item_song || [];
                return songs.map((info: any): ResolveCandidate => {
                    const artists = (info.singer || []).map((s: any, idx: number) => ({
                        id: s.id || idx,
                        name: s.name || 'Unknown Artist',
                    }));
                    return {
                        id: Number(info.id || 0),
                        name: info.title || 'Unknown Song',
                        artists,
                        album: {
                            id: Number(info.album?.id || 0),
                            name: info.album?.name || 'Unknown Album',
                        },
                        duration: (info.interval || 0) * 1000,
                        dt: (info.interval || 0) * 1000,
                        qqMid: info.mid,
                    };
                });
            } catch (error) {
                console.warn('[lyrics-resolve] QQ search failed:', error);
                return [];
            }
        },
        fetchLyrics: async (candidate): Promise<FetchedLyricPayload> => {
            if (!candidate.id || !candidate.qqMid) {
                return { lyrics: null };
            }
            const artistsStr = candidate.artists?.map(a => a.name).join(', ') || '';
            try {
                const data = await requestQQ('GetPlayLyricInfo', 'music.musichallSong.PlayLyricInfo', {
                    albumName: toBase64(candidate.album?.name || ''),
                    crypt: 1,
                    ct: 19,
                    cv: 2111,
                    interval: Math.floor((candidate.duration || candidate.dt || 0) / 1000),
                    lrc_t: 0,
                    qrc: 1,
                    qrc_t: 0,
                    roma: 1,
                    roma_t: 0,
                    singerName: toBase64(artistsStr),
                    songID: Number(candidate.id),
                    songName: toBase64(candidate.name),
                    trans: 1,
                    trans_t: 0,
                    type: 0,
                });
                const encryptedLyricHex = data?.lyric;
                if (!encryptedLyricHex) {
                    return { lyrics: null };
                }
                const decryptedLyric = await qrcDecrypt(encryptedLyricHex);
                const decryptedTrans = data?.trans ? await qrcDecrypt(data.trans) : '';
                const isQrc = detectIsQrc(decryptedLyric);
                const format = isQrc ? 'qrc' : detectTimedLyricFormat(decryptedLyric);
                const lyrics = parseLyricsByFormat(format, decryptedLyric, decryptedTrans) as LyricData | null;
                if (lyrics) {
                    lyrics.isWordByWord = isQrc;
                }
                return { lyrics };
            } catch (error) {
                console.warn('[lyrics-resolve] QQ lyric fetch failed:', error);
                return { lyrics: null };
            }
        },
    };
}

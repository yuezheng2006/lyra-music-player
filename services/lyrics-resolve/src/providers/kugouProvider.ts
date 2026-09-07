// services/lyrics-resolve/src/providers/kugouProvider.ts
// Node-direct Kugou lyric search + KRC download/decrypt.

import md5 from 'blueimp-md5';
import { parseLyricsByFormat } from '@lyra/utils/lyrics/parserCore';
import { detectNonTtmlTimedLyricFormat } from '@lyra/utils/lyrics/formatDetection';
import { krcDecrypt } from '@lyra/utils/lyrics/providers/krcDecrypt';
import { buildKugouLyricSearchQuery } from '@lyra/utils/lyrics/searchQuery';
import type { LyricData } from '@lyra/types';
import type { FetchedLyricPayload, LyricSourcePort, ResolveCandidate } from './types';

function hasKrcHeader(bytes: Uint8Array): boolean {
    return bytes.length >= 4 && bytes[0] === 107 && bytes[1] === 114 && bytes[2] === 99 && bytes[3] === 49;
}

function signParams(params: Record<string, string | number>): string {
    const sortedKeys = Object.keys(params).sort();
    let str = 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA';
    for (const key of sortedKeys) {
        str += `${key}=${params[key]}`;
    }
    str += 'LnT6xpN3khm36zse0QzvmgTZ3waWdRSA';
    return md5(str);
}

async function requestKugou(
    baseUrl: string,
    params: Record<string, string | number>,
): Promise<any> {
    const signed = { ...params, signature: signParams(params) };
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(signed)) {
        url.searchParams.set(key, String(value));
    }
    const response = await fetch(url.toString(), {
        headers: {
            'User-Agent': 'Android12-QQMusic-1003006',
            'KG-RC': '1',
            'KG-THash': 'handbook',
        },
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
        throw new Error(`Kugou API ${response.status}`);
    }
    return response.json();
}

async function decodeKugouLyric(bytes: Uint8Array, contentType: unknown): Promise<{ text: string; format: string }> {
    const isPlain = String(contentType) === '2';
    if (isPlain || !hasKrcHeader(bytes)) {
        const text = new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');
        return { text, format: detectNonTtmlTimedLyricFormat(text) };
    }
    const text = await krcDecrypt(bytes);
    return { text, format: 'krc' };
}

export function createKugouProvider(): LyricSourcePort {
    return {
        id: 'kugou',
        search: async (query, limit) => {
            const keyword = buildKugouLyricSearchQuery(query);
            if (!keyword) return [];
            try {
                const clienttime = Math.floor(Date.now() / 1000);
                const data = await requestKugou('http://mobilecdn.kugou.com/api/v3/search/song', {
                    format: 'json',
                    keyword,
                    page: 1,
                    pagesize: limit,
                    showtype: 1,
                    clienttime,
                });
                const list = data?.data?.info || [];
                return list.map((info: any): ResolveCandidate => {
                    const artists = String(info.singername || '')
                        .split(/[、,&]/)
                        .map((name: string, idx: number) => ({ id: idx, name: name.trim() }))
                        .filter((a: { name: string }) => a.name);
                    return {
                        id: Number(info.album_audio_id || info.audio_id || 0),
                        name: info.songname || 'Unknown Song',
                        artists,
                        album: { id: Number(info.album_id || 0), name: info.album_name || 'Unknown Album' },
                        duration: (info.duration || 0) * 1000,
                        dt: (info.duration || 0) * 1000,
                        kgHash: info.hash,
                    };
                });
            } catch (error) {
                console.warn('[lyrics-resolve] Kugou search failed:', error);
                return [];
            }
        },
        fetchLyrics: async (candidate): Promise<FetchedLyricPayload> => {
            if (!candidate.kgHash) {
                return { lyrics: null };
            }
            const artistsStr = candidate.artists?.map(a => a.name).join(', ') || '';
            try {
                const searchRes = await requestKugou('https://lyrics.kugou.com/v1/search', {
                    album_audio_id: Number(candidate.id) || 0,
                    duration: candidate.duration || candidate.dt || 0,
                    hash: candidate.kgHash,
                    keyword: `${artistsStr} - ${candidate.name}`,
                    lrctxt: '1',
                    man: 'no',
                });
                const best = searchRes?.candidates?.[0];
                if (!best) {
                    return { lyrics: null };
                }
                const downloadRes = await requestKugou('http://lyrics.kugou.com/download', {
                    accesskey: best.accesskey,
                    charset: 'utf8',
                    client: 'mobi',
                    fmt: 'krc',
                    id: best.id,
                    ver: '1',
                });
                const base64Str = downloadRes?.content;
                if (!base64Str) {
                    return { lyrics: null };
                }
                const bytes = Buffer.from(base64Str, 'base64');
                const { text, format } = await decodeKugouLyric(bytes, downloadRes.contenttype);
                const lyrics = parseLyricsByFormat(format as any, text, '') as LyricData | null;
                if (lyrics) {
                    lyrics.isWordByWord = format === 'krc' || format === 'enhanced-lrc';
                }
                return { lyrics };
            } catch (error) {
                console.warn('[lyrics-resolve] Kugou lyric fetch failed:', error);
                return { lyrics: null };
            }
        },
    };
}

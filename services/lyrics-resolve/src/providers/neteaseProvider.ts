// services/lyrics-resolve/src/providers/neteaseProvider.ts
// Node Netease search + lyric fetch against NETEASE_API_BASE.

import { parseLyricsByFormat } from '@lyra/utils/lyrics/parserCore';
import { detectTimedLyricFormat } from '@lyra/utils/lyrics/formatDetection';
import { hasNeteasePureMusicFlag, isPureMusicLyricText } from '@lyra/utils/lyrics/pureMusic';
import type { LyricData } from '@lyra/types';
import type { FetchedLyricPayload, LyricSourcePort, ResolveCandidate } from './types';

function getNeteaseApiBase(): string {
    return (
        process.env.NETEASE_API_BASE
        || process.env.VITE_NETEASE_API_BASE
        || 'http://127.0.0.1:3001'
    ).replace(/\/$/, '');
}

async function neteaseGet(path: string): Promise<any> {
    const url = `${getNeteaseApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
        throw new Error(`Netease API ${response.status} for ${path}`);
    }
    return response.json();
}

function toCandidate(song: any): ResolveCandidate {
    return {
        id: song.id,
        name: song.name || '',
        artists: (song.ar || song.artists || []).map((a: any, idx: number) => ({
            id: a.id ?? idx,
            name: a.name || '',
        })),
        ar: song.ar || song.artists,
        album: song.al || song.album,
        al: song.al || song.album,
        duration: song.dt || song.duration || 0,
        dt: song.dt || song.duration || 0,
    };
}

async function processNeteaseLyricPayload(lyricRes: any, songId: number | string): Promise<FetchedLyricPayload> {
    const mainLrc = lyricRes?.lrc?.lyric || null;
    const yrcLrc = lyricRes?.yrc?.lyric || lyricRes?.lrc?.yrc?.lyric || null;
    const ytlrc = lyricRes?.ytlrc?.lyric || lyricRes?.lrc?.ytlrc?.lyric || null;
    const tlyric = lyricRes?.tlyric?.lyric || null;
    const transLrc = (yrcLrc && ytlrc) ? ytlrc : tlyric;
    const isPureMusic = hasNeteasePureMusicFlag(lyricRes) || isPureMusicLyricText(mainLrc);
    const primary = yrcLrc || mainLrc;

    if (!primary || isPureMusic) {
        return { lyrics: null, isPureMusic };
    }

    const format = yrcLrc ? 'yrc' : detectTimedLyricFormat(mainLrc || primary);
    const lyrics = parseLyricsByFormat(format, primary, transLrc || '') as LyricData | null;
    if (lyrics) {
        lyrics.isWordByWord = Boolean(yrcLrc);
    }
    void songId;
    return { lyrics, isPureMusic: false };
}

export function createNeteaseProvider(): LyricSourcePort {
    return {
        id: 'netease',
        search: async (query, limit) => {
            const data = await neteaseGet(
                `/cloudsearch?keywords=${encodeURIComponent(query)}&limit=${limit}&offset=0`,
            );
            return (data?.result?.songs || []).map(toCandidate);
        },
        fetchLyrics: async (candidate) => {
            const lyricRes = await neteaseGet(`/lyric/new?id=${encodeURIComponent(String(candidate.id))}`);
            return processNeteaseLyricPayload(lyricRes, candidate.id);
        },
    };
}

export async function fetchNeteaseLyricsById(songId: number | string): Promise<FetchedLyricPayload> {
    const lyricRes = await neteaseGet(`/lyric/new?id=${encodeURIComponent(String(songId))}`);
    return processNeteaseLyricPayload(lyricRes, songId);
}

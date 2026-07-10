import type { SongResult } from '../types';
import { neteaseApi } from './netease';
import { getMusicProvider } from './musicProviders/registry';
import type { OnlineMusicProviderId } from '../types';

// src/services/dailyChartPicks.ts
// Map Netease hot-chart seeds onto peer providers (one unique song per title).

/** Netease 热歌榜 — public chart used as quality seed for peer daily picks. */
export const NETEASE_HOT_CHART_PLAYLIST_ID = 3778678;

export type ChartSeed = {
    name: string;
    artist: string;
};

/** Strip version suffixes so "海阔天空 (女版)" collapses with "海阔天空". */
export const normalizeRecommendTitle = (name?: string | null): string =>
    String(name || '')
        .replace(/[（(【\[].*?[）\)\]】]/g, '')
        .replace(/[-–—].*$/u, '')
        .replace(/\s+/g, '')
        .toLowerCase();

export const recommendTitleKey = (song: Pick<SongResult, 'name'>): string =>
    normalizeRecommendTitle(song.name);

/** Keep first occurrence per normalized title. */
export const dedupeSongsByTitle = (songs: SongResult[]): SongResult[] => {
    const seen = new Set<string>();
    const out: SongResult[] = [];
    for (const song of songs) {
        const key = recommendTitleKey(song);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(song);
    }
    return out;
};

const FALLBACK_CHART_SEEDS: readonly ChartSeed[] = [
    { name: '爱人错过', artist: '告五人' },
    { name: '如愿', artist: '王菲' },
    { name: '消愁', artist: '毛不易' },
    { name: '起风了', artist: '买辣椒也用券' },
    { name: '光年之外', artist: 'G.E.M.邓紫棋' },
    { name: '晴天', artist: '周杰伦' },
    { name: '演员', artist: '薛之谦' },
    { name: '孤勇者', artist: '陈奕迅' },
    { name: '海阔天空', artist: 'Beyond' },
    { name: '夜曲', artist: '周杰伦' },
    { name: '稻香', artist: '周杰伦' },
    { name: '告白气球', artist: '周杰伦' },
    { name: '错位时空', artist: '艾辰' },
    { name: '我记得', artist: '赵雷' },
    { name: '平凡之路', artist: '朴树' },
    { name: '成都', artist: '赵雷' },
];

/** Rotate fallback seeds by calendar day so anonymous days still feel fresh. */
const rotateFallbackSeeds = (limit: number): ChartSeed[] => {
    const now = new Date();
    const offset = (now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate()) % FALLBACK_CHART_SEEDS.length;
    const rotated = [
        ...FALLBACK_CHART_SEEDS.slice(offset),
        ...FALLBACK_CHART_SEEDS.slice(0, offset),
    ];
    return rotated.slice(0, limit);
};

/** Load hot-chart seeds from Netease; fall back to curated list. */
export const fetchHotChartSeeds = async (limit: number): Promise<ChartSeed[]> => {
    const capped = Math.max(1, Math.min(limit, 24));
    try {
        const res = await neteaseApi.getPlaylistDetail(NETEASE_HOT_CHART_PLAYLIST_ID);
        const tracks = Array.isArray(res?.playlist?.tracks) ? res.playlist.tracks : [];
        const seeds: ChartSeed[] = [];
        const seen = new Set<string>();
        for (const track of tracks) {
            const name = String(track?.name || '').trim();
            if (!name) continue;
            const key = normalizeRecommendTitle(name);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            const artist = Array.isArray(track?.ar)
                ? track.ar.map((a: { name?: string }) => a?.name).filter(Boolean).join(' / ')
                : '';
            seeds.push({ name, artist: String(artist || '').trim() });
            if (seeds.length >= capped) break;
        }
        if (seeds.length > 0) return seeds;
    } catch (error) {
        console.warn('[dailyChartPicks] hot chart failed, using fallback seeds', error);
    }
    return rotateFallbackSeeds(capped);
};

const scoreMatch = (song: SongResult, seed: ChartSeed): number => {
    const title = normalizeRecommendTitle(song.name);
    const seedTitle = normalizeRecommendTitle(seed.name);
    if (!title || !seedTitle) return -1;
    if (title !== seedTitle && !title.includes(seedTitle) && !seedTitle.includes(title)) {
        return -1;
    }
    let score = title === seedTitle ? 40 : 20;
    const artistBlob = (song.artists || song.ar || [])
        .map(a => a.name)
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    const seedArtist = seed.artist.toLowerCase();
    if (seedArtist && artistBlob.includes(seedArtist.split(/[\/、,&]/)[0]?.trim() || seedArtist)) {
        score += 30;
    }
    if (song.album?.picUrl || song.al?.picUrl) score += 5;
    return score;
};

const matchSeedOnProvider = async (
    provider: OnlineMusicProviderId,
    seed: ChartSeed,
): Promise<SongResult | null> => {
    const query = `${seed.name} ${seed.artist}`.trim();
    try {
        const result = await getMusicProvider(provider).search(query, { limit: 6, offset: 0 });
        let best: SongResult | null = null;
        let bestScore = -1;
        for (const song of result.songs || []) {
            const score = scoreMatch(song, seed);
            if (score > bestScore) {
                bestScore = score;
                best = {
                    ...song,
                    musicProvider: song.musicProvider || provider,
                };
            }
        }
        return bestScore >= 20 ? best : null;
    } catch {
        return null;
    }
};

/**
 * Resolve chart seeds on a peer provider: one song per seed title, parallel batches.
 */
export const fetchChartMatchedPicks = async (
    provider: OnlineMusicProviderId,
    seeds: ChartSeed[],
    limit: number,
): Promise<SongResult[]> => {
    const capped = Math.max(1, Math.min(limit, 16));
    const picks: SongResult[] = [];
    const seen = new Set<string>();
    const queue = seeds.slice(0, Math.max(capped * 2, capped + 4));
    const batchSize = 4;

    for (let i = 0; i < queue.length && picks.length < capped; i += batchSize) {
        const batch = queue.slice(i, i + batchSize);
        const matched = await Promise.all(batch.map(seed => matchSeedOnProvider(provider, seed)));
        for (const song of matched) {
            if (!song) continue;
            const key = recommendTitleKey(song);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            picks.push(song);
            if (picks.length >= capped) break;
        }
    }

    return picks;
};

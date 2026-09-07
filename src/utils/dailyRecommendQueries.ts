import type { OnlineMusicProviderId } from '../types';

// src/utils/dailyRecommendQueries.ts
// Day-seeded keyword picks used when a provider has no personalized daily API.

const SONG_QUERIES = [
    '晴天', '起风了', '海阔天空', '夜曲', '告白气球', '消愁', '演员', '稻香',
] as const;

const QUERIES: Record<'qq' | 'qishui' | 'coco' | 'kugou' | 'kuwo', readonly string[]> = {
    qq: SONG_QUERIES,
    qishui: ['消愁', '光年之外', '孤勇者', '错位时空', '演员', '起风了', '晴天'],
    coco: ['晴天', '起风了', '海阔天空', '夜曲', '告白气球', '稻香', '演员'],
    kugou: SONG_QUERIES,
    kuwo: SONG_QUERIES,
};

const daySeed = (offset = 0) => {
    const now = new Date();
    return now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate() + offset;
};

/** Stable daily keyword for peer-channel picks (real online search, not mock songs). */
export const pickDailyRecommendQuery = (
    provider: OnlineMusicProviderId | string,
): string => {
    if (provider === 'qq') {
        const list = QUERIES.qq;
        return list[daySeed() % list.length];
    }
    if (provider === 'qishui') {
        const list = QUERIES.qishui;
        return list[daySeed() % list.length];
    }
    if (provider === 'coco') {
        const list = QUERIES.coco;
        return list[daySeed(3) % list.length];
    }
    if (provider === 'kugou') {
        const list = QUERIES.kugou;
        return list[daySeed(1) % list.length];
    }
    if (provider === 'kuwo') {
        const list = QUERIES.kuwo;
        return list[daySeed(2) % list.length];
    }
    const list = SONG_QUERIES;
    return list[daySeed() % list.length];
};

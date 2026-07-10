import type { OnlineMusicProviderId } from '../types';

// src/utils/dailyRecommendQueries.ts
// Day-seeded keyword picks used when a provider has no personalized daily API.

const QUERIES: Record<'qq' | 'qishui' | 'coco', readonly string[]> = {
    qq: ['晴天', '起风了', '海阔天空', '夜曲', '告白气球', '消愁', '演员', '稻香'],
    qishui: ['消愁', '光年之外', '孤勇者', '错位时空', '演员', '起风了', '晴天'],
    coco: ['晴天', '起风了', '海阔天空', '夜曲', '告白气球', '稻香', '演员'],
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
    return '流行';
};

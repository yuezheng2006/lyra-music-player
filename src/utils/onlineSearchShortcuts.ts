import type { OnlineMusicProviderId } from '../types';

// src/utils/onlineSearchShortcuts.ts
// Static popular / common search chips for free peer channels (placeholder lists).

export type OnlineSearchShortcutGroupId = 'hot' | 'common' | 'accounts' | 'category' | 'song';

export type OnlineSearchShortcutGroup = {
    id: OnlineSearchShortcutGroupId;
    queries: readonly string[];
};

/** Providers that show empty-state search shortcut chips. */
export const SEARCH_SHORTCUT_PROVIDER_IDS = ['coco', 'qishui', 'bilibili'] as const;

/** Strip routing prefixes before showing shortcut labels or filling the input box. */
export const stripShortcutDisplayLabel = (query: string): string =>
    query.replace(/^(?:up:|账号:|用户:|@|cat:|分类:|song:|歌曲:)\s*/i, '');

export type SearchShortcutProviderId = (typeof SEARCH_SHORTCUT_PROVIDER_IDS)[number];

const COCO_SHORTCUTS: readonly OnlineSearchShortcutGroup[] = [
    {
        id: 'hot',
        // Broader mainstream hits for the free aggregator channel.
        queries: ['晴天', '起风了', '海阔天空', '孤勇者', '夜曲', '演员', '光年之外'],
    },
    {
        id: 'common',
        queries: ['周杰伦', '林俊杰', '邓紫棋', '陈奕迅', '五月天', '薛之谦', '毛不易'],
    },
];

const QISHUI_SHORTCUTS: readonly OnlineSearchShortcutGroup[] = [
    {
        id: 'category',
        // Playlist/category discovery — adapter resolves via search/playlist (cat: prefix).
        queries: ['cat:周杰伦', 'cat:大头针', 'cat:AI歌曲', 'cat:AI翻唱', 'cat:AI孙燕姿'],
    },
    {
        id: 'song',
        queries: ['周杰伦 晴天', '大头针', 'AI周杰伦', 'AI邓紫棋', 'AI陈奕迅'],
    },
];

/**
 * Bilibili shortcuts — only keep queries verified to return real hits.
 * Hot keywords must not collide with account display labels.
 */
const BILIBILI_SHORTCUTS: readonly OnlineSearchShortcutGroup[] = [
    {
        id: 'accounts',
        // Force UP mode so chips never fall through to keyword video search.
        queries: [
            'up:天花板上吊着猫',
            'up:溪谷之风',
            'up:阿德托昆博带件衣服',
            'up:黑蓝墨水就爱搞事儿',
            'up:漫游会议室',
            'up:狼叔-回声电台',
        ],
    },
    {
        id: 'hot',
        // Probed 2026-07-27: plain "AI歌曲/AI周杰伦/AI邓紫棋" often return 0 hits.
        queries: [
            'AI翻唱 周杰伦',
            'AI翻唱 邓紫棋',
            'AI孙燕姿',
            'AI陈奕迅',
            'SUNO翻唱',
        ],
    },
];

/** Drop empty / duplicate display labels across groups (first occurrence wins). */
export const dedupeShortcutGroupsByDisplayLabel = (
    groups: readonly OnlineSearchShortcutGroup[],
): OnlineSearchShortcutGroup[] => {
    const seen = new Set<string>();
    return groups
        .map((group) => {
            const queries = group.queries.filter((query) => {
                const label = stripShortcutDisplayLabel(query).trim().toLowerCase();
                if (!label || seen.has(label)) return false;
                seen.add(label);
                return true;
            });
            return { id: group.id, queries };
        })
        .filter((group) => group.queries.length > 0);
};

export const isSearchShortcutProvider = (
    provider?: string | null,
): provider is SearchShortcutProviderId =>
    provider === 'coco' || provider === 'qishui' || provider === 'bilibili';

/** Resolve static shortcut groups for a peer search channel. */
export const getOnlineSearchShortcutGroups = (
    provider: OnlineMusicProviderId | string | null | undefined,
): readonly OnlineSearchShortcutGroup[] => {
    if (provider === 'qishui') return dedupeShortcutGroupsByDisplayLabel(QISHUI_SHORTCUTS);
    if (provider === 'coco') return dedupeShortcutGroupsByDisplayLabel(COCO_SHORTCUTS);
    if (provider === 'bilibili') return dedupeShortcutGroupsByDisplayLabel(BILIBILI_SHORTCUTS);
    return [];
};

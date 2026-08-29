import type { OnlineMusicProviderId } from '../types';
import type { OnlineSearchShortcutGroupId } from './search/peerSearchClassification';

// src/utils/onlineSearchShortcuts.ts
// Static popular / common search chips for free peer channels (placeholder lists).

export type { OnlineSearchShortcutGroupId };

export type OnlineSearchShortcutGroup = {
    id: OnlineSearchShortcutGroupId;
    queries: readonly string[];
};

/** Providers that show empty-state search shortcut chips. */
export const SEARCH_SHORTCUT_PROVIDER_IDS = ['coco', 'qishui', 'kugou', 'bilibili', 'kuwo'] as const;

/** Strip routing prefixes before showing shortcut labels or filling the input box. */
export const stripShortcutDisplayLabel = (query: string): string =>
    query.replace(/^(?:up:|账号:|用户:|@|cat:|分类:|song:|歌曲:|mid:|uid:)\s*/i, '');

export type SearchShortcutProviderId = (typeof SEARCH_SHORTCUT_PROVIDER_IDS)[number];

const KEYWORD_SONG_SHORTCUTS = ['晴天', '起风了', '海阔天空', '孤勇者', '夜曲', '演员', '光年之外'] as const;
const KEYWORD_ARTIST_SHORTCUTS = ['周杰伦', '林俊杰', '邓紫棋', '陈奕迅', '五月天', '薛之谦', '毛不易'] as const;

const KEYWORD_SHORTCUTS: readonly OnlineSearchShortcutGroup[] = [
    { id: 'song', queries: KEYWORD_SONG_SHORTCUTS },
    { id: 'artist', queries: KEYWORD_ARTIST_SHORTCUTS },
];

const QISHUI_ARTIST_SHORTCUTS = ['周杰伦', '林俊杰', '邓紫棋', '陈奕迅', '五月天'] as const;
const QISHUI_SONG_SHORTCUTS = ['song:晴天', 'song:起风了', 'song:孤勇者', 'song:海阔天空'] as const;

const QISHUI_SHORTCUTS: readonly OnlineSearchShortcutGroup[] = [
    {
        id: 'category',
        queries: ['cat:AI歌曲', 'cat:AI翻唱', 'cat:AI周杰伦', 'cat:流行', 'cat:轻音乐'],
    },
    { id: 'artist', queries: QISHUI_ARTIST_SHORTCUTS },
    { id: 'song', queries: QISHUI_SONG_SHORTCUTS },
];

/**
 * Bilibili shortcuts — only keep queries verified to return real hits.
 * Hot keywords must not collide with account display labels.
 */
const BILIBILI_SHORTCUTS: readonly OnlineSearchShortcutGroup[] = [
    {
        id: 'accounts',
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
        id: 'song',
        queries: [
            'AI翻唱 周杰伦',
            'AI翻唱 邓紫棋',
            'AI孙燕姿',
            'AI陈奕迅',
            'SUNO翻唱',
        ],
    },
];

const SEARCH_SHORTCUT_HINT_KEY: Record<SearchShortcutProviderId, string> = {
    coco: 'search.cocoShortcutsHint',
    qishui: 'search.qishuiShortcutsHint',
    kugou: 'search.shortcutsHint',
    bilibili: 'search.bilibiliShortcutsHint',
    kuwo: 'search.shortcutsHint',
};

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
    provider === 'coco'
    || provider === 'qishui'
    || provider === 'kugou'
    || provider === 'bilibili'
    || provider === 'kuwo';

/** Resolve static shortcut groups for a peer search channel. */
export const getOnlineSearchShortcutGroups = (
    provider: OnlineMusicProviderId | string | null | undefined,
): readonly OnlineSearchShortcutGroup[] => {
    if (provider === 'qishui') return dedupeShortcutGroupsByDisplayLabel(QISHUI_SHORTCUTS);
    if (provider === 'coco' || provider === 'kugou' || provider === 'kuwo') {
        return dedupeShortcutGroupsByDisplayLabel(KEYWORD_SHORTCUTS);
    }
    if (provider === 'bilibili') return dedupeShortcutGroupsByDisplayLabel(BILIBILI_SHORTCUTS);
    return [];
};

export const getSearchShortcutHintKey = (provider: string | null | undefined): string => {
    if (isSearchShortcutProvider(provider)) return SEARCH_SHORTCUT_HINT_KEY[provider];
    return 'search.shortcutsHint';
};

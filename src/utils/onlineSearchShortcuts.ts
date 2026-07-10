import type { OnlineMusicProviderId } from '../types';

// src/utils/onlineSearchShortcuts.ts
// Static popular / common search chips for free peer channels (placeholder lists).

export type OnlineSearchShortcutGroupId = 'hot' | 'common';

export type OnlineSearchShortcutGroup = {
    id: OnlineSearchShortcutGroupId;
    queries: readonly string[];
};

/** Providers that show empty-state search shortcut chips. */
export const SEARCH_SHORTCUT_PROVIDER_IDS = ['coco', 'qishui'] as const;

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
        id: 'hot',
        // Qishui-first: Jay Chou, Pins (大头针), and AI-song discovery.
        queries: ['周杰伦', '大头针', 'AI歌曲', 'AI翻唱', 'AI孙燕姿'],
    },
    {
        id: 'common',
        queries: ['周杰伦 晴天', '大头针', 'AI周杰伦', 'AI邓紫棋', 'AI陈奕迅'],
    },
];

export const isSearchShortcutProvider = (
    provider?: string | null,
): provider is SearchShortcutProviderId =>
    provider === 'coco' || provider === 'qishui';

/** Resolve static shortcut groups for a peer search channel. */
export const getOnlineSearchShortcutGroups = (
    provider: OnlineMusicProviderId | string | null | undefined,
): readonly OnlineSearchShortcutGroup[] => {
    if (provider === 'qishui') return QISHUI_SHORTCUTS;
    if (provider === 'coco') return COCO_SHORTCUTS;
    return [];
};

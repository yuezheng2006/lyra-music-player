import type { OnlineMusicProviderId } from '../types';

// src/utils/onlineSearchShortcuts.ts
// Static popular / common search chips for free peer channels (placeholder lists).

export type OnlineSearchShortcutGroupId = 'hot' | 'common' | 'accounts';

export type OnlineSearchShortcutGroup = {
    id: OnlineSearchShortcutGroupId;
    queries: readonly string[];
};

/** Providers that show empty-state search shortcut chips. */
export const SEARCH_SHORTCUT_PROVIDER_IDS = ['coco', 'qishui', 'bilibili'] as const;

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

/** Popular Bilibili AI-song UP names — tap to run video search. */
const BILIBILI_SHORTCUTS: readonly OnlineSearchShortcutGroup[] = [
    {
        id: 'accounts',
        queries: [
            '天花板上吊着猫',
            '溪谷之风',
            '阿德托昆博带件衣服',
            '黑蓝墨水就爱搞事儿',
            '漫游会议室',
            '狼叔-回声电台',
        ],
    },
    {
        id: 'hot',
        queries: ['AI歌曲', 'AI翻唱', 'AI周杰伦', 'AI邓紫棋', 'AI孙燕姿'],
    },
];

export const isSearchShortcutProvider = (
    provider?: string | null,
): provider is SearchShortcutProviderId =>
    provider === 'coco' || provider === 'qishui' || provider === 'bilibili';

/** Resolve static shortcut groups for a peer search channel. */
export const getOnlineSearchShortcutGroups = (
    provider: OnlineMusicProviderId | string | null | undefined,
): readonly OnlineSearchShortcutGroup[] => {
    if (provider === 'qishui') return QISHUI_SHORTCUTS;
    if (provider === 'coco') return COCO_SHORTCUTS;
    if (provider === 'bilibili') return BILIBILI_SHORTCUTS;
    return [];
};

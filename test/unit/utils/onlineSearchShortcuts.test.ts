import { describe, expect, it } from 'vitest';
import {
    dedupeShortcutGroupsByDisplayLabel,
    getOnlineSearchShortcutGroups,
    isSearchShortcutProvider,
    stripShortcutDisplayLabel,
} from '@/utils/onlineSearchShortcuts';

// test/unit/utils/onlineSearchShortcuts.test.ts

describe('onlineSearchShortcuts', () => {
    it('recognizes coco, qishui, and bilibili as shortcut providers', () => {
        expect(isSearchShortcutProvider('coco')).toBe(true);
        expect(isSearchShortcutProvider('qishui')).toBe(true);
        expect(isSearchShortcutProvider('bilibili')).toBe(true);
        expect(isSearchShortcutProvider('netease')).toBe(false);
        expect(isSearchShortcutProvider('qq')).toBe(false);
    });

    it('returns hot and common placeholder groups for coco', () => {
        const groups = getOnlineSearchShortcutGroups('coco');
        expect(groups.map(group => group.id)).toEqual(['hot', 'common']);
        expect(groups.every(group => group.queries.length > 0)).toBe(true);
    });

    it('returns category and song placeholder groups for qishui', () => {
        const coco = getOnlineSearchShortcutGroups('coco');
        const qishui = getOnlineSearchShortcutGroups('qishui');
        expect(qishui.map(group => group.id)).toEqual(['category', 'song']);
        expect(qishui[0].queries).not.toEqual(coco[0].queries);
        expect(qishui[0].queries.slice(0, 3)).toEqual(['cat:周杰伦', 'cat:大头针', 'cat:AI歌曲']);
        expect(qishui[1].queries).toContain('周杰伦 晴天');
    });

    it('returns Bilibili AI account shortcuts and verified hot keywords without duplicates', () => {
        const groups = getOnlineSearchShortcutGroups('bilibili');
        expect(groups.map(group => group.id)).toEqual(['accounts', 'hot']);
        expect(groups[0].queries).toEqual([
            'up:天花板上吊着猫',
            'up:溪谷之风',
            'up:阿德托昆博带件衣服',
            'up:黑蓝墨水就爱搞事儿',
            'up:漫游会议室',
            'up:狼叔-回声电台',
        ]);
        expect(groups[1].queries).toEqual([
            'AI翻唱 周杰伦',
            'AI翻唱 邓紫棋',
            'AI孙燕姿',
            'AI陈奕迅',
            'SUNO翻唱',
        ]);

        const labels = groups.flatMap(group => (
            group.queries.map(query => stripShortcutDisplayLabel(query).trim().toLowerCase())
        ));
        expect(new Set(labels).size).toBe(labels.length);
    });

    it('dedupes shortcut display labels across groups', () => {
        const deduped = dedupeShortcutGroupsByDisplayLabel([
            { id: 'accounts', queries: ['up:溪谷之风', 'up:漫游会议室'] },
            { id: 'hot', queries: ['溪谷之风', 'AI孙燕姿', 'AI孙燕姿'] },
        ]);
        expect(deduped).toEqual([
            { id: 'accounts', queries: ['up:溪谷之风', 'up:漫游会议室'] },
            { id: 'hot', queries: ['AI孙燕姿'] },
        ]);
    });

    it('returns empty for unsupported providers', () => {
        expect(getOnlineSearchShortcutGroups('netease')).toEqual([]);
        expect(getOnlineSearchShortcutGroups(null)).toEqual([]);
    });
});

import { describe, expect, it } from 'vitest';
import {
    getOnlineSearchShortcutGroups,
    isSearchShortcutProvider,
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

    it('returns distinct placeholder lists for qishui', () => {
        const coco = getOnlineSearchShortcutGroups('coco');
        const qishui = getOnlineSearchShortcutGroups('qishui');
        expect(qishui.map(group => group.id)).toEqual(['hot', 'common']);
        expect(qishui[0].queries).not.toEqual(coco[0].queries);
        expect(qishui[0].queries.slice(0, 3)).toEqual(['周杰伦', '大头针', 'AI歌曲']);
        expect(coco[0].queries).toContain('孤勇者');
    });

    it('returns Bilibili AI account shortcuts first', () => {
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
        expect(groups[1].queries).toContain('AI歌曲');
    });

    it('returns empty for unsupported providers', () => {
        expect(getOnlineSearchShortcutGroups('netease')).toEqual([]);
        expect(getOnlineSearchShortcutGroups(null)).toEqual([]);
    });
});

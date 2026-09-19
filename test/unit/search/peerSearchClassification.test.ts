import { describe, expect, it } from 'vitest';
import {
    classifyPeerSearchQuery,
    shortcutGroupSearchKind,
} from '@/utils/search/peerSearchClassification';
import {
    SEARCH_SHORTCUT_PROVIDER_IDS,
    getOnlineSearchShortcutGroups,
    getSearchShortcutHintKey,
    isSearchShortcutProvider,
    stripShortcutDisplayLabel,
} from '@/utils/onlineSearchShortcuts';

// test/unit/search/peerSearchClassification.test.ts
// Public seam: query kind per peer channel, and shortcut chips must match that kind.

describe('classifyPeerSearchQuery', () => {
    it('treats blank input as empty', () => {
        expect(classifyPeerSearchQuery('qishui', '')).toEqual({ kind: 'empty', query: '', raw: '' });
        expect(classifyPeerSearchQuery('qishui', '   ')).toEqual({ kind: 'empty', query: '', raw: '' });
        expect(classifyPeerSearchQuery('qishui', 'cat:')).toEqual({ kind: 'empty', query: '', raw: 'cat:' });
        expect(classifyPeerSearchQuery('qishui', 'cat:   ')).toEqual({ kind: 'empty', query: '', raw: 'cat:' });
    });

    it('classifies qishui playlist tags only when cat:/分类: is explicit', () => {
        expect(classifyPeerSearchQuery('qishui', 'cat:AI歌曲')).toEqual({
            kind: 'category',
            query: 'AI歌曲',
            raw: 'cat:AI歌曲',
        });
        expect(classifyPeerSearchQuery('qishui', '分类:轻音乐')).toEqual({
            kind: 'category',
            query: '轻音乐',
            raw: '分类:轻音乐',
        });
        expect(classifyPeerSearchQuery('qishui', 'CAT:流行')).toEqual({
            kind: 'category',
            query: '流行',
            raw: 'CAT:流行',
        });
        expect(classifyPeerSearchQuery('qishui', 'catalog:流行')).toEqual({
            kind: 'track',
            query: 'catalog:流行',
            raw: 'catalog:流行',
        });
    });

    it('routes qishui AI terms through playlist category search unless song: forces tracks', () => {
        expect(classifyPeerSearchQuery('qishui', 'AI周杰伦')).toEqual({
            kind: 'category',
            query: 'AI周杰伦',
            raw: 'AI周杰伦',
        });
        expect(classifyPeerSearchQuery('qishui', 'AI歌曲')).toEqual({
            kind: 'category',
            query: 'AI歌曲',
            raw: 'AI歌曲',
        });
        expect(classifyPeerSearchQuery('qishui', 'song:AI周杰伦')).toEqual({
            kind: 'track',
            query: 'AI周杰伦',
            raw: 'song:AI周杰伦',
        });
    });

    it('classifies qishui track intents from song:/歌曲: or a bare keyword', () => {
        expect(classifyPeerSearchQuery('qishui', 'song:周杰伦 晴天')).toEqual({
            kind: 'track',
            query: '周杰伦 晴天',
            raw: 'song:周杰伦 晴天',
        });
        expect(classifyPeerSearchQuery('qishui', '歌曲:大头针')).toEqual({
            kind: 'track',
            query: '大头针',
            raw: '歌曲:大头针',
        });
        expect(classifyPeerSearchQuery('qishui', '周杰伦')).toEqual({
            kind: 'track',
            query: '周杰伦',
            raw: '周杰伦',
        });
    });

    it('classifies bilibili account intents and leaves keywords as tracks', () => {
        expect(classifyPeerSearchQuery('bilibili', 'up:天花板上吊着猫')).toEqual({
            kind: 'account',
            query: '天花板上吊着猫',
            raw: 'up:天花板上吊着猫',
        });
        expect(classifyPeerSearchQuery('bilibili', '@溪谷之风')).toEqual({
            kind: 'account',
            query: '溪谷之风',
            raw: '@溪谷之风',
        });
        expect(classifyPeerSearchQuery('bilibili', 'mid:1091')).toEqual({
            kind: 'account',
            query: '1091',
            raw: 'mid:1091',
        });
        expect(classifyPeerSearchQuery('bilibili', 'AI翻唱 周杰伦')).toEqual({
            kind: 'track',
            query: 'AI翻唱 周杰伦',
            raw: 'AI翻唱 周杰伦',
        });
        expect(classifyPeerSearchQuery('bilibili', 'cat:AI歌曲')).toEqual({
            kind: 'track',
            query: 'cat:AI歌曲',
            raw: 'cat:AI歌曲',
        });
    });

    it('detects share links independently of the current channel', () => {
        expect(classifyPeerSearchQuery('coco', 'https://qishui.douyin.com/s/abc123').kind).toBe('share');
        expect(classifyPeerSearchQuery('qishui', 'https://qishui.douyin.com/s/abc123').kind).toBe('share');
        expect(classifyPeerSearchQuery('coco', 'BV1xx411c7mD').kind).toBe('share');
        expect(classifyPeerSearchQuery('kugou', 'https://b23.tv/demo123').kind).toBe('share');
    });

    it('keeps coco, kugou, and kuwo as keyword track search', () => {
        expect(classifyPeerSearchQuery('coco', '晴天')).toEqual({
            kind: 'track',
            query: '晴天',
            raw: '晴天',
        });
        expect(classifyPeerSearchQuery('kugou', 'cat:流行')).toEqual({
            kind: 'track',
            query: 'cat:流行',
            raw: 'cat:流行',
        });
        expect(classifyPeerSearchQuery('kuwo', 'up:某人')).toEqual({
            kind: 'track',
            query: 'up:某人',
            raw: 'up:某人',
        });
    });
});

describe('peer search shortcut taxonomy', () => {
    it('exposes shortcut chips for every curated peer entry', () => {
        expect([...SEARCH_SHORTCUT_PROVIDER_IDS]).toEqual(['coco', 'qishui', 'kugou', 'bilibili', 'kuwo']);
        for (const provider of SEARCH_SHORTCUT_PROVIDER_IDS) {
            expect(isSearchShortcutProvider(provider)).toBe(true);
            expect(getOnlineSearchShortcutGroups(provider).length).toBeGreaterThan(0);
            expect(getSearchShortcutHintKey(provider)).toMatch(/^search\./);
        }
    });

    it('keeps qishui category chips as playlist tags, never artists or song titles', () => {
        const groups = getOnlineSearchShortcutGroups('qishui');
        expect(groups.map(group => group.id)).toEqual(['category', 'artist', 'song']);
        expect(groups[0].queries).toEqual([
            'cat:AI歌曲',
            'cat:AI翻唱',
            'cat:AI周杰伦',
            'cat:流行',
            'cat:轻音乐',
        ]);
        expect(groups[1].queries).toEqual([
            '周杰伦',
            '林俊杰',
            '邓紫棋',
            '陈奕迅',
            '五月天',
        ]);
        expect(groups[2].queries).toEqual([
            'song:晴天',
            'song:起风了',
            'song:孤勇者',
            'song:海阔天空',
        ]);

        const categoryLabels = groups[0].queries.map(stripShortcutDisplayLabel);
        expect(categoryLabels).toContain('AI周杰伦');
        expect(categoryLabels).not.toContain('周杰伦');
        expect(categoryLabels).not.toContain('大头针');
        expect(groups[1].queries).toContain('周杰伦');
    });

    it('splits keyword-only peers into song vs artist chips', () => {
        expect(getOnlineSearchShortcutGroups('coco').map(group => group.id)).toEqual(['song', 'artist']);
        expect(getOnlineSearchShortcutGroups('kugou').map(group => group.id)).toEqual(['song', 'artist']);
        expect(getOnlineSearchShortcutGroups('kuwo').map(group => group.id)).toEqual(['song', 'artist']);
        expect(getOnlineSearchShortcutGroups('coco')[0].queries).toContain('晴天');
        expect(getOnlineSearchShortcutGroups('coco')[1].queries).toContain('周杰伦');
        expect(getOnlineSearchShortcutGroups('kugou')[1].queries.every(query => !query.includes(' '))).toBe(true);
    });

    it('keeps bilibili account chips prefixed and song chips unprefixed', () => {
        const groups = getOnlineSearchShortcutGroups('bilibili');
        expect(groups.map(group => group.id)).toEqual(['accounts', 'song']);
        expect(groups[0].queries.every(query => query.startsWith('up:'))).toBe(true);
        expect(groups[1].queries).toEqual([
            'AI翻唱 周杰伦',
            'AI翻唱 邓紫棋',
            'AI孙燕姿',
            'AI陈奕迅',
            'SUNO翻唱',
        ]);
    });

    it('classifies every shortcut query as the kind its group claims', () => {
        for (const provider of SEARCH_SHORTCUT_PROVIDER_IDS) {
            const labels = new Set<string>();
            for (const group of getOnlineSearchShortcutGroups(provider)) {
                const expectedKind = shortcutGroupSearchKind(group.id);
                expect(expectedKind).toBeTruthy();
                for (const query of group.queries) {
                    const classified = classifyPeerSearchQuery(provider, query);
                    expect(classified.kind, `${provider} ${group.id} ${query}`).toBe(expectedKind);
                    expect(classified.query.length).toBeGreaterThan(0);

                    const label = stripShortcutDisplayLabel(query).trim().toLowerCase();
                    expect(labels.has(label), `${provider} duplicate label ${label}`).toBe(false);
                    labels.add(label);
                }
            }
        }
    });
});

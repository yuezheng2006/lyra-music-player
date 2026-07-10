import { describe, expect, it } from 'vitest';
import {
    isProviderSearchable,
    isQishuiShareUrl,
    resolveEnabledSearchProviders,
    resolveOnlineSearchProvider,
    resolveOverlaySearchProviders,
    resolveSearchableLibraryProviders,
} from '@/utils/onlineSearchRouting';

// test/unit/utils/onlineSearchRouting.test.ts

describe('onlineSearchRouting', () => {
    it('detects qishui share urls', () => {
        expect(isQishuiShareUrl('https://qishui.douyin.com/s/abc123')).toBe(true);
        expect(isQishuiShareUrl('周杰伦')).toBe(false);
    });

    it('routes share links to qishui regardless of preferred channel', () => {
        expect(resolveOnlineSearchProvider('https://qishui.douyin.com/s/abc123', 'coco')).toBe('qishui');
        expect(resolveOnlineSearchProvider('https://qishui.douyin.com/s/abc123', 'netease')).toBe('qishui');
    });

    it('keeps preferred channel for normal queries', () => {
        expect(resolveOnlineSearchProvider('晴天', 'coco')).toBe('coco');
        expect(resolveOnlineSearchProvider('晴天', 'qq')).toBe('qq');
    });

    it('treats coco and qishui as always searchable and gated providers by login', () => {
        expect(isProviderSearchable('coco', {})).toBe(true);
        expect(isProviderSearchable('qishui', {})).toBe(true);
        expect(isProviderSearchable('netease', {})).toBe(false);
        expect(isProviderSearchable('qq', { qq: true })).toBe(true);
    });

    it('fans out keyword search across checked and signed-in sources', () => {
        expect(resolveEnabledSearchProviders('哈哈', {
            netease: true,
            qq: true,
            qishui: true,
            coco: true,
        }, 'coco', {
            netease: true,
            qq: true,
        })).toEqual(['netease', 'qq', 'qishui', 'coco']);
    });

    it('skips unchecked or unsigned-in netease/qq even when pills look selected', () => {
        expect(resolveSearchableLibraryProviders({
            netease: true,
            qq: true,
            qishui: false,
            coco: true,
        }, {
            netease: false,
            qq: false,
        })).toEqual(['coco']);

        expect(resolveEnabledSearchProviders('哈哈', {
            netease: true,
            qq: true,
            qishui: true,
            coco: true,
        }, 'netease', {
            netease: false,
            qq: true,
        })).toEqual(['qq', 'qishui', 'coco']);
    });

    it('falls back to coco when no signed-in source is available', () => {
        expect(resolveEnabledSearchProviders('哈哈', {
            netease: true,
            qq: true,
            qishui: false,
            coco: false,
        }, 'netease', {
            netease: false,
            qq: false,
        })).toEqual(['coco']);
    });

    it('forces qishui for share links even when multiple sources are enabled', () => {
        expect(resolveEnabledSearchProviders('https://qishui.douyin.com/s/abc123', {
            netease: true,
            qq: true,
            qishui: true,
            coco: true,
        }, 'coco', {
            netease: true,
            qq: true,
        })).toEqual(['qishui']);
    });

    it('keeps coco and qishui overlay channels isolated', () => {
        expect(resolveOverlaySearchProviders({
            query: '孤勇者',
            sourceTab: 'coco',
            activeProviders: ['coco'],
            enabledProviders: { coco: true, qishui: true, netease: true, qq: true },
            sessions: { netease: true, qq: true },
        })).toEqual(['coco']);

        expect(resolveOverlaySearchProviders({
            query: '周杰伦',
            sourceTab: 'qishui',
            activeProviders: ['qishui'],
            enabledProviders: { coco: true, qishui: true, netease: true, qq: true },
            sessions: { netease: true, qq: true },
        })).toEqual(['qishui']);
    });

    it('keeps home aggregate sessions with coco and qishui together', () => {
        expect(resolveOverlaySearchProviders({
            query: '你好',
            sourceTab: 'coco',
            activeProviders: ['qq', 'qishui', 'coco'],
            enabledProviders: { coco: true, qishui: true, netease: false, qq: true },
            sessions: { netease: false, qq: true },
        })).toEqual(['qq', 'qishui', 'coco']);
    });
});

import { describe, expect, it } from 'vitest';
import {
    resolveMediaRequestOverride,
    shouldBypassMediaCors,
} from '../../../shared/mediaRequestHeaders.cjs';

// test/unit/shared/mediaRequestHeaders.test.ts

describe('mediaRequestHeaders', () => {
    it('sets Douyin / Qishui CDN referer for douyinvod hosts', () => {
        expect(resolveMediaRequestOverride('v5-ex-luna.douyinvod.com')).toEqual({
            referer: 'https://music.douyin.com/',
            origin: 'https://music.douyin.com',
        });
    });

    it('keeps Bilibili / Kugou overrides', () => {
        expect(resolveMediaRequestOverride('upos.bilivideo.com')?.referer).toBe('https://www.bilibili.com/');
        expect(resolveMediaRequestOverride('fs.kugou.com')?.referer).toBe('https://www.kugou.com/');
    });

    it('bypasses CORS for douyinvod', () => {
        expect(shouldBypassMediaCors('v5-ex-luna.douyinvod.com')).toBe(true);
        expect(shouldBypassMediaCors('example.com')).toBe(false);
    });

    it('bypasses CORS for Xiaoyuzhou public RSS media', () => {
        expect(shouldBypassMediaCors('media.xyzcdn.net')).toBe(true);
        expect(shouldBypassMediaCors('dts-api.xiaoyuzhoufm.com')).toBe(true);
        expect(shouldBypassMediaCors('aphid.fireside.fm')).toBe(true);
        expect(shouldBypassMediaCors('traffic.megaphone.fm')).toBe(true);
    });
});

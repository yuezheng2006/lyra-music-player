import { describe, expect, it } from 'vitest';
import { resolveHomeSearchPlaceholderKey } from '@/utils/home/resolveHomeSearchPlaceholderKey';

describe('resolveHomeSearchPlaceholderKey', () => {
    it('uses multi-source key for more than one provider', () => {
        expect(resolveHomeSearchPlaceholderKey(['qishui', 'bilibili'])).toBe('home.searchMultiSources');
    });

    it('maps single providers to channel keys', () => {
        expect(resolveHomeSearchPlaceholderKey(['qishui'])).toBe('home.searchQishuiMusic');
        expect(resolveHomeSearchPlaceholderKey(['bilibili'])).toBe('home.searchBilibiliMusic');
        expect(resolveHomeSearchPlaceholderKey(['coco'])).toBe('home.searchCocoMusic');
    });

    it('falls back for empty list', () => {
        expect(resolveHomeSearchPlaceholderKey([])).toBe('home.searchDatabase');
    });
});

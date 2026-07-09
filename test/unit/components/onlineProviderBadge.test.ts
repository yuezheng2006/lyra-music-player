import { describe, expect, it } from 'vitest';
import { resolveOnlineProviderVisualId } from '@/components/shared/OnlineProviderBadge';

// test/unit/components/onlineProviderBadge.test.ts

describe('resolveOnlineProviderVisualId', () => {
    it('maps known providers and defaults unknown ones to netease', () => {
        expect(resolveOnlineProviderVisualId('qq')).toBe('qq');
        expect(resolveOnlineProviderVisualId('qishui')).toBe('qishui');
        expect(resolveOnlineProviderVisualId('coco')).toBe('coco');
        expect(resolveOnlineProviderVisualId('netease')).toBe('netease');
        expect(resolveOnlineProviderVisualId(undefined)).toBe('netease');
        expect(resolveOnlineProviderVisualId('unknown')).toBe('netease');
    });
});

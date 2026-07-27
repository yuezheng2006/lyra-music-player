import { describe, expect, it } from 'vitest';
import { resolveOnlineProviderVisualId } from '@/components/shared/OnlineProviderBadge';

// test/unit/components/onlineProviderBadge.test.ts

describe('resolveOnlineProviderVisualId', () => {
    it('maps known providers, defaults empty to netease, and leaves plugins unmapped', () => {
        expect(resolveOnlineProviderVisualId('qq')).toBe('qq');
        expect(resolveOnlineProviderVisualId('qishui')).toBe('qishui');
        expect(resolveOnlineProviderVisualId('coco')).toBe('coco');
        expect(resolveOnlineProviderVisualId('netease')).toBe('netease');
        expect(resolveOnlineProviderVisualId(undefined)).toBe('netease');
        expect(resolveOnlineProviderVisualId('demo-echo')).toBeNull();
    });
});

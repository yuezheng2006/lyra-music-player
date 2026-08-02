import { describe, expect, it } from 'vitest';
import {
    DEFAULT_UNIFIED_ACCOUNT_PROVIDER_ID,
    UNIFIED_ACCOUNT_PROVIDERS,
} from '@/utils/musicAccounts/unifiedMusicAccountProviders';

// test/unit/musicAccounts/unifiedMusicAccountProviders.test.ts

describe('unifiedMusicAccountProviders', () => {
    it('lists login peers before peer-free sources and defaults to netease', () => {
        expect(DEFAULT_UNIFIED_ACCOUNT_PROVIDER_ID).toBe('netease');
        expect(UNIFIED_ACCOUNT_PROVIDERS.map((item) => item.id)).toEqual([
            'netease',
            'qq',
            'qishui',
            'kugou',
            'coco',
        ]);
        expect(UNIFIED_ACCOUNT_PROVIDERS.filter((item) => item.kind === 'login').map((item) => item.id))
            .toEqual(['netease', 'qq']);
    });
});

import { describe, expect, it } from 'vitest';
import { ONLINE_PROVIDER_ICON_URL } from '../../../src/utils/onlineProviderAssets';

// test/unit/utils/onlineProviderAssets.test.ts
// Netease / Qishui PNGs must be inlined so Electron does not 404 hashed asset files.

describe('onlineProviderAssets', () => {
    it('inlines Netease and Qishui marks as data URIs', () => {
        expect(ONLINE_PROVIDER_ICON_URL.netease).toMatch(/^data:image\/png;base64,/);
        expect(ONLINE_PROVIDER_ICON_URL.qishui).toMatch(/^data:image\/png;base64,/);
    });
});

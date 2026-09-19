import { describe, expect, it } from 'vitest';
import { readSettingsDeepLink } from '@/utils/settings/readSettingsDeepLink';

// test/unit/settings/readSettingsDeepLink.test.ts

describe('readSettingsDeepLink', () => {
    it('opens track atmosphere light plan subview', () => {
        expect(readSettingsDeepLink('?settings=trackAtmosphereLight')).toEqual({
            tab: 'options',
            subview: 'trackAtmosphereLight',
        });
    });

    it('supports help tab override', () => {
        expect(readSettingsDeepLink('?settings=lab&settingsTab=help')).toEqual({
            tab: 'help',
            subview: 'lab',
        });
    });

    it('returns null for unknown settings values', () => {
        expect(readSettingsDeepLink('?settings=nope')).toBeNull();
        expect(readSettingsDeepLink('')).toBeNull();
    });
});

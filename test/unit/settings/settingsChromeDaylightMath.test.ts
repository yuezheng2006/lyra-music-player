import { describe, expect, it } from 'vitest';
import {
    cycleSettingsChromeDaylightMode,
    parseSettingsChromeDaylightMode,
    resolveSettingsChromeDaylight,
} from '../../../src/utils/settings/settingsChromeDaylightMath';

// test/unit/settings/settingsChromeDaylightMath.test.ts
// Settings panel chrome daylight is independent from the player theme.

describe('settingsChromeDaylightMath', () => {
    it('parses stored modes and defaults to follow', () => {
        expect(parseSettingsChromeDaylightMode('light')).toBe('light');
        expect(parseSettingsChromeDaylightMode('dark')).toBe('dark');
        expect(parseSettingsChromeDaylightMode('follow')).toBe('follow');
        expect(parseSettingsChromeDaylightMode('nope')).toBe('follow');
        expect(parseSettingsChromeDaylightMode(null)).toBe('follow');
    });

    it('resolves chrome daylight from mode and player theme', () => {
        expect(resolveSettingsChromeDaylight('follow', true)).toBe(true);
        expect(resolveSettingsChromeDaylight('follow', false)).toBe(false);
        expect(resolveSettingsChromeDaylight('light', false)).toBe(true);
        expect(resolveSettingsChromeDaylight('dark', true)).toBe(false);
    });

    it('cycles follow → light → dark → follow', () => {
        expect(cycleSettingsChromeDaylightMode('follow')).toBe('light');
        expect(cycleSettingsChromeDaylightMode('light')).toBe('dark');
        expect(cycleSettingsChromeDaylightMode('dark')).toBe('follow');
    });
});

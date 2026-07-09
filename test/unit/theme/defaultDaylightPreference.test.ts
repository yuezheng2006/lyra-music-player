import { beforeEach, describe, expect, it, vi } from 'vitest';

const memoryStorage: Record<string, string> = {};

describe('readDefaultDaylightPreference', () => {
    beforeEach(() => {
        vi.resetModules();
        Object.keys(memoryStorage).forEach((key) => {
            delete memoryStorage[key];
        });
        vi.stubGlobal('window', globalThis);
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => memoryStorage[key] ?? null,
            setItem: (key: string, value: string) => {
                memoryStorage[key] = value;
            },
            removeItem: (key: string) => {
                delete memoryStorage[key];
            },
            clear: () => {
                Object.keys(memoryStorage).forEach((key) => {
                    delete memoryStorage[key];
                });
            },
        });
    });

    it('defaults to dark for fresh installs', async () => {
        const { readDefaultDaylightPreference } = await import('@/stores/useSettingsUiStore');
        expect(readDefaultDaylightPreference()).toBe(false);
    });

    it('respects stored user preference', async () => {
        memoryStorage.default_theme_daylight = 'false';
        const { readDefaultDaylightPreference } = await import('@/stores/useSettingsUiStore');
        expect(readDefaultDaylightPreference()).toBe(false);
    });
});

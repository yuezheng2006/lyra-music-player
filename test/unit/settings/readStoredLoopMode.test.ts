import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStoredLoopMode } from '@/stores/settingsUi/settingsPersistenceExtended';

// test/unit/settings/readStoredLoopMode.test.ts

const memoryStore = new Map<string, string>();

const localStorageStub = {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => { memoryStore.set(key, value); },
    removeItem: (key: string) => { memoryStore.delete(key); },
    clear: () => { memoryStore.clear(); },
};

describe('readStoredLoopMode', () => {
    beforeEach(() => {
        memoryStore.clear();
        vi.stubGlobal('window', { localStorage: localStorageStub });
        vi.stubGlobal('localStorage', localStorageStub);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('defaults to list loop so auto-next keeps playing', () => {
        expect(readStoredLoopMode()).toBe('all');
    });

    it('honors an explicit off preference', () => {
        memoryStore.set('player_loop_mode', 'off');
        expect(readStoredLoopMode()).toBe('off');
    });
});

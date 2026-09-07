import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PENDOLO_TUNING } from '@/types';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';

// test/unit/visualizer/pendoloSettings.test.ts
// Verifies the Pendolo glow preference survives the settings store and local persistence boundary.
const createLocalStorageMock = (): Storage => {
    const values = new Map<string, string>();

    return {
        get length() {
            return values.size;
        },
        getItem: (key) => values.get(key) ?? null,
        key: (index) => Array.from(values.keys())[index] ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
    };
};

describe('Pendolo settings', () => {
    let storage: Storage;

    beforeEach(() => {
        storage = createLocalStorageMock();
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { localStorage: storage });
        useSettingsUiStore.setState({ pendoloTuning: { ...DEFAULT_PENDOLO_TUNING } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('defaults the wheel center inset from the left edge for a balanced lyric arc', () => {
        expect(DEFAULT_PENDOLO_TUNING.wheelCenterX).toBeGreaterThan(0.1);
        expect(DEFAULT_PENDOLO_TUNING.wheelCenterX).toBeLessThan(0.3);
        expect(DEFAULT_PENDOLO_TUNING.arcRadius).toBeGreaterThanOrEqual(0.35);
        expect(DEFAULT_PENDOLO_TUNING.arcRadius).toBeLessThanOrEqual(0.45);
    });

    it('updates and persists the line glow preference', () => {
        useSettingsUiStore.getState().handleSetPendoloTuning({ enableLineGlow: true });

        expect(useSettingsUiStore.getState().pendoloTuning.enableLineGlow).toBe(true);
        expect(JSON.parse(storage.getItem('pendolo_tuning') ?? '{}').enableLineGlow).toBe(true);

        useSettingsUiStore.getState().handleSetPendoloTuning({ enableLineGlow: false });

        expect(useSettingsUiStore.getState().pendoloTuning.enableLineGlow).toBe(false);
        expect(JSON.parse(storage.getItem('pendolo_tuning') ?? '{}').enableLineGlow).toBe(false);
    });
});

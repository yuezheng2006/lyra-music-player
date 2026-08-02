import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import { GPU_UNSTABLE_STORAGE_KEY } from '@/utils/performance/gpuUnstableStorage';

// Atomic 封面/滚筒/星河 selection must land mode + preset together.

describe('handleSelectInteractive3dVisualPreset', () => {
    let values: Map<string, string>;

    beforeEach(() => {
        values = new Map();
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => {
                values.set(key, value);
            },
            removeItem: (key: string) => {
                values.delete(key);
            },
            clear: () => {
                values.clear();
            },
        };
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', {
            localStorage: storage,
            electron: {},
            devicePixelRatio: 2,
        });
        useSettingsUiStore.setState({
            visualizerBackgroundMode: 'common',
            enable3dInteractiveBackground: false,
            interactive3dSceneTuning: {
                ...useSettingsUiStore.getState().interactive3dSceneTuning,
                visualPreset: 'emily',
            },
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('sets interactive3d and galaxy preset in one update', () => {
        useSettingsUiStore.getState().handleSelectInteractive3dVisualPreset('mineradioGalaxy');
        const state = useSettingsUiStore.getState();
        expect(state.visualizerBackgroundMode).toBe('interactive3d');
        expect(state.enable3dInteractiveBackground).toBe(true);
        expect(state.interactive3dSceneTuning.visualPreset).toBe('mineradioGalaxy');
        expect(localStorage.getItem('visualizer_background_mode')).toBe('interactive3d');
    });

    it('clears GPU lockout when retrying a preset chip', () => {
        localStorage.setItem(GPU_UNSTABLE_STORAGE_KEY, '1');
        useSettingsUiStore.getState().handleSelectInteractive3dVisualPreset('mineradioTunnel');
        expect(localStorage.getItem(GPU_UNSTABLE_STORAGE_KEY)).toBe('0');
        expect(useSettingsUiStore.getState().visualizerBackgroundMode).toBe('interactive3d');
        expect(useSettingsUiStore.getState().interactive3dSceneTuning.visualPreset).toBe('mineradioTunnel');
    });
});

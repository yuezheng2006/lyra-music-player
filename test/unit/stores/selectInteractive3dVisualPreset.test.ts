import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import { GPU_UNSTABLE_STORAGE_KEY } from '@/utils/performance/gpuUnstableStorage';

// Atomic atmosphere selection must land mode + normalized emily preset together.

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

    it('does not re-enable retired interactive3d; galaxy still normalizes to emily atmosphere tuning', () => {
        useSettingsUiStore.getState().handleSelectInteractive3dVisualPreset('mineradioGalaxy');
        const state = useSettingsUiStore.getState();
        expect(state.visualizerBackgroundMode).toBe('common');
        expect(state.enable3dInteractiveBackground).toBe(false);
        expect(state.interactive3dSceneTuning.visualPreset).toBe('emily');
        expect(localStorage.getItem('visualizer_background_mode')).toBe('common');
    });

    it('keeps GPU lockout when a retired 3D preset is requested and still normalizes tunnel to emily', () => {
        localStorage.setItem(GPU_UNSTABLE_STORAGE_KEY, '1');
        useSettingsUiStore.getState().handleSelectInteractive3dVisualPreset('mineradioTunnel');
        expect(localStorage.getItem(GPU_UNSTABLE_STORAGE_KEY)).toBe('1');
        expect(useSettingsUiStore.getState().visualizerBackgroundMode).toBe('common');
        expect(useSettingsUiStore.getState().interactive3dSceneTuning.visualPreset).toBe('emily');
    });
});

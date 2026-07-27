import { describe, expect, it } from 'vitest';
import {
    applyGpuCrashVisualDemote,
    applyVisualizerBackgroundModeSelection,
} from '@/stores/visualizerBackgroundModeHandlers';
import { GPU_UNSTABLE_STORAGE_KEY } from '@/utils/performance/gpuUnstableStorage';
import { INTERACTIVE3D_OPT_IN_STORAGE_KEY } from '@/utils/visualizer/interactive3dOptInStorage';

// Background-mode handlers stay isolated from the giant settings store.

const memoryStorage = (): Storage => {
    const map = new Map<string, string>();
    return {
        get length() { return map.size; },
        clear: () => map.clear(),
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => { map.set(k, String(v)); },
        removeItem: (k) => { map.delete(k); },
        key: () => null,
    };
};

describe('visualizerBackgroundModeHandlers', () => {
    it('clears GPU lockout when selecting interactive3d', () => {
        const storage = memoryStorage();
        storage.setItem(GPU_UNSTABLE_STORAGE_KEY, '1');
        const result = applyVisualizerBackgroundModeSelection({
            mode: 'interactive3d',
            isElectron: true,
            storage,
        });
        expect(result.resolvedMode).toBe('interactive3d');
        expect(storage.getItem(GPU_UNSTABLE_STORAGE_KEY)).toBe('0');
        expect(storage.getItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY)).toBe('1');
    });

    it('blocks latent under gpuUnstable but keeps 3D retryable via demote+opt-in', () => {
        const storage = memoryStorage();
        storage.setItem(GPU_UNSTABLE_STORAGE_KEY, '1');
        expect(applyVisualizerBackgroundModeSelection({
            mode: 'latent',
            isElectron: true,
            storage,
        }).resolvedMode).toBe('common');

        const demoted = applyGpuCrashVisualDemote({ keep3dOptIn: true, storage });
        expect(demoted.visualizerBackgroundMode).toBe('common');
        expect(storage.getItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY)).toBe('1');
    });
});

import type { VisualizerBackgroundMode } from '../types';
import {
    readGpuUnstableFlag,
    writeGpuUnstableFlag,
} from '../utils/performance/gpuUnstableStorage';
import {
    writeInteractive3dOptIn,
} from '../utils/visualizer/interactive3dOptInStorage';
import { migrateVisualizerBackgroundMode } from '../utils/visualizer/retiredVisualizerBackgroundModes';
import {
    resolveElectronSafeVisualizerBackgroundMode,
    resolveUserSelectedVisualizerBackgroundMode,
} from '../utils/visualizer/visualizerBackgroundModePolicy';

// src/stores/visualizerBackgroundModeHandlers.ts
// Background-mode mutations isolated from the giant settings store.

export const ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY = 'enable_3d_interactive_background';

type BooleanStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const setStoredBoolean = (storage: BooleanStorage, key: string, value: boolean) => {
    storage.setItem(key, value ? 'true' : 'false');
};

/** Apply a user background-mode selection. Retired interactive3d maps to common. */
export const applyVisualizerBackgroundModeSelection = (input: {
    mode: VisualizerBackgroundMode;
    isElectron: boolean;
    storage: BooleanStorage | null | undefined;
}): {
    resolvedMode: VisualizerBackgroundMode;
    enable3dInteractiveBackground: boolean;
} => {
    const storage = input.storage;
    const gpuUnstable = storage ? readGpuUnstableFlag(storage) : false;
    const requested = migrateVisualizerBackgroundMode(input.mode) ?? 'common';
    const resolvedMode = resolveUserSelectedVisualizerBackgroundMode({
        requested,
        isElectron: input.isElectron,
        gpuUnstable,
    });
    if (storage) {
        storage.setItem('visualizer_background_mode', resolvedMode);
        setStoredBoolean(storage, ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY, false);
        writeInteractive3dOptIn(storage, false);
    }
    return { resolvedMode, enable3dInteractiveBackground: false };
};

/** Visual-only demote after GPU crash — never touches audio / media clocks. */
export const applyGpuCrashVisualDemote = (input: {
    keep3dOptIn: boolean;
    storage: BooleanStorage | null | undefined;
}): {
    visualizerBackgroundMode: 'common';
    enable3dInteractiveBackground: false;
} => {
    const storage = input.storage;
    if (storage) {
        writeGpuUnstableFlag(storage, true);
        writeInteractive3dOptIn(storage, input.keep3dOptIn);
        storage.setItem('visualizer_background_mode', 'common');
        setStoredBoolean(storage, ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY, false);
    }
    return {
        visualizerBackgroundMode: 'common',
        enable3dInteractiveBackground: false,
    };
};

export const applyResetVisualizerBackgroundMode = (input: {
    defaultMode: VisualizerBackgroundMode;
    isElectron: boolean;
    devicePixelRatio: number;
    storage: BooleanStorage | null | undefined;
}): {
    resolvedMode: VisualizerBackgroundMode;
    enable3dInteractiveBackground: boolean;
} => {
    let resolvedMode = migrateVisualizerBackgroundMode(input.defaultMode) ?? 'common';
    const storage = input.storage;
    if (storage) {
        resolvedMode = resolveElectronSafeVisualizerBackgroundMode({
            mode: resolvedMode,
            isElectron: input.isElectron,
            devicePixelRatio: input.devicePixelRatio,
            gpuUnstable: readGpuUnstableFlag(storage),
            interactive3dOptIn: false,
        });
        storage.setItem('visualizer_background_mode', resolvedMode);
        setStoredBoolean(storage, ENABLE_3D_INTERACTIVE_BACKGROUND_STORAGE_KEY, false);
        writeInteractive3dOptIn(storage, false);
    }
    return {
        resolvedMode,
        enable3dInteractiveBackground: false,
    };
};

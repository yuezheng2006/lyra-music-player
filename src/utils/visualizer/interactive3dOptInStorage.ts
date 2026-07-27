// src/utils/visualizer/interactive3dOptInStorage.ts
// User opt-in that 3D may auto-start / retry after GPU recovery.

export const INTERACTIVE3D_OPT_IN_STORAGE_KEY = 'lyra_interactive3d_opt_in_v1';

export const readInteractive3dOptIn = (storage: Pick<Storage, 'getItem'> | null | undefined): boolean => (
    storage?.getItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY) === '1'
);

export const writeInteractive3dOptIn = (
    storage: Pick<Storage, 'setItem' | 'removeItem'> | null | undefined,
    optedIn: boolean,
) => {
    if (!storage) return;
    if (optedIn) storage.setItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY, '1');
    else storage.removeItem(INTERACTIVE3D_OPT_IN_STORAGE_KEY);
};

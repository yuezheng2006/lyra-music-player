// src/utils/performance/gpuUnstableStorage.ts
// Isolated persistence for GPU helper crash lockout. Visual recovery only.

export const GPU_UNSTABLE_STORAGE_KEY = 'lyra_gpu_unstable_v1';

export const readGpuUnstableFlag = (storage: Pick<Storage, 'getItem'> | null | undefined): boolean => (
    storage?.getItem(GPU_UNSTABLE_STORAGE_KEY) === '1'
);

export const writeGpuUnstableFlag = (
    storage: Pick<Storage, 'setItem'> | null | undefined,
    unstable: boolean,
) => {
    if (!storage) return;
    storage.setItem(GPU_UNSTABLE_STORAGE_KEY, unstable ? '1' : '0');
};

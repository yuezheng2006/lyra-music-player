// scripts/electronDevRestartPolicy.mjs
// Concurrent-dev restarts Electron only for the GPU software-GL escape.

/** Electron exit code requesting a clean process restart (escape --use-gl=disabled). */
export const ELECTRON_DEV_RESTART_EXIT_CODE = 75;

export function shouldRestartElectronDev(code, { shuttingDown = false } = {}) {
    if (shuttingDown) return false;
    return code === ELECTRON_DEV_RESTART_EXIT_CODE;
}


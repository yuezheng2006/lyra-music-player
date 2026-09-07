import { describe, expect, it } from 'vitest';
import {
    ELECTRON_DEV_RESTART_EXIT_CODE,
    shouldRestartElectronDev,
} from '../../../scripts/electronDevRestartPolicy.mjs';

// test/unit/scripts/electronDevRestartPolicy.test.ts
// Closing Lyra in `dev:electron` must not respawn; only GPU escape code 75 restarts.

describe('shouldRestartElectronDev', () => {
    it('does not restart a clean quit (window close / Cmd+Q)', () => {
        expect(shouldRestartElectronDev(0)).toBe(false);
        expect(shouldRestartElectronDev(null, { shuttingDown: false })).toBe(false);
    });

    it('restarts only the GPU software-GL escape code', () => {
        expect(shouldRestartElectronDev(ELECTRON_DEV_RESTART_EXIT_CODE)).toBe(true);
        expect(shouldRestartElectronDev(1)).toBe(false);
        expect(shouldRestartElectronDev(75, { shuttingDown: true })).toBe(false);
    });
});

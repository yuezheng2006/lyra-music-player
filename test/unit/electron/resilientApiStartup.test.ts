import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

// test/unit/electron/resilientApiStartup.test.ts
// Locks down packaged API startup when optional remote bootstrap is unavailable.

const require = createRequire(import.meta.url);
const {
    serializeStartupError,
    startResilientLocalApi,
} = require('../../../electron/resilientApiStartup.cjs') as {
    serializeStartupError: (error: unknown) => string;
    startResilientLocalApi: (options: Record<string, unknown>) => Promise<number>;
};

describe('startResilientLocalApi', () => {
    it('starts the local API even when remote bootstrap fails', async () => {
        const statuses: Array<Record<string, unknown>> = [];
        const serve = vi.fn(async () => undefined);
        const warning = vi.fn();

        const port = await startResilientLocalApi({
            getFreePort: async () => 45678,
            prepareLocalRuntime: async () => undefined,
            bootstrapRemoteRuntime: async () => {
                throw { code: 'NETWORK_DOWN' };
            },
            serve,
            updateStatus: (status: Record<string, unknown>) => statuses.push(status),
            onBootstrapWarning: warning,
            bootstrapTimeoutMs: 50,
        });

        expect(port).toBe(45678);
        expect(serve).toHaveBeenCalledWith(45678);
        expect(warning).toHaveBeenCalledOnce();
        expect(statuses.at(-1)).toEqual({
            status: 'running',
            port: 45678,
            error: null,
        });
    });

    it('starts after a remote bootstrap timeout instead of hanging', async () => {
        const serve = vi.fn(async () => undefined);

        const port = await startResilientLocalApi({
            getFreePort: async () => 45679,
            prepareLocalRuntime: async () => undefined,
            bootstrapRemoteRuntime: () => new Promise(() => {}),
            serve,
            updateStatus: vi.fn(),
            bootstrapTimeoutMs: 5,
        });

        expect(port).toBe(45679);
        expect(serve).toHaveBeenCalledWith(45679);
    });
});

describe('serializeStartupError', () => {
    it('preserves useful messages from non-Error throws', () => {
        expect(serializeStartupError({ code: 'NETWORK_DOWN' })).toBe('NETWORK_DOWN');
    });
});

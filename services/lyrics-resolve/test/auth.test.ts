import { describe, expect, it } from 'vitest';
import { ApiKeyGate, TEMP_DEV_API_KEY } from '../src/auth';

describe('ApiKeyGate', () => {
    it('rejects missing bearer token', () => {
        const gate = new ApiKeyGate([{ key: 'secret', qps: 5, dailyQuota: 100 }]);
        expect(gate.authorize(undefined).ok).toBe(false);
    });

    it('falls back to temporary dev-key when env is empty', () => {
        const gate = ApiKeyGate.fromEnv(undefined);
        expect(gate.size).toBe(1);
        expect(gate.authorize(`Bearer ${TEMP_DEV_API_KEY}`).ok).toBe(true);
    });

    it('accepts a valid key and enforces qps', () => {
        const gate = new ApiKeyGate([{ key: 'secret', qps: 2, dailyQuota: 100 }]);
        expect(gate.authorize('Bearer secret').ok).toBe(true);
        expect(gate.authorize('Bearer secret').ok).toBe(true);
        const third = gate.authorize('Bearer secret');
        expect(third.ok).toBe(false);
        if (!third.ok) {
            expect(third.status).toBe(429);
        }
    });
});

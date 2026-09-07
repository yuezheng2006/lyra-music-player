// services/lyrics-resolve/src/auth.ts
// Bearer API key auth with simple per-key sliding QPS / daily quota.

/** Temporary hardcoded key for local/private smoke testing. */
export const TEMP_DEV_API_KEY = 'dev-key';

export type ApiKeyConfig = {
    key: string;
    qps: number;
    dailyQuota: number;
};

type KeyState = {
    windowStartedAt: number;
    windowCount: number;
    dayStartedAt: number;
    dayCount: number;
};

export class ApiKeyGate {
    private readonly keys = new Map<string, ApiKeyConfig>();
    private readonly state = new Map<string, KeyState>();

    constructor(configs: ApiKeyConfig[]) {
        for (const config of configs) {
            if (config.key) {
                this.keys.set(config.key, config);
            }
        }
    }

    static fromEnv(raw: string | undefined): ApiKeyGate {
        const keys = (raw || '')
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);
        const resolved = keys.length > 0 ? keys : [TEMP_DEV_API_KEY];
        return new ApiKeyGate(resolved.map(key => ({ key, qps: 10, dailyQuota: 5000 })));
    }

    get size(): number {
        return this.keys.size;
    }

    authorize(header: string | null | undefined): { ok: true; key: string } | { ok: false; status: number; error: string } {
        if (this.keys.size === 0) {
            return { ok: false, status: 503, error: 'API keys are not configured' };
        }
        if (!header || !header.startsWith('Bearer ')) {
            return { ok: false, status: 401, error: 'Missing Bearer token' };
        }
        const key = header.slice('Bearer '.length).trim();
        const config = this.keys.get(key);
        if (!config) {
            return { ok: false, status: 401, error: 'Invalid API key' };
        }

        const now = Date.now();
        let state = this.state.get(key);
        if (!state) {
            state = {
                windowStartedAt: now,
                windowCount: 0,
                dayStartedAt: now,
                dayCount: 0,
            };
            this.state.set(key, state);
        }

        if (now - state.dayStartedAt >= 24 * 60 * 60 * 1000) {
            state.dayStartedAt = now;
            state.dayCount = 0;
        }
        if (now - state.windowStartedAt >= 1000) {
            state.windowStartedAt = now;
            state.windowCount = 0;
        }

        if (state.dayCount >= config.dailyQuota) {
            return { ok: false, status: 429, error: 'Daily quota exceeded' };
        }
        if (state.windowCount >= config.qps) {
            return { ok: false, status: 429, error: 'QPS exceeded' };
        }

        state.windowCount += 1;
        state.dayCount += 1;
        return { ok: true, key };
    }
}

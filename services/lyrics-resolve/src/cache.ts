// services/lyrics-resolve/src/cache.ts
// In-memory fingerprint cache with distinct TTLs by resolve status.

import type { LyricsResolveResponse, LyricsResolveStatus } from './schema';

export type CacheEntry = {
    response: Omit<LyricsResolveResponse, 'elapsedMs' | 'fingerprint'> & {
        fingerprint: string;
    };
    expiresAt: number;
};

const TTL_MS: Record<LyricsResolveStatus, number> = {
    matched: 14 * 24 * 60 * 60 * 1000,
    pure_music: 6 * 60 * 60 * 1000,
    not_found: 30 * 60 * 1000,
};

export class LyricsResolveCache {
    private readonly store = new Map<string, CacheEntry>();

    get(fingerprint: string): CacheEntry['response'] | null {
        const entry = this.store.get(fingerprint);
        if (!entry) {
            return null;
        }
        if (Date.now() >= entry.expiresAt) {
            this.store.delete(fingerprint);
            return null;
        }
        return entry.response;
    }

    set(fingerprint: string, response: CacheEntry['response']): void {
        this.store.set(fingerprint, {
            response,
            expiresAt: Date.now() + TTL_MS[response.status],
        });
        if (this.store.size > 5000) {
            const oldest = this.store.keys().next().value;
            if (oldest) {
                this.store.delete(oldest);
            }
        }
    }

    delete(fingerprint: string): boolean {
        return this.store.delete(fingerprint);
    }

    clear(): void {
        this.store.clear();
    }
}

import { afterEach, describe, expect, it } from 'vitest';
import {
    CRITICAL_TELEMETRY_MAX,
    CRITICAL_TELEMETRY_STORAGE_KEY,
    appendPersistedCriticalTelemetry,
    clearPersistedCriticalTelemetry,
    isCriticalTelemetryEvent,
    readPersistedCriticalTelemetry,
} from '@/utils/telemetry/persistCriticalTelemetry';
import type { TelemetryEvent } from '@/utils/telemetry/telemetryTypes';

// test/unit/telemetry/persistCriticalTelemetry.test.ts

function memoryStorage(): Storage {
    const map = new Map<string, string>();
    return {
        get length() {
            return map.size;
        },
        clear: () => map.clear(),
        getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
        key: (index: number) => Array.from(map.keys())[index] ?? null,
        removeItem: (key: string) => {
            map.delete(key);
        },
        setItem: (key: string, value: string) => {
            map.set(key, value);
        },
    };
}

afterEach(() => {
    clearPersistedCriticalTelemetry(globalThis.localStorage ?? null);
});

describe('persistCriticalTelemetry', () => {
    it('flags warn/error and GPU/playback failure names as critical', () => {
        expect(isCriticalTelemetryEvent({
            t: 1, name: 'boot.ready', level: 'info',
        })).toBe(false);
        expect(isCriticalTelemetryEvent({
            t: 1, name: 'perf.fps', level: 'warn',
        })).toBe(true);
        expect(isCriticalTelemetryEvent({
            t: 1, name: 'gpu.process_gone', level: 'info',
        })).toBe(true);
        expect(isCriticalTelemetryEvent({
            t: 1, name: 'audio.src_empty', level: 'info',
        })).toBe(true);
    });

    it('persists critical events and trims to capacity', () => {
        const storage = memoryStorage();
        for (let i = 0; i < CRITICAL_TELEMETRY_MAX + 5; i += 1) {
            const event: TelemetryEvent = {
                t: i,
                name: 'gpu.process_gone',
                level: 'error',
                data: { i },
            };
            appendPersistedCriticalTelemetry(event, storage);
        }
        const read = readPersistedCriticalTelemetry(storage);
        expect(read).toHaveLength(CRITICAL_TELEMETRY_MAX);
        expect(read[0]?.t).toBe(5);
        expect(read[read.length - 1]?.t).toBe(CRITICAL_TELEMETRY_MAX + 4);
        expect(storage.getItem(CRITICAL_TELEMETRY_STORAGE_KEY)).toBeTruthy();
    });

    it('skips non-critical events', () => {
        const storage = memoryStorage();
        appendPersistedCriticalTelemetry({
            t: 1, name: 'boot.ready', level: 'info',
        }, storage);
        expect(readPersistedCriticalTelemetry(storage)).toHaveLength(0);
    });
});

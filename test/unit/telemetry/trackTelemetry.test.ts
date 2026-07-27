import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    __resetTelemetryForTests,
    clearTelemetry,
    getTelemetrySnapshot,
    startTelemetrySpan,
    trackTelemetry,
} from '@/utils/telemetry/trackTelemetry';

// test/unit/telemetry/trackTelemetry.test.ts

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

beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
});

afterEach(() => {
    __resetTelemetryForTests(8);
    vi.unstubAllGlobals();
});

describe('trackTelemetry', () => {
    it('records sanitized events into the singleton ring', () => {
        trackTelemetry('play.toggle', {
            data: { action: 'replay-song', url: 'https://example.com/a.mp3' },
        });
        const snap = getTelemetrySnapshot();
        expect(snap.size).toBe(1);
        expect(snap.events[0]?.name).toBe('play.toggle');
        expect(snap.events[0]?.data).toEqual({
            action: 'replay-song',
            url: '[redacted-url]',
        });
    });

    it('ends a span with durMs timing', () => {
        const span = startTelemetrySpan('audio.resolve', { provider: 'netease' });
        span.end({ data: { ok: true } });
        const event = getTelemetrySnapshot().events[0];
        expect(event?.name).toBe('audio.resolve');
        expect(event?.durMs).toBeGreaterThanOrEqual(0);
        expect(event?.data).toMatchObject({ provider: 'netease', ok: true });
    });

    it('clearTelemetry empties the ring', () => {
        trackTelemetry('boot.ready');
        clearTelemetry();
        expect(getTelemetrySnapshot().size).toBe(0);
    });

    it('rehydrates critical events from localStorage after restart', () => {
        trackTelemetry('gpu.process_gone', {
            level: 'error',
            data: { exitCode: 512 },
        });
        __resetTelemetryForTests(8, { clearPersisted: false, rehydrate: true });
        const snap = getTelemetrySnapshot();
        expect(snap.size).toBe(1);
        expect(snap.events[0]?.name).toBe('gpu.process_gone');
        expect(snap.events[0]?.data).toMatchObject({ exitCode: 512 });
    });
});

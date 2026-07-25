import { describe, expect, it } from 'vitest';
import {
    createTelemetryRingBuffer,
    pushTelemetryEvent,
    snapshotTelemetryRing,
} from '@/utils/telemetry/telemetryRingBuffer';
import type { TelemetryEvent } from '@/utils/telemetry/telemetryTypes';

// test/unit/telemetry/telemetryRingBuffer.test.ts

const event = (name: string, t: number): TelemetryEvent => ({
    t,
    name,
    level: 'info',
});

describe('telemetryRingBuffer', () => {
    it('pushes events until capacity then overwrites oldest', () => {
        let buffer = createTelemetryRingBuffer(3);
        buffer = pushTelemetryEvent(buffer, event('a', 1));
        buffer = pushTelemetryEvent(buffer, event('b', 2));
        buffer = pushTelemetryEvent(buffer, event('c', 3));
        expect(snapshotTelemetryRing(buffer).events.map((e) => e.name)).toEqual(['a', 'b', 'c']);
        expect(buffer.dropped).toBe(0);

        buffer = pushTelemetryEvent(buffer, event('d', 4));
        const snap = snapshotTelemetryRing(buffer);
        expect(snap.events.map((e) => e.name)).toEqual(['b', 'c', 'd']);
        expect(snap.size).toBe(3);
        expect(snap.dropped).toBe(1);
    });

    it('returns empty snapshot for a fresh buffer', () => {
        const snap = snapshotTelemetryRing(createTelemetryRingBuffer(5));
        expect(snap.size).toBe(0);
        expect(snap.events).toEqual([]);
        expect(snap.dropped).toBe(0);
    });
});

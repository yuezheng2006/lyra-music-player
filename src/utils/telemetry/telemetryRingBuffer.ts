import type { TelemetryEvent, TelemetrySnapshot } from './telemetryTypes';
import { TELEMETRY_RING_CAPACITY } from './telemetryTypes';

// src/utils/telemetry/telemetryRingBuffer.ts
// Fixed-capacity ring buffer for local telemetry events.

export type TelemetryRingBuffer = {
    capacity: number;
    size: number;
    dropped: number;
    /** Next write index in the circular slots array. */
    writeIndex: number;
    slots: Array<TelemetryEvent | null>;
};

/** Create an empty ring buffer. */
export function createTelemetryRingBuffer(capacity = TELEMETRY_RING_CAPACITY): TelemetryRingBuffer {
    const safeCapacity = Math.max(1, Math.floor(capacity));
    return {
        capacity: safeCapacity,
        size: 0,
        dropped: 0,
        writeIndex: 0,
        slots: Array.from({ length: safeCapacity }, () => null),
    };
}

/** Push one event; overwrites oldest when full. */
export function pushTelemetryEvent(
    buffer: TelemetryRingBuffer,
    event: TelemetryEvent,
): TelemetryRingBuffer {
    const next: TelemetryRingBuffer = {
        ...buffer,
        slots: buffer.slots.slice(),
    };
    if (next.size === next.capacity) {
        next.dropped += 1;
    } else {
        next.size += 1;
    }
    next.slots[next.writeIndex] = event;
    next.writeIndex = (next.writeIndex + 1) % next.capacity;
    return next;
}

/** Oldest → newest snapshot for export / UI. */
export function snapshotTelemetryRing(buffer: TelemetryRingBuffer): TelemetrySnapshot {
    const events: TelemetryEvent[] = [];
    if (buffer.size === 0) {
        return {
            capacity: buffer.capacity,
            size: 0,
            dropped: buffer.dropped,
            events,
        };
    }
    const start = buffer.size < buffer.capacity
        ? 0
        : buffer.writeIndex;
    for (let i = 0; i < buffer.size; i += 1) {
        const slot = buffer.slots[(start + i) % buffer.capacity];
        if (slot) {
            events.push(slot);
        }
    }
    return {
        capacity: buffer.capacity,
        size: buffer.size,
        dropped: buffer.dropped,
        events,
    };
}

/** Reset buffer contents (keeps capacity). */
export function clearTelemetryRing(buffer: TelemetryRingBuffer): TelemetryRingBuffer {
    return createTelemetryRingBuffer(buffer.capacity);
}

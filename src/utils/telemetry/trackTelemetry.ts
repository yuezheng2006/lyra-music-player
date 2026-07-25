import {
    clearPersistedCriticalTelemetry,
    appendPersistedCriticalTelemetry,
    readPersistedCriticalTelemetry,
} from './persistCriticalTelemetry';
import {
    clearTelemetryRing,
    createTelemetryRingBuffer,
    pushTelemetryEvent,
    snapshotTelemetryRing,
    type TelemetryRingBuffer,
} from './telemetryRingBuffer';
import { sanitizeTelemetryPayload } from './sanitizeTelemetryPayload';
import type { TelemetryEvent, TelemetryEventName, TelemetryLevel, TelemetrySnapshot } from './telemetryTypes';
import { TELEMETRY_RING_CAPACITY } from './telemetryTypes';

// src/utils/telemetry/trackTelemetry.ts
// Public local telemetry API: track events, spans, and export snapshots.

type TrackTelemetryOptions = {
    level?: TelemetryLevel;
    durMs?: number;
    data?: Record<string, unknown>;
};

let ring: TelemetryRingBuffer = createTelemetryRingBuffer(TELEMETRY_RING_CAPACITY);
const listeners = new Set<() => void>();
let hydrated = false;

const nowMs = (): number => (
    typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now()
);

const notify = () => {
    for (const listener of listeners) {
        try {
            listener();
        } catch {
            // Listener failures must not break callers.
        }
    }
};

/** Hydrate ring once from localStorage critical events (survives reload / Electron restart). */
function ensureHydrated(): void {
    if (hydrated) return;
    hydrated = true;
    const persisted = readPersistedCriticalTelemetry();
    for (const event of persisted) {
        ring = pushTelemetryEvent(ring, event);
    }
}

/** Subscribe to ring updates (DevDebug refresh). Returns unsubscribe. */
export function subscribeTelemetry(listener: () => void): () => void {
    ensureHydrated();
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Record one local telemetry event into the ring buffer. */
export function trackTelemetry(
    name: TelemetryEventName | string,
    options: TrackTelemetryOptions = {},
): void {
    ensureHydrated();
    const event: TelemetryEvent = {
        t: Date.now(),
        name,
        level: options.level ?? 'info',
        durMs: typeof options.durMs === 'number' && Number.isFinite(options.durMs)
            ? Math.max(0, options.durMs)
            : undefined,
        data: sanitizeTelemetryPayload(options.data),
    };
    ring = pushTelemetryEvent(ring, event);
    appendPersistedCriticalTelemetry(event);

    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        const label = `[telemetry] ${event.name}`;
        const detail = {
            level: event.level,
            durMs: event.durMs,
            data: event.data,
        };
        if (event.level === 'error') {
            console.warn(label, detail);
        } else if (event.level === 'warn') {
            console.warn(label, detail);
        } else {
            console.debug(label, detail);
        }
    }

    notify();
}

/** Start a span; call end() to emit `name` with durMs. */
export function startTelemetrySpan(
    name: TelemetryEventName | string,
    data?: Record<string, unknown>,
): { end: (extra?: TrackTelemetryOptions) => void } {
    const started = nowMs();
    return {
        end: (extra = {}) => {
            trackTelemetry(name, {
                level: extra.level ?? 'info',
                durMs: nowMs() - started,
                data: {
                    ...(data ?? {}),
                    ...(extra.data ?? {}),
                },
            });
        },
    };
}

/** Snapshot for DevDebug / export (oldest → newest). */
export function getTelemetrySnapshot(): TelemetrySnapshot {
    ensureHydrated();
    return snapshotTelemetryRing(ring);
}

/** Clear the in-memory ring and persisted critical events. */
export function clearTelemetry(): void {
    ring = clearTelemetryRing(ring);
    clearPersistedCriticalTelemetry();
    notify();
}

/** Test-only: replace the singleton ring. */
export function __resetTelemetryForTests(
    capacity = TELEMETRY_RING_CAPACITY,
    options: { clearPersisted?: boolean; rehydrate?: boolean } = {},
): void {
    const clearPersisted = options.clearPersisted !== false;
    ring = createTelemetryRingBuffer(capacity);
    listeners.clear();
    if (clearPersisted) {
        clearPersistedCriticalTelemetry();
    }
    hydrated = false;
    if (options.rehydrate) {
        ensureHydrated();
    } else {
        // Skip auto-hydrate so unit tests start from an empty ring.
        hydrated = true;
    }
}

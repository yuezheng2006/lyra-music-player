import type { TelemetryEvent } from './telemetryTypes';

// src/utils/telemetry/persistCriticalTelemetry.ts
// Survive reload / Electron restart for GPU and playback diagnosis events.

export const CRITICAL_TELEMETRY_STORAGE_KEY = 'lyra_telemetry_critical_v1';
export const CRITICAL_TELEMETRY_MAX = 100;

/** Events worth keeping across page reload / Electron process restart. */
export function isCriticalTelemetryEvent(event: TelemetryEvent): boolean {
    if (event.level === 'error' || event.level === 'warn') return true;
    return (
        event.name === 'gpu.process_gone'
        || event.name === 'play.error'
        || event.name === 'audio.src_empty'
        || event.name === 'audio.waiting'
        || event.name === 'audio.stalled'
        || event.name === 'audio.rebuffered'
    );
}

const getStorage = (): Storage | null => {
    if (typeof globalThis === 'undefined') return null;
    try {
        return globalThis.localStorage ?? null;
    } catch {
        return null;
    }
};

/** Read persisted critical events (oldest → newest). */
export function readPersistedCriticalTelemetry(
    storage: Storage | null = getStorage(),
): TelemetryEvent[] {
    if (!storage) return [];
    try {
        const raw = storage.getItem(CRITICAL_TELEMETRY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item): item is TelemetryEvent => (
            !!item
            && typeof item === 'object'
            && typeof (item as TelemetryEvent).t === 'number'
            && typeof (item as TelemetryEvent).name === 'string'
            && typeof (item as TelemetryEvent).level === 'string'
        ));
    } catch {
        return [];
    }
}

/** Append one critical event; drops oldest when over capacity. */
export function appendPersistedCriticalTelemetry(
    event: TelemetryEvent,
    storage: Storage | null = getStorage(),
): void {
    if (!storage || !isCriticalTelemetryEvent(event)) return;
    try {
        const prev = readPersistedCriticalTelemetry(storage);
        const next = [...prev, event];
        const trimmed = next.length > CRITICAL_TELEMETRY_MAX
            ? next.slice(next.length - CRITICAL_TELEMETRY_MAX)
            : next;
        storage.setItem(CRITICAL_TELEMETRY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // Quota / private mode — ignore.
    }
}

/** Clear persisted critical telemetry. */
export function clearPersistedCriticalTelemetry(
    storage: Storage | null = getStorage(),
): void {
    if (!storage) return;
    try {
        storage.removeItem(CRITICAL_TELEMETRY_STORAGE_KEY);
    } catch {
        // ignore
    }
}

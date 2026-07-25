import {
    clearTelemetry,
    getTelemetrySnapshot,
    subscribeTelemetry,
} from './trackTelemetry';
import type { TelemetrySnapshot } from './telemetryTypes';

// src/utils/telemetry/installTelemetryDevBridge.ts
// DEV/test bridge: expose snapshot APIs on globalThis for Playwright / CDP.

export type LyraTelemetryBridge = {
    getSnapshot: () => TelemetrySnapshot;
    clear: () => void;
    subscribe: (listener: () => void) => () => void;
};

declare global {
    // eslint-disable-next-line no-var
    var __LYRA_TELEMETRY__: LyraTelemetryBridge | undefined;
}

/** Install `globalThis.__LYRA_TELEMETRY__` once in DEV (idempotent). */
export function installTelemetryDevBridge(): void {
    if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) {
        return;
    }
    if (typeof globalThis === 'undefined') {
        return;
    }
    if (globalThis.__LYRA_TELEMETRY__) {
        return;
    }
    globalThis.__LYRA_TELEMETRY__ = {
        getSnapshot: getTelemetrySnapshot,
        clear: clearTelemetry,
        subscribe: subscribeTelemetry,
    };
}

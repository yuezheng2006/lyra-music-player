import { afterEach, describe, expect, it, vi } from 'vitest';
import { installTelemetryDevBridge } from '@/utils/telemetry/installTelemetryDevBridge';
import { __resetTelemetryForTests, trackTelemetry } from '@/utils/telemetry/trackTelemetry';

// test/unit/telemetry/installTelemetryDevBridge.test.ts

afterEach(() => {
    delete (globalThis as { __LYRA_TELEMETRY__?: unknown }).__LYRA_TELEMETRY__;
    __resetTelemetryForTests(8);
    vi.unstubAllGlobals();
});

describe('installTelemetryDevBridge', () => {
    it('exposes getSnapshot/clear/subscribe on globalThis in DEV', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        });
        installTelemetryDevBridge();
        const bridge = (globalThis as { __LYRA_TELEMETRY__?: {
            getSnapshot: () => { size: number; events: Array<{ name: string }> };
            clear: () => void;
        } }).__LYRA_TELEMETRY__;
        expect(bridge).toBeTruthy();
        trackTelemetry('boot.ready');
        expect(bridge!.getSnapshot().events.some((event) => event.name === 'boot.ready')).toBe(true);
        bridge!.clear();
        expect(bridge!.getSnapshot().size).toBe(0);
    });
});

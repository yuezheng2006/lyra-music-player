import { expect, type Page } from '@playwright/test';

// test/ui/helpers/telemetry.ts
// Playwright helpers that read the DEV `__LYRA_TELEMETRY__` bridge.

export type UiTelemetryEvent = {
    t: number;
    name: string;
    level: string;
    durMs?: number;
    data?: Record<string, unknown>;
};

export type UiTelemetrySnapshot = {
    capacity: number;
    size: number;
    dropped: number;
    events: UiTelemetryEvent[];
};

/** Read the live telemetry ring snapshot from the page (null if bridge missing). */
export async function readTelemetrySnapshot(page: Page): Promise<UiTelemetrySnapshot | null> {
    return page.evaluate(() => {
        const bridge = (globalThis as { __LYRA_TELEMETRY__?: {
            getSnapshot: () => UiTelemetrySnapshot;
        } }).__LYRA_TELEMETRY__;
        return bridge ? bridge.getSnapshot() : null;
    });
}

/** Clear the in-page telemetry ring (and critical persistence). */
export async function clearPageTelemetry(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const bridge = (globalThis as { __LYRA_TELEMETRY__?: { clear: () => void } }).__LYRA_TELEMETRY__;
        if (!bridge) return false;
        bridge.clear();
        return true;
    });
}

type WaitForTelemetryOptions = {
    timeout?: number;
    /** Match event data subset (shallow). */
    data?: Record<string, unknown>;
    sinceMs?: number;
};

/** Poll until an event with the given name (and optional data match) appears. */
export async function waitForTelemetryEvent(
    page: Page,
    name: string,
    options: WaitForTelemetryOptions = {},
): Promise<UiTelemetryEvent> {
    const timeout = options.timeout ?? 20_000;
    let matched: UiTelemetryEvent | null = null;

    await expect.poll(async () => {
        const snap = await readTelemetrySnapshot(page);
        if (!snap) return null;
        const hit = [...snap.events].reverse().find((event) => {
            if (event.name !== name) return false;
            if (typeof options.sinceMs === 'number' && event.t < options.sinceMs) return false;
            if (options.data) {
                for (const [key, value] of Object.entries(options.data)) {
                    if (event.data?.[key] !== value) return false;
                }
            }
            return true;
        });
        matched = hit ?? null;
        return hit?.name ?? null;
    }, { timeout }).toBe(name);

    if (!matched) {
        throw new Error(`telemetry event not found: ${name}`);
    }
    return matched;
}

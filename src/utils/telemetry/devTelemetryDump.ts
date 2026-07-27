import { getTelemetrySnapshot } from './trackTelemetry';

// src/utils/telemetry/devTelemetryDump.ts
// DEV-only: mirror telemetry + playback diag into localStorage for agent/CDP-less reads.

export const DEV_TELEMETRY_DUMP_STORAGE_KEY = 'lyra_telemetry_dump_v1';
const DUMP_INTERVAL_MS = 2000;

type DevTelemetryDump = {
    exportedAt: string;
    href: string;
    gpuUnstable: string | null;
    visualizerMode: string | null;
    bgMode: string | null;
    dockTime: string | null;
    audio: {
        currentTime: number | null;
        paused: boolean | null;
        readyState: number | null;
        networkState: number | null;
        bufferedSec: number | null;
        srcLen: number;
    };
    perf: {
        fpsAvg: number | null;
        tier: string | null;
        mode: string | null;
    };
    telemetry: ReturnType<typeof getTelemetrySnapshot>;
};

const readAudioDiag = () => {
    const audio = typeof document !== 'undefined'
        ? document.querySelector('audio')
        : null;
    if (!audio) {
        return {
            currentTime: null,
            paused: null,
            readyState: null,
            networkState: null,
            bufferedSec: null,
            srcLen: 0,
        };
    }
    let bufferedSec: number | null = null;
    try {
        if (audio.buffered.length > 0) {
            bufferedSec = audio.buffered.end(audio.buffered.length - 1) - audio.currentTime;
        }
    } catch {
        bufferedSec = null;
    }
    return {
        currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : null,
        paused: audio.paused,
        readyState: audio.readyState,
        networkState: audio.networkState,
        bufferedSec,
        srcLen: audio.src ? String(audio.src).length : 0,
    };
};

const buildDump = (): DevTelemetryDump => {
    const dock = typeof document !== 'undefined'
        ? document.querySelector('[data-testid="floating-player-dock-time"]')
        : null;
    let perf = { fpsAvg: null as number | null, tier: null as string | null, mode: null as string | null };
    try {
        // Lazy import avoided; read from store if already on window/module graph.
        const store = (globalThis as { __LYRA_PERF_STORE__?: { getState: () => {
            fpsAvg: number;
            effectiveTier: string;
            mode: string;
        } } }).__LYRA_PERF_STORE__;
        if (store) {
            const state = store.getState();
            perf = {
                fpsAvg: Math.round(state.fpsAvg),
                tier: state.effectiveTier,
                mode: state.mode,
            };
        }
    } catch {
        // ignore
    }
    return {
        exportedAt: new Date().toISOString(),
        href: typeof location !== 'undefined' ? location.href : '',
        gpuUnstable: typeof localStorage !== 'undefined'
            ? localStorage.getItem('lyra_gpu_unstable_v1')
            : null,
        visualizerMode: typeof localStorage !== 'undefined'
            ? localStorage.getItem('visualizer_mode')
            : null,
        bgMode: typeof localStorage !== 'undefined'
            ? localStorage.getItem('visualizer_background_mode')
            : null,
        dockTime: dock?.textContent ?? null,
        audio: readAudioDiag(),
        perf,
        telemetry: (() => {
            const snap = getTelemetrySnapshot();
            // Cap export size so electron-store / localStorage stays reliable.
            const events = snap.events.slice(-120);
            return {
                ...snap,
                size: events.length,
                events,
            };
        })(),
    };
};

/** Start periodic localStorage dump. Returns stop(). */
export function startDevTelemetryDump(): () => void {
    if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) {
        return () => undefined;
    }
    if (typeof localStorage === 'undefined') {
        return () => undefined;
    }

    const write = () => {
        const dump = buildDump();
        try {
            localStorage.setItem(DEV_TELEMETRY_DUMP_STORAGE_KEY, JSON.stringify(dump));
        } catch {
            // quota
        }
        // Electron-store dump — readable from disk without CDP.
        try {
            void window.electron?.saveSettings?.(DEV_TELEMETRY_DUMP_STORAGE_KEY, dump);
        } catch {
            // ignore
        }
    };

    write();
    const id = window.setInterval(write, DUMP_INTERVAL_MS);
    return () => window.clearInterval(id);
}

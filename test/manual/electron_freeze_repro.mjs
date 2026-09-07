import { _electron as electron } from 'playwright';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

// test/manual/electron_freeze_repro.mjs
// Automated GPU-freeze repro: launches an isolated Electron instance (separate
// --user-data-dir, never touches the real dev profile), forces
// interactive3d + a heavy lyric visualizer (cappella/pendolo), seeds a fully
// offline playable track + synthetic lyrics (no network dependency), plays
// for a fixed window, and polls the renderer for hangs / GPU-process-gone /
// FPS collapse instead of relying on manual human testing.
//
// Usage: node test/manual/electron_freeze_repro.mjs
// Requires the existing dev stack (vite :3000, netease-api :3001,
// music-provider-sidecar :3002) already running via `npm run dev:electron`.

const require = createRequire(import.meta.url);
const APP_VERSION = require('../../package.json').version;

const TEST_DURATION_MS = 45_000;
const POLL_INTERVAL_MS = 3_000;
const EVAL_TIMEOUT_MS = 5_000;
// classic is a lightweight baseline: if it also hangs/GPU-crashes, the freeze
// is not specific to cappella/pendolo's heavier DOM/animation cost.
const MODES_TO_TEST = ['classic', 'cappella', 'pendolo'];

const userDataDir = path.join(os.tmpdir(), `lyra-e2e-freeze-repro-${Date.now()}`);

async function waitForAppWindow(app) {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
        for (const win of app.windows()) {
            if (win.url().startsWith('http://localhost:3000')) {
                return win;
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const urls = app.windows().map((win) => win.url());
    throw new Error(`App window was not created. Open windows: ${JSON.stringify(urls)}`);
}

function evalWithTimeout(win, fn, args, timeoutMs) {
    return Promise.race([
        win.evaluate(fn, args),
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('EVAL_TIMEOUT')), timeoutMs);
        }),
    ]);
}

async function seedBaseSettings(win, appVersion) {
    await win.evaluate((version) => {
        localStorage.setItem('i18nextLng', 'zh-CN');
        localStorage.setItem('last_app_view', 'player');
        localStorage.setItem('open_player_on_launch', 'true');
        localStorage.setItem('lyra_onboarding_completed', 'true');
        localStorage.setItem('folia_last_seen_guide_version', version);
        localStorage.setItem('player_volume', '0.05');
        localStorage.setItem('visualizer_background_mode', 'interactive3d');
    }, appVersion);
}

async function seedFixtureTrack(win) {
    await win.evaluate(async () => {
        // Real (quiet) broadband tone, not silence: the atmosphere/beat-detection
        // pipeline reads live FFT bins from the decoded signal every frame, and a
        // silent track short-circuits most of that per-frame work. A few mixed
        // sine bands + a slow amplitude envelope gives the analyser something to
        // chew on across bass/mid/treble bins without being loud in playback.
        const buildToneWav = (seconds = 150, sampleRate = 22050) => {
            const sampleCount = seconds * sampleRate;
            const dataLength = sampleCount * 2;
            const buffer = new ArrayBuffer(44 + dataLength);
            const view = new DataView(buffer);
            const writeString = (offset, text) => {
                for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
            };
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + dataLength, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, dataLength, true);

            const bass = 60;
            const mid = 440;
            const treble = 2400;
            const beatHz = 2.1;
            const peakAmplitude = 0.28 * 32767;
            for (let i = 0; i < sampleCount; i += 1) {
                const t = i / sampleRate;
                const envelope = 0.55 + 0.45 * Math.max(0, Math.sin(2 * Math.PI * beatHz * t));
                const signal = (
                    0.5 * Math.sin(2 * Math.PI * bass * t)
                    + 0.3 * Math.sin(2 * Math.PI * mid * t)
                    + 0.2 * Math.sin(2 * Math.PI * treble * t)
                ) * envelope;
                view.setInt16(44 + i * 2, Math.round(signal * peakAmplitude), true);
            }
            return buffer;
        };

        const { saveToCache } = await import(/* @vite-ignore */ '/src/services/db.ts');
        const { saveAudioBlob } = await import(/* @vite-ignore */ '/src/services/audioCache.ts');
        const { getProviderSongCacheKey } = await import(
            /* @vite-ignore */ '/src/services/musicProviders/registry.ts'
        );

        const coverUrl = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22%3E%3Crect width=%22256%22 height=%22256%22 fill=%22%230a1a33%22/%3E%3C/svg%3E';
        const song = {
            id: 910000002,
            name: 'Freeze Repro Fixture',
            ar: [{ id: 1, name: 'Freeze Repro' }],
            artists: [{ id: 1, name: 'Freeze Repro' }],
            album: { id: 1, name: 'Freeze Repro Album', picUrl: coverUrl },
            al: { id: 1, name: 'Freeze Repro Album', picUrl: coverUrl },
            duration: 150000,
            dt: 150000,
        };

        const wavBytes = buildToneWav(150, 22050);
        await saveAudioBlob(
            getProviderSongCacheKey('audio', song),
            new Blob([wavBytes], { type: 'audio/wav' }),
        );

        const lyricLines = [];
        const step = 3.5;
        for (let t = 0; t + step < 150; t += step) {
            const speakerIndex = Math.floor(t / step) % 2;
            lyricLines.push({
                words: [],
                startTime: t,
                endTime: t + step - 0.2,
                fullText: `压力测试歌词第 ${lyricLines.length + 1} 行 - freeze repro probe line`,
                agentId: speakerIndex === 0 ? 'v1' : 'v2',
            });
        }
        const lyricData = { lines: lyricLines, title: song.name, artist: 'Freeze Repro' };
        await saveToCache(getProviderSongCacheKey('lyric', song), lyricData);

        await saveToCache('last_song', song);
        await saveToCache('last_queue', [song]);
    });
}

async function runFreezeProbe(win, mode) {
    await win.evaluate((visualizerMode) => {
        localStorage.setItem('visualizer_mode', visualizerMode);
    }, mode);

    await win.reload();
    await win.waitForLoadState('domcontentloaded', { timeout: 20000 });

    const bootReady = await win.evaluate(async () => {
        const deadline = Date.now() + 20000;
        while (Date.now() < deadline) {
            const bridge = globalThis.__LYRA_TELEMETRY__;
            if (bridge) {
                const snap = bridge.getSnapshot();
                if (snap.events.some((event) => event.name === 'boot.ready')) return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
        return false;
    });
    if (!bootReady) {
        console.warn(`[${mode}] boot.ready telemetry not observed within 20s`);
    }

    const dock = win.getByTestId('floating-player-dock');
    await dock.waitFor({ state: 'visible', timeout: 20000 });
    const playButton = dock.getByRole('button', { name: /^(Play|播放)$/i });
    await playButton.waitFor({ state: 'visible', timeout: 10000 });
    // force: true — a transiently overlapping sibling (e.g. the lyrics toggle)
    // can intercept the actionability check right after reload; the button
    // itself is visible/enabled, so a plain dispatched click is safe here.
    await playButton.click({ timeout: 10000, force: true });
    await win.waitForTimeout(1500);

    const probeStartedAtMs = Date.now();
    const samples = [];
    let stallCount = 0;
    let consecutiveStalls = 0;
    let maxConsecutiveStalls = 0;
    let hardHangDetected = false;

    const deadline = Date.now() + TEST_DURATION_MS;
    while (Date.now() < deadline) {
        const iterationStart = Date.now();
        try {
            const snapshot = await evalWithTimeout(win, () => {
                const perf = globalThis.__LYRA_PERF_STORE__?.getState?.();
                const telemetry = globalThis.__LYRA_TELEMETRY__?.getSnapshot?.();
                return {
                    fpsInstant: perf?.fpsInstant ?? null,
                    fpsAvg: perf?.fpsAvg ?? null,
                    fpsMin: perf?.fpsMin ?? null,
                    autoTier: perf?.autoTier ?? null,
                    memoryMb: perf?.memory?.usedMb ?? null,
                    memoryWarning: perf?.memoryWarning ?? null,
                    telemetryEventCount: telemetry?.size ?? null,
                    gpuGoneEvents: (telemetry?.events ?? []).filter((event) => event.name === 'gpu.process_gone').length,
                    tierChangeEvents: (telemetry?.events ?? []).filter((event) => event.name === 'perf.tier_change').length,
                    playErrorEvents: (telemetry?.events ?? []).filter((event) => event.name === 'play.error').length,
                };
            }, null, EVAL_TIMEOUT_MS);
            samples.push({ tMs: Date.now() - probeStartedAtMs, ...snapshot });
            consecutiveStalls = 0;
        } catch (error) {
            stallCount += 1;
            consecutiveStalls += 1;
            maxConsecutiveStalls = Math.max(maxConsecutiveStalls, consecutiveStalls);
            samples.push({ tMs: Date.now() - probeStartedAtMs, stall: true, error: String(error?.message || error) });
            if (consecutiveStalls >= 3) {
                hardHangDetected = true;
            }
        }
        const elapsed = Date.now() - iterationStart;
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, POLL_INTERVAL_MS - elapsed)));
    }

    const fpsValues = samples.map((s) => s.fpsAvg).filter((v) => typeof v === 'number');
    const gpuGone = Math.max(0, ...samples.map((s) => s.gpuGoneEvents ?? 0));
    const tierChanges = Math.max(0, ...samples.map((s) => s.tierChangeEvents ?? 0));
    const playErrors = Math.max(0, ...samples.map((s) => s.playErrorEvents ?? 0));

    return {
        mode,
        sampleCount: samples.length,
        stallCount,
        maxConsecutiveStalls,
        hardHangDetected,
        minFpsAvgObserved: fpsValues.length ? Math.min(...fpsValues) : null,
        gpuProcessGoneEvents: gpuGone,
        perfTierChangeEvents: tierChanges,
        playErrorEvents: playErrors,
        samples,
    };
}

async function main() {
    const app = await electron.launch({
        args: ['.', `--user-data-dir=${userDataDir}`],
        env: {
            ...process.env,
            ELECTRON_DEV: 'true',
            LYRA_EXTERNAL_DEV_APIS: 'true',
            LYRA_DISABLE_SINGLE_INSTANCE_LOCK: 'true',
            NODE_ENV: 'development',
        },
    });

    const consoleMessages = [];
    const mainProcessGpuLogs = [];
    const results = [];

    try {
        const proc = app.process();
        proc.stdout?.on('data', (chunk) => {
            const text = chunk.toString();
            if (/gpu/i.test(text)) mainProcessGpuLogs.push(text.trim());
        });
        proc.stderr?.on('data', (chunk) => {
            const text = chunk.toString();
            if (/gpu process exited|gpu-process|GPU process/i.test(text)) mainProcessGpuLogs.push(text.trim());
        });

        const win = await waitForAppWindow(app);
        win.on('console', (msg) => {
            const type = msg.type();
            if (type === 'error' || type === 'warning') {
                consoleMessages.push(`[${type}] ${msg.text()}`);
            }
        });
        await win.waitForLoadState('domcontentloaded', { timeout: 20000 });
        await win.waitForTimeout(1000);

        await seedBaseSettings(win, APP_VERSION);
        await seedFixtureTrack(win);

        for (const mode of MODES_TO_TEST) {
            console.log(`\n=== Probing visualizer_mode=${mode} + interactive3d for ${TEST_DURATION_MS / 1000}s ===`);
            try {
                const result = await runFreezeProbe(win, mode);
                console.log(JSON.stringify({ ...result, samples: undefined }, null, 2));
                results.push(result);
            } catch (error) {
                console.error(`[${mode}] probe failed: ${error?.message || error}`);
                results.push({ mode, probeError: String(error?.message || error) });
            }
        }
    } finally {
        console.log('\n=== FULL SUMMARY ===');
        for (const result of results) {
            console.log(`- ${result.mode}: hardHang=${result.hardHangDetected} stalls=${result.stallCount}/${result.sampleCount} minFpsAvg=${result.minFpsAvgObserved} gpuGoneEvents=${result.gpuProcessGoneEvents}`);
        }

        const errorCounts = new Map();
        for (const line of consoleMessages) {
            errorCounts.set(line, (errorCounts.get(line) ?? 0) + 1);
        }
        const topErrors = [...errorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (topErrors.length) {
            console.log('\n=== Top repeated console errors/warnings ===');
            for (const [line, count] of topErrors) {
                console.log(`${count}x  ${line.slice(0, 200)}`);
            }
        }

        if (mainProcessGpuLogs.length) {
            console.log('\n=== Main-process GPU-related logs ===');
            for (const line of mainProcessGpuLogs.slice(0, 20)) console.log(line);
        }

        const anyHardHang = results.some((r) => r.hardHangDetected);
        const anyGpuCrash = results.some((r) => r.gpuProcessGoneEvents > 0) || mainProcessGpuLogs.length > 0;
        console.log(`\nRESULT: hardHang=${anyHardHang} gpuCrash=${anyGpuCrash}`);

        await app.close().catch(() => {});
        process.exitCode = anyHardHang || anyGpuCrash ? 1 : 0;
    }
}

await main();

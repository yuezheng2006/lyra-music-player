// Attach to the already-running `npm run dev:electron` instance over CDP (no relaunch)
// to diagnose GPU-process instability without needing the user to reproduce it manually.
//
// Usage: node test/manual/probe_live_gpu_stability.mjs [soakMinutes]
//
// 1. Prints Chromium's real GPU feature status (chrome://gpu equivalent via
//    SystemInfo.getInfo) — the fastest way to tell "hardware accelerated" apart
//    from a silent software-rendering fallback (webgl/gpu_compositing disabled).
// 2. Polls window.__LYRA_PERF_STORE__ + the <audio> element every 30s for
//    `soakMinutes` to catch stalls or fps collapse during real playback.
//
// Background: electron/main.cjs escalates the ANGLE backend after *repeat*
// GPU-process crashes (electron/electron#49904 — ANGLE Metal backend crash on
// macOS 26 Tahoe). Use this script to confirm a boot is healthy before/after
// changing that escalation logic.
import { chromium } from 'playwright-core';

const soakMinutes = Number(process.argv[2] ?? 5);

const browser = await chromium.connectOverCDP('http://127.0.0.1:9229');
let page = null;
for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
        if (p.url().includes('localhost:3000')) page = p;
    }
}
if (!page) {
    console.error('Lyra page not found on ws://127.0.0.1:9229 — is dev:electron running?');
    process.exit(1);
}

const cdp = await browser.newBrowserCDPSession();
const info = await cdp.send('SystemInfo.getInfo');
console.log('gpu device:', info.gpu?.devices?.[0]?.deviceString);
console.log('feature status:', JSON.stringify(info.gpu?.featureStatus, null, 2));

const unhealthy = ['webgl', 'gpu_compositing', 'rasterization']
    .filter((key) => String(info.gpu?.featureStatus?.[key] ?? '').startsWith('disabled'));
if (unhealthy.length > 0) {
    console.warn(`GPU DEGRADED — disabled features: ${unhealthy.join(', ')} (likely stuck in software fallback after a crash; relaunch the app)`);
} else {
    console.log('GPU healthy — hardware accelerated.');
}

console.log(`\nSoaking for ${soakMinutes} minute(s), sampling every 30s...`);
for (let i = 0; i < soakMinutes * 2; i += 1) {
    await page.waitForTimeout(30000);
    const snapshot = await page.evaluate(() => {
        const audio = document.querySelector('audio');
        const perf = globalThis.__LYRA_PERF_STORE__?.getState();
        return {
            t: new Date().toISOString(),
            paused: audio?.paused,
            currentTime: audio ? Math.round(audio.currentTime) : null,
            fpsAvg: perf ? Math.round(perf.fpsAvg) : null,
            tier: perf?.effectiveTier ?? null,
            bgMode: localStorage.getItem('visualizer_background_mode'),
            gpuUnstable: localStorage.getItem('lyra_gpu_unstable_v1'),
        };
    });
    console.log(JSON.stringify(snapshot));
}

await browser.close();

import { existsSync } from 'fs';
import { defineConfig } from '@playwright/test';

// playwright.config.ts
// Local: hardware GL + 1 worker (SwiftShader on mac melts the CPU).
// CI/Linux: SwiftShader so headless WebGL still mounts.

const loopbackNoProxy = '127.0.0.1,localhost,::1';
process.env.NO_PROXY = process.env.NO_PROXY ? `${process.env.NO_PROXY},${loopbackNoProxy}` : loopbackNoProxy;
process.env.no_proxy = process.env.no_proxy ? `${process.env.no_proxy},${loopbackNoProxy}` : loopbackNoProxy;

const chromiumCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
].filter((value): value is string => Boolean(value));

const chromiumExecutablePath = chromiumCandidates.find(candidate => existsSync(candidate));

const isCi = Boolean(process.env.CI);
// PLAYWRIGHT_WEB_PORT avoids colliding with other local apps already bound to 4173.
const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT || 4173);
const webOrigin = `http://127.0.0.1:${webPort}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1'
  ? true
  : process.env.PLAYWRIGHT_REUSE_SERVER === '0'
    ? false
    : !isCi;
// Force software GL only when needed (Linux CI / explicit override). Local macOS must use GPU.
const useSwiftShader = isCi
  || process.env.PLAYWRIGHT_FORCE_SWIFTSHADER === '1'
  || process.platform === 'linux';

const chromiumArgs = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  ...(useSwiftShader
    ? ['--use-angle=swiftshader']
    : [
        // Prefer real GPU on local macOS/Windows; avoid ANGLE software fallbacks.
        '--use-angle=default',
        '--disable-software-rasterizer',
      ]),
];

export default defineConfig({
  testDir: './test/ui',
  fullyParallel: false,
  // Two WebGL Chromiums + Electron Vite is what spikes the fans locally.
  workers: isCi ? 2 : 1,
  reporter: isCi ? 'github' : 'line',
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: isCi ? 1 : 0,
  use: {
    baseURL: webOrigin,
    viewport: {
      width: 1440,
      height: 1100,
    },
    trace: 'on-first-retry',
    launchOptions: {
      executablePath: chromiumExecutablePath,
      args: chromiumArgs,
    },
  },
  webServer: {
    command: `cross-env VITE_NETEASE_API_BASE=${webOrigin}/__mock_netease__ npm run dev -- --host 127.0.0.1 --port ${webPort} --strictPort`,
    url: webOrigin,
    reuseExistingServer,
    timeout: 120_000,
  },
});

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

// test/manual/electron_packaged_smoke.mjs
// Shared hard/soft assertions for release-path Electron (file:// + embedded APIs).
// Usage:
//   node test/manual/electron_packaged_smoke.mjs --mode=dist
//   node test/manual/electron_packaged_smoke.mjs --mode=app --app=/path/to/Lyra.app

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const parseArgs = (argv) => {
  const out = { mode: 'dist', app: null };
  for (const arg of argv) {
    if (arg.startsWith('--mode=')) out.mode = arg.slice('--mode='.length);
    if (arg.startsWith('--app=')) out.app = arg.slice('--app='.length);
  }
  return out;
};

const httpGetJson = (url, timeoutMs = 15000) => new Promise((resolve, reject) => {
  const req = http.get(url, { timeout: timeoutMs }, (res) => {
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      try {
        resolve({ status: res.statusCode || 0, json: JSON.parse(body), body });
      } catch {
        resolve({ status: res.statusCode || 0, json: null, body });
      }
    });
  });
  req.on('timeout', () => {
    req.destroy();
    reject(new Error(`timeout fetching ${url}`));
  });
  req.on('error', reject);
});

const resolveMacExecutable = (appPath) => {
  const macOSDir = path.join(appPath, 'Contents', 'MacOS');
  if (!fs.existsSync(macOSDir)) {
    throw new Error(`Not a mac .app bundle: ${appPath}`);
  }
  const entries = fs.readdirSync(macOSDir);
  if (entries.length === 0) {
    throw new Error(`Empty MacOS dir in ${appPath}`);
  }
  // Prefer productName "Lyra" when present.
  const preferred = entries.find((name) => name === 'Lyra') || entries[0];
  return path.join(macOSDir, preferred);
};

const buildLaunchOptions = (args) => {
  const env = {
    ...process.env,
    LYRA_DISABLE_SINGLE_INSTANCE_LOCK: 'true',
    ELECTRON_DEV: 'false',
    NODE_ENV: 'production',
  };
  delete env.ELECTRON_DEV;
  env.ELECTRON_DEV = 'false';

  if (args.mode === 'app') {
    if (!args.app) {
      throw new Error('--mode=app requires --app=/path/to/Lyra.app');
    }
    const appPath = path.resolve(args.app);
    return {
      executablePath: resolveMacExecutable(appPath),
      args: [],
      env,
      cwd: repoRoot,
    };
  }

  if (args.mode !== 'dist') {
    throw new Error(`Unknown --mode=${args.mode} (expected dist|app)`);
  }

  const distIndex = path.join(repoRoot, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    throw new Error(`Missing ${distIndex}; run ELECTRON=true vite build first`);
  }

  return {
    args: ['.'],
    env: {
      ...env,
      ELECTRON: 'true',
    },
    cwd: repoRoot,
  };
};

const waitForPackagedWindow = async (app, timeoutMs = 45000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const win of app.windows()) {
      const url = win.url();
      if (!url || url === 'about:blank') continue;
      if (url.startsWith('http://localhost:3000') || url.startsWith('http://127.0.0.1:3000')) {
        throw new Error(`Packaged smoke saw Vite dev URL (wrong path): ${url}`);
      }
      // Packaged UI is served from a loopback static server (not Vite :3000, not file://).
      if (/^https?:\/\/127\.0\.0\.1:\d+\//.test(url) || url.startsWith('file://') || url.startsWith('lyra://')) {
        return win;
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  const urls = app.windows().map((win) => win.url());
  throw new Error(`Packaged app window not ready. Open windows: ${JSON.stringify(urls)}`);
};

const evaluateBridge = async (page) => page.evaluate(async () => {
  const electronBridge = window.electron;
  if (!electronBridge) {
    return { ok: false, error: 'window.electron missing' };
  }
  const neteasePort = await electronBridge.getNeteasePort?.();
  const musicProviderPort = await electronBridge.getMusicProviderPort?.();
  const hasRoot = Boolean(document.getElementById('root'));
  // Avoid navigator.serviceWorker.getRegistrations() — it can thrash Chromium SW storage under file://.
  return {
    ok: true,
    title: document.title,
    url: location.href,
    hasRoot,
    neteasePort,
    musicProviderPort,
    hasGetNeteasePort: typeof electronBridge.getNeteasePort === 'function',
    hasGetMusicProviderPort: typeof electronBridge.getMusicProviderPort === 'function',
    swController: Boolean(navigator.serviceWorker?.controller),
  };
});

/** Retry across Electron's brief post-load navigations. */
const waitForBridge = async (app, timeoutMs = 90000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const win = await waitForPackagedWindow(app, Math.min(15000, deadline - Date.now()));
      await new Promise((r) => setTimeout(r, 1000));
      const bridge = await evaluateBridge(win);
      if (!bridge.ok) {
        lastError = new Error(bridge.error);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      const isPackagedUi =
        /^https?:\/\/127\.0\.0\.1:\d+\//.test(bridge.url || '')
        || bridge.url?.startsWith('file://')
        || bridge.url?.startsWith('lyra://');
      if (!isPackagedUi) {
        lastError = new Error(`expected packaged UI origin, got ${bridge.url}`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      return { win, bridge };
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 750));
    }
  }
  throw new Error(`Bridge never ready: ${lastError?.message || lastError}`);
};

const args = parseArgs(process.argv.slice(2));
const launchOptions = buildLaunchOptions(args);
const softFails = [];
const summary = {
  mode: args.mode,
  url: null,
  neteasePort: null,
  musicProviderPort: null,
  search: null,
  songUrl: null,
  lyric: null,
  fonts: null,
  serviceWorker: null,
  softFails,
};

let app;
try {
  app = await electron.launch(launchOptions);
  const { win, bridge } = await waitForBridge(app);

  summary.url = bridge.url;
  summary.neteasePort = bridge.neteasePort;
  summary.musicProviderPort = bridge.musicProviderPort;
  summary.serviceWorker = {
    controller: bridge.swController,
  };

  if (!bridge.hasGetNeteasePort || !bridge.hasGetMusicProviderPort) {
    throw new Error(`Preload incomplete: ${JSON.stringify(bridge)}`);
  }
  if (!bridge.hasRoot) {
    throw new Error('Missing #root — renderer failed to mount');
  }
  if (typeof bridge.neteasePort !== 'number' || bridge.neteasePort <= 0) {
    throw new Error(`Invalid netease port: ${bridge.neteasePort}`);
  }
  if (typeof bridge.musicProviderPort !== 'number' || bridge.musicProviderPort <= 0) {
    throw new Error(`Invalid music provider port: ${bridge.musicProviderPort}`);
  }
  if (bridge.swController) {
    throw new Error(`Service worker controller active in Electron packaged path`);
  }

  // Hard: local API must answer.
  const searchUrl = `http://127.0.0.1:${bridge.neteasePort}/cloudsearch?keywords=${encodeURIComponent('周杰伦')}&limit=3`;
  let searchRes;
  try {
    searchRes = await httpGetJson(searchUrl);
  } catch (error) {
    throw new Error(`Netease API unreachable on port ${bridge.neteasePort}: ${error.message}`);
  }
  if (searchRes.status < 200 || searchRes.status >= 500) {
    throw new Error(`Netease API HTTP ${searchRes.status} for cloudsearch`);
  }

  const songs = searchRes.json?.result?.songs;
  if (!Array.isArray(songs) || songs.length === 0) {
    softFails.push(`cloudsearch returned no songs (status=${searchRes.status}); upstream may be blocked`);
    summary.search = { ok: false, soft: true, status: searchRes.status };
  } else {
    summary.search = { ok: true, count: songs.length, id: songs[0].id };
    const songId = songs[0].id;
    try {
      const urlRes = await httpGetJson(
        `http://127.0.0.1:${bridge.neteasePort}/song/url/v1?id=${songId}&level=standard`,
      );
      const playUrl = urlRes.json?.data?.[0]?.url;
      if (playUrl) {
        summary.songUrl = { ok: true, hasUrl: true };
      } else {
        softFails.push(`song/url returned no url for id=${songId} (privilege/geo)`);
        summary.songUrl = { ok: false, soft: true, status: urlRes.status, code: urlRes.json?.data?.[0]?.code };
      }
    } catch (error) {
      softFails.push(`song/url failed: ${error.message}`);
      summary.songUrl = { ok: false, soft: true, error: error.message };
    }

    try {
      const lyricRes = await httpGetJson(
        `http://127.0.0.1:${bridge.neteasePort}/lyric/new?id=${songId}`,
      );
      const hasLyric = Boolean(lyricRes.json?.lrc?.lyric || lyricRes.json?.tlyric?.lyric);
      summary.lyric = { ok: true, hasLyric, status: lyricRes.status };
      if (!hasLyric) {
        softFails.push(`lyric empty for id=${songId}`);
      }
    } catch (error) {
      softFails.push(`lyric failed: ${error.message}`);
      summary.lyric = { ok: false, soft: true, error: error.message };
    }
  }

  // Fonts: check bundled TTF is reachable relative to the page.
  const fontCheck = await win.evaluate(async () => {
    const candidates = [
      new URL('../fonts/YehuoBrush.ttf', document.baseURI).href,
      new URL('./fonts/YehuoBrush.ttf', document.baseURI).href,
    ];
    for (const href of candidates) {
      try {
        const res = await fetch(href);
        if (res.ok) {
          return { ok: true, href, status: res.status };
        }
      } catch {
        // try next
      }
    }
    return { ok: false, tried: candidates };
  });
  summary.fonts = fontCheck;
  if (!fontCheck.ok) {
    throw new Error(`Bundled lyric font not fetchable: ${JSON.stringify(fontCheck)}`);
  }

  console.log(JSON.stringify({ hardPass: true, summary }, null, 2));
  if (softFails.length) {
    console.warn(`[packaged-smoke] soft-fails (${softFails.length}):`);
    for (const item of softFails) console.warn(`  - ${item}`);
  }
  process.exitCode = 0;
} catch (error) {
  console.error('[packaged-smoke] HARD FAIL:', error.message || error);
  console.error(JSON.stringify({ hardPass: false, summary }, null, 2));
  process.exitCode = 1;
} finally {
  if (app) {
    await app.close().catch(() => {});
  }
}

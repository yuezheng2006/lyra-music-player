import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

// test/manual/capture_packaged_boot.mjs
// Launch a release .app (not Vite/dev) and capture real screenshots + DOM diagnostics.
// Usage:
//   node test/manual/capture_packaged_boot.mjs --app=release/verify-mac/arm64/Lyra.app

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outDir = path.join(repoRoot, 'tmp-boot-capture', 'packaged');
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parseArgs = (argv) => {
  const out = { app: path.join(repoRoot, 'release', 'verify-mac', 'arm64', 'Lyra.app') };
  for (const arg of argv) {
    if (arg.startsWith('--app=')) out.app = path.resolve(arg.slice('--app='.length));
  }
  return out;
};

const resolveMacExecutable = (appPath) => {
  const macOSDir = path.join(appPath, 'Contents', 'MacOS');
  if (!fs.existsSync(macOSDir)) {
    throw new Error(`Not a mac .app bundle: ${appPath}`);
  }
  const entries = fs.readdirSync(macOSDir);
  const preferred = entries.find((name) => name === 'Lyra') || entries[0];
  if (!preferred) throw new Error(`Empty MacOS dir in ${appPath}`);
  return path.join(macOSDir, preferred);
};

const diagnose = async (page) => page.evaluate(() => {
  const splash = document.getElementById('boot-splash');
  const root = document.getElementById('root');
  const pick = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      id: el.id || null,
      hiddenAttr: el.getAttribute('data-hidden'),
      childCount: el.children.length,
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      opacity: cs.opacity,
      bg: cs.backgroundColor,
      w: el.clientWidth,
      h: el.clientHeight,
    };
  };
  const sample = document.elementFromPoint(
    Math.floor(window.innerWidth / 2),
    Math.floor(window.innerHeight / 2),
  );
  return {
    href: location.href,
    title: document.title,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    splash: pick(splash),
    root: pick(root),
    hasReactRoot: Boolean(root && root.children.length > 0),
    centerElement: sample
      ? {
          tag: sample.tagName,
          id: sample.id || null,
          className: typeof sample.className === 'string' ? sample.className.slice(0, 140) : '',
          text: (sample.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 100),
        }
      : null,
  };
});

const waitForPackagedWindow = async (app, timeoutMs = 60000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const win of app.windows()) {
      const url = win.url();
      if (!url || url === 'about:blank') continue;
      if (url.startsWith('http://localhost:3000') || url.startsWith('http://127.0.0.1:3000')) {
        throw new Error(`Packaged capture saw Vite dev URL (wrong path): ${url}`);
      }
      if (url.startsWith('devtools:')) continue;
      if (/^https?:\/\/127\.0\.0\.1:\d+\//.test(url) || url.startsWith('file://') || url.startsWith('lyra://')) {
        return win;
      }
    }
    await sleep(250);
  }
  throw new Error(`Packaged app window not ready. Open windows: ${JSON.stringify(app.windows().map((w) => w.url()))}`);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.app)) {
    throw new Error(`Missing app bundle: ${args.app}`);
  }

  const executablePath = resolveMacExecutable(args.app);
  const logs = [];

  const app = await electron.launch({
    executablePath,
    args: [],
    cwd: repoRoot,
    env: {
      ...process.env,
      LYRA_DISABLE_SINGLE_INSTANCE_LOCK: 'true',
      LYRA_DISABLE_DEVTOOLS: '1',
      ELECTRON_DEV: 'false',
      NODE_ENV: 'production',
    },
  });

  app.process().stdout?.on('data', (d) => logs.push(`[stdout] ${d}`));
  app.process().stderr?.on('data', (d) => logs.push(`[stderr] ${d}`));

  const page = await waitForPackagedWindow(app);
  page.on('console', (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

  const shots = [];
  const waits = [800, 2500, 5000, 9000];
  let elapsed = 0;
  for (const target of waits) {
    await sleep(target - elapsed);
    elapsed = target;
    const stamp = `t${target}`;
    const shotPath = path.join(outDir, `packaged-${stamp}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    const diag = await diagnose(page);
    shots.push({ waitMs: target, shotPath, diag });
    fs.writeFileSync(path.join(outDir, `packaged-${stamp}.json`), JSON.stringify(diag, null, 2));
  }

  fs.writeFileSync(path.join(outDir, 'packaged-logs.txt'), logs.join(''));
  fs.writeFileSync(
    path.join(outDir, 'packaged-summary.json'),
    JSON.stringify({ app: args.app, executablePath, shots, logTail: logs.slice(-60) }, null, 2),
  );

  await app.close();

  console.log(JSON.stringify({
    app: args.app,
    outDir,
    shots: shots.map((s) => ({
      waitMs: s.waitMs,
      shotPath: s.shotPath,
      href: s.diag.href,
      splashPresent: Boolean(s.diag.splash),
      splashHidden: s.diag.splash?.hiddenAttr ?? null,
      hasReactRoot: s.diag.hasReactRoot,
      center: s.diag.centerElement,
      rootText: s.diag.root?.text?.slice(0, 140) ?? null,
    })),
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

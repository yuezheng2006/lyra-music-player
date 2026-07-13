import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

// test/manual/capture_electron_boot.mjs
// Launch Electron against the repo and capture real app-window screenshots + DOM diagnostics.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outDir = path.join(repoRoot, 'tmp-boot-capture');
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isAppPage = (page) => {
  const url = page.url();
  return /localhost:\d+|file:\/\//.test(url) && !url.startsWith('devtools:');
};

const diagnose = async (page) => page.evaluate(() => {
  const splash = document.getElementById('boot-splash');
  const root = document.getElementById('root');
  const body = document.body;
  const pick = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      id: el.id || null,
      className: typeof el.className === 'string' ? el.className.slice(0, 160) : '',
      hiddenAttr: el.getAttribute('data-hidden'),
      childCount: el.children.length,
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 220),
      opacity: cs.opacity,
      visibility: cs.visibility,
      bg: cs.backgroundColor,
      display: cs.display,
      pointerEvents: cs.pointerEvents,
      zIndex: cs.zIndex,
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
    readyState: document.readyState,
    bodyBg: getComputedStyle(body).backgroundColor,
    splash: pick(splash),
    root: pick(root),
    hasReactRoot: Boolean(root && root.children.length > 0),
    centerElement: sample
      ? {
          tag: sample.tagName,
          id: sample.id || null,
          className: typeof sample.className === 'string' ? sample.className.slice(0, 120) : '',
          text: (sample.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        }
      : null,
  };
});

const resolveAppPage = async (app, timeoutMs = 45000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const pages = app.windows();
    for (const page of pages) {
      if (isAppPage(page)) {
        return page;
      }
    }
    await sleep(200);
  }
  throw new Error(`Timed out waiting for app page. windows=${app.windows().map((p) => p.url()).join(' | ')}`);
};

const main = async () => {
  const logs = [];
  const electronPath = path.join(
    repoRoot,
    'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron',
  );

  const app = await electron.launch({
    executablePath: electronPath,
    args: ['.'],
    cwd: repoRoot,
    env: {
      ...process.env,
      ELECTRON_DEV: 'true',
      LYRA_EXTERNAL_DEV_APIS: 'true',
      LYRA_DISABLE_SINGLE_INSTANCE_LOCK: 'true',
      LYRA_DISABLE_DEVTOOLS: '1',
      NODE_ENV: 'development',
    },
  });

  app.process().stdout?.on('data', (d) => logs.push(`[stdout] ${d}`));
  app.process().stderr?.on('data', (d) => logs.push(`[stderr] ${d}`));

  const page = await resolveAppPage(app);
  page.on('console', (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}\n${err.stack || ''}`));

  await page.waitForLoadState('domcontentloaded');

  const shots = [];
  const waits = [500, 1500, 3000, 6000, 9000];
  let elapsed = 0;
  for (const target of waits) {
    await sleep(target - elapsed);
    elapsed = target;
    const stamp = `t${target}`;
    const shotPath = path.join(outDir, `boot-${stamp}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    const diag = await diagnose(page);
    shots.push({ waitMs: target, shotPath, diag });
    fs.writeFileSync(path.join(outDir, `boot-${stamp}.json`), JSON.stringify(diag, null, 2));
  }

  fs.writeFileSync(path.join(outDir, 'boot-logs.txt'), logs.join(''));
  fs.writeFileSync(path.join(outDir, 'boot-summary.json'), JSON.stringify({ shots, logTail: logs.slice(-80) }, null, 2));

  await app.close();
  console.log(JSON.stringify({
    outDir,
    shots: shots.map((s) => ({
      waitMs: s.waitMs,
      shotPath: s.shotPath,
      href: s.diag.href,
      splashHidden: s.diag.splash?.hiddenAttr ?? null,
      splashPresent: Boolean(s.diag.splash),
      hasReactRoot: s.diag.hasReactRoot,
      center: s.diag.centerElement,
      rootText: s.diag.root?.text?.slice(0, 120) ?? null,
    })),
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

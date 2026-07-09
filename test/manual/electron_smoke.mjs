import { _electron as electron } from 'playwright';

// test/manual/electron_smoke.mjs
// Launches the Electron shell and verifies the renderer preload bridge is available.

const app = await electron.launch({
  args: ['.'],
  env: {
    ...process.env,
    ELECTRON_DEV: 'true',
    FOLIA_DISABLE_SINGLE_INSTANCE_LOCK: 'true',
    NODE_ENV: 'development',
  },
});

try {
  const win = await waitForAppWindow(app);
  await win.waitForLoadState('domcontentloaded', { timeout: 20000 });
  await win.waitForTimeout(1200);

  const result = await win.evaluate(() => ({
    hasClearQQMusicLogin: typeof window.electron?.clearQQMusicLogin === 'function',
    hasElectron: Boolean(window.electron),
    hasGetQQMusicLoginCookie: typeof window.electron?.getQQMusicLoginCookie === 'function',
    hasOpenQQMusicLogin: typeof window.electron?.openQQMusicLogin === 'function',
    title: document.title,
    url: window.location.href,
  }));

  if (!result.hasElectron || !result.hasOpenQQMusicLogin || !result.hasClearQQMusicLogin || !result.hasGetQQMusicLoginCookie) {
    throw new Error(`Electron preload bridge is incomplete: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify(result, null, 2));
} finally {
  await app.close().catch(() => {});
}

async function waitForAppWindow(app) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    for (const win of app.windows()) {
      const url = win.url();
      if (url.startsWith('http://localhost:3000')) {
        return win;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  const urls = app.windows().map(win => win.url());
  throw new Error(`Auralis app window was not created. Open windows: ${JSON.stringify(urls)}`);
}

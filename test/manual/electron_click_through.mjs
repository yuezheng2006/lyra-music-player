import { _electron as electron } from 'playwright';

// test/manual/electron_click_through.mjs
// Verifies account panel stays clickable when main-window click-through is enabled.

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
  await win.waitForTimeout(1500);

  await win.evaluate(() => {
    const state = {
      view: 'player',
      overlays: [],
      overlayView: null,
      overlayOriginView: null,
      search: null,
    };
    window.history.pushState(state, '', '#player');
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  });
  await win.waitForTimeout(800);

  await win.evaluate(async () => {
    await window.electron?.setMainWindowClickThroughEnabled?.(true);
  });
  await win.waitForTimeout(300);

  const clickThroughOn = await win.evaluate(async () => ({
    enabled: await window.electron?.getMainWindowClickThroughEnabled?.(),
  }));
  if (!clickThroughOn.enabled) {
    throw new Error('Expected click-through to be enabled before opening the panel');
  }

  await win.keyboard.press('p');
  await win.waitForTimeout(900);

  const panelVisible = await win.locator('div.pointer-events-auto.w-80').first().isVisible();
  if (!panelVisible) {
    throw new Error('Player side panel did not open');
  }

  const afterPanel = await win.evaluate(async () => ({
    clickThrough: await window.electron?.getMainWindowClickThroughEnabled?.(),
    hasQQSection: document.body.innerText.includes('QQ'),
  }));

  if (afterPanel.clickThrough) {
    throw new Error('Click-through should auto-disable while side panel is open');
  }

  await win.locator('button[title="账户"], button[title="Account"]').first().click();
  await win.waitForTimeout(600);

  const qqSettingsButton = win.locator('button').filter({ hasText: /扫码登录|Scan|Login/i }).first();
  const qqCount = await qqSettingsButton.count();
  if (qqCount === 0) {
    throw new Error('QQ login button was not rendered in account panel');
  }

  await qqSettingsButton.click({ timeout: 5000 });
  await win.waitForTimeout(1200);

  const windows = app.windows().map(candidate => candidate.url());
  const hasLoginWindow = windows.some(url => url.includes('y.qq.com') || url.includes('qq.com'));
  if (!hasLoginWindow) {
    console.log(JSON.stringify({ afterPanel, windows }, null, 2));
    throw new Error('QQ login window did not open after clicking scan-login button');
  }

  console.log(JSON.stringify({
    clickThroughOn,
    afterPanel,
    loginWindowOpened: true,
  }, null, 2));
} finally {
  await app.close().catch(() => {});
}

async function waitForAppWindow(app) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    for (const win of app.windows()) {
      if (win.url().startsWith('http://localhost:3000')) {
        return win;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  const urls = app.windows().map(win => win.url());
  throw new Error(`Auralis app window was not created. Open windows: ${JSON.stringify(urls)}`);
}

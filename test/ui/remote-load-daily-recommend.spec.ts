import { expect, test, type Page } from '@playwright/test';
import { APP_VERSION } from './helpers/appVersion';

async function installDailyRecommendHarness(page: Page, mode: 'fail' | 'recover') {
  await page.addInitScript((payload: { mode: 'fail' | 'recover'; appVersion: string }) => {
    localStorage.clear();
    localStorage.setItem('i18nextLng', 'zh-CN');
    localStorage.setItem('default_theme_daylight', 'false');
    localStorage.setItem('static_mode', 'true');
    localStorage.setItem('last_app_view', 'home');
    localStorage.setItem('open_player_on_launch', 'false');
    localStorage.setItem('lyra_onboarding_completed', 'true');
    localStorage.setItem('folia_last_seen_guide_version', payload.appVersion);
    localStorage.setItem('last_home_view_tab', 'daily');

    let attempts = 0;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url.includes('/recommend/songs')) {
        attempts += 1;
        if (payload.mode === 'fail' || attempts < 3) {
          return new Response(JSON.stringify({ code: 500, msg: 'boom' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({
          code: 200,
          data: {
            dailySongs: [{
              id: 42,
              name: 'Stability Song',
              ar: [{ id: 1, name: 'Fixture' }],
              al: { id: 1, name: 'Album', picUrl: '' },
              dt: 120000,
            }],
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return originalFetch(input, init);
    };
  }, { mode, appVersion: APP_VERSION });
}

// TODO: 'daily' 已从侧边栏移除且当前无入口能到达 DailyRecommendSurface（useSearchNavigationStore 会把
// last_home_view_tab='daily' 回退为 playlist）。待每日推荐重新有入口后改造启用。
test.describe.skip('daily recommend remote load', () => {
  test('shows error + diagnostic controls instead of empty copy on failure', async ({ page }) => {
    await installDailyRecommendHarness(page, 'fail');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const dailyNav = page.getByRole('button', { name: /每日推荐|Daily/i }).last();
    await expect(dailyNav).toBeVisible({ timeout: 20_000 });
    await dailyNav.click();

    await expect(page.getByTestId('remote-load-error')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('今天还没有推荐歌曲')).toHaveCount(0);
    await expect(page.getByTestId('remote-load-retry')).toBeVisible();
    await page.getByTestId('remote-load-toggle-diagnostic').click();
    await expect(page.getByTestId('remote-load-diagnostic')).toBeVisible();
  });

  test('shows diagnostic controls on empty daily recommend too', async ({ page }) => {
    await page.addInitScript((appVersion: string) => {
      localStorage.clear();
      localStorage.setItem('i18nextLng', 'zh-CN');
      localStorage.setItem('default_theme_daylight', 'false');
      localStorage.setItem('static_mode', 'true');
      localStorage.setItem('last_app_view', 'home');
      localStorage.setItem('open_player_on_launch', 'false');
      localStorage.setItem('lyra_onboarding_completed', 'true');
      localStorage.setItem('folia_last_seen_guide_version', appVersion);
      localStorage.setItem('last_home_view_tab', 'daily');

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
        if (url.includes('/recommend/songs')) {
          return new Response(JSON.stringify({
            code: 200,
            data: { dailySongs: [] },
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return originalFetch(input, init);
      };
    }, APP_VERSION);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /每日推荐|Daily/i }).last().click();

    await expect(page.getByTestId('remote-load-empty')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('remote-load-toggle-diagnostic')).toBeVisible();
    await page.getByTestId('remote-load-toggle-diagnostic').click();
    await expect(page.getByTestId('remote-load-diagnostic')).toBeVisible();
    await expect(page.getByTestId('remote-load-diagnostic')).toContainText(/source=netease|No API diagnostics|recent/i);
  });
});

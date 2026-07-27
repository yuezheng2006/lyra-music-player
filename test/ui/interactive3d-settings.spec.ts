import { expect, test } from '@playwright/test';
import { APP_VERSION } from './helpers/appVersion';

// test/ui/interactive3d-settings.spec.ts
// 3D 背景设置卡：经 设置 → Options → Visual Settings → 歌词动画实验台 → Background 到达，
// 断言现行卡片结构（视觉预设组 / 质量档 / 重置按钮）。

async function openInteractive3dSettings(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });

    await page.evaluate((appVersion: string) => {
        localStorage.setItem('visualizer_background_mode', 'interactive3d');
        localStorage.setItem('lyra_onboarding_completed', 'true');
        // 必须等于当前版本，否则 What's New 弹层（z-[150]）会拦截点击。
        localStorage.setItem('folia_last_seen_guide_version', appVersion);
        // 性能 HUD 的实时数字会破坏截图确定性。
        localStorage.setItem('lyra_performance_hud', '0');
    }, APP_VERSION);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const settingsButton = page.getByRole('button', { name: /设置|Settings/i }).first();
    await settingsButton.click();

    // 设置面板改版：Help/Options 标签 → Visual Settings 分类 → 歌词动画实验台。
    await page.getByText(/^(Options|选项)$/).first().click();
    await page.getByRole('button', { name: /Visual Settings|视觉设置/i }).first().click();
    await page.getByRole('button', { name: /Lyrics Animation Adjust|歌词动画样式/i }).first().click();
    await page.getByRole('button', { name: /^(背景|Background)$/ }).click();
}

test.describe('interactive3d settings UI', () => {
    test('shows componentized 3D scene toggles with stable test ids', async ({ page }) => {
        await openInteractive3dSettings(page);

        await expect(page.getByTestId('interactive3d-settings-card')).toBeVisible();
        await expect(page.getByTestId('interactive3d-settings-reset')).toBeVisible();
        // 旧的逐效果开关（interactive3d-scene-layers）已被视觉预设组取代。
        await expect(page.getByTestId('interactive3d-mineradio-presets')).toBeVisible();
        await expect(page.getByTestId('interactive3d-quality-tier-group')).toBeVisible();

        await expect(page).toHaveScreenshot('interactive3d-settings-card.png', {
            animations: 'disabled',
            maxDiffPixelRatio: 0.02,
        });
    });
});

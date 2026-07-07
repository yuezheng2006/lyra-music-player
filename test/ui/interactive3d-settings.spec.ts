import { expect, test } from '@playwright/test';
import { INTERACTIVE3D_SCENE_EFFECTS } from '../../src/components/visualizer/geometric/interactive3dSceneRegistry';

async function openInteractive3dSettings(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });

    await page.evaluate(() => {
        localStorage.setItem('visualizer_background_mode', 'interactive3d');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const settingsButton = page.getByRole('button', { name: /设置|Settings/i }).first();
    await settingsButton.click();

    await page.getByRole('button', { name: /歌词动画样式|Lyrics Animation/i }).click();
    await page.getByRole('button', { name: /背景|Background/i }).click();
}

test.describe('interactive3d settings UI', () => {
    test('shows componentized 3D scene toggles with stable test ids', async ({ page }) => {
        await openInteractive3dSettings(page);

        await expect(page.getByTestId('interactive3d-settings-card')).toBeVisible();
        await expect(page.getByTestId('interactive3d-quality-tier-group')).toBeVisible();
        await expect(page.getByTestId('interactive3d-scene-layers')).toBeVisible();

        for (const effect of INTERACTIVE3D_SCENE_EFFECTS) {
            await expect(page.getByTestId(effect.testId)).toBeVisible();
        }

        await expect(page).toHaveScreenshot('interactive3d-settings-card.png', {
            animations: 'disabled',
            maxDiffPixelRatio: 0.02,
        });
    });
});

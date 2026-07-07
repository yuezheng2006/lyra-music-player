import { expect, test } from '@playwright/test';

const BASE_INTERACTIVE3D_TUNING = {
    qualityTier: 'balanced',
    rhythmIntensity: 0.85,
    cinemaShake: 0.5,
    bloomStrength: 0.62,
    shelfMode: 'off',
    shelfPresence: 'auto',
    shelfCameraMode: 'dynamic',
    enableBackgroundWash: true,
    enableOrbitField: true,
    enableBassRipples: true,
    enableBeatBursts: true,
    enableLyricFocusAura: true,
    enableDomShapes: true,
    enableBloomParticles: false,
    enableFloatingParticles: false,
    enableCoverParticles: true,
    cameraControl: 'auto',
};

const WEBGL_VISUAL_PRESETS = ['emily', 'starfield', 'tunnel'] as const;

async function openVisPlaygroundWithInteractive3d(
    page: import('@playwright/test').Page,
    visualPreset: typeof WEBGL_VISUAL_PRESETS[number],
) {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });

    await page.evaluate(({ tuning, preset }) => {
        localStorage.setItem('i18nextLng', 'en');
        localStorage.setItem('visualizer_background_mode', 'interactive3d');
        localStorage.setItem('static_mode', 'false');
        localStorage.setItem('interactive_3d_scene_tuning', JSON.stringify({
            ...tuning,
            visualPreset: preset,
        }));
    }, { tuning: BASE_INTERACTIVE3D_TUNING, preset: visualPreset });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.getByTitle('Help & Options').click();
    await page.locator('h2').getByText('Options', { exact: true }).click();
    await page.getByRole('button', { name: /Visual Settings/i }).click();
    await page.getByRole('button', { name: /Lyrics Animation Adjust|歌词动画样式/i }).click();
}

async function getWebGLStage(page: import('@playwright/test').Page) {
    return page
        .getByTestId('mineradio-playback-stage')
        .filter({ has: page.locator('canvas') })
        .first();
}

async function expectWebGLStageMounted(page: import('@playwright/test').Page) {
    const stage = await getWebGLStage(page);
    await expect(stage).toBeVisible({ timeout: 20_000 });

    await expect.poll(async () => stage.evaluate((node) => {
        const canvas = node.querySelector('canvas');
        if (!canvas) return { ok: false, reason: 'missing-canvas' };
        const rect = canvas.getBoundingClientRect();
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        return {
            ok: Boolean(gl) && rect.width > 120 && rect.height > 120,
            reason: gl ? 'ok' : 'missing-webgl-context',
            width: rect.width,
            height: rect.height,
        };
    }), { timeout: 20_000 }).toMatchObject({ ok: true });
}

test.describe('interactive3d WebGL cover particles', () => {
    for (const preset of WEBGL_VISUAL_PRESETS) {
        test(`mounts WebGL canvas for ${preset} preset`, async ({ page }) => {
            await openVisPlaygroundWithInteractive3d(page, preset);
            await expectWebGLStageMounted(page);
        });
    }

    test('builds cover depth map after Emily WebGL stage mounts', async ({ page }) => {
        await openVisPlaygroundWithInteractive3d(page, 'emily');

        const stage = page.locator('[data-testid="mineradio-playback-stage"][data-cover-depth-ready="true"]');
        await expect(stage).toBeVisible({ timeout: 20_000 });

        await expect.poll(async () => stage.getAttribute('data-cover-depth-ready'), {
            timeout: 20_000,
        }).toBe('true');
    });
});

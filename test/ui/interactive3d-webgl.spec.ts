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

const WEBGL_VISUAL_PRESETS = ['emily', 'quantumCube', 'mineradioVinyl', 'mineradioGalaxy'] as const;
const TEST_COVER_URL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22 viewBox=%220 0 256 256%22%3E%3Crect width=%22256%22 height=%22256%22 fill=%22%2309172f%22/%3E%3Ccircle cx=%22128%22 cy=%22128%22 r=%2276%22 fill=%22%23ff2d55%22/%3E%3Cpath d=%22M42 186L214 70v116z%22 fill=%22%2300f5d4%22 opacity=%220.82%22/%3E%3C/svg%3E';

async function openVisPlaygroundWithInteractive3d(
    page: import('@playwright/test').Page,
    visualPreset: string,
) {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });

    await page.evaluate(async ({ tuning, preset, coverUrl }) => {
        // Playwright page sandbox path; resolved at runtime in the browser.
        const { saveToCache } = await import(/* @vite-ignore */ '/src/services/db.ts' as string);
        const song = {
            id: 900000001,
            name: 'Cover Particle Fixture',
            ar: [{ id: 1, name: 'Fixture Artist' }],
            artists: [{ id: 1, name: 'Fixture Artist' }],
            album: { id: 1, name: 'Fixture Album', picUrl: coverUrl },
            al: { id: 1, name: 'Fixture Album', picUrl: coverUrl },
            duration: 180000,
            dt: 180000,
        };
        await saveToCache('last_song', song);
        await saveToCache('last_queue', [song]);
        localStorage.setItem('i18nextLng', 'en');
        localStorage.setItem('visualizer_background_mode', 'interactive3d');
        localStorage.setItem('static_mode', 'false');
        localStorage.setItem('interactive_3d_scene_tuning', JSON.stringify({
            ...tuning,
            visualPreset: preset,
        }));
    }, { tuning: BASE_INTERACTIVE3D_TUNING, preset: visualPreset, coverUrl: TEST_COVER_URL });

    await page.reload();
    await page.waitForLoadState('networkidle');
}

async function getWebGLStage(page: import('@playwright/test').Page) {
    return page
        .getByTestId('mineradio-playback-stage')
        .filter({ has: page.locator('canvas') })
        .first();
}

async function expectWebGLStageMounted(
    page: import('@playwright/test').Page,
    visualPreset?: typeof WEBGL_VISUAL_PRESETS[number],
) {
    const stage = await getWebGLStage(page);
    await expect(stage).toBeVisible({ timeout: 20_000 });
    if (visualPreset) {
        await expect(stage).toHaveAttribute('data-visual-preset', visualPreset);
    }
    await expect.poll(async () => stage.getAttribute('data-cover-url'), {
        timeout: 20_000,
    }).toBe(TEST_COVER_URL);
    await expect.poll(async () => stage.getAttribute('data-loaded-cover-url'), {
        timeout: 20_000,
    }).toBe(TEST_COVER_URL);

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
            stagePointerEvents: getComputedStyle(node).pointerEvents,
            canvasPointerEvents: getComputedStyle(canvas).pointerEvents,
            interactiveReady: node.getAttribute('data-interactive-ready'),
        };
    }), { timeout: 20_000 }).toMatchObject({
        ok: true,
        stagePointerEvents: 'auto',
        canvasPointerEvents: 'auto',
        interactiveReady: 'true',
    });
}

async function expectWebGLStageInteractive(page: import('@playwright/test').Page) {
    const stage = await getWebGLStage(page);
    const box = await stage.boundingBox();
    if (!box) throw new Error('missing WebGL stage bounds');
    const x = box.x + box.width * 0.78;
    const y = box.y + box.height * 0.34;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 44, y + 18, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => stage.getAttribute('data-interaction-last'), {
        timeout: 5_000,
    }).toBe('drag-move');
    await page.mouse.wheel(0, 80);
    await expect.poll(() => stage.getAttribute('data-interaction-last'), {
        timeout: 5_000,
    }).toBe('wheel');
}

test.describe('interactive3d WebGL cover particles', () => {
    for (const preset of WEBGL_VISUAL_PRESETS) {
        test(`mounts WebGL canvas for ${preset} preset`, async ({ page }) => {
            await openVisPlaygroundWithInteractive3d(page, preset);
            await expectWebGLStageMounted(page, preset);
        });
    }

    test('honors stored Mineradio vinyl preset on the mounted WebGL stage', async ({ page }) => {
        await openVisPlaygroundWithInteractive3d(page, 'mineradioVinyl');
        await expectWebGLStageMounted(page, 'mineradioVinyl');
    });

    test('normalizes removed visual presets to cover on the mounted WebGL stage', async ({ page }) => {
        await openVisPlaygroundWithInteractive3d(page, 'terrain');
        await expectWebGLStageMounted(page, 'emily');
    });

    test('accepts Mineradio-style drag and wheel interaction through app overlays', async ({ page }) => {
        await openVisPlaygroundWithInteractive3d(page, 'emily');
        await expectWebGLStageMounted(page, 'emily');
        await expectWebGLStageInteractive(page);
    });
});

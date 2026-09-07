import { expect, test } from '@playwright/test';
import { APP_VERSION } from './helpers/appVersion';
import {
    clearPageTelemetry,
    waitForTelemetryEvent,
} from './helpers/telemetry';
import { BOOT_READY_REDLINE_MS } from '../../src/utils/performance/startupRedlineBudgets';

// test/ui/startup-redline.spec.ts
// RED LINE: cold boot stays under the hard budget. Retired interactive3d is not part of boot.

test.describe('startup red-line', () => {
    test('boot.ready stays under red-line budget', async ({ page }) => {
        await page.goto('/');
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
        await page.evaluate((appVersion) => {
            localStorage.setItem('i18nextLng', 'en');
            localStorage.setItem('lyra_onboarding_completed', 'true');
            localStorage.setItem('folia_last_seen_guide_version', appVersion);
            localStorage.setItem('visualizer_background_mode', 'common');
            localStorage.setItem('static_mode', 'true');
        }, APP_VERSION);
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const boot = await waitForTelemetryEvent(page, 'boot.ready', {
            timeout: BOOT_READY_REDLINE_MS + 2_000,
        });
        expect(typeof boot.durMs).toBe('number');
        expect(
            boot.durMs!,
            `boot.ready ${boot.durMs}ms exceeded red-line ${BOOT_READY_REDLINE_MS}ms`,
        ).toBeLessThanOrEqual(BOOT_READY_REDLINE_MS);
    });

    test('stored interactive3d migrates to common and still boots under red-line', async ({ page }) => {
        await page.goto('/');
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
        await page.evaluate((appVersion) => {
            localStorage.setItem('i18nextLng', 'en');
            localStorage.setItem('lyra_onboarding_completed', 'true');
            localStorage.setItem('folia_last_seen_guide_version', appVersion);
            localStorage.setItem('visualizer_background_mode', 'interactive3d');
            localStorage.setItem('static_mode', 'true');
        }, APP_VERSION);
        await clearPageTelemetry(page);
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const boot = await waitForTelemetryEvent(page, 'boot.ready', {
            timeout: BOOT_READY_REDLINE_MS + 2_000,
        });
        expect(boot.durMs!).toBeLessThanOrEqual(BOOT_READY_REDLINE_MS);

        const storedMode = await page.evaluate(() => localStorage.getItem('visualizer_background_mode'));
        expect(storedMode).toBe('common');
        await expect(page.getByTestId('interactive-cover-r3f-stage')).toHaveCount(0);
    });
});

import { expect, test, type Page } from '@playwright/test';
import {
    clearPageTelemetry,
    readTelemetrySnapshot,
    waitForTelemetryEvent,
} from './helpers/telemetry';

// test/ui/telemetry-boot-playback.spec.ts
// E2E: assert boot + play/pause paths via the local telemetry ring.

const FIXTURE_COVER =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22%3E%3Crect width=%22256%22 height=%22256%22 fill=%22%2309172f%22/%3E%3C/svg%3E';

async function installTelemetryPlaybackHarness(page: Page) {
    await page.addInitScript((coverUrl: string) => {
        localStorage.clear();
        localStorage.setItem('i18nextLng', 'en');
        localStorage.setItem('default_theme_daylight', 'false');
        localStorage.setItem('static_mode', 'true');
        localStorage.setItem('last_app_view', 'player');
        localStorage.setItem('open_player_on_launch', 'true');
        localStorage.setItem('lyra_onboarding_completed', 'true');
        localStorage.setItem('folia_last_seen_guide_version', '1.0.3');
        localStorage.setItem('visualizer_mode', 'classic');
        localStorage.setItem('visualizer_background_mode', 'common');
        localStorage.setItem('player_volume', '0.5');

        // Stub HTMLMediaElement transport so resume/pause telemetry does not depend on real codecs.
        const mediaProto = HTMLMediaElement.prototype as HTMLMediaElement & {
            __lyraPlayStubbed?: boolean;
        };
        if (!mediaProto.__lyraPlayStubbed) {
            mediaProto.__lyraPlayStubbed = true;
            mediaProto.play = function playStub(this: HTMLMediaElement) {
                Object.defineProperty(this, 'paused', {
                    configurable: true,
                    get: () => false,
                });
                this.dispatchEvent(new Event('play'));
                this.dispatchEvent(new Event('playing'));
                return Promise.resolve();
            };
            mediaProto.pause = function pauseStub(this: HTMLMediaElement) {
                Object.defineProperty(this, 'paused', {
                    configurable: true,
                    get: () => true,
                });
                this.dispatchEvent(new Event('pause'));
            };
        }

        Object.defineProperty(window, 'electron', {
            configurable: true,
            value: {
                getAudioCacheUsage: async () => 0,
                clearAudioCache: async () => {},
                getAudioCacheStats: async () => ({ size: 0, count: 0 }),
            },
        });

        // Seed IndexedDB after first paint via dynamic import in page setup below.
        (window as unknown as { __TELEMETRY_E2E_COVER__?: string }).__TELEMETRY_E2E_COVER__ = coverUrl;
    }, FIXTURE_COVER);
}

async function seedLastSong(page: Page) {
    await page.evaluate(async () => {
        const coverUrl = (window as unknown as { __TELEMETRY_E2E_COVER__?: string }).__TELEMETRY_E2E_COVER__
            ?? '';
        const { saveToCache } = await import(/* @vite-ignore */ '/src/services/db.ts' as string);
        const { saveAudioBlob } = await import(/* @vite-ignore */ '/src/services/audioCache.ts' as string);
        const { getProviderSongCacheKey } = await import(
            /* @vite-ignore */ '/src/services/musicProviders/registry.ts' as string
        );

        // Minimal valid WAV so restore can mint a blob: URL without network.
        const wav = new Uint8Array([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
            0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
            0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00,
            0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00,
        ]);
        const song = {
            id: 910000001,
            name: 'Telemetry Fixture',
            ar: [{ id: 1, name: 'Fixture Artist' }],
            artists: [{ id: 1, name: 'Fixture Artist' }],
            album: { id: 1, name: 'Fixture Album', picUrl: coverUrl },
            al: { id: 1, name: 'Fixture Album', picUrl: coverUrl },
            duration: 180000,
            dt: 180000,
        };
        await saveAudioBlob(
            getProviderSongCacheKey('audio', song),
            new Blob([wav], { type: 'audio/wav' }),
        );
        await saveToCache('last_song', song);
        await saveToCache('last_queue', [song]);
    });
}

test.describe('telemetry boot + playback e2e', () => {
    test('emits boot.ready and exposes the DEV telemetry bridge', async ({ page }) => {
        await installTelemetryPlaybackHarness(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await expect.poll(async () => {
            const snap = await readTelemetrySnapshot(page);
            return snap ? 'ready' : null;
        }, { timeout: 20_000 }).toBe('ready');

        const boot = await waitForTelemetryEvent(page, 'boot.ready', { timeout: 20_000 });
        expect(typeof boot.durMs === 'number' || boot.durMs === undefined).toBe(true);

        const snap = await readTelemetrySnapshot(page);
        expect(snap!.size).toBeGreaterThan(0);
        expect(snap!.events.some((event) => event.name === 'boot.ready')).toBe(true);
    });

    test('records play.toggle → play.resume → play.pause via dock transport', async ({ page }) => {
        await installTelemetryPlaybackHarness(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await seedLastSong(page);
        await page.reload();
        await page.waitForLoadState('networkidle');

        await waitForTelemetryEvent(page, 'boot.ready', { timeout: 20_000 });
        await clearPageTelemetry(page);

        const dock = page.getByTestId('floating-player-dock');
        const playButton = dock.getByRole('button', { name: /^(Play|播放)$/i });
        await expect(playButton).toBeVisible({ timeout: 20_000 });
        await playButton.click();

        await waitForTelemetryEvent(page, 'play.toggle', { timeout: 15_000 });
        await waitForTelemetryEvent(page, 'play.resume', { timeout: 15_000 });

        const pauseButton = dock.getByRole('button', { name: /^(Pause|暂停)$/i });
        await expect(pauseButton).toBeVisible({ timeout: 10_000 });
        await pauseButton.click();

        // Fade-out path still emits play.pause immediately; wait without clock skew filters.
        await waitForTelemetryEvent(page, 'play.pause', { timeout: 15_000 });

        const snap = await readTelemetrySnapshot(page);
        const names = (snap?.events ?? []).map((event) => event.name);
        expect(names).toContain('play.toggle');
        expect(names).toContain('play.resume');
        expect(names).toContain('play.pause');
        expect(names.filter((name) => name === 'play.error')).toEqual([]);
    });

    test('records settings.changed when switching background mode from dock', async ({ page }) => {
        await installTelemetryPlaybackHarness(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await seedLastSong(page);
        await page.reload();
        await page.waitForLoadState('networkidle');

        await waitForTelemetryEvent(page, 'boot.ready', { timeout: 20_000 });
        await clearPageTelemetry(page);
        const sinceMs = Date.now() - 50;

        const menuTrigger = page.getByTestId('floating-player-background-menu-trigger');
        await expect(menuTrigger).toBeVisible({ timeout: 20_000 });
        await menuTrigger.click();

        const emily = page.getByTestId('floating-player-background-preset-emily');
        await expect(emily).toBeVisible({ timeout: 10_000 });
        await emily.click();

        await waitForTelemetryEvent(page, 'settings.changed', {
            timeout: 15_000,
            sinceMs,
        });

        await expect.poll(async () => page.evaluate(() => (
            localStorage.getItem('visualizer_background_mode')
        )), { timeout: 10_000 }).toBe('interactive3d');
    });
});

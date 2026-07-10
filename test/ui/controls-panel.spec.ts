import { expect, test, type Page } from '@playwright/test';

const localImportFixture = {
  rootName: 'Controls Fixture',
  entries: [
    {
      kind: 'file' as const,
      name: 'Test Artist - Midnight Train.mp3',
      type: 'audio/mpeg',
      content: 'fake-audio-data',
      lastModified: 1710000000000,
    },
    {
      kind: 'file' as const,
      name: 'Test Artist - Midnight Train.lrc',
      type: 'text/plain',
      content: '[00:00.00]Midnight Train\n[00:12.00]Leaves the station',
      lastModified: 1710000000000,
    },
  ],
};

async function installControlsPanelState(page: Page) {
  await page.addInitScript((fixture: typeof localImportFixture) => {
    localStorage.clear();
    localStorage.setItem('i18nextLng', 'zh-CN');
    localStorage.setItem('default_theme_daylight', 'false');
    localStorage.setItem('static_mode', 'true');
    localStorage.setItem('last_app_view', 'player');
    localStorage.setItem('open_player_on_launch', 'true');
    localStorage.setItem('visualizer_mode', 'classic');
    localStorage.setItem('player_volume', '0.41');
    localStorage.setItem('player_loop_mode', 'off');
    localStorage.setItem('visualizer_background_mode', 'common');

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('hover') && query.includes('fine'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    Object.defineProperty(window, 'electron', {
      configurable: true,
      value: {
        getAudioCacheUsage: async () => 0,
        clearAudioCache: async () => {},
        getAudioCacheStats: async () => ({ size: 0, count: 0 }),
      },
    });

    class MockAudio extends EventTarget {
      duration = 126;
      paused = true;
      currentTime = 0;
      volume = 1;
      #src = '';

      set src(value: string) {
        this.#src = value;
        setTimeout(() => {
          this.dispatchEvent(new Event('loadedmetadata'));
          this.dispatchEvent(new Event('canplay'));
        }, 0);
      }

      get src() {
        return this.#src;
      }

      play() {
        this.paused = false;
        return Promise.resolve();
      }

      pause() {
        this.paused = true;
      }
    }

    const OriginalWorker = window.Worker;
    class MockWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      readonly #url: string;

      constructor(url: string | URL) {
        this.#url = String(url);
        if (!this.#url.includes('metadataParser.worker')) {
          return new OriginalWorker(url as string, { type: 'module' }) as unknown as MockWorker;
        }
      }

      postMessage(message: { type: string; requestId: string; file: File; }) {
        if (!this.#url.includes('metadataParser.worker') || message.type !== 'parse-metadata') {
          return;
        }

        const baseName = message.file.name.replace(/\.[^.]+$/, '');
        const [artist = 'Fixture Artist', title = baseName] = baseName.split(' - ');
        const response = {
          type: 'result',
          requestId: message.requestId,
          data: {
            title,
            artist,
            album: 'Fixture Album',
            duration: 126000,
          },
        };

        setTimeout(() => {
          this.onmessage?.({ data: response } as MessageEvent);
        }, 0);
      }

      terminate() {}
      addEventListener() {}
      removeEventListener() {}
    }

    Object.defineProperty(window, 'Worker', {
      configurable: true,
      value: MockWorker,
    });
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      value: MockAudio,
    });

    const createFileHandle = (entry: typeof fixture.entries[number]) => ({
      kind: 'file' as const,
      name: entry.name,
      async getFile() {
        return new File([entry.content], entry.name, {
          type: entry.type,
          lastModified: entry.lastModified,
        });
      },
    });

    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: async () => ({
        kind: 'directory' as const,
        name: fixture.rootName,
        async *values() {
          for (const handle of fixture.entries.map(createFileHandle)) {
            yield handle;
          }
        },
        async getFileHandle(name: string) {
          const handle = fixture.entries.map(createFileHandle).find(item => item.name === name);
          if (!handle) {
            throw new DOMException(`Missing file: ${name}`, 'NotFoundError');
          }
          return handle;
        },
        async getDirectoryHandle() {
          throw new DOMException('Nested directories are not defined in this fixture', 'NotFoundError');
        },
        async queryPermission() {
          return 'granted';
        },
        async requestPermission() {
          return 'granted';
        },
      }),
    });
  }, localImportFixture);
}

async function openControlsTab(page: Page) {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Folder' }).last().click();
  await page.getByRole('button', { name: /Import Folder|导入文件夹/i }).last().click();
  await expect(page.getByText('Midnight Train').first()).toBeVisible({ timeout: 20_000 });

  await page.getByText('Midnight Train').first().click();
  await page.waitForTimeout(500);

  const panelToggle = page.locator('.fixed.bottom-8.right-0 button').last();
  await expect(panelToggle).toBeVisible();
  await panelToggle.click();

  await page.getByTitle('控制').click();
  await expect(page.getByTestId('controls-lyrics-animation-section')).toBeVisible();
}

test.describe('player controls panel', () => {
  test.beforeEach(async ({ page }) => {
    await installControlsPanelState(page);
  });

  test('renders all primary control sections', async ({ page }) => {
    await openControlsTab(page);

    await expect(page.getByTestId('controls-lyrics-animation-section')).toBeVisible();
    await expect(page.getByTestId('controls-animation-intensity-section')).toBeVisible();
    await expect(page.getByTestId('controls-panel-theme-section')).toBeVisible();
    await expect(page.getByTestId('controls-player-background-section')).toBeVisible();
    await expect(page.getByTestId('controls-lyric-color-presets')).toBeVisible();
    await expect(page.getByText('音量')).toBeVisible();
  });

  test('switches visualizer mode and persists to localStorage', async ({ page }) => {
    await openControlsTab(page);

    await page.getByTestId('controls-visualizer-mode-cadenza').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('visualizer_mode'))).toBe('cadenza');

    await page.getByTestId('controls-visualizer-mode-classic').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('visualizer_mode'))).toBe('classic');
  });

  test('switches animation intensity and persists to localStorage', async ({ page }) => {
    await openControlsTab(page);

    await page.getByTestId('controls-animation-intensity-chaotic').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme_animation_intensity'))).toBe('chaotic');

    await page.getByTestId('controls-animation-intensity-calm').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme_animation_intensity'))).toBe('calm');
  });

  test('updates volume and loop mode from quick actions', async ({ page }) => {
    await openControlsTab(page);

    const volumeSlider = page.locator('[data-testid="controls-lyrics-animation-section"]').locator('..').locator('input[type="range"]').first();
    await volumeSlider.fill('0.62');
    await volumeSlider.dispatchEvent('mouseup');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_volume'))).toBe('0.62');

    const loopButton = page.locator('.grid.grid-cols-3.gap-3 button').first();
    await loopButton.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_loop_mode'))).toBe('all');
    await loopButton.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_loop_mode'))).toBe('one');
    await loopButton.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_loop_mode'))).toBe('off');
  });

  test('toggles daylight appearance and cover color tint', async ({ page }) => {
    await openControlsTab(page);

    await page.getByTestId('controls-appearance-light').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('default_theme_daylight'))).toBe('true');

    await page.getByTestId('controls-appearance-dark').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('default_theme_daylight'))).toBe('false');

    await page.getByTestId('controls-cover-color-tint-on').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('use_cover_color_bg'))).toBe('true');

    await page.getByTestId('controls-cover-color-tint-off').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('use_cover_color_bg'))).toBe('false');
  });

  test('switches player background mode', async ({ page }) => {
    await openControlsTab(page);

    await page.getByTestId('controls-player-background-mode-interactive3d').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('visualizer_background_mode'))).toBe('interactive3d');

    await page.getByTestId('controls-player-background-mode-common').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('visualizer_background_mode'))).toBe('common');
  });

  test('applies lyric color preset and switches to AI theme mode', async ({ page }) => {
    await openControlsTab(page);

    await page.getByTestId('lyric-color-preset-douyin-neon').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme_bg_mode'))).toBe('ai');
  });
});

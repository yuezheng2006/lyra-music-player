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
    // Start on home so local import is reachable without leaving the player first.
    localStorage.setItem('last_app_view', 'home');
    localStorage.setItem('open_player_on_launch', 'false');
    localStorage.setItem('lyra_onboarding_completed', 'true');
    // Match screenshot fixtures: suppress What's New overlay (z-[150]).
    localStorage.setItem('folia_last_seen_guide_version', '1.0.3');
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

    // Avoid `#private` fields: Playwright serializes init scripts through a transform
    // that can emit `_classPrivateFieldInitSpec` without defining the helper.
    class MockAudio extends EventTarget {
      duration = 126;
      paused = true;
      currentTime = 0;
      volume = 1;
      _src = '';

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          this.dispatchEvent(new Event('loadedmetadata'));
          this.dispatchEvent(new Event('canplay'));
        }, 0);
      }

      get src() {
        return this._src;
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
      url: string;

      constructor(url: string | URL) {
        this.url = String(url);
        if (!this.url.includes('metadataParser.worker')) {
          return new OriginalWorker(url as string, { type: 'module' }) as unknown as MockWorker;
        }
      }

      postMessage(message: { type: string; requestId: string; file: File; }) {
        if (!this.url.includes('metadataParser.worker') || message.type !== 'parse-metadata') {
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

    const liveDirectoryHandles = new Map<string, FileSystemDirectoryHandle>();

    const createFileHandle = (entry: typeof fixture.entries[number]) => ({
      kind: 'file' as const,
      name: entry.name,
      async getFile() {
        return new File([entry.content], entry.name, {
          type: entry.type,
          lastModified: entry.lastModified,
        });
      },
      async queryPermission() {
        return 'granted' as PermissionState;
      },
      async requestPermission() {
        return 'granted' as PermissionState;
      },
    });

    const createDirectoryHandle = (rootFixture: typeof fixture) => {
      const fileHandles = rootFixture.entries.map(createFileHandle);
      const handle = {
        kind: 'directory' as const,
        name: rootFixture.rootName,
        async *values() {
          for (const fileHandle of fileHandles) {
            yield fileHandle;
          }
        },
        async getFileHandle(name: string) {
          const fileHandle = fileHandles.find(item => item.name === name);
          if (!fileHandle) {
            throw new DOMException(`Missing file: ${name}`, 'NotFoundError');
          }
          return fileHandle;
        },
        async getDirectoryHandle() {
          throw new DOMException('Nested directories are not defined in this fixture', 'NotFoundError');
        },
        async queryPermission() {
          return 'granted' as PermissionState;
        },
        async requestPermission() {
          return 'granted' as PermissionState;
        },
      };
      liveDirectoryHandles.set(rootFixture.rootName, handle as unknown as FileSystemDirectoryHandle);
      return handle;
    };

    // Plain stubs are IDB-cloneable; restore live methodful handles on read.
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function patchedPut(value: any, key?: IDBValidKey) {
      if (value && value.key === 'local_dir_handles' && value.data && typeof value.data === 'object') {
        const stubs: Record<string, { kind: 'directory'; name: string }> = {};
        for (const [name, handle] of Object.entries(value.data as Record<string, any>)) {
          stubs[name] = { kind: 'directory', name: (handle as { name?: string })?.name || name };
          if (handle && typeof (handle as { getFileHandle?: unknown }).getFileHandle === 'function') {
            liveDirectoryHandles.set(name, handle as FileSystemDirectoryHandle);
          }
        }
        return originalPut.call(this, { ...value, data: stubs }, key as IDBValidKey);
      }
      return originalPut.call(this, value, key as IDBValidKey);
    };

    const originalGet = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function patchedGet(query: IDBValidKey | IDBKeyRange) {
      const request = originalGet.call(this, query);
      request.addEventListener('success', () => {
        const result = request.result;
        if (!result || result.key !== 'local_dir_handles' || !result.data || typeof result.data !== 'object') {
          return;
        }
        const restored: Record<string, FileSystemDirectoryHandle> = {};
        for (const name of Object.keys(result.data)) {
          const live = liveDirectoryHandles.get(name);
          if (live) {
            restored[name] = live;
          }
        }
        result.data = restored;
      });
      return request;
    };

    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: async () => createDirectoryHandle(fixture),
    });
  }, localImportFixture);
}

async function openControlsTab(page: Page) {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.waitForLoadState('networkidle');

  // zh-CN uses 本地/本地歌曲; en uses Folder.
  const localNav = page.getByRole('button', { name: /^(Folder|本地|本地歌曲)$/ }).last();
  await expect(localNav).toBeVisible({ timeout: 20_000 });
  await localNav.click();
  await page.getByRole('button', { name: /Import Folder|导入文件夹/i }).last().click();
  // Folder cards appear first; open the imported library to reach the track row.
  const importedLibrary = page.getByRole('heading', { name: /Controls Fixture|All Songs/i }).first();
  await expect(importedLibrary).toBeVisible({ timeout: 20_000 });
  await importedLibrary.click();
  await expect(page.getByText('Midnight Train').first()).toBeVisible({ timeout: 20_000 });

  // Play-all should navigate into the player stage.
  await page.getByRole('button', { name: /播放全部|Play All/i }).click();
  const panelToggle = page.getByTestId('unified-panel-toggle').locator('button').first();
  await expect(panelToggle).toBeVisible({ timeout: 20_000 });
  await panelToggle.click();

  // Exact title only — `/控制|Controls/i` also hits "远程控制" and "Controls Fixture".
  await page.getByRole('button', { name: /^(控制|Controls)$/ }).click();
  await expect(page.getByTestId('controls-lyrics-animation-section')).toBeVisible();
}

test.describe('player controls panel', () => {
  test.beforeEach(async ({ page }) => {
    await installControlsPanelState(page);
  });

  test('renders compact high-frequency control sections', async ({ page }) => {
    await openControlsTab(page);

    await expect(page.getByTestId('controls-quick-actions')).toBeVisible();
    await expect(page.getByTestId('controls-theme-section')).toBeVisible();
    await expect(page.getByTestId('controls-lyrics-animation-section')).toBeVisible();
    await expect(page.getByTestId('controls-lyric-color-presets')).toBeVisible();
    await expect(page.getByTestId('controls-toggle-lyrics-advanced')).toBeVisible();
    await expect(page.getByTestId('controls-lyrics-advanced-section')).toHaveCount(0);
    await expect(page.getByTestId('controls-open-lyric-color-picker')).toBeVisible();
    await expect(page.getByTestId('controls-interactive3d-presets-section')).toBeVisible();
    await expect(page.getByTestId('controls-open-more-settings')).toBeVisible();

    await expect(page.getByTestId('controls-animation-intensity-section')).toHaveCount(0);
    await expect(page.getByTestId('controls-player-background-section')).toHaveCount(0);
  });

  test('switches visualizer mode and persists to localStorage', async ({ page }) => {
    await openControlsTab(page);

    await page.getByTestId('controls-visualizer-mode-trigger').click();
    await page.getByTestId('controls-visualizer-mode-cadenza').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('visualizer_mode'))).toBe('cadenza');

    await page.getByTestId('controls-visualizer-mode-trigger').click();
    await page.getByTestId('controls-visualizer-mode-classic').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('visualizer_mode'))).toBe('classic');
  });

  test('updates volume and loop mode from quick actions', async ({ page }) => {
    await openControlsTab(page);

    const volumeSlider = page.getByTestId('controls-tab').locator('input[type="range"]').first();
    await volumeSlider.fill('0.62');
    await volumeSlider.dispatchEvent('mouseup');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_volume'))).toBe('0.62');

    const loopButton = page.getByTestId('controls-quick-actions').locator('button').first();
    await loopButton.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_loop_mode'))).toBe('all');
    await loopButton.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_loop_mode'))).toBe('one');
    await loopButton.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('player_loop_mode'))).toBe('off');
  });

  test('selecting a 3D preset switches background mode to interactive3d', async ({ page }) => {
    await openControlsTab(page);

    await page.getByTestId('controls-interactive3d-preset-emily').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('visualizer_background_mode'))).toBe('interactive3d');
  });

  test('applies lyric color preset without changing theme source mode', async ({ page }) => {
    await openControlsTab(page);

    // soda-white is the default; pick another color-only preset.
    await page.getByTestId('lyric-color-preset-foil-gold').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('lyric_color_preset_id'))).toBe('foil-gold');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme_bg_mode'))).not.toBe('ai');
  });
});

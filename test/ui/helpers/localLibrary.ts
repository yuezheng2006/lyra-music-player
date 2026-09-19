import { expect, type Page } from '@playwright/test';
import { APP_VERSION } from './appVersion';

// test/ui/helpers/localLibrary.ts
// Shared local-folder import fixture: mocks Audio/Worker/showDirectoryPicker so specs
// can import a local library and enter the player stage deterministically.

export type LocalLibraryEntry = {
    kind: 'file';
    name: string;
    type: string;
    content: string;
    lastModified: number;
};

export type LocalLibraryFixture = {
    rootName: string;
    entries: LocalLibraryEntry[];
};

export async function installLocalLibraryState(page: Page, fixture: LocalLibraryFixture) {
    await page.addInitScript(({ rootFixture, appVersion }: { rootFixture: LocalLibraryFixture; appVersion: string }) => {
        localStorage.clear();
        localStorage.setItem('i18nextLng', 'zh-CN');
        localStorage.setItem('default_theme_daylight', 'false');
        localStorage.setItem('static_mode', 'true');
        localStorage.setItem('last_app_view', 'home');
        localStorage.setItem('open_player_on_launch', 'false');
        localStorage.setItem('lyra_onboarding_completed', 'true');
        // Must equal the exact app version, otherwise the What's New overlay (z-[150]) blocks clicks.
        localStorage.setItem('folia_last_seen_guide_version', appVersion);
        // 性能 HUD 的实时数字会破坏截图确定性。
        localStorage.setItem('lyra_performance_hud', '0');
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
            readyState = 4;
            networkState = 1;
            error = null;
            ended = false;
            _src = '';

            set src(value: string) {
                this._src = value;
                setTimeout(() => {
                    this.dispatchEvent(new Event('loadedmetadata'));
                    this.dispatchEvent(new Event('canplay'));
                    this.dispatchEvent(new Event('canplaythrough'));
                }, 0);
            }

            get src() {
                return this._src;
            }

            _ticker: ReturnType<typeof setInterval> | null = null;

            play() {
                this.paused = false;
                setTimeout(() => {
                    this.dispatchEvent(new Event('play'));
                    this.dispatchEvent(new Event('playing'));
                }, 0);
                // Advance the clock so stall watchdogs don't auto-skip the track.
                if (!this._ticker) {
                    this._ticker = setInterval(() => {
                        if (this.paused) return;
                        this.currentTime = Math.min(this.currentTime + 0.25, this.duration - 1);
                        this.dispatchEvent(new Event('timeupdate'));
                    }, 250);
                }
                return Promise.resolve();
            }

            pause() {
                this.paused = true;
                if (this._ticker) {
                    clearInterval(this._ticker);
                    this._ticker = null;
                }
                this.dispatchEvent(new Event('pause'));
            }

            load() {}
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

        // Real decodable audio: fake bytes make the <audio> element fire `error`,
        // and the playback controller then auto-skips to the next queue track.
        // Long enough that natural track-end auto-advance never fires mid-test.
        const buildSilentWav = (seconds = 300, sampleRate = 8000) => {
            const dataLength = seconds * sampleRate;
            const buffer = new ArrayBuffer(44 + dataLength);
            const view = new DataView(buffer);
            const writeString = (offset: number, text: string) => {
                for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
            };
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + dataLength, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate, true);
            view.setUint16(32, 1, true);
            view.setUint16(34, 8, true);
            writeString(36, 'data');
            view.setUint32(40, dataLength, true);
            new Uint8Array(buffer, 44).fill(128);
            return buffer;
        };

        const createFileHandle = (entry: LocalLibraryEntry) => ({
            kind: 'file' as const,
            name: entry.name,
            async getFile() {
                const payload = entry.content === '__SILENT_WAV__' ? buildSilentWav() : entry.content;
                return new File([payload], entry.name, {
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

        const createDirectoryHandle = (root: LocalLibraryFixture) => {
            const fileHandles = root.entries.map(createFileHandle);
            const handle = {
                kind: 'directory' as const,
                name: root.rootName,
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
            liveDirectoryHandles.set(root.rootName, handle as unknown as FileSystemDirectoryHandle);
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
            value: async () => createDirectoryHandle(rootFixture),
        });
    }, { rootFixture: fixture, appVersion: APP_VERSION });
}

/** Import the fixture folder from home, play all, and land in the player stage. */
export async function enterPlayerFromLocalImport(page: Page, options: { firstTrackText: string }) {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await page.waitForLoadState('networkidle');

    const localNav = page.getByRole('button', { name: /^(Folder|本地|本地歌曲)$/ }).last();
    await expect(localNav).toBeVisible({ timeout: 20_000 });
    await localNav.click();
    await page.getByRole('button', { name: /Import Folder|导入文件夹/i }).last().click();
    const importedLibrary = page.getByRole('heading', { name: /Fixture|All Songs/i }).first();
    await expect(importedLibrary).toBeVisible({ timeout: 20_000 });
    await importedLibrary.click();
    await expect(page.getByText(options.firstTrackText).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /播放全部|Play All/i }).click();
    const panelToggle = page.getByTestId('unified-panel-toggle').locator('button').first();
    await expect(panelToggle).toBeVisible({ timeout: 20_000 });
}

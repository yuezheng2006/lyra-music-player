import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ONLINE_LIBRARY_FILTER_STORAGE_KEY,
    useOnlineLibraryFilterStore,
} from '@/stores/useOnlineLibraryFilterStore';

// test/unit/stores/onlineLibraryFilterStore.test.ts

const createLocalStorageMock = () => {
    const values = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            values.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            values.delete(key);
        }),
        clear: vi.fn(() => {
            values.clear();
        }),
    };
};

describe('useOnlineLibraryFilterStore', () => {
    let localStorageMock: ReturnType<typeof createLocalStorageMock>;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        (globalThis as { window?: { localStorage: Storage } }).window = {
            localStorage: localStorageMock as unknown as Storage,
        };

        useOnlineLibraryFilterStore.setState({
            playlistProviders: {
                netease: true,
                qq: true,
                qishui: true,
                coco: true,
                kugou: true,
                bilibili: true,
            },
            moduleFilter: 'all',
            searchProvider: 'netease',
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete (globalThis as { window?: unknown }).window;
    });

    it('toggles playlist providers independently', () => {
        useOnlineLibraryFilterStore.getState().togglePlaylistProvider('netease');

        expect(useOnlineLibraryFilterStore.getState().playlistProviders.netease).toBe(false);
        expect(useOnlineLibraryFilterStore.getState().playlistProviders.qq).toBe(true);
        expect(useOnlineLibraryFilterStore.getState().playlistProviders.qishui).toBe(true);
        expect(useOnlineLibraryFilterStore.getState().playlistProviders.coco).toBe(true);
    });

    it('moves search provider when enabling a peer source', () => {
        const store = useOnlineLibraryFilterStore.getState();
        store.setSearchProvider('coco');

        expect(useOnlineLibraryFilterStore.getState().searchProvider).toBe('coco');
        expect(useOnlineLibraryFilterStore.getState().playlistProviders.coco).toBe(true);
    });

    it('falls back search provider when the active source is toggled off', () => {
        useOnlineLibraryFilterStore.setState({
            playlistProviders: {
                netease: true,
                qq: false,
                qishui: true,
                coco: true,
                kugou: true,
                bilibili: true,
            },
            searchProvider: 'netease',
        });

        useOnlineLibraryFilterStore.getState().togglePlaylistProvider('netease');

        expect(useOnlineLibraryFilterStore.getState().playlistProviders.netease).toBe(false);
        expect(useOnlineLibraryFilterStore.getState().searchProvider).toBe('qishui');
    });

    it('updates module filter', () => {
        useOnlineLibraryFilterStore.getState().setModuleFilter('liked');
        expect(useOnlineLibraryFilterStore.getState().moduleFilter).toBe('liked');
    });

    it('persists provider and module filter changes to localStorage', () => {
        useOnlineLibraryFilterStore.getState().togglePlaylistProvider('qq');
        useOnlineLibraryFilterStore.getState().setModuleFilter('created');
        useOnlineLibraryFilterStore.getState().setSearchProvider('coco');

        expect(localStorageMock.setItem).toHaveBeenCalled();
        const lastCall = localStorageMock.setItem.mock.calls.at(-1);
        expect(lastCall?.[0]).toBe(ONLINE_LIBRARY_FILTER_STORAGE_KEY);
        const parsed = JSON.parse(String(lastCall?.[1]));
        expect(parsed.playlistProviders.qq).toBe(false);
        expect(parsed.moduleFilter).toBe('created');
        expect(parsed.searchProvider).toBe('coco');
        expect(parsed.playlistProviders.coco).toBe(true);
    });

    it('hydrates from localStorage when the store module boots', async () => {
        localStorageMock.setItem(ONLINE_LIBRARY_FILTER_STORAGE_KEY, JSON.stringify({
            playlistProviders: {
                netease: false,
                qq: true,
                qishui: true,
                coco: true,
                kugou: true,
                bilibili: true,
            },
            moduleFilter: 'liked',
            searchProvider: 'qq',
        }));

        vi.resetModules();
        const { useOnlineLibraryFilterStore: freshStore } = await import('@/stores/useOnlineLibraryFilterStore');

        expect(freshStore.getState().playlistProviders.netease).toBe(false);
        expect(freshStore.getState().playlistProviders.qq).toBe(true);
        expect(freshStore.getState().moduleFilter).toBe('liked');
        expect(freshStore.getState().searchProvider).toBe('qq');
    });
});

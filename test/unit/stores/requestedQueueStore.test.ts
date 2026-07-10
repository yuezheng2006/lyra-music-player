import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SongResult } from '@/types';

// test/unit/stores/requestedQueueStore.test.ts

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            store.delete(key);
        }),
        clear: vi.fn(() => {
            store.clear();
        }),
    };
};

const song = (id: number, name = `Song ${id}`): SongResult => ({
    id,
    name,
    artists: [{ id: 1, name: 'Artist' }],
    album: { id: 1, name: 'Album' },
    duration: 180000,
});

describe('useRequestedQueueStore', () => {
    let localStorageMock: ReturnType<typeof createLocalStorageMock>;

    beforeEach(async () => {
        vi.resetModules();
        localStorageMock = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        (globalThis as { window?: { localStorage: Storage } }).window = {
            localStorage: localStorageMock as unknown as Storage,
        };
    });

    it('only grows when songs are explicitly added', async () => {
        const { useRequestedQueueStore } = await import('@/stores/useRequestedQueueStore');
        useRequestedQueueStore.getState().clear();

        const first = useRequestedQueueStore.getState().addSongs([song(1), song(2)]);
        expect(first.changed).toBe(true);
        expect(useRequestedQueueStore.getState().songs.map(item => item.id)).toEqual([1, 2]);

        const again = useRequestedQueueStore.getState().addSongs([song(2), song(3)]);
        expect(again.changed).toBe(true);
        expect(useRequestedQueueStore.getState().songs.map(item => item.id)).toContain(3);
        expect(useRequestedQueueStore.getState().songs).toHaveLength(3);
    });

    it('persists and hydrates the requested queue', async () => {
        const { useRequestedQueueStore } = await import('@/stores/useRequestedQueueStore');
        useRequestedQueueStore.getState().clear();
        useRequestedQueueStore.getState().addSongs([song(9)]);
        useRequestedQueueStore.setState({ songs: [] });
        useRequestedQueueStore.getState().hydrate();
        expect(useRequestedQueueStore.getState().songs.map(item => item.id)).toEqual([9]);
    });

    it('tracks auto-seed notice for dock cue', async () => {
        const { useRequestedQueueStore } = await import('@/stores/useRequestedQueueStore');
        useRequestedQueueStore.getState().clear();

        useRequestedQueueStore.getState().markAutoSeeded(0);
        expect(useRequestedQueueStore.getState().autoSeedNotice).toBeNull();

        useRequestedQueueStore.getState().markAutoSeeded(5);
        const notice = useRequestedQueueStore.getState().autoSeedNotice;
        expect(notice?.count).toBe(5);
        expect(typeof notice?.at).toBe('number');

        useRequestedQueueStore.getState().clearAutoSeedNotice();
        expect(useRequestedQueueStore.getState().autoSeedNotice).toBeNull();
    });
});

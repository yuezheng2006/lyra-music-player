import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    MAX_LYRIC_OFFSET_ENTRIES,
    buildLyricOffsetSongKey,
    persistLyricTimelineOffsetMs,
    readLyricTimelineOffsetMs,
} from '@/utils/playback/lyricOffsetStore';

// test/unit/playback/lyricOffsetStore.test.ts
// Covers per-song lyric timeline offset persistence and eviction.

const createLocalStorageMock = (): Storage => {
    const store = new Map<string, string>();

    return {
        get length() {
            return store.size;
        },
        getItem: (key: string) => store.get(key) ?? null,
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, value);
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
    };
};

describe('lyricOffsetStore', () => {
    beforeEach(() => {
        (globalThis as { window?: unknown; }).window = { localStorage: createLocalStorageMock() };
    });

    afterEach(() => {
        delete (globalThis as { window?: unknown; }).window;
    });

    it('builds provider-scoped song keys', () => {
        expect(buildLyricOffsetSongKey({ id: 42 })).toBe('local:42');
        expect(buildLyricOffsetSongKey({ id: 42, musicProvider: 'netease' })).toBe('netease:42');
        expect(buildLyricOffsetSongKey(null)).toBeNull();
    });

    it('prefers the stable LocalSong UUID over the session-generated SongResult id', () => {
        expect(buildLyricOffsetSongKey({ id: -1710000000001, localData: { id: 'uuid-a' } }))
            .toBe('localfile:uuid-a');
    });

    it('round-trips a calibrated offset per song', () => {
        persistLyricTimelineOffsetMs('local:1', -100);
        persistLyricTimelineOffsetMs('local:2', 50);

        expect(readLyricTimelineOffsetMs('local:1')).toBe(-100);
        expect(readLyricTimelineOffsetMs('local:2')).toBe(50);
        expect(readLyricTimelineOffsetMs('local:3')).toBe(0);
        expect(readLyricTimelineOffsetMs(null)).toBe(0);
    });

    it('removes the entry when the offset is reset to 0', () => {
        persistLyricTimelineOffsetMs('local:1', -100);
        persistLyricTimelineOffsetMs('local:1', 0);

        expect(readLyricTimelineOffsetMs('local:1')).toBe(0);
        expect(window.localStorage.getItem('lyric_timeline_offsets_v1')).toBe('[]');
    });

    it('evicts the oldest entries beyond the cap', () => {
        for (let index = 0; index < MAX_LYRIC_OFFSET_ENTRIES + 5; index += 1) {
            persistLyricTimelineOffsetMs(`local:${index}`, 25);
        }

        expect(readLyricTimelineOffsetMs('local:0')).toBe(0);
        expect(readLyricTimelineOffsetMs(`local:${MAX_LYRIC_OFFSET_ENTRIES + 4}`)).toBe(25);
    });

    it('ignores corrupted storage payloads', () => {
        window.localStorage.setItem('lyric_timeline_offsets_v1', '{not json');
        expect(readLyricTimelineOffsetMs('local:1')).toBe(0);

        persistLyricTimelineOffsetMs('local:1', 75);
        expect(readLyricTimelineOffsetMs('local:1')).toBe(75);
    });
});

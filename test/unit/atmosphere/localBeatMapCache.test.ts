import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BeatMap } from '@/types/atmosphere';
import {
    clearLocalBeatMapCache,
    getLocalBeatMap,
    getPreferredLocalBeatMode,
    isLocalBeatPromptSource,
    resolveLocalBeatPersistKey,
    setLocalBeatMap,
    setPreferredLocalBeatMode,
} from '@/utils/atmosphere/localBeatMapCache';

// test/unit/atmosphere/localBeatMapCache.test.ts

const memoryStore = new Map<string, string>();

const sampleMap = (count: number): BeatMap => ({
    kicks: Array.from({ length: count }, (_, i) => i),
    beats: Array.from({ length: count }, (_, i) => ({
        time: i,
        strength: 0.6,
        confidence: 0.7,
        camera: true,
        pulse: true,
    })),
    pulseBeats: [],
    cameraBeats: Array.from({ length: count }, (_, i) => ({
        time: i,
        strength: 0.6,
        confidence: 0.7,
        camera: true,
        pulse: true,
    })),
    duration: 12,
    visualBeatCount: count,
    tempoSource: 'test',
    analyzedAt: 1,
});

describe('localBeatMapCache', () => {
    beforeEach(() => {
        memoryStore.clear();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => memoryStore.get(key) ?? null,
            setItem: (key: string, value: string) => { memoryStore.set(key, value); },
            removeItem: (key: string) => { memoryStore.delete(key); },
            clear: () => { memoryStore.clear(); },
        });
    });

    afterEach(() => {
        clearLocalBeatMapCache();
        vi.unstubAllGlobals();
    });

    it('resolves persist keys from atmosphere song keys', () => {
        expect(resolveLocalBeatPersistKey('42::blob:abc')).toBe('42');
        expect(resolveLocalBeatPersistKey('unknown::blob:abc')).toBe('unknown::blob:abc');
        expect(isLocalBeatPromptSource('blob:http://localhost/1')).toBe(true);
        expect(isLocalBeatPromptSource('https://cdn.example/a.mp3')).toBe(false);
    });

    it('stores and reads MR/DJ maps independently', () => {
        setLocalBeatMap('song-1', 'mr', sampleMap(3));
        setLocalBeatMap('song-1', 'dj', sampleMap(5));
        setPreferredLocalBeatMode('song-1', 'dj');

        expect(getLocalBeatMap('song-1', 'mr')?.visualBeatCount).toBe(3);
        expect(getLocalBeatMap('song-1', 'dj')?.visualBeatCount).toBe(5);
        expect(getPreferredLocalBeatMode('song-1')).toBe('dj');
    });
});

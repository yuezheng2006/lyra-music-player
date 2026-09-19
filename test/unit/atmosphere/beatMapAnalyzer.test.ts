import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    analyzeBeatMapFromUrl,
    clearBeatMapAnalysisCache,
} from '@/utils/atmosphere/beatMapAnalyzer';

// test/unit/atmosphere/beatMapAnalyzer.test.ts

describe('analyzeBeatMapFromUrl', () => {
    afterEach(() => {
        clearBeatMapAnalysisCache();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('dedupes concurrent fetches for the same audio URL', async () => {
        let fetchCount = 0;
        vi.stubGlobal('fetch', vi.fn(async () => {
            fetchCount += 1;
            return {
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(8),
            };
        }));

        const audioContext = {
            decodeAudioData: vi.fn(async () => ({
                duration: 0.2,
                numberOfChannels: 1,
                sampleRate: 44100,
                length: 8820,
                getChannelData: () => new Float32Array(8820),
            })),
        } as unknown as AudioContext;

        const url = 'https://example.com/track.m4a';
        const [first, second] = await Promise.all([
            analyzeBeatMapFromUrl(url, audioContext),
            analyzeBeatMapFromUrl(url, audioContext),
        ]);

        expect(fetchCount).toBe(1);
        expect(first).toEqual(second);
        expect(audioContext.decodeAudioData).toHaveBeenCalledTimes(1);
    });

    it('keeps separate in-memory caches for MR and DJ modes', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(8),
        })));

        const audioContext = {
            decodeAudioData: vi.fn(async () => ({
                duration: 12,
                numberOfChannels: 1,
                sampleRate: 44100,
                length: 44100 * 12,
                getChannelData: () => new Float32Array(44100 * 12),
            })),
        } as unknown as AudioContext;

        const url = 'https://example.com/mode-track.m4a';
        await analyzeBeatMapFromUrl(url, audioContext, { mode: 'mr' });
        await analyzeBeatMapFromUrl(url, audioContext, { mode: 'dj' });
        expect(audioContext.decodeAudioData).toHaveBeenCalledTimes(2);
    });
});

import { describe, expect, it } from 'vitest';
import {
    PLAY_PAUSE_FADE_IN_MS,
    PLAY_PAUSE_FADE_OUT_MS,
    PLAY_PAUSE_FADE_OUT_PAUSE_DELAY_MS,
    shouldSkipPlayPauseFade,
} from '@/utils/playback/audioPlayPauseFadeMath';

describe('audioPlayPauseFadeMath', () => {
    it('keeps fade windows short and pause delay after fade-out', () => {
        expect(PLAY_PAUSE_FADE_IN_MS).toBeLessThan(200);
        expect(PLAY_PAUSE_FADE_OUT_MS).toBeLessThan(200);
        expect(PLAY_PAUSE_FADE_OUT_PAUSE_DELAY_MS).toBeGreaterThan(PLAY_PAUSE_FADE_OUT_MS);
    });

    it('skips fade when target volume is silent', () => {
        expect(shouldSkipPlayPauseFade(0)).toBe(true);
        expect(shouldSkipPlayPauseFade(0.0005)).toBe(true);
        expect(shouldSkipPlayPauseFade(0.2)).toBe(false);
    });
});

// src/utils/playback/audioPlayPauseFadeMath.ts
// Short play/pause gain-fade timings (shorter than Mineradio ~420ms to keep UI snappy).

/** Fade-in duration when resuming playback. */
export const PLAY_PAUSE_FADE_IN_MS = 120;

/** Fade-out duration before the element actually pauses. */
export const PLAY_PAUSE_FADE_OUT_MS = 100;

/** Delay after starting fade-out before calling `audio.pause()`. */
export const PLAY_PAUSE_FADE_OUT_PAUSE_DELAY_MS = PLAY_PAUSE_FADE_OUT_MS + 20;

/** Skip audible fade when the effective target is already silent. */
export function shouldSkipPlayPauseFade(targetVolume: number): boolean {
    return !(Number.isFinite(targetVolume) && targetVolume > 0.001);
}

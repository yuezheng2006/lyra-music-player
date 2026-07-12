// src/utils/audioAutoPlayGuard.ts
// Keeps pending autoplay alive across src clear / reload pause events.

/** HTMLMediaElement.HAVE_CURRENT_DATA */
const HAVE_CURRENT_DATA = 2;

/**
 * When React clears or swaps audio `src`, the element fires `pause`.
 * That must not wipe `shouldAutoPlay` or the next source will stay silent.
 */
export function shouldPreserveAutoPlayOnPause(
    shouldAutoPlay: boolean,
    currentSrc: string,
    readyState: number,
): boolean {
    return shouldAutoPlay && (!currentSrc || readyState < HAVE_CURRENT_DATA);
}

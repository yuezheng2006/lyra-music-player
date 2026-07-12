// src/utils/audioAutoPlayGuard.ts
// Keeps pending autoplay alive across src swap / reload pause events.

/**
 * When React swaps audio `src`, the element fires `pause` while the *old*
 * currentSrc/readyState are often still set. Clearing shouldAutoPlay there
 * leaves the next source silent. If autoplay is armed, always preserve it;
 * user pause must clear the flag *before* calling element.pause().
 */
export function shouldPreserveAutoPlayOnPause(shouldAutoPlay: boolean): boolean {
    return shouldAutoPlay;
}

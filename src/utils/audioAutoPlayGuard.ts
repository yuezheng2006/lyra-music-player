// src/utils/audioAutoPlayGuard.ts
// Keeps pending autoplay alive across src swap / reload pause events.

import type { MutableRefObject, RefObject } from 'react';

/**
 * When React swaps audio `src`, the element fires `pause` while the *old*
 * currentSrc/readyState are often still set. Clearing shouldAutoPlay there
 * leaves the next source silent. If autoplay is armed, always preserve it;
 * user pause must clear the flag *before* calling element.pause().
 */
export function shouldPreserveAutoPlayOnPause(shouldAutoPlay: boolean): boolean {
    return shouldAutoPlay;
}

/**
 * Arm autoplay at the start of a click-driven play path, before any await.
 * Async URL fetches drop the user gesture; without this flag + Electron policy,
 * the later play() lands as NotAllowedError and the dock stays paused.
 */
export function armAutoPlayIntent(shouldAutoPlayRef: MutableRefObject<boolean>): void {
    shouldAutoPlayRef.current = true;
}

type UnlockAutoplayOptions = {
    audioRef: RefObject<HTMLAudioElement | null> | MutableRefObject<HTMLAudioElement | null>;
    audioContextRef?: MutableRefObject<AudioContext | null>;
};

/**
 * Spend remaining user activation on AudioContext + a muted play/pause prime
 * so a later play() after await is more likely to be allowed.
 */
export function unlockHtmlAudioForAutoplay(options: UnlockAutoplayOptions): void {
    const audioContext = options.audioContextRef?.current;
    if (audioContext && audioContext.state === 'suspended') {
        void audioContext.resume().catch(() => undefined);
    }

    const audio = options.audioRef.current;
    if (!audio) {
        return;
    }

    const hasSource = Boolean(audio.currentSrc || audio.src);
    if (!hasSource) {
        return;
    }

    const wasMuted = audio.muted;
    audio.muted = true;
    const playPromise = audio.play();
    if (playPromise === undefined) {
        audio.muted = wasMuted;
        return;
    }

    void playPromise
        .then(() => {
            audio.pause();
            audio.muted = wasMuted;
        })
        .catch(() => {
            audio.muted = wasMuted;
        });
}

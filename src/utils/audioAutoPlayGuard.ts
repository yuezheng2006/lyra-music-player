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

/** Session restore must arm this before fetching the restored source, or the play bridge misses it. */
export function armLaunchAutoPlay(
    shouldAutoPlayRef: MutableRefObject<boolean>,
    autoPlayOnLaunch: boolean,
): void {
    if (autoPlayOnLaunch) {
        shouldAutoPlayRef.current = true;
    }
}

type UnlockAutoplayOptions = {
    audioRef: RefObject<HTMLAudioElement | null> | MutableRefObject<HTMLAudioElement | null>;
    audioContextRef?: MutableRefObject<AudioContext | null>;
};

/**
 * Spend remaining user activation on AudioContext + a muted play/pause prime
 * so a later play() after await is more likely to be allowed.
 *
 * Must not pause after a src swap: clicking Next while already playing used to
 * arm unlock on song A, then unlock's deferred pause() hit song B and aborted
 * its play() ("interrupted by a call to pause()").
 */
/**
 * Src-swap races often reject play() before the new media is attached.
 * Keep shouldAutoPlay armed so canplay / the autoplay effect can retry.
 */
export function isTransientAutoplayFailure(error: unknown): boolean {
    if (!(error instanceof DOMException)) {
        return false;
    }
    return error.name === 'AbortError' || error.name === 'NotSupportedError';
}

/** True when the element has a non-empty source URL worth calling play() on. */
export function hasPlayableHtmlMediaSource(
    media: Pick<HTMLMediaElement, 'currentSrc' | 'src'> | null | undefined,
): boolean {
    if (!media) {
        return false;
    }
    const src = (media.currentSrc || media.src || '').trim();
    return src.length > 0;
}

export function unlockHtmlAudioForAutoplay(options: UnlockAutoplayOptions): void {
    const audioContext = options.audioContextRef?.current;
    if (audioContext && audioContext.state === 'suspended') {
        void audioContext.resume().catch(() => undefined);
    }

    const audio = options.audioRef.current;
    if (!audio) {
        return;
    }

    // Already playing: the click already unlocked media. A muted play/pause
    // prime would race the next track's src commit and pause the new source.
    if (!audio.paused && !audio.ended) {
        return;
    }

    const srcAtStart = audio.currentSrc || audio.src;
    if (!srcAtStart) {
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
            // Src may have changed to the next track while this prime was in flight.
            const srcNow = audio.currentSrc || audio.src;
            if (srcNow !== srcAtStart) {
                audio.muted = wasMuted;
                return;
            }
            audio.pause();
            audio.muted = wasMuted;
        })
        .catch(() => {
            audio.muted = wasMuted;
        });
}

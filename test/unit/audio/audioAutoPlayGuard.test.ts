import { describe, expect, it, vi } from 'vitest';
import {
    armAutoPlayIntent,
    armLaunchAutoPlay,
    hasPlayableHtmlMediaSource,
    isTransientAutoplayFailure,
    shouldPreserveAutoPlayOnPause,
    unlockHtmlAudioForAutoplay,
} from '@/utils/audioAutoPlayGuard';

// test/unit/audio/audioAutoPlayGuard.test.ts

describe('isTransientAutoplayFailure', () => {
    it('treats AbortError and NotSupportedError as retryable', () => {
        expect(isTransientAutoplayFailure(new DOMException('aborted', 'AbortError'))).toBe(true);
        expect(isTransientAutoplayFailure(new DOMException('no sources', 'NotSupportedError'))).toBe(true);
        expect(isTransientAutoplayFailure(new DOMException('blocked', 'NotAllowedError'))).toBe(false);
        expect(isTransientAutoplayFailure(new Error('other'))).toBe(false);
    });
});

describe('hasPlayableHtmlMediaSource', () => {
    it('requires a non-empty src', () => {
        expect(hasPlayableHtmlMediaSource({ currentSrc: '', src: '' })).toBe(false);
        expect(hasPlayableHtmlMediaSource({ currentSrc: '', src: 'https://a.test/x.mp3' })).toBe(true);
        expect(hasPlayableHtmlMediaSource(null)).toBe(false);
    });
});

describe('shouldPreserveAutoPlayOnPause', () => {
    it('preserves autoplay whenever it is armed', () => {
        expect(shouldPreserveAutoPlayOnPause(true)).toBe(true);
    });

    it('does not preserve when autoplay is not armed', () => {
        expect(shouldPreserveAutoPlayOnPause(false)).toBe(false);
    });
});

describe('armLaunchAutoPlay', () => {
    it('arms before restore when the lab switch is on', () => {
        const shouldAutoPlayRef = { current: false };
        armLaunchAutoPlay(shouldAutoPlayRef, true);
        expect(shouldAutoPlayRef.current).toBe(true);
    });

    it('leaves autoplay disarmed when the lab switch is off', () => {
        const shouldAutoPlayRef = { current: false };
        armLaunchAutoPlay(shouldAutoPlayRef, false);
        expect(shouldAutoPlayRef.current).toBe(false);
    });
});

describe('unlockHtmlAudioForAutoplay', () => {
    it('primes a muted play/pause when the element is paused with a source', async () => {
        const play = vi.fn(async () => undefined);
        const pause = vi.fn();
        const audio = {
            currentSrc: 'https://example.test/a.mp3',
            src: 'https://example.test/a.mp3',
            muted: false,
            paused: true,
            ended: false,
            play,
            pause,
        } as unknown as HTMLAudioElement;
        const audioRef = { current: audio };
        const audioContextRef = {
            current: { state: 'suspended', resume: vi.fn(async () => undefined) } as unknown as AudioContext,
        };

        unlockHtmlAudioForAutoplay({ audioRef, audioContextRef });

        expect(audioContextRef.current.resume).toHaveBeenCalled();
        expect(play).toHaveBeenCalled();
        await play.mock.results[0]?.value;
        await Promise.resolve();
        expect(pause).toHaveBeenCalled();
        expect(audio.muted).toBe(false);
    });

    it('skips muted priming when already playing so Next cannot be paused by unlock', () => {
        const play = vi.fn(async () => undefined);
        const pause = vi.fn();
        const audio = {
            currentSrc: 'https://example.test/a.mp3',
            src: 'https://example.test/a.mp3',
            muted: false,
            paused: false,
            ended: false,
            play,
            pause,
        } as unknown as HTMLAudioElement;
        const audioContextRef = {
            current: { state: 'running', resume: vi.fn(async () => undefined) } as unknown as AudioContext,
        };

        unlockHtmlAudioForAutoplay({ audioRef: { current: audio }, audioContextRef });

        expect(play).not.toHaveBeenCalled();
        expect(pause).not.toHaveBeenCalled();
    });

    it('does not pause after the element src changes mid-prime', async () => {
        let currentSrc = 'https://example.test/a.mp3';
        const play = vi.fn(async () => {
            currentSrc = 'https://example.test/b.mp3';
        });
        const pause = vi.fn();
        const audio = {
            get currentSrc() { return currentSrc; },
            get src() { return currentSrc; },
            muted: false,
            paused: true,
            ended: false,
            play,
            pause,
        } as unknown as HTMLAudioElement;

        unlockHtmlAudioForAutoplay({ audioRef: { current: audio } });
        await play.mock.results[0]?.value;
        await Promise.resolve();

        expect(pause).not.toHaveBeenCalled();
        expect(audio.muted).toBe(false);
    });

    it('skips priming when there is no source yet', () => {
        const play = vi.fn(async () => undefined);
        const audio = {
            currentSrc: '',
            src: '',
            muted: false,
            paused: true,
            ended: false,
            play,
            pause: vi.fn(),
        } as unknown as HTMLAudioElement;

        unlockHtmlAudioForAutoplay({ audioRef: { current: audio } });
        expect(play).not.toHaveBeenCalled();
    });
});

import { describe, expect, it, vi } from 'vitest';
import {
    armAutoPlayIntent,
    shouldPreserveAutoPlayOnPause,
    unlockHtmlAudioForAutoplay,
} from '@/utils/audioAutoPlayGuard';

// test/unit/audio/audioAutoPlayGuard.test.ts

describe('shouldPreserveAutoPlayOnPause', () => {
    it('preserves autoplay whenever it is armed', () => {
        expect(shouldPreserveAutoPlayOnPause(true)).toBe(true);
    });

    it('does not preserve when autoplay is not armed', () => {
        expect(shouldPreserveAutoPlayOnPause(false)).toBe(false);
    });
});

describe('armAutoPlayIntent', () => {
    it('sets the autoplay ref before async work', () => {
        const shouldAutoPlayRef = { current: false };
        armAutoPlayIntent(shouldAutoPlayRef);
        expect(shouldAutoPlayRef.current).toBe(true);
    });
});

describe('unlockHtmlAudioForAutoplay', () => {
    it('primes a muted play/pause when the element already has a source', async () => {
        const play = vi.fn(async () => undefined);
        const pause = vi.fn();
        const audio = {
            currentSrc: 'https://example.test/a.mp3',
            src: 'https://example.test/a.mp3',
            muted: false,
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

    it('skips priming when there is no source yet', () => {
        const play = vi.fn(async () => undefined);
        const audio = {
            currentSrc: '',
            src: '',
            muted: false,
            play,
            pause: vi.fn(),
        } as unknown as HTMLAudioElement;

        unlockHtmlAudioForAutoplay({ audioRef: { current: audio } });
        expect(play).not.toHaveBeenCalled();
    });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    clearOnlinePlaybackRecoveryState,
    createOnlineRecoveryController,
} from '../../../src/components/app/playback/createOnlineRecoveryController';
import { loadOnlineSongAudioSource } from '../../../src/services/onlinePlayback';

// test/unit/playback/createOnlineRecoveryController.test.ts
// Recovery must refresh companion videoSrc alongside the audio URL.

vi.mock('../../../src/services/onlinePlayback', () => ({
    loadOnlineSongAudioSource: vi.fn(),
}));

vi.mock('../../../src/services/musicProviders/sidecarProviderClient', () => ({
    markProviderAudioUnavailable: vi.fn(),
}));

describe('createOnlineRecoveryController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearOnlinePlaybackRecoveryState();
    });

    it('updates videoSrc when recovering a refreshed online source', async () => {
        vi.mocked(loadOnlineSongAudioSource).mockResolvedValue({
            kind: 'ok',
            audioSrc: 'https://cdn.example/audio-new.m4s',
            videoSrc: 'https://cdn.example/video-new.m4s',
        });

        const setAudioSrc = vi.fn();
        const setVideoSrc = vi.fn();
        const audioElement = {
            currentSrc: 'https://cdn.example/audio-old.m4s',
            currentTime: 12,
        } as HTMLAudioElement;

        const controller = createOnlineRecoveryController({
            audioQuality: 'standard',
            currentSong: {
                id: 42,
                name: 'demo',
                musicProvider: 'bilibili',
                providerSongId: 'BV1xx411c7mD|1',
            } as any,
            audioSrc: 'https://cdn.example/audio-old.m4s',
            audioRef: { current: audioElement },
            currentSongRef: { current: 42 },
            blobUrlRef: { current: null },
            shouldAutoPlayRef: { current: false },
            pendingResumeTimeRef: { current: null },
            onlinePlaybackRecoveryRef: { current: null },
            lastAudioRecoverySourceRef: { current: null },
            currentOnlineAudioUrlFetchedAtRef: { current: Date.now() },
            setAudioSrc,
            setVideoSrc,
            onlineAudioUrlTtlMs: 60_000,
            onlineAudioUrlRefreshBufferMs: 5_000,
        });

        const recovered = await controller.recoverOnlinePlaybackSource({
            failedSrc: 'https://cdn.example/audio-old.m4s',
            autoplay: true,
        });

        expect(recovered).toBe(true);
        expect(setAudioSrc).toHaveBeenCalledWith('https://cdn.example/audio-new.m4s');
        expect(setVideoSrc).toHaveBeenCalledWith('https://cdn.example/video-new.m4s');
    });

    it('remounts and heals when recovery returns the same CDN URL', async () => {
        const sameSrc = 'https://cdn.example/audio-same.m4s';
        vi.mocked(loadOnlineSongAudioSource).mockResolvedValue({
            kind: 'ok',
            audioSrc: sameSrc,
        });

        const setAudioSrc = vi.fn();
        const remountAudioElement = vi.fn();
        const audioElement = {
            currentSrc: sameSrc,
            currentTime: 25,
        } as HTMLAudioElement;

        const controller = createOnlineRecoveryController({
            audioQuality: 'standard',
            currentSong: {
                id: 7,
                name: 'qishui-demo',
                musicProvider: 'qishui',
                providerSongId: '7578838498515142696',
            } as any,
            audioSrc: sameSrc,
            audioRef: { current: audioElement },
            currentSongRef: { current: 7 },
            blobUrlRef: { current: null },
            shouldAutoPlayRef: { current: false },
            pendingResumeTimeRef: { current: null },
            onlinePlaybackRecoveryRef: { current: null },
            lastAudioRecoverySourceRef: { current: null },
            currentOnlineAudioUrlFetchedAtRef: { current: Date.now() },
            setAudioSrc,
            remountAudioElement,
            onlineAudioUrlTtlMs: 60_000,
            onlineAudioUrlRefreshBufferMs: 5_000,
        });

        const recovered = await controller.recoverOnlinePlaybackSource({
            failedSrc: sameSrc,
            resumeAt: 25,
            autoplay: true,
        });

        expect(recovered).toBe(true);
        expect(remountAudioElement).toHaveBeenCalledTimes(1);
        expect(setAudioSrc).toHaveBeenCalledWith(sameSrc);
    });
});

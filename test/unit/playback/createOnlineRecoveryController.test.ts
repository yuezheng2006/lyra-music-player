import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    clearOnlinePlaybackRecoveryState,
    createOnlineRecoveryController,
    isOnlinePlaybackRecoveryExhausted,
} from '../../../src/components/app/playback/createOnlineRecoveryController';
import { loadOnlineSongAudioSource } from '../../../src/services/onlinePlayback';

// test/unit/playback/createOnlineRecoveryController.test.ts
// Recovery must refresh companion videoSrc alongside the audio URL.

vi.mock('../../../src/services/onlinePlayback', () => ({
    loadOnlineSongAudioSource: vi.fn(),
}));

vi.mock('../../../src/services/musicProviders/sidecarProviderClient', () => ({
    markProviderAudioUnavailable: vi.fn(),
    clearProviderAudioUnavailable: vi.fn(),
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
        expect(loadOnlineSongAudioSource).toHaveBeenCalledWith(
            expect.anything(),
            'standard',
            null,
            { forceRefresh: true },
        );
    });

    it('disarms autoplay after the recovery attempt limit is reached', async () => {
        vi.mocked(loadOnlineSongAudioSource).mockResolvedValue({
            kind: 'ok',
            audioSrc: 'https://cdn.example/audio-recovered.m4s',
        });

        const shouldAutoPlayRef = { current: true };
        const pendingResumeTimeRef = { current: 18 };
        const controller = createOnlineRecoveryController({
            audioQuality: 'standard',
            currentSong: {
                id: 88,
                name: 'retry-limit-demo',
                musicProvider: 'qishui',
                providerSongId: 'retry-limit-demo',
            } as any,
            audioSrc: 'https://cdn.example/audio-old.m4s',
            audioRef: {
                current: {
                    currentSrc: 'https://cdn.example/audio-old.m4s',
                    currentTime: 18,
                } as HTMLAudioElement,
            },
            currentSongRef: { current: 88 },
            blobUrlRef: { current: null },
            shouldAutoPlayRef,
            pendingResumeTimeRef,
            onlinePlaybackRecoveryRef: { current: null },
            lastAudioRecoverySourceRef: { current: null },
            currentOnlineAudioUrlFetchedAtRef: { current: Date.now() },
            setAudioSrc: vi.fn(),
            onlineAudioUrlTtlMs: 60_000,
            onlineAudioUrlRefreshBufferMs: 5_000,
        });

        for (let attempt = 0; attempt < 3; attempt += 1) {
            await controller.recoverOnlinePlaybackSource({ autoplay: true });
        }
        expect(isOnlinePlaybackRecoveryExhausted(88)).toBe(true);
        const recovered = await controller.recoverOnlinePlaybackSource({ autoplay: true });

        expect(recovered).toBe(false);
        expect(shouldAutoPlayRef.current).toBe(false);
        expect(pendingResumeTimeRef.current).toBeNull();
        clearOnlinePlaybackRecoveryState(88);
        expect(isOnlinePlaybackRecoveryExhausted(88)).toBe(false);
    });

    it('retries a second recovery after same-src heal instead of hard-failing', async () => {
        const staleSrc = 'https://cdn.example/audio-stale.m4s';
        const freshSrc = 'https://cdn.example/audio-fresh.m4s';
        vi.mocked(loadOnlineSongAudioSource)
            .mockResolvedValueOnce({ kind: 'ok', audioSrc: staleSrc })
            .mockResolvedValueOnce({ kind: 'ok', audioSrc: staleSrc })
            .mockResolvedValueOnce({ kind: 'ok', audioSrc: freshSrc });

        const setAudioSrc = vi.fn();
        const audioElement = {
            currentSrc: staleSrc,
            currentTime: 22,
        } as HTMLAudioElement;

        const controller = createOnlineRecoveryController({
            audioQuality: 'standard',
            currentSong: {
                id: 9,
                name: 'qishui-stale',
                musicProvider: 'qishui',
                providerSongId: '7574370760544962598',
            } as any,
            audioSrc: staleSrc,
            audioRef: { current: audioElement },
            currentSongRef: { current: 9 },
            blobUrlRef: { current: null },
            shouldAutoPlayRef: { current: false },
            pendingResumeTimeRef: { current: null },
            onlinePlaybackRecoveryRef: { current: null },
            lastAudioRecoverySourceRef: { current: null },
            currentOnlineAudioUrlFetchedAtRef: { current: Date.now() },
            setAudioSrc,
            remountAudioElement: vi.fn(),
            onlineAudioUrlTtlMs: 60_000,
            onlineAudioUrlRefreshBufferMs: 5_000,
        });

        await controller.recoverOnlinePlaybackSource({
            failedSrc: staleSrc,
            autoplay: true,
        });

        const recoveredAgain = await controller.recoverOnlinePlaybackSource({
            failedSrc: staleSrc,
            autoplay: true,
        });

        expect(recoveredAgain).toBe(true);
        expect(setAudioSrc).toHaveBeenLastCalledWith(freshSrc);
    });
});

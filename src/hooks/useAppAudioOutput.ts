import { useCallback, useEffect, type RefObject } from 'react';
import { clampMediaVolume } from '@/utils/appPlaybackHelpers';
import type { StatusMessage } from '@/types';

interface UseAppAudioOutputParams {
    audioRef: RefObject<HTMLAudioElement | null>;
    audioContextRef: RefObject<AudioContext | null>;
    gainNodeRef: RefObject<GainNode | null>;
    replayGainLinearRef: RefObject<number>;
    volumePreviewFrameRef: RefObject<number | null>;
    pendingVolumePreviewRef: RefObject<number | null>;
    isMuted: boolean;
    volume: number;
    audioOutputDeviceId: string;
    audioSrc: string | null;
    persistAudioOutputDeviceId: (deviceId: string) => void;
    setStatusMsg: (message: StatusMessage | null) => void;
}

/** 管理播放输出设备切换与音量预览增益同步。 */
export function useAppAudioOutput({
    audioRef,
    audioContextRef,
    gainNodeRef,
    replayGainLinearRef,
    volumePreviewFrameRef,
    pendingVolumePreviewRef,
    isMuted,
    volume,
    audioOutputDeviceId,
    audioSrc,
    persistAudioOutputDeviceId,
    setStatusMsg,
}: UseAppAudioOutputParams) {
    const syncOutputGain = useCallback((targetVolume: number, smoothing = 0.015) => {
        const clampedVolume = clampMediaVolume(targetVolume);

        if (gainNodeRef.current && audioContextRef.current) {
            if (smoothing <= 0) {
                gainNodeRef.current.gain.setValueAtTime(
                    replayGainLinearRef.current * clampedVolume,
                    audioContextRef.current.currentTime,
                );
            } else {
                gainNodeRef.current.gain.setTargetAtTime(
                    replayGainLinearRef.current * clampedVolume,
                    audioContextRef.current.currentTime,
                    smoothing,
                );
            }

            if (audioRef.current) {
                audioRef.current.volume = 1;
                audioRef.current.muted = false;
            }
            return;
        }

        if (audioRef.current) {
            audioRef.current.volume = clampedVolume;
            audioRef.current.muted = isMuted;
        }
    }, [audioContextRef, audioRef, gainNodeRef, isMuted, replayGainLinearRef]);

    const applyAudioOutputDevice = useCallback(async (
        targetDeviceId: string,
        reportError = true,
    ) => {
        const audioElement = audioRef.current as (HTMLAudioElement & {
            setSinkId?: (sinkId: string) => Promise<void>;
            sinkId?: string;
        }) | null;
        const audioContext = audioContextRef.current as (AudioContext & {
            setSinkId?: (sinkId: string) => Promise<void>;
            sinkId?: string;
        }) | null;
        const audioSinkTarget = gainNodeRef.current && audioContext?.setSinkId
            ? audioContext
            : audioElement;

        if (!audioSinkTarget?.setSinkId) {
            persistAudioOutputDeviceId(targetDeviceId);
            return true;
        }

        const normalizedTargetDeviceId = targetDeviceId || '';
        if (audioSinkTarget.sinkId === normalizedTargetDeviceId) {
            persistAudioOutputDeviceId(targetDeviceId);
            return true;
        }

        let attempt = 0;
        const maxRetryCount = 4;
        let shouldPauseBeforeSwitch = normalizedTargetDeviceId === 'default' || normalizedTargetDeviceId === 'communications';

        while (attempt <= maxRetryCount) {
            const wasPlaying = !audioElement.paused && !audioElement.ended;
            try {
                if (shouldPauseBeforeSwitch && wasPlaying) {
                    audioElement.pause();
                }

                await audioSinkTarget.setSinkId(normalizedTargetDeviceId);
                persistAudioOutputDeviceId(targetDeviceId);

                if (shouldPauseBeforeSwitch && wasPlaying) {
                    try {
                        await audioElement.play();
                    } catch (resumeError) {
                        console.warn('[App] Audio output switched but playback did not resume automatically', {
                            resumeError,
                            targetDeviceId: normalizedTargetDeviceId,
                            audioSrc,
                        });
                    }
                }

                return true;
            } catch (error) {
                const isAbortError = error instanceof DOMException && error.name === 'AbortError';
                if (isAbortError && attempt < maxRetryCount) {
                    if (wasPlaying && audioElement.paused) {
                        try {
                            await audioElement.play();
                        } catch {
                            // Ignore resume failures during retry path.
                        }
                    }
                    attempt += 1;
                    shouldPauseBeforeSwitch = true;
                    await new Promise(resolve => window.setTimeout(resolve, 180));
                    continue;
                }

                console.warn('[App] Failed to apply audio output device', {
                    error,
                    targetDeviceId: normalizedTargetDeviceId,
                    sinkTarget: audioSinkTarget === audioContext ? 'audio-context' : 'audio-element',
                });

                if (wasPlaying && audioElement.paused) {
                    try {
                        await audioElement.play();
                    } catch {
                        // Ignore resume failures on final error.
                    }
                }

                if (reportError) {
                    setStatusMsg({
                        type: 'error',
                        text: '切换播放设备失败',
                    });
                }
                return false;
            }
        }

        return false;
    }, [audioContextRef, audioRef, audioSrc, gainNodeRef, persistAudioOutputDeviceId, setStatusMsg]);

    useEffect(() => {
        const audioElement = audioRef.current;

        if (!audioElement) {
            return;
        }

        let isDisposed = false;
        const handleAudioDeviceRetry = () => {
            if (isDisposed) {
                return;
            }
            void applyAudioOutputDevice(audioOutputDeviceId, false);
        };

        audioElement.addEventListener('loadedmetadata', handleAudioDeviceRetry);
        audioElement.addEventListener('canplay', handleAudioDeviceRetry);
        void applyAudioOutputDevice(audioOutputDeviceId, false);
        return () => {
            isDisposed = true;
            audioElement.removeEventListener('loadedmetadata', handleAudioDeviceRetry);
            audioElement.removeEventListener('canplay', handleAudioDeviceRetry);
        };
    }, [applyAudioOutputDevice, audioOutputDeviceId, audioRef, audioSrc]);

    const handleAudioOutputDeviceChange = useCallback(async (deviceId: string) => (
        await applyAudioOutputDevice(deviceId, true)
    ), [applyAudioOutputDevice]);

    const handlePreviewVolume = useCallback((val: number) => {
        pendingVolumePreviewRef.current = val;

        if (volumePreviewFrameRef.current !== null) {
            return;
        }

        volumePreviewFrameRef.current = requestAnimationFrame(() => {
            volumePreviewFrameRef.current = null;
            const nextVolume = pendingVolumePreviewRef.current;
            if (nextVolume !== null) {
                syncOutputGain(nextVolume, 0.015);
            }
        });
    }, [pendingVolumePreviewRef, syncOutputGain, volumePreviewFrameRef]);

    return {
        syncOutputGain,
        applyAudioOutputDevice,
        handleAudioOutputDeviceChange,
        handlePreviewVolume,
    };
}

import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { PlayerState } from '../types';
import {
    hasPlayableHtmlMediaSource,
    isTransientAutoplayFailure,
} from '../utils/audioAutoPlayGuard';
import {
    PLAY_PAUSE_FADE_IN_MS,
    PLAY_PAUSE_FADE_OUT_MS,
    PLAY_PAUSE_FADE_OUT_PAUSE_DELAY_MS,
    shouldSkipPlayPauseFade,
} from '../utils/playback/audioPlayPauseFadeMath';
import { trackTelemetry } from '../utils/telemetry/trackTelemetry';
import { isOnlinePlaybackRecoveryExhausted } from '../components/app/playback/createOnlineRecoveryController';

// src/hooks/usePlaybackTransportController.ts

type UsePlaybackTransportControllerParams = {
    activePlaybackContext: 'main' | 'stage';
    stageActiveEntryKind: string | null;
    isNowPlayingStageActive: boolean;
    currentSongId: number | null;
    audioSrc: string | null;
    duration: number;
    audioRef: RefObject<HTMLAudioElement | null>;
    audioContextRef: MutableRefObject<AudioContext | null>;
    shouldAutoPlayRef: MutableRefObject<boolean>;
    currentTime: { set: (value: number) => void };
    stageLyricsClockRef: MutableRefObject<{
        startTimeSec: number;
        endTimeSec: number;
        baseTimeSec: number;
        startedAtMs: number | null;
    }>;
    setPlayerState: Dispatch<SetStateAction<PlayerState>>;
    setStatusMsg: Dispatch<SetStateAction<any>>;
    setupAudioAnalyzer: () => void;
    syncOutputGain: (targetVolume: number, smoothing?: number) => void;
    rampOutputGain: (targetVolume: number, durationMs: number) => void;
    getTargetPlaybackVolume: () => number;
    shouldRefreshCurrentOnlineAudioSource: () => boolean;
    recoverOnlinePlaybackSource: (options: {
        failedSrc?: string | null;
        resumeAt?: number;
        autoplay: boolean;
    }) => Promise<boolean>;
    getSyntheticStageLyricsTime: () => number;
    syncStageLyricsClock: (timeSec: number, endTimeSec: number, nextPlayerState: PlayerState, startTimeSec?: number) => void;
    t: (key: string) => string;
};

// Owns play and pause transport behavior across main playback and Stage lyric-only playback.
export function usePlaybackTransportController({
    activePlaybackContext,
    stageActiveEntryKind,
    isNowPlayingStageActive,
    currentSongId,
    audioSrc,
    duration,
    audioRef,
    audioContextRef,
    shouldAutoPlayRef,
    currentTime,
    stageLyricsClockRef,
    setPlayerState,
    setStatusMsg,
    setupAudioAnalyzer,
    syncOutputGain,
    rampOutputGain,
    getTargetPlaybackVolume,
    shouldRefreshCurrentOnlineAudioSource,
    recoverOnlinePlaybackSource,
    getSyntheticStageLyricsTime,
    syncStageLyricsClock,
    t,
}: UsePlaybackTransportControllerParams) {
    const fadeSerialRef = useRef(0);
    const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelPlayPauseFade = useCallback(() => {
        fadeSerialRef.current += 1;
        if (fadeOutTimerRef.current !== null) {
            clearTimeout(fadeOutTimerRef.current);
            fadeOutTimerRef.current = null;
        }
    }, []);

    useEffect(() => () => {
        cancelPlayPauseFade();
    }, [cancelPlayPauseFade]);

    const resumePlayback = useCallback(async () => {
        if (isNowPlayingStageActive) {
            return;
        }

        if (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics' && !audioSrc) {
            const currentSyntheticTime = getSyntheticStageLyricsTime();
            syncStageLyricsClock(currentSyntheticTime, duration, PlayerState.PLAYING, stageLyricsClockRef.current.startTimeSec);
            currentTime.set(currentSyntheticTime);
            setPlayerState(PlayerState.PLAYING);
            return;
        }

        if (!audioRef.current) {
            return;
        }

        if (isOnlinePlaybackRecoveryExhausted(currentSongId)) {
            shouldAutoPlayRef.current = false;
            setStatusMsg({ type: 'error', text: t('status.playbackError') });
            setPlayerState(PlayerState.PAUSED);
            return;
        }

        cancelPlayPauseFade();
        setupAudioAnalyzer();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const targetVolume = getTargetPlaybackVolume();
        const useFade = !shouldSkipPlayPauseFade(targetVolume);
        trackTelemetry('play.resume', {
            data: {
                useFade,
                hasAudioSrc: Boolean(audioSrc),
                contextState: audioContextRef.current?.state ?? null,
            },
        });

        // Source refresh owns its own play path — keep gain at target so recovery is not left silent.
        if (shouldRefreshCurrentOnlineAudioSource()) {
            syncOutputGain(targetVolume, 0);
            const refreshed = await recoverOnlinePlaybackSource({
                failedSrc: audioRef.current.currentSrc || audioSrc,
                resumeAt: audioRef.current.currentTime,
                autoplay: true,
            });

            if (refreshed) {
                return;
            }
        }

        // Empty / dead src → NotSupportedError if we call play(); recover or bail cleanly.
        if (!hasPlayableHtmlMediaSource(audioRef.current)) {
            syncOutputGain(targetVolume, 0);
            const recovered = await recoverOnlinePlaybackSource({
                failedSrc: audioSrc,
                resumeAt: audioRef.current.currentTime,
                autoplay: true,
            });
            if (recovered) {
                return;
            }
            trackTelemetry('play.error', {
                level: 'warn',
                data: { name: 'NotSupportedError', phase: 'resume-no-src' },
            });
            setStatusMsg({ type: 'error', text: t('status.playbackError') });
            setPlayerState(PlayerState.PAUSED);
            return;
        }

        if (useFade) {
            syncOutputGain(0, 0);
        } else {
            syncOutputGain(targetVolume, 0);
        }

        try {
            await audioRef.current.play();
            if (useFade) {
                rampOutputGain(targetVolume, PLAY_PAUSE_FADE_IN_MS);
            } else {
                syncOutputGain(targetVolume, 0);
            }
            setPlayerState(PlayerState.PLAYING);
        } catch (error) {
            const recovered = await recoverOnlinePlaybackSource({
                failedSrc: audioRef.current.currentSrc || audioSrc,
                resumeAt: audioRef.current.currentTime,
                autoplay: true,
            });

            if (recovered) {
                return;
            }

            if (!audioRef.current.paused && !audioRef.current.ended) {
                if (useFade) {
                    rampOutputGain(targetVolume, PLAY_PAUSE_FADE_IN_MS);
                } else {
                    syncOutputGain(targetVolume, 0);
                }
                setPlayerState(PlayerState.PLAYING);
                return;
            }

            syncOutputGain(targetVolume, 0);

            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                trackTelemetry('play.error', {
                    level: 'warn',
                    data: { name: error.name, phase: 'resume' },
                });
                setStatusMsg({ type: 'info', text: t('status.clickToPlay') });
                setPlayerState(PlayerState.PAUSED);
                return;
            }

            // Abort/NotSupported while src is attaching — arm autoplay for canplay retry.
            if (isTransientAutoplayFailure(error)) {
                const recoveryExhausted = isOnlinePlaybackRecoveryExhausted(currentSongId);
                if (!recoveryExhausted) {
                    shouldAutoPlayRef.current = true;
                }
                trackTelemetry('play.error', {
                    level: 'warn',
                    data: {
                        name: error instanceof DOMException ? error.name : 'unknown',
                        phase: recoveryExhausted ? 'resume-terminal' : 'resume-transient',
                    },
                });
                setPlayerState(PlayerState.PAUSED);
                return;
            }

            trackTelemetry('play.error', {
                level: 'error',
                data: {
                    name: error instanceof DOMException ? error.name : 'unknown',
                    phase: 'resume',
                },
            });
            setStatusMsg({ type: 'error', text: t('status.playbackError') });
            setPlayerState(PlayerState.PAUSED);
            // Do not rethrow — UI calls void resumePlayback(); uncaught NotSupportedError spams console.
        }
    }, [activePlaybackContext, audioContextRef, audioRef, audioSrc, cancelPlayPauseFade, currentSongId, currentTime, duration, getSyntheticStageLyricsTime, getTargetPlaybackVolume, isNowPlayingStageActive, rampOutputGain, recoverOnlinePlaybackSource, setPlayerState, setStatusMsg, setupAudioAnalyzer, shouldAutoPlayRef, shouldRefreshCurrentOnlineAudioSource, stageActiveEntryKind, stageLyricsClockRef, syncOutputGain, syncStageLyricsClock, t]);

    const pausePlayback = useCallback(() => {
        if (isNowPlayingStageActive) {
            return;
        }

        if (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics' && !audioSrc) {
            const currentSyntheticTime = getSyntheticStageLyricsTime();
            syncStageLyricsClock(currentSyntheticTime, duration, PlayerState.PAUSED, stageLyricsClockRef.current.startTimeSec);
            currentTime.set(currentSyntheticTime);
            setPlayerState(PlayerState.PAUSED);
            return;
        }

        if (!audioRef.current) {
            return;
        }

        // Clear before pause so AppAudioElement onPause does not treat this as a src-swap preserve.
        shouldAutoPlayRef.current = false;

        if (audioRef.current.paused || audioRef.current.ended) {
            cancelPlayPauseFade();
            syncOutputGain(getTargetPlaybackVolume(), 0);
            setPlayerState(PlayerState.PAUSED);
            trackTelemetry('play.pause', { data: { path: 'already-paused' } });
            return;
        }

        const targetVolume = getTargetPlaybackVolume();
        if (shouldSkipPlayPauseFade(targetVolume) || !audioContextRef.current || !audioRef.current) {
            cancelPlayPauseFade();
            audioRef.current.pause();
            syncOutputGain(targetVolume, 0);
            setPlayerState(PlayerState.PAUSED);
            trackTelemetry('play.pause', { data: { path: 'immediate', useFade: false } });
            return;
        }

        cancelPlayPauseFade();
        const serial = fadeSerialRef.current;
        trackTelemetry('play.pause', { data: { path: 'fade', useFade: true } });
        rampOutputGain(0, PLAY_PAUSE_FADE_OUT_MS);
        fadeOutTimerRef.current = setTimeout(() => {
            fadeOutTimerRef.current = null;
            if (serial !== fadeSerialRef.current) {
                return;
            }
            const audio = audioRef.current;
            if (!audio) {
                return;
            }
            try {
                audio.pause();
            } catch {
                // Element may already be torn down during remount.
            }
            // Restore target gain while paused so the next resume can fade from a known level.
            syncOutputGain(getTargetPlaybackVolume(), 0);
            setPlayerState(PlayerState.PAUSED);
        }, PLAY_PAUSE_FADE_OUT_PAUSE_DELAY_MS);
    }, [activePlaybackContext, audioContextRef, audioRef, audioSrc, cancelPlayPauseFade, currentTime, duration, getSyntheticStageLyricsTime, getTargetPlaybackVolume, isNowPlayingStageActive, rampOutputGain, setPlayerState, shouldAutoPlayRef, stageActiveEntryKind, stageLyricsClockRef, syncOutputGain, syncStageLyricsClock]);

    return {
        resumePlayback,
        pausePlayback,
    };
}

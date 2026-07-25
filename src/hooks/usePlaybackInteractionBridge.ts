import { useCallback, useEffect } from 'react';
import type React from 'react';
import type { MotionValue } from 'framer-motion';
import { neteaseApi } from '../services/netease';
import { PlayerState } from '../types';
import type { ReplayGainMode, SongResult, StageLoopMode, StatusMessage } from '../types';
import { replayGainModeLabels } from '../utils/appPlaybackHelpers';
import {
    hasFoliaKeyboardWindow,
    isModKeyChord,
    isTextEntryTarget,
} from '@/components/shortcuts/shortcutKeyboardGuards';
import {
    KEYBOARD_VOLUME_STEP,
    resolveVolumeStepAdjustment,
} from '@/utils/playback/adjustVolumeByStepMath';
import { resolvePlayToggleAction } from '@/utils/playback/resolvePlayToggleActionMath';
import { trackTelemetry } from '@/utils/telemetry/trackTelemetry';

// src/hooks/usePlaybackInteractionBridge.ts

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');

type UsePlaybackInteractionBridgeParams = {
    isDev: boolean;
    currentSong: SongResult | null;
    currentView: string;
    audioSrc: string | null;
    activePlaybackContext: 'main' | 'stage';
    stageActiveEntryKind: string | null;
    isNowPlayingStageActive: boolean;
    isPanelOpen: boolean;
    isPlayerChromeHidden: boolean;
    isFmMode: boolean;
    playerState: PlayerState;
    duration: number;
    currentTime: MotionValue<number>;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    stageLyricsClockRef: React.MutableRefObject<{
        startTimeSec: number;
        endTimeSec: number;
        baseTimeSec: number;
        startedAtMs: number | null;
    }>;
    setIsDevDebugOverlayVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setIsPlayerChromeHidden: React.Dispatch<React.SetStateAction<boolean>>;
    setIsFloatingDockRevealed: React.Dispatch<React.SetStateAction<boolean>>;
    setIsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setReplayGainMode: React.Dispatch<React.SetStateAction<ReplayGainMode>>;
    setStatusMsg: React.Dispatch<React.SetStateAction<StatusMessage | null>>;
    handleNextTrack: () => Promise<void> | void;
    handlePrevTrack: () => void;
    handleToggleLoopMode: () => void;
    pausePlayback: () => void;
    resumePlayback: () => Promise<void>;
    volume: number;
    isMuted: boolean;
    handleSetVolume: (volume: number) => void;
    handleToggleMute: () => void;
    /** Re-arm audio when session restore left currentSong without audioSrc. */
    replayCurrentSong?: () => void;
    syncStageLyricsClock: (timeSec: number, endTimeSec: number, nextPlayerState: PlayerState, startTimeSec?: number) => void;
};

// Bridges playback-related keyboard and click interactions without leaving them inline in App.tsx.
export function usePlaybackInteractionBridge({
    isDev,
    currentSong,
    currentView,
    audioSrc,
    activePlaybackContext,
    stageActiveEntryKind,
    isNowPlayingStageActive,
    isPanelOpen,
    isPlayerChromeHidden,
    isFmMode,
    playerState,
    duration,
    currentTime,
    audioRef,
    stageLyricsClockRef,
    setIsDevDebugOverlayVisible,
    setIsPlayerChromeHidden,
    setIsFloatingDockRevealed,
    setIsPanelOpen,
    setReplayGainMode,
    setStatusMsg,
    handleNextTrack,
    handlePrevTrack,
    handleToggleLoopMode,
    pausePlayback,
    resumePlayback,
    volume,
    isMuted,
    handleSetVolume,
    handleToggleMute,
    replayCurrentSong,
    syncStageLyricsClock,
}: UsePlaybackInteractionBridgeParams) {
    const adjustVolumeByKeyboard = useCallback((delta: number) => {
        const { nextVolume, volumeChanged, shouldUnmute } = resolveVolumeStepAdjustment({
            volume,
            isMuted,
            delta,
        });
        if (volumeChanged) {
            handleSetVolume(nextVolume);
        }
        if (shouldUnmute) {
            handleToggleMute();
        }
    }, [handleSetVolume, handleToggleMute, isMuted, volume]);
    const togglePlay = useCallback((event?: React.MouseEvent | KeyboardEvent) => {
        event?.stopPropagation();

        const action = resolvePlayToggleAction({
            isNowPlayingStageActive,
            hasCurrentSong: Boolean(currentSong),
            hasAudioSrc: Boolean(audioSrc),
            canReplayCurrentSong: Boolean(replayCurrentSong),
            activePlaybackContext,
            stageActiveEntryKind,
            playerStateIsPlaying: playerState === PlayerState.PLAYING,
            audioIsActivelyPlaying: Boolean(
                audioRef.current && !audioRef.current.paused && !audioRef.current.ended,
            ),
        });

        trackTelemetry('play.toggle', {
            level: action === 'replay-song' ? 'warn' : 'info',
            data: {
                action,
                hasAudioSrc: Boolean(audioSrc),
                playbackContext: activePlaybackContext,
                stageKind: stageActiveEntryKind,
                songId: currentSong?.id ?? null,
            },
        });
        if (action === 'replay-song') {
            trackTelemetry('audio.src_empty', {
                level: 'warn',
                data: { reason: 'play-toggle-replay', songId: currentSong?.id ?? null },
            });
        }

        switch (action) {
            case 'replay-song':
                // After GPU relaunch / failed restore: rehydrate stream instead of fake lyrics clock.
                replayCurrentSong?.();
                return;
            case 'synthetic-pause':
                pausePlayback();
                return;
            case 'synthetic-resume':
                void resumePlayback();
                return;
            case 'audio-pause':
                pausePlayback();
                return;
            case 'audio-resume':
                void resumePlayback();
                return;
            case 'noop':
            default:
                return;
        }
    }, [activePlaybackContext, audioRef, audioSrc, currentSong, isNowPlayingStageActive, pausePlayback, playerState, replayCurrentSong, resumePlayback, stageActiveEntryKind]);

    const toggleLoop = useCallback((event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (isNowPlayingStageActive) {
            return;
        }

        handleToggleLoopMode();
    }, [handleToggleLoopMode, isNowPlayingStageActive]);

    const handleChangeReplayGainMode = useCallback((mode: ReplayGainMode) => {
        setReplayGainMode(mode);
        setStatusMsg({ type: 'info', text: replayGainModeLabels[mode] });
    }, [setReplayGainMode, setStatusMsg]);

    const handleContainerClick = useCallback(() => {
        if (isPanelOpen) {
            setIsPanelOpen(false);
            return;
        }
        // Immersive fullscreen: click canvas to restore floating dock only.
        // Do not clear chrome-hidden — that would re-show sidebar and feel like exiting fullscreen.
        if (currentView === 'player' && isPlayerChromeHidden) {
            setIsFloatingDockRevealed(true);
        }
    }, [currentView, isPanelOpen, isPlayerChromeHidden, setIsFloatingDockRevealed, setIsPanelOpen]);

    const handleFmTrash = useCallback(async () => {
        if (isNowPlayingStageActive) {
            return;
        }

        if (currentSong && isFmMode) {
            try {
                await neteaseApi.fmTrash(currentSong.id);
            } catch (error) {
                void error;
            }
            void handleNextTrack();
        }
    }, [currentSong, handleNextTrack, isFmMode, isNowPlayingStageActive]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isTextEntryTarget(event.target)) {
                return;
            }

            const hasBlockingWindow = () => hasFoliaKeyboardWindow();

            if (isDev && event.altKey && event.shiftKey && event.code === 'KeyD') {
                event.preventDefault();
                setIsDevDebugOverlayVisible(prev => !prev);
                return;
            }

            switch (event.code) {
                case 'ArrowUp':
                case 'ArrowDown': {
                    // Player view only — home GridView/ArtistGrid own ↑↓ for card navigation.
                    if (currentView !== 'player' || hasBlockingWindow()) return;
                    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                    event.preventDefault();
                    adjustVolumeByKeyboard(event.code === 'ArrowUp' ? KEYBOARD_VOLUME_STEP : -KEYBOARD_VOLUME_STEP);
                    break;
                }
                case 'Space':
                    if (currentSong && (audioSrc || isNowPlayingStageActive || (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics'))) {
                        event.preventDefault();
                        if (isNowPlayingStageActive) {
                            return;
                        }
                        togglePlay(event);
                    }
                    break;
                case 'ArrowLeft':
                    const isPrevTrackKey = isMac 
                        ? (event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey)
                        : (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey);

                    if (isPrevTrackKey) {
                        if (currentSong) {
                            event.preventDefault();
                            if (isNowPlayingStageActive) {
                                return;
                            }
                            handlePrevTrack();
                        }
                        return;
                    }

                    if (currentView !== 'player') return;
                    event.preventDefault();
                    if (isNowPlayingStageActive) {
                        return;
                    }

                    if (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics' && !audioSrc) {
                        const nextTime = Math.max(stageLyricsClockRef.current.startTimeSec, currentTime.get() - 5);
                        syncStageLyricsClock(nextTime, duration, playerState, stageLyricsClockRef.current.startTimeSec);
                        currentTime.set(nextTime);
                    } else if (audioRef.current) {
                        const nextTime = Math.max(0, audioRef.current.currentTime - 5);
                        audioRef.current.currentTime = nextTime;
                    }
                    break;
                case 'ArrowRight':
                    const isNextTrackKey = isMac 
                        ? (event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey)
                        : (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey);

                    if (isNextTrackKey) {
                        if (currentSong) {
                            event.preventDefault();
                            if (isNowPlayingStageActive) {
                                return;
                            }
                            void handleNextTrack();
                        }
                        return;
                    }

                    if (currentView !== 'player') return;
                    event.preventDefault();
                    if (isNowPlayingStageActive) {
                        return;
                    }

                    if (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics' && !audioSrc) {
                        const nextTime = Math.min(duration, currentTime.get() + 5);
                        syncStageLyricsClock(nextTime, duration, playerState, stageLyricsClockRef.current.startTimeSec);
                        currentTime.set(nextTime);
                    } else if (audioRef.current) {
                        const nextTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 5);
                        audioRef.current.currentTime = nextTime;
                    }
                    break;
                case 'KeyH':
                    if (currentView !== 'player' || isPanelOpen || hasBlockingWindow()) return;
                    if (!isModKeyChord({
                        code: event.code,
                        expectedCode: 'KeyH',
                        metaKey: event.metaKey,
                        ctrlKey: event.ctrlKey,
                        altKey: event.altKey,
                        shiftKey: event.shiftKey,
                    })) return;
                    event.preventDefault();
                    setIsPlayerChromeHidden(prev => !prev);
                    break;
                case 'KeyP':
                    if (currentView !== 'player' || hasBlockingWindow()) return;
                    if (!isModKeyChord({
                        code: event.code,
                        expectedCode: 'KeyP',
                        metaKey: event.metaKey,
                        ctrlKey: event.ctrlKey,
                        altKey: event.altKey,
                        shiftKey: event.shiftKey,
                    })) return;
                    event.preventDefault();
                    setIsPanelOpen(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        activePlaybackContext,
        adjustVolumeByKeyboard,
        audioRef,
        audioSrc,
        currentSong,
        currentTime,
        currentView,
        duration,
        handleNextTrack,
        handlePrevTrack,
        isDev,
        isNowPlayingStageActive,
        isPanelOpen,
        pausePlayback,
        playerState,
        resumePlayback,
        setIsDevDebugOverlayVisible,
        setIsPanelOpen,
        setIsPlayerChromeHidden,
        stageActiveEntryKind,
        stageLyricsClockRef,
        syncStageLyricsClock,
        togglePlay,
    ]);

    return {
        togglePlay,
        toggleLoop,
        handleChangeReplayGainMode,
        handleContainerClick,
        handleFmTrash,
    };
}

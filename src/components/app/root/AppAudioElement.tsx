import type { MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import { PlayerState, type SongResult, type StageLoopMode } from '@/types';
import { LOCAL_TAIL_DECODE_ERROR_TOLERANCE_SEC } from '@/components/app/root/appConstants';
import { isLocalPlaybackSong, isNavidromePlaybackSong, isStagePlaybackSong, isYtmPlaybackSong } from '@/utils/appPlaybackGuards';
import {
    resolveHtmlAudioStallTimeoutMs,
    shouldUseAnonymousHtmlAudioCors,
} from '@/utils/playback/rssPodcastPlayback';
import { shouldPreserveAutoPlayOnPause } from '@/utils/audioAutoPlayGuard';
import { resolvePlaybackDurationSec, resolveSongDurationSec } from '@/utils/appPlaybackHelpers';
import { resolveMediaClocksFromAudioElement } from '@/utils/playback/mediaClockIsolationMath';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import { isOnlinePlaybackRecoveryExhausted } from '../playback/createOnlineRecoveryController';
import { shouldRejectPermissionPreviewStream } from '@/utils/playback/onlineSongPlayAccess';

export interface AppAudioElementProps {
    audioRef: RefObject<HTMLAudioElement | null>;
    audioSrc: string | null;
    /** Remount key after Format-error recovery. */
    audioElementEpoch?: number;
    effectiveLoopMode: StageLoopMode;
    shouldAutoPlay: MutableRefObject<boolean>;
    currentTime: MotionValue<number>;
    /** Keep lyrics on the same media clock as dock progress (independent of visualizer RAF). */
    lyricCurrentTime?: MotionValue<number>;
    lyricTimelineOffsetMs?: number;
    setPlayerState: (state: PlayerState) => void;
    setupAudioAnalyzer: () => void;
    playbackAutoSkipCountRef: MutableRefObject<number>;
    currentSong: SongResult | null;
    cacheSongAssets: () => void;
    handleNextTrack: (options?: { allowStopOnMissing?: boolean; shouldNavigateToPlayer?: boolean }) => Promise<void> | void;
    setDuration: (duration: number) => void;
    pendingResumeTimeRef: MutableRefObject<number | null>;
    duration: number;
    recoverOnlinePlaybackSource: (options: { failedSrc: string; resumeAt: number; autoplay: boolean }) => Promise<boolean>;
    playerState: PlayerState;
    skipAfterPlaybackFailure: () => void;
    onBlockedPermissionPreview?: () => void;
}

/**
 * A stalled network connection ("waiting" fires, then nothing) never emits
 * `error`, so onError's recovery path below is never reached — the dock clock
 * just sits still forever. This is the timeout before we force the same
 * online-recovery path onError uses.
 */

export function AppAudioElement(props: AppAudioElementProps) {
    const {
        audioRef,
        audioSrc,
        audioElementEpoch = 0,
        effectiveLoopMode,
        shouldAutoPlay,
        currentTime,
        lyricCurrentTime,
        lyricTimelineOffsetMs = 0,
        setPlayerState,
        setupAudioAnalyzer,
        playbackAutoSkipCountRef,
        currentSong,
        cacheSongAssets,
        handleNextTrack,
        setDuration,
        pendingResumeTimeRef,
        duration,
        recoverOnlinePlaybackSource,
        playerState,
        skipAfterPlaybackFailure,
        onBlockedPermissionPreview,
    } = props;
    const globalLyricTimelineOffsetMs = useSettingsUiStore(state => state.globalLyricTimelineOffsetMs);

    // Stall watchdog: recover a hung online stream even though it never fires `error`.
    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement || !audioSrc) return undefined;

        let stallTimer: ReturnType<typeof setTimeout> | null = null;

        const clearStallTimer = () => {
            if (stallTimer !== null) {
                clearTimeout(stallTimer);
                stallTimer = null;
            }
        };

        const onWaiting = () => {
            // Only arm once per stall episode — repeated `stalled` events while
            // already waiting must not keep pushing the deadline back.
            if (stallTimer !== null) return;

            const failedSrc = audioElement.currentSrc || audioSrc;
            const shouldRecover = Boolean(
                currentSong &&
                !isLocalPlaybackSong(currentSong) &&
                !isNavidromePlaybackSong(currentSong) &&
                !isStagePlaybackSong(currentSong) &&
                failedSrc &&
                !failedSrc.startsWith('blob:')
            );
            if (!shouldRecover) return;

            const stallTimeoutMs = resolveHtmlAudioStallTimeoutMs(currentSong);
            stallTimer = setTimeout(() => {
                stallTimer = null;
                if (audioElement.paused || audioElement.ended) return;

                if (isOnlinePlaybackRecoveryExhausted(currentSong?.id)) {
                    skipAfterPlaybackFailure();
                    return;
                }

                console.warn('[Audio] stall watchdog: no progress after', stallTimeoutMs, 'ms — reconnecting', { failedSrc });
                void (async () => {
                    const recovered = await recoverOnlinePlaybackSource({
                        failedSrc,
                        resumeAt: audioElement.currentTime,
                        autoplay: true,
                    });
                    if (!recovered) {
                        skipAfterPlaybackFailure();
                    }
                })();
            }, stallTimeoutMs);
        };

        audioElement.addEventListener('waiting', onWaiting);
        audioElement.addEventListener('playing', clearStallTimer);
        audioElement.addEventListener('timeupdate', clearStallTimer);
        audioElement.addEventListener('pause', clearStallTimer);
        return () => {
            clearStallTimer();
            audioElement.removeEventListener('waiting', onWaiting);
            audioElement.removeEventListener('playing', clearStallTimer);
            audioElement.removeEventListener('timeupdate', clearStallTimer);
            audioElement.removeEventListener('pause', clearStallTimer);
        };
    }, [audioElementEpoch, audioRef, audioSrc, currentSong, recoverOnlinePlaybackSource, skipAfterPlaybackFailure]);

    const useAnonymousCors = shouldUseAnonymousHtmlAudioCors(currentSong, {
        isElectronRenderer: typeof window !== 'undefined' && Boolean(window.electron),
    });

    return (
<audio
            key={`${audioElementEpoch}-${useAnonymousCors ? 'cors' : 'direct'}`}
            ref={audioRef}
            src={audioSrc || undefined}
            preload="auto"
            crossOrigin={useAnonymousCors ? 'anonymous' : undefined}
            loop={effectiveLoopMode === 'one'}
            onPlay={(e) => {
                // Muted unlock priming must not clear pending autoplay for the next src.
                if (!e.currentTarget.muted) {
                    shouldAutoPlay.current = false;
                }
                currentTime.set(e.currentTarget.currentTime);
                setPlayerState(PlayerState.PLAYING);
            }}
            onPlaying={(e) => {
                if (!e.currentTarget.muted) {
                    shouldAutoPlay.current = false;
                }
                currentTime.set(e.currentTarget.currentTime);
                setupAudioAnalyzer();
                playbackAutoSkipCountRef.current = 0;
                setPlayerState(PlayerState.PLAYING);
            }}
            onPause={(e) => {
                const audioElement = e.currentTarget;
                // Src swaps fire pause with the old currentSrc still attached.
                // Never wipe armed autoplay here — pausePlayback clears it first.
                // Also skip flipping UI to PAUSED while autoplay is still pending,
                // or the dock shows a play button before canplay retries.
                if (shouldPreserveAutoPlayOnPause(shouldAutoPlay.current)) {
                    return;
                }
                shouldAutoPlay.current = false;
                if (!audioElement.ended) {
                    setPlayerState(PlayerState.PAUSED);
                }
            }}
            onTimeUpdate={(e) => {
                const audioElement = e.currentTarget;
                if (!audioElement.paused && !audioElement.ended) {
                    // Media-layer clocks: independent of visualizer RAF / WebGL.
                    const { currentTimeSec, lyricTimeSec } = resolveMediaClocksFromAudioElement({
                        audioCurrentTimeSec: audioElement.currentTime,
                        lyricTimelineOffsetMs,
                        globalLyricTimelineOffsetMs,
                    });
                    currentTime.set(currentTimeSec);
                    lyricCurrentTime?.set(lyricTimeSec);
                    if (playerState !== PlayerState.PLAYING) {
                        setPlayerState(PlayerState.PLAYING);
                    }
                }
            }}
            onSeeked={(e) => {
                const { currentTimeSec, lyricTimeSec } = resolveMediaClocksFromAudioElement({
                    audioCurrentTimeSec: e.currentTarget.currentTime,
                    lyricTimelineOffsetMs,
                    globalLyricTimelineOffsetMs,
                });
                currentTime.set(currentTimeSec);
                lyricCurrentTime?.set(lyricTimeSec);
            }}
            // Buffer progress debug helper. Uncomment to inspect how much of
            // the current source the browser has actually buffered.
            // onProgress={(e) => {
            //     const audioElement = e.currentTarget;
            //     const buffered = audioElement.buffered;
            //     const source = audioElement.currentSrc || audioSrc;
            //     if (!source || buffered.length === 0 || !Number.isFinite(audioElement.duration) || audioElement.duration <= 0) {
            //         return;
            //     }
            //
            //     const bufferedEnd = buffered.end(buffered.length - 1);
            //     const bufferedPercent = Math.max(
            //         0,
            //         Math.min(100, Math.round((bufferedEnd / audioElement.duration) * 100))
            //     );
            //     if (lastBufferedPercentLogRef.current !== bufferedPercent) {
            //         lastBufferedPercentLogRef.current = bufferedPercent;
            //         console.log('[Audio] buffered percent', {
            //             src: source,
            //             currentTime: audioElement.currentTime,
            //             bufferedEnd,
            //             duration: audioElement.duration,
            //             bufferedPercent,
            //         });
            //     }
            // }}
            onEnded={(e) => {
                // YTM proxy can emit premature ended when a range stalls; recover instead of skipping.
                if (isYtmPlaybackSong(currentSong) && audioSrc) {
                    const songDurationSec = resolveSongDurationSec(currentSong);
                    const endedAt = e.currentTarget.currentTime;
                    if (songDurationSec > 8 && endedAt < songDurationSec - 2.5) {
                        console.warn('[Audio] premature YTM ended — recovering', {
                            endedAt,
                            songDurationSec,
                        });
                        void (async () => {
                            const recovered = await recoverOnlinePlaybackSource({
                                failedSrc: audioSrc,
                                resumeAt: Math.max(0, endedAt - 0.25),
                                autoplay: true,
                            });
                            if (!recovered) {
                                skipAfterPlaybackFailure();
                            }
                        })();
                        return;
                    }
                }

                // Cache if playing fully
                if (audioSrc && !audioSrc.startsWith('blob:') && currentSong && !isStagePlaybackSong(currentSong)) {
                    cacheSongAssets();
                }

                // If single loop is active, native loop handles it.
                // If not, we handle queue logic.
                if (effectiveLoopMode !== 'one') {
                    void handleNextTrack({ allowStopOnMissing: true, shouldNavigateToPlayer: false });
                }
            }}
            onLoadedMetadata={(e) => {
                const audioElement = e.currentTarget;
                if (shouldRejectPermissionPreviewStream(currentSong, audioElement.duration)) {
                    audioElement.pause();
                    shouldAutoPlay.current = false;
                    pendingResumeTimeRef.current = null;
                    onBlockedPermissionPreview?.();
                    skipAfterPlaybackFailure();
                    return;
                }

                const nextDuration = resolvePlaybackDurationSec(
                    audioElement.duration,
                    resolveSongDurationSec(currentSong),
                );
                if (nextDuration > 0) {
                    setDuration(nextDuration);
                }

                const pendingResumeTime = pendingResumeTimeRef.current;
                if (pendingResumeTime !== null) {
                    const safeDuration = nextDuration > 0
                        ? Math.max(nextDuration - 0.25, 0)
                        : pendingResumeTime;
                    const nextTime = Math.min(pendingResumeTime, safeDuration);
                    audioElement.currentTime = nextTime;
                    currentTime.set(nextTime);
                    pendingResumeTimeRef.current = null;
                    return;
                }

                // Don't yank the dock clock backward if playback already advanced.
                if (audioElement.currentTime < 0.25) {
                    currentTime.set(audioElement.currentTime);
                }
            }}
            onDurationChange={(e) => {
                const nextDuration = resolvePlaybackDurationSec(
                    e.currentTarget.duration,
                    resolveSongDurationSec(currentSong),
                );
                if (nextDuration > 0) {
                    setDuration(nextDuration);
                }
            }}
            onError={(e) => {
                if (!audioSrc) {
                    return;
                }

                const audioElement = e.currentTarget;
                const reportedDuration = Number.isFinite(audioElement.duration) && audioElement.duration > 0
                    ? audioElement.duration
                    : duration;
                const isLocalTailDecodeError = Boolean(
                    isLocalPlaybackSong(currentSong) &&
                    Number.isFinite(reportedDuration) &&
                    reportedDuration > 0 &&
                    audioElement.currentTime > 0 &&
                    reportedDuration - audioElement.currentTime <= LOCAL_TAIL_DECODE_ERROR_TOLERANCE_SEC
                );

                if (isLocalTailDecodeError) {
                    currentTime.set(Math.max(audioElement.currentTime, reportedDuration));
                    setPlayerState(PlayerState.IDLE);

                    if (effectiveLoopMode === 'one') {
                        audioElement.currentTime = 0;
                        audioElement.load();
                        const replayPromise = audioElement.play();
                        if (replayPromise !== undefined) {
                            replayPromise.catch(() => {
                                setPlayerState(PlayerState.PAUSED);
                            });
                        }
                        return;
                    }

                    void handleNextTrack({ allowStopOnMissing: true, shouldNavigateToPlayer: false });
                    return;
                }

                const failedSrc = e.currentTarget.currentSrc || audioSrc;
                const shouldRetryOnlineSong = Boolean(
                    currentSong &&
                    !isLocalPlaybackSong(currentSong) &&
                    !isNavidromePlaybackSong(currentSong) &&
                    !isStagePlaybackSong(currentSong) &&
                    failedSrc &&
                    !failedSrc.startsWith('blob:')
                );

                if (shouldRetryOnlineSong) {
                    if (isOnlinePlaybackRecoveryExhausted(currentSong?.id)) {
                        shouldAutoPlay.current = false;
                        pendingResumeTimeRef.current = null;
                        skipAfterPlaybackFailure();
                        return;
                    }
                    void (async () => {
                        const recovered = await recoverOnlinePlaybackSource({
                            failedSrc,
                            resumeAt: e.currentTarget.currentTime,
                            autoplay: (!e.currentTarget.paused && !e.currentTarget.ended) || playerState === PlayerState.PLAYING || shouldAutoPlay.current,
                        });

                        if (!recovered) {
                            skipAfterPlaybackFailure();
                        }
                    })();
                    return;
                }

                skipAfterPlaybackFailure();
            }}
        />

    );
}

import type { MotionValue } from 'framer-motion';
import type { MutableRefObject, RefObject } from 'react';
import { PlayerState, type SongResult, type StageLoopMode } from '@/types';
import { LOCAL_TAIL_DECODE_ERROR_TOLERANCE_SEC } from '@/components/app/root/appConstants';
import { isLocalPlaybackSong, isNavidromePlaybackSong, isStagePlaybackSong } from '@/utils/appPlaybackGuards';
import { shouldPreserveAutoPlayOnPause } from '@/utils/audioAutoPlayGuard';

export interface AppAudioElementProps {
    audioRef: RefObject<HTMLAudioElement | null>;
    audioSrc: string | null;
    effectiveLoopMode: StageLoopMode;
    shouldAutoPlay: MutableRefObject<boolean>;
    currentTime: MotionValue<number>;
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
}

export function AppAudioElement(props: AppAudioElementProps) {
    const {
        audioRef,
        audioSrc,
        effectiveLoopMode,
        shouldAutoPlay,
        currentTime,
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
    } = props;

    return (
<audio
            ref={audioRef}
            src={audioSrc || undefined}
            preload="auto"
            crossOrigin="anonymous"
            loop={effectiveLoopMode === 'one'}
            onPlay={(e) => {
                shouldAutoPlay.current = false;
                currentTime.set(e.currentTarget.currentTime);
                setPlayerState(PlayerState.PLAYING);
            }}
            onPlaying={(e) => {
                shouldAutoPlay.current = false;
                currentTime.set(e.currentTarget.currentTime);
                setupAudioAnalyzer();
                playbackAutoSkipCountRef.current = 0;
                setPlayerState(PlayerState.PLAYING);
            }}
            onPause={(e) => {
                const audioElement = e.currentTarget;
                // Clearing or swapping `src` pauses the element. Keep autoplay intent so the
                // next source can still start after an async URL fetch.
                if (shouldPreserveAutoPlayOnPause(
                    shouldAutoPlay.current,
                    audioElement.currentSrc,
                    audioElement.readyState,
                )) {
                    if (!audioElement.ended) {
                        setPlayerState(PlayerState.PAUSED);
                    }
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
                    currentTime.set(audioElement.currentTime);
                    setPlayerState(PlayerState.PLAYING);
                }
            }}
            onSeeked={(e) => {
                currentTime.set(e.currentTarget.currentTime);
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
            onEnded={() => {
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
                setDuration(audioElement.duration);

                const pendingResumeTime = pendingResumeTimeRef.current;
                if (pendingResumeTime !== null) {
                    const safeDuration = Number.isFinite(audioElement.duration) && audioElement.duration > 0
                        ? Math.max(audioElement.duration - 0.25, 0)
                        : pendingResumeTime;
                    const nextTime = Math.min(pendingResumeTime, safeDuration);
                    audioElement.currentTime = nextTime;
                    currentTime.set(nextTime);
                    pendingResumeTimeRef.current = null;
                    return;
                }

                currentTime.set(0); // Ensure currentTime is reset when new audio loads
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

import { useEffect, useMemo, useRef } from 'react';
import { getAtmosphereSongKey, useAtmosphereEngine } from '@/hooks/useAtmosphereEngine';
import { useMoodEngineSongSync } from '@/hooks/atmosphere/useMoodEngineSongSync';
import { useElectronPlaybackBridge } from '@/hooks/useElectronPlaybackBridge';
import { useElectronVideoExportController } from '@/hooks/useElectronVideoExportController';
import { useMediaSessionBridge } from '@/hooks/useMediaSessionBridge';
import { useNavidromeScrobbleReporter } from '@/hooks/useNavidromeScrobbleReporter';
import { usePlaybackAudioBridge } from '@/hooks/usePlaybackAudioBridge';
import { usePlaybackInteractionBridge } from '@/hooks/usePlaybackInteractionBridge';
import { usePlaybackTransportController } from '@/hooks/usePlaybackTransportController';
import { usePlaybackVisualizerBridge } from '@/hooks/usePlaybackVisualizerBridge';
import { PlayerState } from '@/types';
import { isLocalPlaybackSong, isNavidromePlaybackSong, resolveNavidromePlaybackCarrier } from '@/utils/appPlaybackGuards';
import { resolveAtmosphereTrackHints } from '@/utils/atmosphere/resolveAtmosphereTrackHints';
import { isVideoPlaybackStageActive } from '@/utils/playback/resolveVideoPlaybackStage';
import type { AppControllerCoreResult, AppControllerLibraryResult } from './useAppController.types';

export function useAppControllerPlaybackBridges(core: AppControllerCoreResult & AppControllerLibraryResult) {
    const {
        activePlaybackContext,
        analyserRef,
        animationFrameRef,
        audioBands,
        audioContextRef,
        audioPower,
        audioRef,
        audioElementEpoch,
        audioSrc,
        cachedCoverUrl,
        coverUrl,
        currentSong,
        currentTime,
        currentView,
        duration,
        effectiveLoopMode,
        enableMediaCache,
        enableSmartAtmosphere,
        enableBilibiliVideoBackground,
        gainNodeRef,
        getCoverUrl,
        getNowPlayingDisplayTime,
        getSyntheticStageLyricsTime,
        getTargetPlaybackVolume,
        handleLike,
        handleNextTrack,
        handlePrevTrack,
        handleSetVolume,
        handleToggleMute,
        handleStageExternalPlayRequest,
        handleToggleLoopMode,
        isDaylight,
        isDev,
        isElectronWindow,
        isFmMode,
        isLocalSongLiked,
        isLyricsLoading,
        isAudioSourceLoadingRef,
        isMainWindowClickThroughEnabled,
        isNowPlayingControlDisabledRef,
        isNowPlayingStageActive,
        isPanelOpen,
        isPlayerChromeHidden,
        setIsFloatingDockRevealed,
        likedSongIds,
        lyricCurrentTime,
        lyricTimelineOffsetMs,
        lyrics,
        navigateToPlayer,
        panelTab,
        playQueue,
        playSong,
        playerState,
        recoverOnlinePlaybackSource,
        replayGainLinearRef,
        replayGainMode,
        setCurrentLineIndex,
        setIsDevDebugOverlayVisible,
        setIsPanelOpen,
        setIsPlayerChromeHidden,
        setIsTitlebarRevealed,
        setPlayerState,
        setReplayGainMode,
        setShowTransparentWindowBorder,
        setStatusMsg,
        shouldAutoPlay,
        shouldRefreshCurrentOnlineAudioSource,
        showTransparentWindowBorder,
        sourceRef,
        stageActiveEntryKind,
        stageLyricsClockRef,
        stageLyricsSession,
        stageStatus,
        starredNavidromeSongIds,
        staticMode,
        syncNowPlayingClock,
        syncOutputGain,
        rampOutputGain,
        syncStageLyricsClock,
        t,
        transparentPlayerBackground,
        updateCacheSize,
        videoRef,
        videoSrc,
        volume,
        isMuted,
    } = core;

    const { setupAudioAnalyzer, cacheSongAssets } = usePlaybackAudioBridge({
        audioRef,
        audioSrc,
        audioElementEpoch,
        currentSong,
        isLyricsLoading,
        enableMediaCache,
        isPanelOpen,
        panelTab,
        replayGainMode,
        shouldAutoPlayRef: shouldAutoPlay,
        audioContextRef,
        analyserRef,
        gainNodeRef,
        replayGainLinearRef,
        sourceRef,
        setPlayerState,
        setStatusMsg,
        syncOutputGain,
        getTargetPlaybackVolume,
        getCoverUrl,
        updateCacheSize,
        t: key => t(key),
    });

    const { resumePlayback, pausePlayback } = usePlaybackTransportController({
        activePlaybackContext,
        stageActiveEntryKind,
        isNowPlayingStageActive,
        currentSongId: currentSong?.id ?? null,
        audioSrc,
        duration,
        audioRef,
        audioContextRef,
        shouldAutoPlayRef: shouldAutoPlay,
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
        t: key => t(key),
    });

    useNavidromeScrobbleReporter({
        audioRef,
        currentSong,
    });

    const mediaSessionPlayRef = useRef(resumePlayback);
    const mediaSessionPauseRef = useRef(pausePlayback);
    const mediaSessionPrevRef = useRef(handlePrevTrack);
    const mediaSessionNextRef = useRef(handleNextTrack);
    const taskbarHasTrackRef = useRef(Boolean(currentSong));
    const taskbarPlayerStateRef = useRef(playerState);

    useEffect(() => {
        mediaSessionPlayRef.current = resumePlayback;
    }, [resumePlayback]);

    useEffect(() => {
        mediaSessionPauseRef.current = pausePlayback;
    }, [pausePlayback]);

    useEffect(() => {
        mediaSessionPrevRef.current = handlePrevTrack;
    }, [handlePrevTrack]);

    useEffect(() => {
        mediaSessionNextRef.current = handleNextTrack;
    }, [handleNextTrack]);

    useEffect(() => {
        taskbarHasTrackRef.current = Boolean(currentSong);
    }, [currentSong]);

    useEffect(() => {
        taskbarPlayerStateRef.current = playerState;
    }, [playerState]);

    useMediaSessionBridge({
        audioRef,
        currentSong,
        cachedCoverUrl,
        playerState,
        isNowPlayingStageActive,
        t: (key) => t(key),
        mediaSessionPlayRef,
        mediaSessionPauseRef,
        mediaSessionPrevRef,
        mediaSessionNextRef,
        isNowPlayingControlDisabledRef,
    });

    const {
        exportState,
        handleExportCommand,
        startVideoExport,
    } = useElectronVideoExportController({
        isElectronWindow,
        audioRef,
        videoRef,
        videoSrc,
        currentTime,
        duration,
        currentSong,
        setIsPlayerChromeHidden,
        setIsPanelOpen,
        navigateToPlayer,
        pausePlayback,
        resumePlayback,
    });

    const {
        publishStagePlayerPlaybackUpdate,
    } = useElectronPlaybackBridge({
        isElectronWindow,
        setIsTitlebarRevealed,
        isPlayerChromeHidden,
        setIsPlayerChromeHidden,
        showTransparentWindowBorder,
        setShowTransparentWindowBorder,
        transparentPlayerBackground,
        activePlaybackContext,
        isStagePlayerSnapshotEnabled: stageStatus?.enabled === true,
        mainWindowClickThroughEnabled: isMainWindowClickThroughEnabled,
        isNowPlayingControlDisabledRef,
        audioRef,
        audioSrc,
        currentTime,
        duration,
        currentSong,
        coverUrl,
        cachedCoverUrl,
        playerState,
        playQueue,
        effectiveLoopMode,
        isFmMode,
        isNowPlayingStageActive,
        mediaSessionPlayRef,
        mediaSessionPauseRef,
        mediaSessionPrevRef,
        mediaSessionNextRef,
        getSyntheticStageLyricsTime,
        syncStageLyricsClock,
        taskbarHasTrackRef,
        taskbarPlayerStateRef,
        exportState,
        isDaylight,
        lyrics,
        lyricTimelineOffsetMs,
        onRemoteExportCommand: handleExportCommand,
        onExternalPlayRequest: handleStageExternalPlayRequest,
        isLiked: (() => {
            if (!currentSong) return false;
            if (isLocalPlaybackSong(currentSong)) {
                return isLocalSongLiked(currentSong);
            }
            if (isNavidromePlaybackSong(currentSong)) {
                const navidromeSong = resolveNavidromePlaybackCarrier(currentSong);
                return navidromeSong ? starredNavidromeSongIds.has(navidromeSong.navidromeData.id) : false;
            }
            return likedSongIds.has(currentSong.id);
        })(),
        onLike: handleLike,
    });

    const atmosphereSongKey = getAtmosphereSongKey(currentSong?.id ?? null, audioSrc);
    const atmosphereTrackHints = useMemo(
        () => resolveAtmosphereTrackHints(currentSong),
        [currentSong],
    );
    // Dual decode (DASH video + audio) is already heavy; pause atmosphere RAF while video stage is up.
    const videoStageActive = isVideoPlaybackStageActive(currentView, videoSrc)
        && enableBilibiliVideoBackground;
    const atmosphereEngine = useAtmosphereEngine({
        enabled: enableSmartAtmosphere && !staticMode && !videoStageActive,
        isPlaying: playerState === PlayerState.PLAYING,
        audioSrc,
        songKey: atmosphereSongKey,
        audioContextRef,
        durationSec: duration,
        contentType: atmosphereTrackHints.contentType,
        precomputedBeatMap: atmosphereTrackHints.precomputedBeatMap,
    });

    useMoodEngineSongSync(currentSong);

    usePlaybackVisualizerBridge({
        audioRef,
        analyserRef,
        animationFrameRef,
        activePlaybackContext,
        audioSrc,
        audioElementEpoch,
        audioPower,
        audioBands,
        currentTime,
        lyrics,
        playerState,
        duration,
        effectiveLoopMode,
        isNowPlayingStageActive,
        stageActiveEntryKind,
        stageLyricsSession,
        stageLyricsClockRef,
        setCurrentLineIndex,
        setPlayerState,
        getSyntheticStageLyricsTime,
        syncStageLyricsClock,
        getNowPlayingDisplayTime,
        syncNowPlayingClock,
        lyricTimelineOffsetMs,
        lyricCurrentTime,
        isAudioSourceLoadingRef,
        onAtmosphereTick: atmosphereEngine.tick,
    });

    const {
        togglePlay,
        toggleLoop,
        handleChangeReplayGainMode,
        handleContainerClick,
        handleFmTrash,
    } = usePlaybackInteractionBridge({
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
        replayCurrentSong: () => {
            if (!currentSong) return;
            void playSong(currentSong, playQueue.length > 0 ? playQueue : [currentSong], isFmMode, {
                shouldNavigateToPlayer: false,
            });
        },
        syncStageLyricsClock,
    });

    return {
        atmosphereEngine,
        atmosphereSongKey,
        atmosphereTrackHints,
        cacheSongAssets,
        exportState,
        handleChangeReplayGainMode,
        handleContainerClick,
        handleFmTrash,
        mediaSessionNextRef,
        mediaSessionPauseRef,
        mediaSessionPlayRef,
        mediaSessionPrevRef,
        pausePlayback,
        publishStagePlayerPlaybackUpdate,
        resumePlayback,
        setupAudioAnalyzer,
        startVideoExport,
        taskbarHasTrackRef,
        taskbarPlayerStateRef,
        toggleLoop,
        togglePlay,
    };
}

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
import { isLocalPlaybackSong, isNavidromePlaybackSong, resolveNavidromePlaybackCarrier } from '@/utils/appPlaybackGuards';
import { resolveAtmosphereTrackHints } from '@/utils/atmosphere/resolveAtmosphereTrackHints';
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
        gainNodeRef,
        getCoverUrl,
        getNowPlayingDisplayTime,
        getSyntheticStageLyricsTime,
        getTargetPlaybackVolume,
        handleLike,
        handleNextTrack,
        handlePrevTrack,
        handleStageExternalPlayRequest,
        handleToggleLoopMode,
        isDaylight,
        isDev,
        isElectronWindow,
        isFmMode,
        isLocalSongLiked,
        isLyricsLoading,
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
        syncStageLyricsClock,
        t,
        transparentPlayerBackground,
        updateCacheSize,
        videoSrc,
    } = core;

    const { setupAudioAnalyzer, cacheSongAssets } = usePlaybackAudioBridge({
        audioRef,
        audioSrc,
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
    } = useElectronVideoExportController({
        isElectronWindow,
        audioRef,
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
    const bilibiliVideoActive = Boolean(
        currentView === 'player'
        && currentSong?.musicProvider === 'bilibili'
        && videoSrc,
    );
    const atmosphereEngine = useAtmosphereEngine({
        enabled: enableSmartAtmosphere && !staticMode && !bilibiliVideoActive,
        audioSrc,
        songKey: atmosphereSongKey,
        audioContextRef,
        durationSec: duration,
        contentType: atmosphereTrackHints.contentType,
        precomputedBeatMap: atmosphereTrackHints.precomputedBeatMap,
    });

    useMoodEngineSongSync(typeof currentSong?.id === 'number' ? currentSong.id : null);

    usePlaybackVisualizerBridge({
        audioRef,
        analyserRef,
        animationFrameRef,
        activePlaybackContext,
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
        syncStageLyricsClock,
    });

    return {
        atmosphereEngine,
        atmosphereSongKey,
        atmosphereTrackHints,
        cacheSongAssets,
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
        taskbarHasTrackRef,
        taskbarPlayerStateRef,
        toggleLoop,
        togglePlay,
    };
}

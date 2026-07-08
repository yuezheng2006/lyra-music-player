import { useCallback, useMemo } from 'react';
import { buildDebugSnapshot } from '@/components/app/presentation/buildDebugSnapshot';
import { createGridNavigationHandlers } from '@/components/app/navigation/createGridNavigationHandlers';
import { DEFAULT_THEME, DAYLIGHT_THEME, DEV_DEBUG_SHORTCUT_LABEL } from '@/components/app/root/appConstants';
import { useCommandPalette } from '@/components/command-palette/useCommandPalette';
import { useSongThemeAutoGeneration } from '@/hooks/useSongThemeAutoGeneration';
import { FALLBACK_AI_DUAL_THEME } from '@/services/themeSanitizer';
import { PlayerState } from '@/types';
import { isLocalPlaybackSong, isNavidromePlaybackSong } from '@/utils/appPlaybackGuards';
import type {
    AppControllerCoreResult,
    AppControllerLibraryResult,
    AppControllerPlaybackBridgesResult,
    AppControllerPresentationShellResult,
} from './useAppController.types';

export function useAppControllerCommandLayer(
    core: AppControllerCoreResult
        & AppControllerLibraryResult
        & AppControllerPlaybackBridgesResult
        & AppControllerPresentationShellResult,
) {
    const {
        activePlaybackContext,
        aiTheme,
        audioRef,
        audioSrc,
        bgMode,
        canOpenThemeQuickEditor,
        coverUrl,
        currentLineIndex,
        currentSong,
        currentTime,
        currentView,
        customTheme,
        desktopLyricsStatus,
        duration,
        enableAlternativeLyricSources,
        enablePlayerPageNativeBlur,
        generateAITheme,
        getThemeParkSeedTheme,
        handleAutoMatchBestLyricForCurrentSong,
        handleNextTrack,
        handlePrevTrack,
        handleSetAppLanguagePreference,
        handleSetMonetBackgroundTuning,
        handleSetVisualizerBackgroundMode,
        handleSetVisualizerMode,
        handleToggleAlternativeLyricSources,
        handleToggleDaylight,
        handleToggleHidePlayerTranslationSubtitle,
        handleToggleShowSubtitleTranslation,
        hidePlayerTranslationSubtitle,
        homeLayoutStyle,
        isDaylight,
        isDev,
        isGeneratingTheme,
        isLyricsLoading,
        isNowPlayingControlDisabled,
        isNowPlayingStageActive,
        isSearchOpen,
        isSettingsModalOpen,
        localSongs,
        lyricCurrentTime,
        lyrics,
        navigateDirectHome,
        navigateToHome,
        navigateToNeteaseAlbum,
        navigateToNeteaseArtist,
        navigateToPlayer,
        navigateToSearch,
        nowPlayingConnectionStatus,
        nowPlayingDebugInfo,
        nowPlayingLyricPayload,
        nowPlayingPaused,
        nowPlayingProgressMs,
        nowPlayingProgressQuality,
        nowPlayingTrack,
        openSettings,
        openThemeQuickEditor,
        pendingUnavailableReplacement,
        playQueue,
        playSong,
        playerState,
        publishStagePlayerPlaybackUpdate,
        searchSourceTab,
        setActiveGridViewCollection,
        setDesktopLyricsLocked,
        setHomeViewTab,
        setIsPanelOpen,
        setIsUserGuideModalOpen,
        setPanelTab,
        setPlayerState,
        showLyricMatchModal,
        showNaviLyricMatchModal,
        showOnlineLyricMatchModal,
        showSubtitleTranslation,
        shuffleQueue,
        songThemeAutoGenerateEnabled,
        songThemeAutoSwitchEnabled,
        stageActiveEntryKind,
        stageLyricsClockRef,
        stageSource,
        submitSearch,
        syncStageLyricsClock,
        t,
        toggleDesktopLyrics,
        toggleLoop,
        togglePlay,
        toggleTransparentModeWithHandoff,
        transparentPlayerBackground,
        visualizerMode,
    } = core;

    const canGenerateAITheme = Boolean((lyrics?.lines.length ?? 0) > 0 || currentSong?.isPureMusic);
    const generateCurrentSongTheme = useCallback(() => {
        void generateAITheme(lyrics, currentSong);
    }, [currentSong, generateAITheme, lyrics]);

    const toggleDaylightMode = useCallback(() => {
        handleToggleDaylight(!isDaylight);
    }, [handleToggleDaylight, isDaylight]);

    const currentSearchSourceTabInPalette = useMemo(() => {
        if (currentSong) {
            if (isLocalPlaybackSong(currentSong)) {
                return 'local';
            }
            if (isNavidromePlaybackSong(currentSong)) {
                return 'navidrome';
            }
            return 'playlist';
        }
        return searchSourceTab;
    }, [currentSong, searchSourceTab]);

    const toggleBrowserFullscreen = useCallback(async () => {
        if (typeof window !== 'undefined' && window.electron?.toggleFullscreenWindow) {
            return window.electron.toggleFullscreenWindow();
        }

        if (typeof document === 'undefined') {
            return false;
        }

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return true;
            }

            await document.documentElement.requestFullscreen();
            return true;
        } catch (error) {
            console.warn('[CommandPalette] Failed to toggle browser fullscreen:', error);
            return false;
        }
    }, []);

    const commandPaletteContext = useMemo(() => ({
        currentSearchSourceTab: currentSearchSourceTabInPalette,
        localSongs,
        playerState,
        t: (key: string, fallback?: string) => t(key, fallback ?? ''),
        openSettings,
        navigateToHome,
        navigateToPlayer,
        navigateToSearch,
        toggleBrowserFullscreen,
        setHomeViewTab,
        setPanelTab,
        setIsPanelOpen,
        submitSearch,
        togglePlay,
        toggleLoop,
        handleNextTrack,
        handlePrevTrack,
        shuffleQueue,
        playQueue,
        playSong,
        canGenerateAITheme,
        isGeneratingTheme,
        generateAITheme: generateCurrentSongTheme,
        setVisualizerMode: handleSetVisualizerMode,
        setVisualizerBackgroundMode: handleSetVisualizerBackgroundMode,
        setMonetBackgroundTuning: handleSetMonetBackgroundTuning,
        toggleTransparentBackground: () => {
            void toggleTransparentModeWithHandoff(!transparentPlayerBackground);
        },
        transparentPlayerBackground,
        hideBottomSubtitleOverlay: hidePlayerTranslationSubtitle,
        toggleBottomSubtitleOverlay: () => {
            handleToggleHidePlayerTranslationSubtitle(!hidePlayerTranslationSubtitle);
        },
        showSubtitleTranslation,
        toggleSubtitleTranslation: () => {
            handleToggleShowSubtitleTranslation(!showSubtitleTranslation);
        },
        enablePlayerPageNativeBlur,
        toggleDaylightMode,
        setAppLanguagePreference: handleSetAppLanguagePreference,
        enableAlternativeLyricSources,
        runAutoMatchBestLyric: handleAutoMatchBestLyricForCurrentSong,
        setIsUserGuideModalOpen,
        openThemeQuickEditor,
        canOpenThemeQuickEditor,
        toggleDesktopLyrics: () => toggleDesktopLyrics(),
        setDesktopLyricsLocked: (locked: boolean) => setDesktopLyricsLocked(locked),
        desktopLyricsEnabled: desktopLyricsStatus.enabled,
        desktopLyricsLocked: desktopLyricsStatus.locked,
    }), [
        canGenerateAITheme,
        canOpenThemeQuickEditor,
        currentSearchSourceTabInPalette,
        desktopLyricsStatus.enabled,
        desktopLyricsStatus.locked,
        enableAlternativeLyricSources,
        enablePlayerPageNativeBlur,
        generateCurrentSongTheme,
        handleAutoMatchBestLyricForCurrentSong,
        handleNextTrack,
        handlePrevTrack,
        handleSetAppLanguagePreference,
        handleSetMonetBackgroundTuning,
        handleSetVisualizerBackgroundMode,
        handleSetVisualizerMode,
        handleToggleHidePlayerTranslationSubtitle,
        handleToggleShowSubtitleTranslation,
        hidePlayerTranslationSubtitle,
        isGeneratingTheme,
        localSongs,
        navigateToHome,
        navigateToPlayer,
        navigateToSearch,
        openSettings,
        openThemeQuickEditor,
        playQueue,
        playSong,
        playerState,
        setDesktopLyricsLocked,
        setHomeViewTab,
        setIsPanelOpen,
        setIsUserGuideModalOpen,
        setPanelTab,
        showSubtitleTranslation,
        shuffleQueue,
        submitSearch,
        t,
        toggleBrowserFullscreen,
        toggleDaylightMode,
        toggleDesktopLyrics,
        toggleLoop,
        togglePlay,
        toggleTransparentModeWithHandoff,
        transparentPlayerBackground,
    ]);

    const commandPalette = useCommandPalette({
        currentView,
        isBlocked: isSettingsModalOpen
            || (currentView === 'home' && isSearchOpen)
            || showLyricMatchModal
            || showNaviLyricMatchModal
            || showOnlineLyricMatchModal
            || Boolean(pendingUnavailableReplacement),
        context: commandPaletteContext,
    });

    const nowPlayingDebugSnapshot = useMemo(() => (
        stageSource === 'now-playing'
            ? {
                connectionStatus: nowPlayingConnectionStatus,
                isActive: isNowPlayingStageActive,
                paused: nowPlayingPaused,
                progressMs: nowPlayingProgressMs,
                progressQuality: nowPlayingProgressQuality,
                trackTitle: nowPlayingTrack?.title ?? nowPlayingLyricPayload?.title ?? null,
                durationSec: (nowPlayingTrack?.durationMs ?? nowPlayingLyricPayload?.durationMs ?? 0) / 1000,
                ...nowPlayingDebugInfo,
            }
            : null
    ), [
        isNowPlayingStageActive,
        nowPlayingConnectionStatus,
        nowPlayingDebugInfo,
        nowPlayingLyricPayload?.durationMs,
        nowPlayingLyricPayload?.title,
        nowPlayingPaused,
        nowPlayingProgressMs,
        nowPlayingProgressQuality,
        nowPlayingTrack?.durationMs,
        nowPlayingTrack?.title,
        stageSource,
    ]);

    const activeDualTheme = useMemo(() => {
        if (bgMode === 'custom' && customTheme) {
            return customTheme;
        }
        if (bgMode === 'ai') {
            return aiTheme ?? FALLBACK_AI_DUAL_THEME;
        }
        return {
            light: DAYLIGHT_THEME,
            dark: DEFAULT_THEME,
        };
    }, [aiTheme, bgMode, customTheme]);

    const devDebugSnapshot = useMemo(() => (
        isDev
            ? buildDebugSnapshot({
                shortcutLabel: DEV_DEBUG_SHORTCUT_LABEL,
                currentSong,
                currentView,
                playerState,
                visualizerMode,
                lyrics,
                currentLineIndex,
                currentTimeValue: currentTime.get(),
                audioSrc,
                coverUrl,
                nowPlayingDebug: nowPlayingDebugSnapshot,
                themeMode: bgMode,
                activeDualTheme,
            })
            : null
    ), [
        activeDualTheme,
        audioSrc,
        bgMode,
        coverUrl,
        currentLineIndex,
        currentSong,
        currentTime,
        currentView,
        isDev,
        nowPlayingDebugSnapshot,
        playerState,
        lyrics,
        visualizerMode,
    ]);

    const themeParkSeedTheme = useMemo(() => getThemeParkSeedTheme(), [getThemeParkSeedTheme]);

    useSongThemeAutoGeneration({
        enabled: songThemeAutoSwitchEnabled && songThemeAutoGenerateEnabled,
        currentSong,
        lyrics,
        isLyricsLoading,
        generateAITheme,
    });

    const seekMainAudio = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            if (audioRef.current.paused) {
                void audioRef.current.play();
                setPlayerState(PlayerState.PLAYING);
            }
            void publishStagePlayerPlaybackUpdate();
        }
    }, [audioRef, publishStagePlayerPlaybackUpdate, setPlayerState]);

    const handleMonetLyricLineSeek = useCallback((lyricTimeSec: number) => {
        if (isNowPlayingControlDisabled) {
            return;
        }

        const playbackTime = Math.max(0, lyricTimeSec + currentTime.get() - lyricCurrentTime.get());
        if (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics' && !audioSrc) {
            syncStageLyricsClock(playbackTime, duration, playerState, stageLyricsClockRef.current.startTimeSec);
            currentTime.set(playbackTime);
            if (playerState !== PlayerState.PLAYING) {
                setPlayerState(PlayerState.PLAYING);
            }
            void publishStagePlayerPlaybackUpdate();
        } else {
            seekMainAudio(playbackTime);
        }
    }, [
        activePlaybackContext,
        audioSrc,
        currentTime,
        duration,
        isNowPlayingControlDisabled,
        lyricCurrentTime,
        playerState,
        publishStagePlayerPlaybackUpdate,
        seekMainAudio,
        setPlayerState,
        stageActiveEntryKind,
        stageLyricsClockRef,
        syncStageLyricsClock,
    ]);

    const {
        handleUnifiedAlbumSelect,
        handleUnifiedArtistSelect,
        handlePlayerPanelAlbumSelect,
        handlePlayerPanelArtistSelect,
    } = createGridNavigationHandlers({
        homeLayoutStyle,
        setActiveGridViewCollection,
        navigateDirectHome,
        navigateToNeteaseAlbum,
        navigateToNeteaseArtist,
    });

    return {
        activeDualTheme,
        canGenerateAITheme,
        commandPalette,
        commandPaletteContext,
        currentSearchSourceTabInPalette,
        devDebugSnapshot,
        generateCurrentSongTheme,
        handleMonetLyricLineSeek,
        handlePlayerPanelAlbumSelect,
        handlePlayerPanelArtistSelect,
        handleUnifiedAlbumSelect,
        handleUnifiedArtistSelect,
        nowPlayingDebugSnapshot,
        seekMainAudio,
        themeParkSeedTheme,
        toggleBrowserFullscreen,
        toggleDaylightMode,
    };
}

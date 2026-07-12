import { useCallback, useEffect, useMemo, useRef } from 'react';
import { buildDebugSnapshot } from '@/components/app/presentation/buildDebugSnapshot';
import { createGridNavigationHandlers } from '@/components/app/navigation/createGridNavigationHandlers';
import { DEFAULT_THEME, DAYLIGHT_THEME, DEV_DEBUG_SHORTCUT_LABEL } from '@/components/app/root/appConstants';
import { useCommandPalette } from '@/components/command-palette/useCommandPalette';
import { useSongThemeAutoGeneration } from '@/hooks/useSongThemeAutoGeneration';
import { useWindowFullscreenState } from '@/hooks/useWindowFullscreenState';
import { FALLBACK_AI_DUAL_THEME } from '@/services/themeSanitizer';
import {
    applyLyricColorPresetToDualTheme,
    getLyricColorPresetById,
    saveStoredLyricColorPresetId,
    type LyricColorPresetId,
} from '@/utils/theme/lyricColorPresets';
import { isFullscreenPlayActive, isFullscreenPlayEngaged } from '@/utils/windowFullscreen';
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
        enableSmartAtmosphere,
        activateSmartTheme,
        generateAITheme,
        handleToggleEnableSmartAtmosphere,
        getThemeParkSeedTheme,
        handleAutoMatchBestLyricForCurrentSong,
        handleNextTrack,
        handlePrevTrack,
        handleSetAppLanguagePreference,
        handleSetMonetBackgroundTuning,
        handleSetVisualizerBackgroundMode,
        handleSetVisualizerMode,
        handleSetLyricWordMode,
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
        isPlayerChromeHidden,
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
        saveCustomDualTheme,
        saveEditedAiDualTheme,
        saveLyricColorDualTheme,
        searchSourceTab,
        setActiveGridViewCollection,
        setDesktopLyricsLocked,
        setHomeViewTab,
        setIsPanelOpen,
        setIsPlayerChromeHidden,
        setIsFloatingDockRevealed,
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

    const canGenerateAITheme = Boolean((lyrics?.lines.length ?? 0) > 0 || currentSong?.isPureMusic || currentSong?.name);
    const generateCurrentSongTheme = useCallback(() => {
        void generateAITheme(lyrics, currentSong);
    }, [currentSong, generateAITheme, lyrics]);

    const activateCurrentSmartTheme = useCallback(() => {
        void activateSmartTheme(lyrics, currentSong);
    }, [activateSmartTheme, currentSong, lyrics]);

    const toggleDaylightMode = useCallback(() => {
        handleToggleDaylight(!isDaylight);
    }, [handleToggleDaylight, isDaylight]);

    const toggleSmartAtmosphere = useCallback(() => {
        handleToggleEnableSmartAtmosphere(!enableSmartAtmosphere);
    }, [enableSmartAtmosphere, handleToggleEnableSmartAtmosphere]);

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

    const { isWindowFullscreen, setWindowFullscreen } = useWindowFullscreenState();
    const wasWindowFullscreenRef = useRef(isWindowFullscreen);
    const isImmersiveFullscreen = isFullscreenPlayActive({
        currentView,
        isPlayerChromeHidden,
        isWindowFullscreen,
    });

    // OS Esc / system leave-fullscreen should also exit 满屏 chrome hide.
    useEffect(() => {
        const wasFullscreen = wasWindowFullscreenRef.current;
        wasWindowFullscreenRef.current = isWindowFullscreen;
        if (wasFullscreen && !isWindowFullscreen && currentView === 'player' && isPlayerChromeHidden) {
            setIsPlayerChromeHidden(false);
            setIsFloatingDockRevealed(false);
        }
    }, [currentView, isPlayerChromeHidden, isWindowFullscreen, setIsFloatingDockRevealed, setIsPlayerChromeHidden]);

    // Leaving the player while OS-fullscreen should drop window fullscreen.
    useEffect(() => {
        if (currentView !== 'player' && isWindowFullscreen) {
            void setWindowFullscreen(false);
        }
    }, [currentView, isWindowFullscreen, setWindowFullscreen]);

    const exitWindowFullscreen = useCallback(() => {
        void setWindowFullscreen(false);
    }, [setWindowFullscreen]);

    const toggleImmersiveFullscreen = useCallback(() => {
        const entering = !isFullscreenPlayEngaged({
            currentView,
            isPlayerChromeHidden,
            isWindowFullscreen,
        });

        if (entering) {
            navigateToPlayer();
            setIsPanelOpen(false);
            setIsPlayerChromeHidden(true);
            setIsFloatingDockRevealed(false);
            void setWindowFullscreen(true);
            return true;
        }

        setIsPlayerChromeHidden(false);
        setIsFloatingDockRevealed(false);
        void setWindowFullscreen(false);
        return true;
    }, [
        currentView,
        isPlayerChromeHidden,
        isWindowFullscreen,
        navigateToPlayer,
        setIsFloatingDockRevealed,
        setIsPanelOpen,
        setIsPlayerChromeHidden,
        setWindowFullscreen,
    ]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.target instanceof HTMLInputElement
                || event.target instanceof HTMLTextAreaElement
                || (event.target instanceof HTMLElement && event.target.isContentEditable)
            ) {
                return;
            }
            if (document.querySelector('[data-folia-keyboard-window="true"]')) {
                return;
            }
            if (event.code !== 'KeyF') {
                return;
            }
            if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
                return;
            }
            event.preventDefault();
            toggleImmersiveFullscreen();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleImmersiveFullscreen]);

    const commandPaletteContext = useMemo(() => ({
        currentSearchSourceTab: currentSearchSourceTabInPalette,
        localSongs,
        playerState,
        t: (key: string, fallback?: string) => t(key, fallback ?? ''),
        openSettings,
        navigateToHome: () => {
            setIsPlayerChromeHidden(false);
            setIsFloatingDockRevealed(false);
            exitWindowFullscreen();
            navigateToHome();
        },
        navigateDirectHome,
        navigateToPlayer,
        navigateToSearch,
        toggleImmersiveFullscreen,
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
        setLyricWordMode: handleSetLyricWordMode,
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
        enableSmartAtmosphere,
        toggleSmartAtmosphere,
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
        enableSmartAtmosphere,
        generateCurrentSongTheme,
        handleAutoMatchBestLyricForCurrentSong,
        handleNextTrack,
        handlePrevTrack,
        handleSetAppLanguagePreference,
        handleSetMonetBackgroundTuning,
        handleSetVisualizerBackgroundMode,
        handleSetVisualizerMode,
        handleSetLyricWordMode,
        handleToggleHidePlayerTranslationSubtitle,
        handleToggleShowSubtitleTranslation,
        hidePlayerTranslationSubtitle,
        isGeneratingTheme,
        isPlayerChromeHidden,
        localSongs,
        navigateToHome,
        navigateDirectHome,
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
        setIsPlayerChromeHidden,
        setIsFloatingDockRevealed,
        setIsUserGuideModalOpen,
        setPanelTab,
        showSubtitleTranslation,
        shuffleQueue,
        submitSearch,
        t,
        toggleImmersiveFullscreen,
        toggleDaylightMode,
        toggleSmartAtmosphere,
        toggleDesktopLyrics,
        toggleLoop,
        togglePlay,
        toggleTransparentModeWithHandoff,
        transparentPlayerBackground,
        exitWindowFullscreen,
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

    const handleApplyLyricColorPreset = useCallback((presetId: LyricColorPresetId) => {
        const preset = getLyricColorPresetById(presetId);
        if (!preset) {
            return;
        }
        // Color stays independent from the font picker; still apply glow/rhythm emphasis.
        const nextDualTheme = applyLyricColorPresetToDualTheme(activeDualTheme, preset, { includeEmphasis: true });
        saveStoredLyricColorPresetId(presetId);
        const label = t(preset.labelKey, preset.labelFallback);
        saveLyricColorDualTheme(
            nextDualTheme,
            currentSong?.id ?? null,
            t('status.lyricColorPresetApplied', { name: label }),
        );
    }, [activeDualTheme, currentSong?.id, saveLyricColorDualTheme, t]);

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
        activateCurrentSmartTheme,
        generateCurrentSongTheme,
        handleMonetLyricLineSeek,
        handlePlayerPanelAlbumSelect,
        handlePlayerPanelArtistSelect,
        handleUnifiedAlbumSelect,
        handleUnifiedArtistSelect,
        onApplyLyricColorPreset: handleApplyLyricColorPreset,
        nowPlayingDebugSnapshot,
        seekMainAudio,
        themeParkSeedTheme,
        isImmersiveFullscreen,
        isWindowFullscreen,
        toggleImmersiveFullscreen,
        exitWindowFullscreen,
        toggleDaylightMode,
    };
}

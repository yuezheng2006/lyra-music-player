import { useCallback, useEffect, useMemo, useRef } from 'react';
import { buildDebugSnapshot } from '@/components/app/presentation/buildDebugSnapshot';
import { createGridNavigationHandlers } from '@/components/app/navigation/createGridNavigationHandlers';
import { DEFAULT_THEME, DAYLIGHT_THEME, DEV_DEBUG_SHORTCUT_LABEL } from '@/components/app/root/appConstants';
import { useCommandPalette } from '@/components/command-palette/useCommandPalette';
import { useSongThemeAutoGeneration } from '@/hooks/useSongThemeAutoGeneration';
import { useWindowFullscreenState } from '@/hooks/useWindowFullscreenState';
import { FALLBACK_AI_DUAL_THEME } from '@/services/themeSanitizer';
import {
    applyLyricBodyColorToDualTheme,
    applyLyricColorPresetToDualTheme,
    getLyricColorPresetById,
    saveStoredLyricBodyColor,
    saveStoredLyricColorPresetId,
    type LyricColorPresetId,
} from '@/utils/theme/lyricColorPresets';
import { isFullscreenPlayActive, isFullscreenPlayEngaged } from '@/utils/windowFullscreen';
import {
    hasFoliaKeyboardWindow,
    isModKeyChord,
    isTextEntryTarget,
    shouldExitFullscreenOnEscape,
    shouldOpenShortcutsCheatSheet,
} from '@/components/shortcuts/shortcutKeyboardGuards';
import { PlayerState } from '@/types';
import { isLocalPlaybackSong, isNavidromePlaybackSong } from '@/utils/appPlaybackGuards';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import { useNeteaseDiscoveryStore } from '@/stores/useNeteaseDiscoveryStore';
import { resolveNeteaseLikedPlaylist } from '@/utils/home/neteaseDiscoveryMath';
import { playDiscoverySongs } from '@/utils/home/startNeteaseDiscoveryPlayback';
import { hasNeteaseSession } from '@/utils/onlineLibraryAccess';
import { useAppControllerSongDownload } from '@/hooks/useAppControllerSongDownload';
import { hasPlayableHtmlMediaSource } from '@/utils/audioAutoPlayGuard';
import { resolveVolumeStepAdjustment } from '@/utils/playback/adjustVolumeByStepMath';
import { getAtmosphereSongKey } from '@/hooks/atmosphere/getAtmosphereSongKey';
import {
    isLocalBeatPromptSource,
    resolveLocalBeatPersistKey,
} from '@/utils/atmosphere/localBeatMapCache';
import { useLocalBeatAnalysisStore } from '@/stores/useLocalBeatAnalysisStore';
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
    const setIsOnboardingOpen = useSettingsUiStore(state => state.setIsOnboardingOpen);
    const setIsWhatsNewOpen = useSettingsUiStore(state => state.setIsWhatsNewOpen);
    const {
        activePlaybackContext,
        aiTheme,
        audioQuality,
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
        enableBilibiliVideoBackground,
        activateSmartTheme,
        generateAITheme,
        handleToggleEnableSmartAtmosphere,
        handleToggleEnableBilibiliVideoBackground,
        getThemeParkSeedTheme,
        handleAutoMatchBestLyricForCurrentSong,
        handleNextTrack,
        handlePrevTrack,
        handleSetVolume,
        handleToggleMute,
        handleSetAppLanguagePreference,
        handleSetMonetBackgroundTuning,
        handleSetLatentBackgroundTuning,
        handleSetNomandBackgroundTuning,
        handleSetVisualizerBackgroundMode,
        handleSetVisualizerMode,
        handleSetLyricWordMode,
        handleToggleAlternativeLyricSources,
        handleToggleDaylight,
        handleToggleHidePlayerTranslationSubtitle,
        handleToggleShowSubtitleTranslation,
        handleSetSubtitleContentMode,
        hidePlayerTranslationSubtitle,
        homeLayoutStyle,
        isDaylight,
        isDev,
        isElectronWindow,
        isGeneratingTheme,
        isLyricsLoading,
        isMuted,
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
        replacePlayQueue,
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
        setIsShortcutsCheatSheetOpen,
        setPanelTab,
        setPlayerState,
        setStatusMsg,
        showLyricMatchModal,
        showNaviLyricMatchModal,
        showOnlineLyricMatchModal,
        showSubtitleTranslation,
        subtitleContentMode,
        shuffleQueue,
        songThemeAutoGenerateEnabled,
        songThemeAutoSwitchEnabled,
        stageActiveEntryKind,
        stageLyricsClockRef,
        stageSource,
        startVideoExport,
        submitSearch,
        syncStageLyricsClock,
        t,
        toggleDesktopLyrics,
        toggleLoop,
        togglePlay,
        toggleTransparentModeWithHandoff,
        transparentPlayerBackground,
        user,
        playlists,
        visualizerMode,
        volume,
    } = core;

    const adjustVolumeByStep = useCallback((delta: number) => {
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

    const openLocalBeatAnalysis = useCallback(() => {
        if (!currentSong || !audioSrc) return false;
        const songKey = getAtmosphereSongKey(currentSong.id, audioSrc);
        const persistKey = resolveLocalBeatPersistKey(songKey);
        if (!songKey || !persistKey) return false;
        if (!isLocalBeatPromptSource(audioSrc) && !/^https?:\/\//i.test(audioSrc)) return false;
        const mode = useSettingsUiStore.getState().localBeatAnalysisMode === 'dj' ? 'dj' : 'mr';
        useLocalBeatAnalysisStore.getState().openPrompt(
            {
                persistKey,
                songKey,
                audioSrc,
                trackTitle: currentSong.name || '',
            },
            mode,
        );
        return true;
    }, [audioSrc, currentSong]);

    const setLocalBeatAnalysisMode = useCallback((mode: 'mr' | 'dj') => {
        useSettingsUiStore.getState().handleSetLocalBeatAnalysisMode(mode);
    }, []);

    const setLocalBeatAnalysisPromptPolicy = useCallback((policy: 'auto' | 'ask') => {
        useSettingsUiStore.getState().handleSetLocalBeatAnalysisPromptPolicy(policy);
    }, []);

    const toggleBilibiliVideoBackground = useCallback(() => {
        handleToggleEnableBilibiliVideoBackground(!enableBilibiliVideoBackground);
    }, [enableBilibiliVideoBackground, handleToggleEnableBilibiliVideoBackground]);

    const startNeteasePersonalFm = useCallback(async () => {
        if (!hasNeteaseSession(user)) {
            setHomeViewTab('radio');
            navigateDirectHome({ clearContext: false });
            return false;
        }
        const songs = await useNeteaseDiscoveryStore.getState().startPersonalFm();
        const started = playDiscoverySongs(songs, playSong, true);
        if (started) {
            setHomeViewTab('radio');
            navigateDirectHome({ clearContext: false });
        }
        return started;
    }, [navigateDirectHome, playSong, setHomeViewTab, user]);

    const startNeteaseHeartbeat = useCallback(async () => {
        if (!hasNeteaseSession(user) || !user) return false;
        const likedPlaylist = resolveNeteaseLikedPlaylist(playlists, user);
        if (!likedPlaylist) return false;
        const songs = await useNeteaseDiscoveryStore.getState().startHeartbeat({
            user,
            likedPlaylistId: likedPlaylist.id,
        });
        return playDiscoverySongs(songs, playSong, false);
    }, [playSong, playlists, user]);

    const handleSetLyricEffectPackId = useSettingsUiStore(state => state.handleSetLyricEffectPackId);
    const {
        downloadSong,
        downloadSongs,
        downloadCurrentSong,
        downloadSearchResults,
    } = useAppControllerSongDownload({
        audioQuality,
        currentSong,
        setStatusMsg,
    });

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
            // Capture-phase help shortcut: works from home/player, including Cmd+?.
            if (shouldOpenShortcutsCheatSheet({
                code: event.code,
                key: event.key,
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                hasBlockingWindow: hasFoliaKeyboardWindow(),
            })) {
                event.preventDefault();
                event.stopPropagation();
                setIsShortcutsCheatSheetOpen(true);
                return;
            }

            if (isTextEntryTarget(event.target)) {
                return;
            }
            if (hasFoliaKeyboardWindow()) {
                return;
            }

            if (event.key === 'Escape') {
                if (!shouldExitFullscreenOnEscape({
                    isTextEntryTarget: false,
                    hasBlockingWindow: false,
                    isFullscreenPlayEngaged: isFullscreenPlayEngaged({
                        currentView,
                        isPlayerChromeHidden,
                        isWindowFullscreen,
                    }),
                })) {
                    return;
                }
                event.preventDefault();
                toggleImmersiveFullscreen();
                return;
            }

            if (!isModKeyChord({
                code: event.code,
                expectedCode: 'KeyF',
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
            })) {
                return;
            }
            event.preventDefault();
            toggleImmersiveFullscreen();
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [
        currentView,
        isPlayerChromeHidden,
        isWindowFullscreen,
        setIsShortcutsCheatSheetOpen,
        toggleImmersiveFullscreen,
    ]);

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
        adjustVolumeByStep,
        setVolume: handleSetVolume,
        toggleMute: handleToggleMute,
        shuffleQueue,
        playQueue,
        currentSong,
        replacePlayQueue,
        playSong,
        startNeteasePersonalFm,
        startNeteaseHeartbeat,
        canGenerateAITheme,
        isGeneratingTheme,
        generateAITheme: generateCurrentSongTheme,
        setVisualizerMode: handleSetVisualizerMode,
        setLyricWordMode: handleSetLyricWordMode,
        setLyricEffectPackId: handleSetLyricEffectPackId,
        setVisualizerBackgroundMode: handleSetVisualizerBackgroundMode,
        setMonetBackgroundTuning: handleSetMonetBackgroundTuning,
        setLatentBackgroundTuning: handleSetLatentBackgroundTuning,
        setNomandBackgroundTuning: handleSetNomandBackgroundTuning,
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
        subtitleContentMode,
        cycleSubtitleContentMode: () => {
            const next = subtitleContentMode === 'translation'
                ? 'romanization'
                : 'translation';
            handleSetSubtitleContentMode(next);
        },
        enablePlayerPageNativeBlur,
        toggleDaylightMode,
        enableSmartAtmosphere,
        toggleSmartAtmosphere,
        openLocalBeatAnalysis,
        setLocalBeatAnalysisMode,
        setLocalBeatAnalysisPromptPolicy,
        enableBilibiliVideoBackground,
        toggleBilibiliVideoBackground,
        setAppLanguagePreference: handleSetAppLanguagePreference,
        enableAlternativeLyricSources,
        runAutoMatchBestLyric: handleAutoMatchBestLyricForCurrentSong,
        setIsUserGuideModalOpen,
        setIsShortcutsCheatSheetOpen,
        setIsOnboardingOpen,
        setIsWhatsNewOpen,
        openThemeQuickEditor,
        canOpenThemeQuickEditor,
        toggleDesktopLyrics: () => toggleDesktopLyrics(),
        setDesktopLyricsLocked: (locked: boolean) => setDesktopLyricsLocked(locked),
        desktopLyricsEnabled: desktopLyricsStatus.enabled,
        desktopLyricsLocked: desktopLyricsStatus.locked,
        setDesktopLyricsYFactor: (factor: number) => {
            useSettingsUiStore.getState().handleSetDesktopLyricsYFactor(factor);
        },
        downloadCurrentSong,
        downloadSearchResults,
        startVideoExport,
        isElectronWindow,
    }), [
        canGenerateAITheme,
        canOpenThemeQuickEditor,
        currentSearchSourceTabInPalette,
        desktopLyricsStatus.enabled,
        desktopLyricsStatus.locked,
        downloadCurrentSong,
        downloadSearchResults,
        startVideoExport,
        isElectronWindow,
        enableAlternativeLyricSources,
        enablePlayerPageNativeBlur,
        enableSmartAtmosphere,
        enableBilibiliVideoBackground,
        generateCurrentSongTheme,
        handleAutoMatchBestLyricForCurrentSong,
        handleNextTrack,
        handlePrevTrack,
        adjustVolumeByStep,
        handleToggleMute,
        handleSetAppLanguagePreference,
        handleSetMonetBackgroundTuning,
        handleSetLatentBackgroundTuning,
        handleSetNomandBackgroundTuning,
        handleSetVisualizerBackgroundMode,
        handleSetVisualizerMode,
        handleSetLyricWordMode,
        handleSetLyricEffectPackId,
        handleToggleHidePlayerTranslationSubtitle,
        handleToggleShowSubtitleTranslation,
        handleSetSubtitleContentMode,
        hidePlayerTranslationSubtitle,
        isGeneratingTheme,
        isPlayerChromeHidden,
        localSongs,
        navigateToHome,
        navigateDirectHome,
        navigateToPlayer,
        navigateToSearch,
        openLocalBeatAnalysis,
        openSettings,
        openThemeQuickEditor,
        playQueue, currentSong, playSong, replacePlayQueue,
        playlists,
        playerState,
        startNeteaseHeartbeat,
        startNeteasePersonalFm,
        setDesktopLyricsLocked,
        setHomeViewTab,
        setIsPanelOpen,
        setIsPlayerChromeHidden,
        setIsFloatingDockRevealed,
        setIsUserGuideModalOpen,
        setIsShortcutsCheatSheetOpen,
        setIsOnboardingOpen,
        setIsWhatsNewOpen,
        setLocalBeatAnalysisMode,
        setLocalBeatAnalysisPromptPolicy,
        setPanelTab,
        showSubtitleTranslation,
        subtitleContentMode,
        handleSetSubtitleContentMode,
        shuffleQueue,
        submitSearch,
        t,
        toggleImmersiveFullscreen,
        toggleDaylightMode,
        toggleSmartAtmosphere,
        toggleBilibiliVideoBackground,
        toggleDesktopLyrics,
        toggleLoop,
        togglePlay,
        toggleTransparentModeWithHandoff,
        transparentPlayerBackground,
        user,
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
        // Color chips only change lyric body hues — not animation intensity / glow / rhythm.
        // Seed from Theme Park (covers legacy/ai/custom), not the debug-only activeDualTheme.
        // No toast — same silent UX as font preset / lyric intensity.
        const nextDualTheme = applyLyricColorPresetToDualTheme(getThemeParkSeedTheme(), preset);
        saveStoredLyricColorPresetId(presetId);
        saveLyricColorDualTheme(nextDualTheme, currentSong?.id ?? null);
        void import('../utils/telemetry/trackTelemetry').then(({ trackTelemetry }) => {
            trackTelemetry('settings.changed', {
                data: { key: 'lyricColorPreset', value: presetId },
            });
        });
    }, [currentSong?.id, getThemeParkSeedTheme, saveLyricColorDualTheme]);

    const handleApplyLyricBodyColor = useCallback((color: string) => {
        const nextDualTheme = applyLyricBodyColorToDualTheme(getThemeParkSeedTheme(), color);
        if (!nextDualTheme) {
            return;
        }
        saveStoredLyricBodyColor(color);
        saveLyricColorDualTheme(nextDualTheme, currentSong?.id ?? null);
    }, [currentSong?.id, getThemeParkSeedTheme, saveLyricColorDualTheme]);

    useSongThemeAutoGeneration({
        enabled: songThemeAutoSwitchEnabled && songThemeAutoGenerateEnabled,
        currentSong,
        lyrics,
        isLyricsLoading,
        generateAITheme,
    });

    const seekMainAudio = useCallback((time: number) => {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }
        audio.currentTime = time;
        // Lyric-line seek may try to resume; empty/dead src throws NotSupportedError.
        if (audio.paused && hasPlayableHtmlMediaSource(audio)) {
            void audio.play().then(() => {
                setPlayerState(PlayerState.PLAYING);
            }).catch(() => {
                setPlayerState(PlayerState.PAUSED);
            });
        }
        void publishStagePlayerPlaybackUpdate();
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
        downloadSong,
        downloadSongs,
        downloadCurrentSong,
        downloadSearchResults,
        generateCurrentSongTheme,
        handleMonetLyricLineSeek,
        handlePlayerPanelAlbumSelect,
        handlePlayerPanelArtistSelect,
        handleUnifiedAlbumSelect,
        handleUnifiedArtistSelect,
        onApplyLyricColorPreset: handleApplyLyricColorPreset,
        onApplyLyricBodyColor: handleApplyLyricBodyColor,
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

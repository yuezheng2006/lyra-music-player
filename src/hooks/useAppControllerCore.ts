import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useMotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { resolveStartupOverlay } from '@/utils/startupOverlayGate';
import { loadVisualizerRegistryEntry } from '@/components/visualizer/registry';
import { createCoverUrlResolver } from '@/components/app/playback/createCoverUrlResolver';
import { createLyricsSetter } from '@/components/app/playback/createLyricsSetter';
import { createOnlineRecoveryController } from '@/components/app/playback/createOnlineRecoveryController';
import { persistPlaybackCache } from '@/components/app/playback/persistPlaybackCache';
import {
    DEFAULT_THEME,
    DAYLIGHT_THEME,
    ONLINE_AUDIO_URL_REFRESH_BUFFER_MS,
    ONLINE_AUDIO_URL_TTL_MS,
    PLAYER_CHROME_HIDDEN_STORAGE_KEY,
} from '@/components/app/root/appConstants';
import { PlayerState, ReplayGainMode, StatusMessage, PlaybackContext, StageLoopMode, type AudioBands, type SongResult, type LyricData } from '@/types';
import { isNavidromeEnabled } from '@/services/navidromeService';
import { isNavidromeUiEnabled } from '@/utils/featureFlags';
import { useAppPreferences } from '@/hooks/useAppPreferences';
import { useElectronNeteaseApiStatus } from '@/hooks/useElectronNeteaseApiStatus';
import { useAppControllerCoreIntegrations } from '@/hooks/useAppControllerCoreIntegrations';
import { useThemeController } from '@/hooks/useThemeController';
import { useAtmosphereThemeBridge } from '@/hooks/useAtmosphereThemeBridge';
import { useThemeQuickEditorStore } from '@/stores/useThemeQuickEditorStore';
import { useSearchNavigationStore } from '@/stores/useSearchNavigationStore';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import { useShallow } from 'zustand/react/shallow';
import { isLocalPlaybackSong } from '@/utils/appPlaybackGuards';
import { useAppAudioOutput } from '@/hooks/useAppAudioOutput';








export function useAppControllerCore() {
    const { t } = useTranslation();
    const isDev = import.meta.env.DEV;
    const isElectronWindow = Boolean((window as typeof window & { electron?: unknown; }).electron);
    const [isTitlebarRevealed, setIsTitlebarRevealed] = useState(false);
    const [showTransparentWindowBorder, setShowTransparentWindowBorder] = useState(false);
    const [isMainWindowClickThroughEnabled, setIsMainWindowClickThroughEnabled] = useState(false);
    const [isClickThroughToggleHotspotActive, setIsClickThroughToggleHotspotActive] = useState(false);

    // Player Data
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [currentSong, setCurrentSong] = useState<SongResult | null>(null);
    const [lyrics, setLyricsState] = useState<LyricData | null>(null);
    const [lyricTimelineOffsetMs, setLyricTimelineOffsetMs] = useState(0);
    const [cachedCoverUrl, setCachedCoverUrl] = useState<string | null>(null);
    const [activePlaybackContext, setActivePlaybackContext] = useState<PlaybackContext>('main');

    // Queue
    const [playQueue, setPlayQueue] = useState<SongResult[]>([]);

    // UI State
    const [statusMsg, setStatusMsg] = useState<StatusMessage | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    useElectronNeteaseApiStatus(setStatusMsg, t);

    // Auto-close the player panel when leaving the player view
    // (Effect moved to after useAppNavigation where currentView is defined)
    const [panelTab, setPanelTab] = useState<'cover' | 'controls' | 'queue' | 'account' | 'local' | 'navi' | 'onlineLyrics'>('cover');
    const [isPlayerChromeHidden, setIsPlayerChromeHidden] = useState(() => {
        const saved = localStorage.getItem(PLAYER_CHROME_HIDDEN_STORAGE_KEY);
        return saved === 'true';
    });
    // Floating dock can reappear in fullscreen without exiting immersive chrome / OS fullscreen.
    const [isFloatingDockRevealed, setIsFloatingDockRevealed] = useState(false);
    const [isFloatingDockPopoverOpen, setIsFloatingDockPopoverOpen] = useState(false);
    const [isDevDebugOverlayVisible, setIsDevDebugOverlayVisible] = useState(false);
    const [navidromeEnabledStored, setNavidromeEnabledState] = useState(() => isNavidromeEnabled());
    const navidromeEnabled = isNavidromeUiEnabled() && navidromeEnabledStored;
    const [starredNavidromeSongIds, setStarredNavidromeSongIds] = useState<Set<string>>(new Set());
    const {
        closeSettings,
        isSettingsSubviewOpen,
        openSettings,
        settingsModalState,
        homeLayoutStyle,
        setActiveGridViewCollection,
        enableAlternativeLyricSources,
        handleToggleAlternativeLyricSources,
        lastSeenGuideVersion,
        setLastSeenGuideVersion,
        setIsUserGuideModalOpen,
        setIsShortcutsCheatSheetOpen,
        onboardingCompleted,
        setIsOnboardingOpen,
        setIsWhatsNewOpen,
        playerLyricsVisible,
        handleTogglePlayerLyricsVisible,
    } = useSettingsUiStore(useShallow(state => ({
        closeSettings: state.closeSettings,
        isSettingsSubviewOpen: state.isSubSettingsViewOpen,
        openSettings: state.openSettings,
        settingsModalState: state.settingsModalState,
        homeLayoutStyle: state.homeLayoutStyle,
        setActiveGridViewCollection: state.setActiveGridViewCollection,
        enableAlternativeLyricSources: state.enableAlternativeLyricSources,
        handleToggleAlternativeLyricSources: state.handleToggleAlternativeLyricSources,
        lastSeenGuideVersion: state.lastSeenGuideVersion,
        setLastSeenGuideVersion: state.setLastSeenGuideVersion,
        setIsUserGuideModalOpen: state.setIsUserGuideModalOpen,
        setIsShortcutsCheatSheetOpen: state.setIsShortcutsCheatSheetOpen,
        onboardingCompleted: state.onboardingCompleted,
        setIsOnboardingOpen: state.setIsOnboardingOpen,
        setIsWhatsNewOpen: state.setIsWhatsNewOpen,
        playerLyricsVisible: state.playerLyricsVisible,
        handleTogglePlayerLyricsVisible: state.handleTogglePlayerLyricsVisible,
    })));
    const setThemeQuickEditorContext = useThemeQuickEditorStore(state => state.setContext);
    const openThemeQuickEditor = useThemeQuickEditorStore(state => state.openEditor);
    const canOpenThemeQuickEditor = useThemeQuickEditorStore(state => state.canOpenEditor);

    useEffect(() => {
        const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
        // Re-read storage in case an earlier skip wrote before this store instance hydrated.
        const storedCompleted = typeof window !== 'undefined'
            && (
                localStorage.getItem('lyra_onboarding_completed') === 'true'
                || Boolean(localStorage.getItem('folia_last_seen_guide_version'))
            );
        const overlay = resolveStartupOverlay({
            onboardingCompleted: onboardingCompleted || storedCompleted,
            lastSeenGuideVersion,
            appVersion,
        });
        if (overlay === 'onboarding') {
            setIsOnboardingOpen(true);
            return;
        }
        if (overlay === 'whats-new') {
            setIsWhatsNewOpen(true);
        }
    }, [
        lastSeenGuideVersion,
        onboardingCompleted,
        setIsOnboardingOpen,
        setIsWhatsNewOpen,
    ]);

    const loadNavidromeFavorites = useCallback(async () => {
        if (!navidromeEnabled) {
            setStarredNavidromeSongIds(new Set());
            return;
        }

        const { getNavidromeConfig, navidromeApi } = await import('@/services/navidromeService');
        const config = getNavidromeConfig();
        if (!config) return;

        try {
            const songs = await navidromeApi.getStarred2(config);
            setStarredNavidromeSongIds(new Set(songs.map(song => song.id)));
        } catch (error) {
            console.warn('[App] Failed to load Navidrome favorites:', error);
        }
    }, [navidromeEnabled]);

    useEffect(() => {
        void loadNavidromeFavorites();
    }, [loadNavidromeFavorites]);

    const prevSettingsOpenRef = useRef(false);
    useEffect(() => {
        const isOpen = settingsModalState.isOpen;
        if (!isOpen && prevSettingsOpenRef.current && navidromeEnabled) {
            void loadNavidromeFavorites();
        }
        prevSettingsOpenRef.current = isOpen;
    }, [settingsModalState.isOpen, navidromeEnabled, loadNavidromeFavorites]);

    // Player State
    const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE);
    const currentTime = useMotionValue(0);
    useEffect(() => {
        (window as any).__folia_current_time = currentTime;
    }, [currentTime]);
    const [duration, setDuration] = useState(0);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [isFmMode, setIsFmMode] = useState(false);

    // Progress Bar State
    // Removed isDragging and sliderValue as they are handled by ProgressBar component

    // Audio Analysis State
    const audioPower = useMotionValue(0);
    const bass = useMotionValue(0);
    const lowMid = useMotionValue(0);
    const mid = useMotionValue(0);
    const vocal = useMotionValue(0);
    const treble = useMotionValue(0);
    const spectrum = useMotionValue<Uint8Array<ArrayBufferLike>>(new Uint8Array(0));
    const audioBands = useMemo<AudioBands>(() => ({
        bass,
        lowMid,
        mid,
        vocal,
        treble,
        spectrum,
    }), [bass, lowMid, mid, spectrum, treble, vocal]);

    // Refs
    const audioRef = useRef<HTMLAudioElement>(null);
    const animationFrameRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const replayGainLinearRef = useRef(1);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const blobUrlRef = useRef<string | null>(null);
    const queueScrollRef = useRef<HTMLDivElement>(null);
    const shouldAutoPlay = useRef(false);
    const currentSongRef = useRef<number | null>(null);
    const currentSongFullRef = useRef<SongResult | null>(null);
    useEffect(() => {
        currentSongFullRef.current = currentSong;
    }, [currentSong]);
    const playbackRequestIdRef = useRef(0);
    const playbackAutoSkipCountRef = useRef(0);
    const pendingUnavailableSkipTimerRef = useRef<number | null>(null);
    const pendingUnavailableSkipIntervalRef = useRef<number | null>(null);
    const volumePreviewFrameRef = useRef<number | null>(null);
    const pendingVolumePreviewRef = useRef<number | null>(null);
    const pendingResumeTimeRef = useRef<number | null>(null);
    const onlinePlaybackRecoveryRef = useRef<Promise<boolean> | null>(null);
    const lastAudioRecoverySourceRef = useRef<string | null>(null);
    const currentOnlineAudioUrlFetchedAtRef = useRef<number | null>(null);
    // Buffer progress debug helper. Uncomment this ref, the reset effect below,
    // and the audio `onProgress` handler to log buffered percent again.
    // const lastBufferedPercentLogRef = useRef<number | null>(null);
    const [isLyricsLoading, setIsLyricsLoading] = useState(false);
    const isNowPlayingControlDisabledRef = useRef(false);

    const [replayGainMode, setReplayGainMode] = useState<ReplayGainMode>(() => {
        const saved = localStorage.getItem('local_replaygain_mode');
        return saved === 'track' || saved === 'album' ? saved : 'off';
    });
    const localFileBlobsRef = useRef<Map<string, string>>(new Map()); // id -> blob URL

    // Navigation Persistence State (Lifted from Home/LocalMusicView)
    const homeViewTab = useSearchNavigationStore(state => state.homeViewTab);
    const setHomeViewTab = useSearchNavigationStore(state => state.setHomeViewTab);
    const handleToggleNavidromeEnabled = useCallback((enabled: boolean) => {
        setNavidromeEnabledState(enabled);
        if (!enabled && homeViewTab === 'navidrome') {
            setHomeViewTab('local');
        }
    }, [homeViewTab, setHomeViewTab]);

    // Preferences and Theme
    // Manages user preferences for audio quality, theme settings, 
    // and related actions like toggling cover color backgrounds and static mode,
    // as well as setting daylight mode preference
    const appPreferences = useAppPreferences(setStatusMsg);
    const {
        audioQuality,
        setAudioQuality,
        useCoverColorBg,
        staticMode,
        disableHomeDynamicBackground,
        hidePlayerTranslationSubtitle,
        showSubtitleTranslation,
        hidePlayerRightPanelButton,
        transparentPlayerBackground,
        enablePlayerPageNativeBlur,
        autoHidePlayerChrome,
        disableVisualizerVignette,
        enableSmartAtmosphere,
        enable3dInteractiveBackground,
        minimizeToTray,
        hideTaskbarIcon,
        openPlayerOnLaunch,
        enableMediaCache,
        backgroundOpacity,
        subtitleOverlayOpacity,
        visualizerOpacity,
        visualizerBackgroundMode,
        isDaylight,
        visualizerMode,
        classicTuning,
        cadenzaTuning,
        partitaTuning,
        fumeTuning,
        claddaghTuning,
        cappellaTuning,
        tiltTuning,
        monetBackgroundTuning,
        interactive3dSceneTuning,
        monetTuning,
        cappellaCustomEmojiImages,
        isLoadingCappellaCustomEmojiPack,
        cappellaCustomAvatarImages,
        monetBackgroundImage,
        monetPortraitImage,
        urlBackgroundList,
        urlBackgroundSelectedId,
        lyricsFontStyle,
        lyricsFontScale,
        lyricsCustomFontFamily,
        lyricsCustomFontLabel,
        lyricFontPresetId,
        lyricFilterPattern,
        showOpenPanelCloseButton,
        enableNowPlayingStage,
        queueAddBehavior,
        audioOutputDeviceId,
        loopMode,
        handleToggleCoverColorBg,
        handleToggleStaticMode,
        handleToggleDisableHomeDynamicBackground,
        handleToggleHidePlayerTranslationSubtitle,
        handleToggleShowSubtitleTranslation,
        handleToggleHidePlayerRightPanelButton,
        handleToggleTransparentPlayerBackground,
        handleToggleDisableVisualizerVignette,
        handleToggleEnableSmartAtmosphere,
        handleToggleEnable3dInteractiveBackground,
        handleToggleMinimizeToTray,
        handleToggleHideTaskbarIcon,
        handleToggleOpenPlayerOnLaunch,
        handleToggleMediaCache,
        handleSetBackgroundOpacity,
        setDaylightPreference,
        handleSetVisualizerMode,
        handleSetLyricWordMode,
        handleSetVisualizerBackgroundMode,
        handleSetMonetBackgroundTuning,
        handleSetInteractive3dSceneTuning,
        handleSetMonetTuning,
        handleSetCadenzaTuning,
        handleResetCadenzaTuning,
        handleSetPartitaTuning,
        handleResetPartitaTuning,
        handleSetFumeTuning,
        handleResetFumeTuning,
        handleSetCappellaTuning,
        handleResetCappellaTuning,
        handleSetTiltTuning,
        handleResetTiltTuning,
        handleImportCustomCappellaEmojiPack,
        handleClearCustomCappellaEmojiPack,
        handleSetLyricsFontStyle,
        handleSetLyricsFontScale,
        handleSetLyricsCustomFont,
        handleUploadLyricsCustomFont,
        handleSetAppLanguagePreference,
        handleSetLyricFilterPattern,
        handleToggleOpenPanelCloseButton,
        handleToggleNowPlayingStage,
        handleSetQueueAddBehavior,
        handleSetAudioOutputDeviceId: persistAudioOutputDeviceId,
        volume,
        isMuted,
        handleSetVolume,
        handleToggleMute,
        handleToggleLoopMode,
    } = appPreferences;

    useEffect(() => {
        void loadVisualizerRegistryEntry(visualizerMode).catch(error => {
            console.warn('[Boot] Failed to preload visualizer entry', visualizerMode, error);
        });
    }, [visualizerMode]);

    const setLyrics = useMemo(
        () => createLyricsSetter(setLyricsState, lyricFilterPattern, currentSongFullRef),
        [lyricFilterPattern],
    );
    const lyricCurrentTime = useMotionValue(0);

    useEffect(() => {
        setLyricTimelineOffsetMs(0);
    }, [currentSong?.id]);

    const effectiveLoopMode: StageLoopMode = loopMode;

    const getTargetPlaybackVolume = useCallback(() => (isMuted ? 0 : volume), [isMuted, volume]);

    const persistLastPlaybackCache = useCallback(persistPlaybackCache, []);

    const {
        syncOutputGain,
        handleAudioOutputDeviceChange,
        handlePreviewVolume,
    } = useAppAudioOutput({
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
    });

    const {
        shouldRefreshCurrentOnlineAudioSource,
        recoverOnlinePlaybackSource,
    } = useMemo(() => createOnlineRecoveryController({
        audioQuality,
        currentSong,
        audioSrc,
        audioRef,
        currentSongRef,
        blobUrlRef,
        shouldAutoPlayRef: shouldAutoPlay,
        pendingResumeTimeRef,
        onlinePlaybackRecoveryRef,
        lastAudioRecoverySourceRef,
        currentOnlineAudioUrlFetchedAtRef,
        setAudioSrc,
        onlineAudioUrlTtlMs: ONLINE_AUDIO_URL_TTL_MS,
        onlineAudioUrlRefreshBufferMs: ONLINE_AUDIO_URL_REFRESH_BUFFER_MS,
    }), [audioQuality, audioSrc, audioRef, blobUrlRef, currentOnlineAudioUrlFetchedAtRef, currentSong, currentSongRef, lastAudioRecoverySourceRef, onlinePlaybackRecoveryRef, pendingResumeTimeRef, setAudioSrc, shouldAutoPlay]);

    const getCoverUrl = useMemo(
        () => createCoverUrlResolver(cachedCoverUrl, currentSong),
        [cachedCoverUrl, currentSong],
    );

    const coverUrl = getCoverUrl();
    const currentSongArtist = useMemo(() => {
        if (!currentSong) {
            return null;
        }
        const joinedArtists = currentSong.ar?.map(artist => artist.name).filter(Boolean).join(', ');
        if (joinedArtists) {
            return joinedArtists;
        }
        const fallbackArtists = currentSong.artists?.map(artist => artist.name).filter(Boolean).join(', ');
        if (fallbackArtists) {
            return fallbackArtists;
        }
        return isLocalPlaybackSong(currentSong)
            ? currentSong.localData.matchedArtists || currentSong.localData.artist || null
            : null;
    }, [currentSong]);
    const currentSongAlbum = useMemo(() => {
        if (!currentSong) {
            return null;
        }
        if (currentSong.al?.name || currentSong.album?.name) {
            return currentSong.al?.name || currentSong.album?.name || null;
        }
        return isLocalPlaybackSong(currentSong)
            ? currentSong.localData.matchedAlbumName || currentSong.localData.album || null
            : null;
    }, [currentSong]);

    const applyAtmosphereHintsFromTheme = useAtmosphereThemeBridge({
        getCurrentTuning: () => useSettingsUiStore.getState().interactive3dSceneTuning,
        onTuningChange: (patch) => {
            useSettingsUiStore.getState().handleSetInteractive3dSceneTuning(patch);
        },
    });

    // Theme Controller
    // manages current theme, daylight mode, and related actions like generating AI themes 
    // and restoring cached themes for songs
    const themeController = useThemeController({
        defaultTheme: DEFAULT_THEME,
        daylightTheme: DAYLIGHT_THEME,
        isDaylight,
        setDaylightPreference,
        setStatusMsg,
        coverUrl,
        t,
        onAtmosphereHints: applyAtmosphereHintsFromTheme,
    });
    const {
        theme,
        setTheme,
        aiTheme,
        customTheme,
        hasCustomTheme,
        themeSourceModel,
        isCustomThemePreferred,
        songThemeAutoSwitchEnabled,
        songThemeAutoGenerateEnabled,
        bgMode,
        isGeneratingTheme,
        handleToggleDaylight,
        handleBgModeChange,
        activateSmartTheme,
        handleResetTheme,
        applyDefaultTheme,
        restoreCachedThemeForSong,
        generateAITheme,
        getThemeParkSeedTheme,
        saveCustomDualTheme,
        saveEditedAiDualTheme,
        saveLyricColorDualTheme,
        applyCustomTheme,
        handleCustomThemePreferenceChange,
        handleSongThemeAutoSwitchChange,
        handleSongThemeAutoGenerateChange,
    } = themeController;

    useEffect(() => {
        const isPureMusic = Boolean(currentSong?.isPureMusic);
        const songTitle = currentSong?.name;
        const allText = lyrics?.lines.map(l => l.fullText).join('\n') || null;
        const promptSourceText = (isPureMusic ? songTitle : allText) || allText;

        setThemeQuickEditorContext({
            aiTheme,
            customTheme,
            bgMode,
            coverUrl,
            songKey: currentSong?.id ?? null,
            isDaylight,
            promptSourceText,
            isPureMusic,
            songTitle,
        });
    }, [aiTheme, bgMode, coverUrl, currentSong?.id, currentSong?.isPureMusic, currentSong?.name, customTheme, isDaylight, lyrics, setThemeQuickEditorContext]);

    const integrations = useAppControllerCoreIntegrations({
        t,
        isDev,
        isElectronWindow,
        setStatusMsg,
        enableNowPlayingStage,
        activePlaybackContext,
        setActivePlaybackContext,
        currentSong,
        lyrics,
        cachedCoverUrl,
        audioSrc,
        playQueue,
        isFmMode,
        playerState,
        duration,
        currentLineIndex,
        currentTime,
        audioRef,
        currentSongRef,
        shouldAutoPlayRef: shouldAutoPlay,
        pendingResumeTimeRef,
        lastAudioRecoverySourceRef,
        currentOnlineAudioUrlFetchedAtRef,
        setCurrentSong,
        setLyrics,
        setCachedCoverUrl,
        setAudioSrc,
        setPlayQueue,
        setIsFmMode,
        setIsLyricsLoading,
        setPlayerState,
        setCurrentLineIndex,
        setDuration,
        audioQuality,
        isPanelOpen,
        setIsPanelOpen,
        blobUrlRef,
        isPlayerChromeHidden,
        setIsPlayerChromeHidden,
        showTransparentWindowBorder,
        setShowTransparentWindowBorder,
        transparentPlayerBackground,
        applyTransparentPlayerBackground: handleToggleTransparentPlayerBackground,
        restoreCachedThemeForSong,
        persistLastPlaybackCache,
    });

    return {
        activePlaybackContext,
        aiTheme,
        analyserRef,
        animationFrameRef,
        appPreferences,
        audioBands,
        audioContextRef,
        audioPower,
        audioQuality,
        audioRef,
        audioSrc,
        backgroundOpacity,
        bass,
        applyCustomTheme,
        applyDefaultTheme,
        autoHidePlayerChrome,
        bgMode,
        blobUrlRef,
        cachedCoverUrl,
        cadenzaTuning,
        canOpenThemeQuickEditor,
        cappellaCustomAvatarImages,
        cappellaCustomEmojiImages,
        cappellaTuning,
        classicTuning,
        claddaghTuning,
        closeSettings,
        coverUrl,
        currentLineIndex,
        currentOnlineAudioUrlFetchedAtRef,
        currentSong,
        currentSongAlbum,
        currentSongArtist,
        currentSongFullRef,
        currentSongRef,
        currentTime,
        customTheme,
        disableHomeDynamicBackground,
        disableVisualizerVignette,
        duration,
        effectiveLoopMode,
        enableAlternativeLyricSources,
        enableMediaCache,
        enableNowPlayingStage,
        enablePlayerPageNativeBlur,
        enableSmartAtmosphere,
        fumeTuning,
        gainNodeRef,
        activateSmartTheme,
        generateAITheme,
        getCoverUrl,
        getTargetPlaybackVolume,
        getThemeParkSeedTheme,
        handleAudioOutputDeviceChange,
        handleBgModeChange,
        handleCustomThemePreferenceChange,
        handlePreviewVolume,
        handleResetTheme,
        handleSetAppLanguagePreference,
        handleSetLyricFilterPattern,
        handleSetInteractive3dSceneTuning,
        handleSetMonetBackgroundTuning,
        handleSetMonetTuning,
        handleSetVisualizerBackgroundMode,
        handleSetVisualizerMode,
        handleSetLyricWordMode,
        handleSetVolume,
        handleSongThemeAutoGenerateChange,
        handleSongThemeAutoSwitchChange,
        handleToggleAlternativeLyricSources,
        handleToggleCoverColorBg,
        handleToggleDaylight,
        handleToggleDisableVisualizerVignette,
        handleToggleEnableSmartAtmosphere,
        handleToggleHidePlayerTranslationSubtitle,
        handleToggleLoopMode,
        handleToggleMute,
        handleToggleNavidromeEnabled,
        handleTogglePlayerLyricsVisible,
        handleToggleShowSubtitleTranslation,
        hasCustomTheme,
        hidePlayerRightPanelButton,
        hidePlayerTranslationSubtitle,
        homeLayoutStyle,
        homeViewTab,
        interactive3dSceneTuning,
        isClickThroughToggleHotspotActive,
        isCustomThemePreferred,
        isDaylight,
        isDev,
        isDevDebugOverlayVisible,
        isElectronWindow,
        isFmMode,
        isGeneratingTheme,
        isLyricsLoading,
        isMuted,
        isMainWindowClickThroughEnabled,
        isNowPlayingControlDisabledRef,
        isPanelOpen,
        isPlayerChromeHidden,
        isFloatingDockRevealed,
        isFloatingDockPopoverOpen,
        isSettingsSubviewOpen,
        isTitlebarRevealed,
        lastAudioRecoverySourceRef,
        loadNavidromeFavorites,
        localFileBlobsRef,
        loopMode,
        lowMid,
        lyricCurrentTime,
        lyricFilterPattern,
        lyricTimelineOffsetMs,
        lyrics,
        lyricsCustomFontFamily,
        lyricsFontScale,
        lyricsFontStyle,
        lyricFontPresetId,
        mid,
        monetBackgroundImage,
        monetBackgroundTuning,
        monetPortraitImage,
        monetTuning,
        navidromeEnabled,
        onlinePlaybackRecoveryRef,
        openSettings,
        openThemeQuickEditor,
        panelTab,
        partitaTuning,
        pendingResumeTimeRef,
        pendingUnavailableSkipIntervalRef,
        pendingUnavailableSkipTimerRef,
        pendingVolumePreviewRef,
        persistLastPlaybackCache,
        playQueue,
        playbackAutoSkipCountRef,
        playbackRequestIdRef,
        playerLyricsVisible,
        playerState,
        prevSettingsOpenRef,
        queueAddBehavior,
        queueScrollRef,
        recoverOnlinePlaybackSource,
        replayGainLinearRef,
        replayGainMode,
        restoreCachedThemeForSong,
        saveCustomDualTheme,
        saveEditedAiDualTheme,
        saveLyricColorDualTheme,
        setActiveGridViewCollection,
        setAudioQuality,
        setAudioSrc,
        setCachedCoverUrl,
        setCurrentLineIndex,
        setCurrentSong,
        setDuration,
        setHomeViewTab,
        setIsClickThroughToggleHotspotActive,
        setIsDevDebugOverlayVisible,
        setIsFmMode,
        setIsLyricsLoading,
        setIsMainWindowClickThroughEnabled,
        setIsPanelOpen,
        setIsPlayerChromeHidden,
        setIsFloatingDockRevealed,
        setIsFloatingDockPopoverOpen,
        setIsTitlebarRevealed,
        setIsUserGuideModalOpen,
        setIsShortcutsCheatSheetOpen,
        setLyrics,
        setLyricTimelineOffsetMs,
        setPanelTab,
        setPlayQueue,
        setPlayerState,
        setReplayGainMode,
        setShowTransparentWindowBorder,
        setStarredNavidromeSongIds,
        setStatusMsg,
        setTheme,
        setThemeQuickEditorContext,
        settingsModalState,
        shouldAutoPlay,
        shouldRefreshCurrentOnlineAudioSource,
        showOpenPanelCloseButton,
        showSubtitleTranslation,
        showTransparentWindowBorder,
        songThemeAutoGenerateEnabled,
        songThemeAutoSwitchEnabled,
        sourceRef,
        spectrum,
        starredNavidromeSongIds,
        staticMode,
        statusMsg,
        subtitleOverlayOpacity,
        syncOutputGain,
        t,
        theme,
        themeController,
        themeSourceModel,
        tiltTuning,
        transparentPlayerBackground,
        treble,
        urlBackgroundList,
        urlBackgroundSelectedId,
        useCoverColorBg,
        visualizerBackgroundMode,
        visualizerMode,
        visualizerOpacity,
        vocal,
        volume,
        volumePreviewFrameRef,
        ...integrations,
    };
}

import { useEffect, useMemo } from 'react';
import { buildAppStyle } from '@/components/app/presentation/buildAppStyle';
import { buildPlayerViewFlags } from '@/components/app/presentation/buildPlayerViewFlags';
import { buildVisualizerTheme } from '@/components/app/presentation/buildVisualizerTheme';
import { DAYLIGHT_THEME, DEFAULT_THEME, PLAYER_CHROME_HIDDEN_STORAGE_KEY } from '@/components/app/root/appConstants';
import { resolveVisualizerBackgroundMode } from '@/hooks/useAppPreferences';
import { useElectronDesktopLyrics } from '@/hooks/useElectronDesktopLyrics';
import { useObsBrowserSourcePublisher } from '@/hooks/useObsBrowserSourcePublisher';
import type {
    AppControllerCoreResult,
    AppControllerLibraryResult,
    AppControllerPlaybackBridgesResult,
} from './useAppController.types';

export function useAppControllerPresentationShell(
    core: AppControllerCoreResult & AppControllerLibraryResult & AppControllerPlaybackBridgesResult,
) {
    const {
        activePlaybackContext,
        audioBands,
        audioPower,
        audioRef,
        autoHidePlayerChrome,
        backgroundOpacity,
        bgMode,
        cadenzaTuning,
        cappellaCustomAvatarImages,
        cappellaCustomEmojiImages,
        cappellaTuning,
        classicTuning,
        claddaghTuning,
        coverUrl,
        currentLineIndex,
        currentSong,
        currentTime,
        currentView,
        disableHomeDynamicBackground,
        disableVisualizerVignette,
        duration,
        enablePlayerPageNativeBlur,
        fumeTuning,
        hidePlayerRightPanelButton,
        hidePlayerTranslationSubtitle,
        interactive3dSceneTuning,
        isDaylight,
        isElectronWindow,
        isMainWindowClickThroughEnabled,
        isPanelOpen,
        isNowPlayingStageActive,
        isPlayerChromeHidden,
        lyricTimelineOffsetMs,
        lyrics,
        lyricsCustomFontFamily,
        lyricsFontScale,
        lyricsFontStyle,
        monetBackgroundImage,
        monetBackgroundTuning,
        monetPortraitImage,
        monetTuning,
        partitaTuning,
        playerState,
        setIsClickThroughToggleHotspotActive,
        setIsMainWindowClickThroughEnabled,
        setIsPlayerChromeHidden,
        settingsModalState,
        showSubtitleTranslation,
        stageActiveEntryKind,
        stageSource,
        staticMode,
        subtitleOverlayOpacity,
        theme,
        tiltTuning,
        transparentPlayerBackground,
        urlBackgroundList,
        urlBackgroundSelectedId,
        useCoverColorBg,
        visualizerBackgroundMode,
        visualizerMode,
        visualizerOpacity,
    } = core;

    const usesCustomWindowChrome = isElectronWindow;
    const isPlayerPageTransparent = transparentPlayerBackground || enablePlayerPageNativeBlur;
    const shouldUseTransparentAppBackground = currentView === 'player' && isPlayerPageTransparent;
    const appStyle = useMemo(() => buildAppStyle({
        bgMode,
        isDaylight,
        theme,
        daylightTheme: DAYLIGHT_THEME,
        defaultTheme: DEFAULT_THEME,
        transparentBackground: shouldUseTransparentAppBackground,
    }), [bgMode, isDaylight, shouldUseTransparentAppBackground, theme]);

    const { visualizerTheme, visualizerGeometrySeed } = useMemo(() => buildVisualizerTheme({
        appStyle,
        theme,
        lyricsFontStyle,
        lyricsCustomFontFamily,
        currentSongId: currentSong?.id,
        visualizerMode,
        visualizerBackgroundMode,
    }), [appStyle, currentSong?.id, lyricsCustomFontFamily, lyricsFontStyle, theme, visualizerBackgroundMode, visualizerMode]);

    const {
        desktopLyricsStatus,
        toggleDesktopLyrics,
        setDesktopLyricsLocked,
    } = useElectronDesktopLyrics({
        isElectronWindow,
        audioRef,
        lyrics,
        currentLineIndex,
        lyricOffsetMs: lyricTimelineOffsetMs,
        durationSec: duration,
        playerState,
        currentSong,
        theme: visualizerTheme,
        lyricsFontScale,
        lyricsCustomFontFamily,
    });

    const resolvedVisualizerBackgroundMode = useMemo(
        () => resolveVisualizerBackgroundMode(visualizerBackgroundMode, visualizerMode),
        [visualizerBackgroundMode, visualizerMode],
    );
    const isNowPlayingControlDisabled = isNowPlayingStageActive;

    useEffect(() => {
        localStorage.setItem(PLAYER_CHROME_HIDDEN_STORAGE_KEY, String(isPlayerChromeHidden));
    }, [isPlayerChromeHidden]);

    useEffect(() => {
        if (!autoHidePlayerChrome) return;

        let timeoutId: number;
        let isThrottled = false;
        let rafId: number;

        const showAndResetTimer = () => {
            setIsPlayerChromeHidden(false);
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                setIsPlayerChromeHidden(true);
            }, 3000);
        };

        const handleMouseOut = (e: MouseEvent) => {
            if (!e.relatedTarget || (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
                window.clearTimeout(timeoutId);
                timeoutId = window.setTimeout(() => {
                    setIsPlayerChromeHidden(true);
                }, 300);
            }
        };

        const throttledMouseMove = () => {
            if (isThrottled) return;
            isThrottled = true;
            rafId = requestAnimationFrame(() => {
                showAndResetTimer();
                isThrottled = false;
            });
        };

        showAndResetTimer();
        window.addEventListener('mouseout', handleMouseOut);
        window.addEventListener('mousemove', throttledMouseMove);

        return () => {
            window.clearTimeout(timeoutId);
            cancelAnimationFrame(rafId);
            window.removeEventListener('mouseout', handleMouseOut);
            window.removeEventListener('mousemove', throttledMouseMove);
        };
    }, [autoHidePlayerChrome, setIsPlayerChromeHidden]);

    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        const previousBodyBackgroundColor = body.style.backgroundColor;
        const previousHtmlBackgroundColor = html.style.backgroundColor;
        const shouldUseTransparentDocumentBackground = isElectronWindow && isPlayerPageTransparent;

        if (shouldUseTransparentDocumentBackground) {
            body.style.backgroundColor = 'transparent';
            html.style.backgroundColor = 'transparent';
        } else {
            body.style.backgroundColor = '';
            html.style.backgroundColor = '';
        }

        return () => {
            body.style.backgroundColor = previousBodyBackgroundColor;
            html.style.backgroundColor = previousHtmlBackgroundColor;
        };
    }, [isElectronWindow, isPlayerPageTransparent]);

    useEffect(() => {
        if (!isElectronWindow || !window.electron?.getMainWindowClickThroughEnabled || !window.electron?.onMainWindowClickThroughChanged) {
            setIsMainWindowClickThroughEnabled(false);
            return;
        }

        let mounted = true;

        void window.electron.getMainWindowClickThroughEnabled().then((enabled) => {
            if (mounted) {
                setIsMainWindowClickThroughEnabled(Boolean(enabled));
            }
        }).catch(() => {
            if (mounted) {
                setIsMainWindowClickThroughEnabled(false);
            }
        });

        const unsubscribe = window.electron.onMainWindowClickThroughChanged((state) => {
            const enabled = Boolean(state?.enabled);
            setIsMainWindowClickThroughEnabled(enabled);
            setIsClickThroughToggleHotspotActive(enabled && Boolean(state?.unlockHoverActive));
        });

        return () => {
            mounted = false;
            unsubscribe?.();
        };
    }, [isElectronWindow, setIsClickThroughToggleHotspotActive, setIsMainWindowClickThroughEnabled]);

    const isSettingsModalOpen = settingsModalState.isOpen;
    const shouldSuspendMainWindowClickThrough =
        currentView !== 'player' || isPanelOpen || isSettingsModalOpen;

    // Click-through is player-only; suspend it whenever home, settings, or side panel needs input.
    useEffect(() => {
        if (!isElectronWindow || !shouldSuspendMainWindowClickThrough) {
            return;
        }

        void window.electron?.setMainWindowClickThroughEnabled?.(false);
        void window.electron?.setMainWindowClickThroughUnlockHover?.(false);
        setIsClickThroughToggleHotspotActive(false);
    }, [
        isElectronWindow,
        setIsClickThroughToggleHotspotActive,
        shouldSuspendMainWindowClickThrough,
    ]);

    useEffect(() => {
        if (!isElectronWindow || !isMainWindowClickThroughEnabled || !window.electron?.setMainWindowClickThroughUnlockHover) {
            setIsClickThroughToggleHotspotActive(false);
            void window.electron?.setMainWindowClickThroughUnlockHover?.(false);
            return;
        }

        const toggleHotspotWidth = 48;
        const toggleHotspotHeight = 40;
        const toggleHotspotRightInset = 176;
        const toggleHotspotTopInset = 4;

        const syncToggleHotspot = (active: boolean) => {
            setIsClickThroughToggleHotspotActive(prev => (prev === active ? prev : active));
            void window.electron!.setMainWindowClickThroughUnlockHover(active);
        };

        const handleMouseMove = (event: MouseEvent) => {
            const withinHorizontalBounds =
                event.clientX >= window.innerWidth - toggleHotspotRightInset - toggleHotspotWidth
                && event.clientX <= window.innerWidth - toggleHotspotRightInset;
            const withinVerticalBounds =
                event.clientY >= toggleHotspotTopInset
                && event.clientY <= toggleHotspotTopInset + toggleHotspotHeight;
            const withinHotspot = withinHorizontalBounds && withinVerticalBounds;

            setIsClickThroughToggleHotspotActive(prev => {
                if (prev === withinHotspot) {
                    return prev;
                }

                void window.electron!.setMainWindowClickThroughUnlockHover(withinHotspot);
                return withinHotspot;
            });
        };

        const handleMouseLeave = () => {
            syncToggleHotspot(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            syncToggleHotspot(false);
        };
    }, [isElectronWindow, isMainWindowClickThroughEnabled, setIsClickThroughToggleHotspotActive]);

    const {
        isPlayerView,
        shouldPauseVisualizerBackground,
        shouldHidePlayerProgressBar,
        shouldHidePlayerTranslationSubtitle,
        shouldHidePlayerRightPanelButton,
        canToggleCurrentPlayback,
    } = useMemo(() => buildPlayerViewFlags({
        currentView,
        disableHomeDynamicBackground,
        hidePlayerTranslationSubtitle,
        hidePlayerRightPanelButton,
        isNowPlayingControlDisabled,
        activePlaybackContext,
        stageActiveEntryKind,
        audioSrc: core.audioSrc,
        duration,
    }), [
        activePlaybackContext,
        core.audioSrc,
        currentView,
        disableHomeDynamicBackground,
        duration,
        hidePlayerRightPanelButton,
        hidePlayerTranslationSubtitle,
        isNowPlayingControlDisabled,
        stageActiveEntryKind,
    ]);

    const {
        obsBrowserSourceStatus,
        isObsBrowserSourceRendering,
        refreshObsBrowserSourceStatus,
    } = useObsBrowserSourcePublisher({
        isElectronWindow,
        activePlaybackContext,
        stageSource,
        currentSong,
        lyrics,
        coverUrl,
        currentTime,
        offsetMs: lyricTimelineOffsetMs,
        duration,
        playerState,
        theme: visualizerTheme,
        isDaylight,
        visualizerMode,
        visualizerBackgroundMode,
        lyricsFontScale,
        backgroundOpacity,
        visualizerOpacity,
        subtitleOverlayOpacity,
        transparentBackground: isPlayerPageTransparent,
        useCoverColorBg,
        staticMode,
        disableGeometricBackground: resolvedVisualizerBackgroundMode !== 'interactive3d',
        disableVignette: disableVisualizerVignette,
        hideTranslationSubtitle: shouldHidePlayerTranslationSubtitle,
        showSubtitleTranslation,
        seed: visualizerGeometrySeed,
        audioPower,
        audioBands,
        classicTuning,
        cadenzaTuning,
        partitaTuning,
        fumeTuning,
        claddaghTuning,
        cappellaTuning,
        cappellaCustomEmojiImages,
        cappellaCustomAvatarImages,
        tiltTuning,
        monetBackgroundTuning,
        interactive3dSceneTuning,
        monetTuning,
        monetBackgroundImage,
        monetPortraitImage,
        urlBackgroundList,
        urlBackgroundSelectedId,
    });

    return {
        appStyle,
        canToggleCurrentPlayback,
        desktopLyricsStatus,
        isNowPlayingControlDisabled,
        isObsBrowserSourceRendering,
        isPlayerPageTransparent,
        isPlayerView,
        isSettingsModalOpen,
        obsBrowserSourceStatus,
        refreshObsBrowserSourceStatus,
        resolvedVisualizerBackgroundMode,
        setDesktopLyricsLocked,
        shouldHidePlayerProgressBar,
        shouldHidePlayerRightPanelButton,
        shouldHidePlayerTranslationSubtitle,
        shouldPauseVisualizerBackground,
        shouldUseTransparentAppBackground,
        toggleDesktopLyrics,
        usesCustomWindowChrome,
        visualizerGeometrySeed,
        visualizerTheme,
    };
}

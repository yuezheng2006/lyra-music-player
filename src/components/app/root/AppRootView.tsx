import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import VisualizerRenderer from '@/components/visualizer/VisualizerRenderer';
import CommandPalette from '@/components/command-palette/CommandPalette';
import AppShell from '@/components/app/AppShell';
import AppSidebar from '@/components/app/chrome/AppSidebar';
import Home from '@/components/app/Home';
import PlayerPanel from '@/components/app/PlayerPanel';
import ThemeQuickEditorHost from '@/components/panelTab/ThemeQuickEditor';
import AppDialogs from '@/components/app/dialogs/AppDialogs';
import AppOverlays from '@/components/app/overlays/AppOverlays';
import { UserGuideModal } from '@/components/modal/UserGuideModal';
import { ShortcutsCheatSheet } from '@/components/shortcuts/ShortcutsCheatSheet';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { WhatsNewModal } from '@/components/onboarding/WhatsNewModal';
import { ObsBrowserSourceLyrics } from '@/components/obs/ObsBrowserSourceLyrics';
import { resolvePlayerGeometricBackgroundDisabled } from '@/components/visualizer/resolveInteractive3dFumeLayering';
import { resolveFloatingPlayerBarReserve } from '@/components/floatingPlayerDockLayout';
import { VISUALIZER_SUBTITLE_PORTAL_ROOT_ID } from '@/components/visualizer/visualizerSubtitlePortal';
import type { AppControllerResult } from '@/hooks/useAppController';
import { AppAudioElement } from '@/components/app/root/AppAudioElement';
import { BilibiliVideoSurface } from '@/components/bilibili/BilibiliVideoSurface';
import { useBilibiliVideoSync } from '@/hooks/useBilibiliVideoSync';
import { useAppSidebarCollapse } from '@/hooks/useAppSidebarCollapse';
import { resolveSidebarLayout } from '@/hooks/resolveSidebarLayout';
import { useSearchNavigationStore } from '@/stores/useSearchNavigationStore';
import { useDailyRecommendStore } from '@/stores/useDailyRecommendStore';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import type { AppSidebarActive } from '@/components/app/chrome/AppSidebar';
import { useCoverShellTheme } from '@/hooks/useCoverShellTheme';
import { useBootSplashLifecycle } from '@/hooks/useBootSplashLifecycle';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { PerformanceHud } from '@/components/performance/PerformanceHud';
import { isVideoPlaybackStageActive } from '@/utils/playback/resolveVideoPlaybackStage';

interface AppRootViewProps {
    controller: AppControllerResult;
}

export function AppRootView({ controller }: AppRootViewProps) {
    const { t } = useTranslation();
    const homeViewTab = useSearchNavigationStore(state => state.homeViewTab);
    const setHomeViewTab = useSearchNavigationStore(state => state.setHomeViewTab);
    const preloadDailyRecommend = useDailyRecommendStore(state => state.preload);
    const isOnboardingOpen = useSettingsUiStore(state => state.isOnboardingOpen);
    const isWhatsNewOpen = useSettingsUiStore(state => state.isWhatsNewOpen);
    const setIsOnboardingOpen = useSettingsUiStore(state => state.setIsOnboardingOpen);
    const setIsWhatsNewOpen = useSettingsUiStore(state => state.setIsWhatsNewOpen);
    const completeOnboarding = useSettingsUiStore(state => state.completeOnboarding);
    const markWhatsNewSeen = useSettingsUiStore(state => state.markWhatsNewSeen);
    const [bootShellReady, setBootShellReady] = useState(false);

    usePerformanceMonitor();

    // Mark shell ready after first commit + paint so splash doesn't uncover black.
    useEffect(() => {
        let outer = 0;
        let inner = 0;
        outer = window.requestAnimationFrame(() => {
            inner = window.requestAnimationFrame(() => {
                setBootShellReady(true);
            });
        });
        return () => {
            window.cancelAnimationFrame(outer);
            window.cancelAnimationFrame(inner);
        };
    }, []);

    useBootSplashLifecycle({
        ready: bootShellReady,
        statusText: t('boot.preparingUi'),
    });

    // Warm daily recommend in the background so opening the tab feels instant.
    useEffect(() => {
        const win = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        if (typeof win.requestIdleCallback === 'function') {
            const id = win.requestIdleCallback(() => preloadDailyRecommend(), { timeout: 2500 });
            return () => win.cancelIdleCallback?.(id);
        }
        const timer = window.setTimeout(() => preloadDailyRecommend(), 800);
        return () => window.clearTimeout(timer);
    }, [preloadDailyRecommend]);

    const {
        activePlaybackContext,
        appDialogsModel,
        appOverlaysModel,
        appStyle,
        atmosphereEngine,
        audioBands,
        audioPower,
        audioRef,
        audioSrc,
        videoRef,
        videoSrc,
        setVideoSrc,
        backgroundOpacity,
        cacheSongAssets,
        cadenzaTuning,
        cappellaCustomAvatarImages,
        cappellaCustomEmojiImages,
        cappellaTuning,
        classicTuning,
        claddaghTuning,
        commandPalette,
        currentLineIndex,
        currentSong,
        currentSongAlbum,
        currentSongArtist,
        currentTime,
        currentView,
        disableVisualizerVignette,
        duration,
        effectiveLoopMode,
        enableSmartAtmosphere,
        fumeTuning,
        getCoverUrl,
        handleContainerClick,
        handleMonetLyricLineSeek,
        handleNextTrack,
        handleSetMonetTuning,
        homeModel,
        interactive3dSceneTuning,
        isClickThroughToggleHotspotActive,
        isDaylight,
        isElectronWindow,
        isHomeFullyHidden,
        isMainWindowClickThroughEnabled,
        isObsBrowserSourceRendering,
        isPlayerChromeHidden,
        isPlayerPageTransparent,
        isPlayerView,
        isSettingsModalOpen,
        isSettingsSubviewOpen,
        isTitlebarRevealed,
        lyricCurrentTime,
        lyrics,
        lyricsFontScale,
        monetBackgroundImage,
        monetBackgroundTuning,
        monetPortraitImage,
        monetTuning,
        navigateToHome,
        navigateDirectHome,
        navigateToPlayer,
        openSettings,
        navidromeEnabled,
        nowPlayingConnectionStatus,
        partitaTuning,
        pendingResumeTimeRef,
        playbackAutoSkipCountRef,
        playerLyricsVisible,
        playerPanelModel,
        playerState,
        playlistShelfItems,
        recoverOnlinePlaybackSource,
        resolvedVisualizerBackgroundMode,
        saveCustomDualTheme,
        saveEditedAiDualTheme,
        setDuration,
        setIsClickThroughToggleHotspotActive,
        setPlayerState,
        setupAudioAnalyzer,
        shouldAutoPlay,
        shouldHidePlayerTranslationSubtitle,
        shouldPauseVisualizerBackground,
        shouldShowHomeSurface,
        showLyricMatchModal,
        showSubtitleTranslation,
        showTransparentWindowBorder,
        skipAfterPlaybackFailure,
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
        usesCustomWindowChrome,
        visualizerBackgroundMode,
        visualizerGeometrySeed,
        visualizerMode,
        visualizerOpacity,
        visualizerTheme,
    } = controller;
    const shellTheme = useCoverShellTheme(getCoverUrl(), isDaylight);

    const videoStageActive = isVideoPlaybackStageActive(currentView, videoSrc);

    useEffect(() => {
        if (!currentSong && videoSrc) {
            setVideoSrc(null);
        }
    }, [currentSong, setVideoSrc, videoSrc]);

    useBilibiliVideoSync({
        enabled: videoStageActive,
        videoSrc,
        audioRef,
        videoRef,
    });

    // Immersive fullscreen hides the rail temporarily; user collapse preference stays independent.
    const immersiveCanvas = currentView === 'player' && isPlayerChromeHidden;
    const { userCollapsed, toggleCollapsed, setCollapsed } = useAppSidebarCollapse();
    const sidebarCollapsedBeforeImmersiveRef = useRef<boolean | null>(null);
    const sidebarLayout = resolveSidebarLayout({
        immersiveCanvas,
        userCollapsed,
    });
    const playerBarHeight = resolveFloatingPlayerBarReserve(immersiveCanvas);
    const sidebarWidth = sidebarLayout.width;

    // Snapshot / restore user collapse across immersive enter-exit so fullscreen never force-expands the rail.
    useEffect(() => {
        if (immersiveCanvas) {
            if (sidebarCollapsedBeforeImmersiveRef.current === null) {
                sidebarCollapsedBeforeImmersiveRef.current = userCollapsed;
            }
            return;
        }

        const snapshot = sidebarCollapsedBeforeImmersiveRef.current;
        if (snapshot === null) {
            return;
        }
        sidebarCollapsedBeforeImmersiveRef.current = null;
        if (snapshot !== userCollapsed) {
            setCollapsed(snapshot);
        }
    }, [immersiveCanvas, setCollapsed, userCollapsed]);

    return (
        <AppShell
            appStyle={{
                ...appStyle,
                ['--app-player-bar-height' as string]: playerBarHeight,
                ['--app-sidebar-width' as string]: sidebarWidth,
            }}
            isElectronWindow={isElectronWindow}
            usesCustomWindowChrome={usesCustomWindowChrome}
            useCustomWindowRadius={isElectronWindow && transparentPlayerBackground}
            showTransparentWindowBorder={showTransparentWindowBorder}
            isPlayerView={isPlayerView}
            isTitlebarRevealed={isTitlebarRevealed}
            isMainWindowClickThroughEnabled={isMainWindowClickThroughEnabled}
            showMainWindowClickThroughToggle={isMainWindowClickThroughEnabled ? isClickThroughToggleHotspotActive : isTitlebarRevealed}
            isDaylight={isDaylight}
            shellTheme={shellTheme}
            onToggleMainWindowClickThrough={() => {
                const nextEnabled = !isMainWindowClickThroughEnabled;
                if (!nextEnabled) {
                    setIsClickThroughToggleHotspotActive(false);
                }
                void window.electron?.setMainWindowClickThroughEnabled?.(nextEnabled);
                if (!nextEnabled) {
                    void window.electron?.setMainWindowClickThroughUnlockHover?.(false);
                }
            }}
            audioElement={<AppAudioElement
                audioRef={audioRef}
                audioSrc={audioSrc}
                effectiveLoopMode={effectiveLoopMode}
                shouldAutoPlay={shouldAutoPlay}
                currentTime={currentTime}
                setPlayerState={setPlayerState}
                setupAudioAnalyzer={setupAudioAnalyzer}
                playbackAutoSkipCountRef={playbackAutoSkipCountRef}
                currentSong={currentSong}
                cacheSongAssets={cacheSongAssets}
                handleNextTrack={handleNextTrack}
                setDuration={setDuration}
                pendingResumeTimeRef={pendingResumeTimeRef}
                duration={duration}
                recoverOnlinePlaybackSource={recoverOnlinePlaybackSource}
                playerState={playerState}
                skipAfterPlaybackFailure={skipAfterPlaybackFailure}
            />}
        >
            <div className="relative flex min-h-0 flex-1 w-full">
                <AppSidebar
                    active={((): AppSidebarActive => {
                        if (homeViewTab === 'daily') return 'daily';
                        if (homeViewTab === 'podcast') return 'podcast';
                        if (homeViewTab === 'local') return 'local';
                        if (homeViewTab === 'navidrome' && navidromeEnabled) return 'navidrome';
                        if (homeViewTab === 'ytmusic') return 'ytmusic';
                        if (homeViewTab === 'history') return 'history';
                        return 'home';
                    })()}
                    isDaylight={isDaylight}
                    collapsed={sidebarLayout.collapsed}
                    forceHidden={sidebarLayout.forceHidden}
                    navidromeEnabled={navidromeEnabled}
                    onToggleCollapsed={toggleCollapsed}
                    onOpenHome={() => {
                        setHomeViewTab('playlist');
                        navigateDirectHome();
                    }}
                    onOpenDaily={() => {
                        setHomeViewTab('daily');
                        navigateDirectHome({ clearContext: false });
                    }}
                    onOpenPodcast={() => {
                        setHomeViewTab('podcast');
                        navigateDirectHome({ clearContext: false });
                    }}
                    onOpenLocal={() => {
                        setHomeViewTab('local');
                        navigateDirectHome({ clearContext: false });
                    }}
                    onOpenNavidrome={() => {
                        setHomeViewTab('navidrome');
                        navigateDirectHome({ clearContext: false });
                    }}
                    onOpenYtmusic={() => {
                        setHomeViewTab('ytmusic');
                        navigateDirectHome({ clearContext: false });
                    }}
                    onOpenHistory={() => {
                        setHomeViewTab('history');
                        navigateDirectHome({ clearContext: false });
                    }}
                    onOpenSettings={() => openSettings('options')}
                />

                <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            {/* Home Mount Point */}
            <div
                className="absolute inset-0 z-10"
                style={{
                    pointerEvents: shouldShowHomeSurface ? 'auto' : 'none',
                    visibility: shouldShowHomeSurface ? 'visible' : 'hidden',
                    transition: shouldShowHomeSurface
                        ? 'visibility 0s linear 0s'
                        : 'visibility 0s linear 0.25s',
                    display: isHomeFullyHidden ? 'none' : 'block',
                }}
            >
                <motion.div
                    className="absolute inset-0"
                    initial={false}
                    animate={{ opacity: shouldShowHomeSurface ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                    {currentView === 'home' || currentView === 'player' ? (
                        <Home model={homeModel} isHomeFullyHidden={isHomeFullyHidden} />
                    ) : null}
                </motion.div>
            </div>

            {/* --- VISUALIZER (Background Layer & Main Click Target) --- */}
            <div
                className="absolute inset-0 z-0"
                onClick={handleContainerClick}
            >
                <BilibiliVideoSurface
                    videoRef={videoRef}
                    videoSrc={videoSrc || ''}
                    visible={videoStageActive}
                />
                {!isObsBrowserSourceRendering && (
                    <VisualizerRenderer
                        mode={visualizerMode}
                        currentTime={lyricCurrentTime}
                        currentLineIndex={currentLineIndex}
                        lines={lyrics?.lines || []}
                        theme={visualizerTheme}
                        isDaylight={isDaylight}
                        audioPower={audioPower}
                        audioBands={audioBands}
                        beatPulse={atmosphereEngine.beatPulse}
                        cinemaScale={atmosphereEngine.cinemaScale}
                        atmosphereEnergy={atmosphereEngine.atmosphereEnergy}
                        atmosphereGroove={atmosphereEngine.atmosphereGroove}
                        cameraPunch={atmosphereEngine.cameraPunch}
                        sceneParallaxX={atmosphereEngine.sceneParallaxX}
                        sceneParallaxY={atmosphereEngine.sceneParallaxY}
                        sceneRoll={atmosphereEngine.sceneRoll}
                        songTitle={currentSong?.name}
                        songArtist={currentSongArtist}
                        songAlbum={currentSongAlbum}
                        coverUrl={getCoverUrl()}
                        shellCanvasBackground={shellTheme.stageAtmosphere}
                        showText={currentView === 'player' && playerLyricsVisible && !isSettingsModalOpen}
                        useCoverColorBg={useCoverColorBg}
                        seed={visualizerGeometrySeed}
                        staticMode={staticMode}
                        paused={shouldPauseVisualizerBackground || videoStageActive}
                        backgroundOpacity={videoStageActive ? 0 : backgroundOpacity}
                        visualizerOpacity={visualizerOpacity}
                        videoStageActive={videoStageActive}
                        transparentBackground={
                            (currentView === 'player' && isPlayerPageTransparent && !isSettingsModalOpen)
                            || videoStageActive
                        }
                        disableGeometricBackground={
                            videoStageActive
                            || resolvePlayerGeometricBackgroundDisabled(
                                resolvedVisualizerBackgroundMode,
                                isSettingsSubviewOpen,
                            )
                        }
                        enableAtmosphereLayer={enableSmartAtmosphere && !staticMode && !videoStageActive}
                        enableBeatBursts={enableSmartAtmosphere && !staticMode && !videoStageActive}
                        disableVignette={disableVisualizerVignette}
                        visualizerBackgroundMode={visualizerBackgroundMode}
                        lyricsFontScale={lyricsFontScale}
                        subtitleOverlayOpacity={subtitleOverlayOpacity}
                        isPlayerChromeHidden={isPlayerChromeHidden}
                        immersiveLyrics={immersiveCanvas}
                        hideTranslationSubtitle={shouldHidePlayerTranslationSubtitle}
                        showSubtitleTranslation={showSubtitleTranslation}
                        classicTuning={classicTuning}
                        cadenzaTuning={cadenzaTuning}
                        partitaTuning={partitaTuning}
                        fumeTuning={fumeTuning}
                        claddaghTuning={claddaghTuning}
                        cappellaTuning={cappellaTuning}
                        tiltTuning={tiltTuning}
                        monetBackgroundTuning={monetBackgroundTuning}
                        interactive3dSceneTuning={interactive3dSceneTuning}
                        playlistShelfItems={playlistShelfItems}
                        monetTuning={monetTuning}
                        onMonetTuningChange={handleSetMonetTuning}
                        cappellaCustomEmojiImages={cappellaCustomEmojiImages}
                        cappellaCustomAvatarImages={cappellaCustomAvatarImages}
                        monetBackgroundImage={monetBackgroundImage}
                        monetPortraitImage={monetPortraitImage}
                        urlBackgroundList={urlBackgroundList}
                        urlBackgroundSelectedId={urlBackgroundSelectedId}
                        onLyricLineSeek={visualizerMode === 'monet' ? handleMonetLyricLineSeek : undefined}
                        onBack={navigateToHome}
                    />
                )}
            </div>

            {currentView === 'player' && isObsBrowserSourceRendering && (
                <ObsBrowserSourceLyrics
                    lyrics={lyrics}
                    currentLineIndex={currentLineIndex}
                    visualizerTheme={visualizerTheme}
                    lyricsFontScale={lyricsFontScale}
                    shouldHidePlayerTranslationSubtitle={shouldHidePlayerTranslationSubtitle}
                    isDaylight={isDaylight}
                    navigateToHome={navigateToHome}
                />
            )}

            {currentView === 'player' && activePlaybackContext === 'stage' && (!stageActiveEntryKind || stageSource === 'now-playing') && !currentSong && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center px-6">
                    <div className={`max-w-lg rounded-3xl border px-6 py-5 text-center backdrop-blur-md ${isDaylight ? 'border-black/10 bg-white/50 text-zinc-800' : 'border-white/10 bg-black/30 text-white'}`}>
                        <div className="text-xs uppercase tracking-[0.22em] opacity-50">
                            {stageSource === 'now-playing' ? 'Stage · Now Playing' : 'Stage · Stage API'}
                        </div>
                        <div className="mt-3 text-2xl font-semibold">
                            {stageSource === 'now-playing'
                                ? '等待本地 Now Playing 服务输入'
                                : (t('options.stageSessionEmpty') || '等待外部输入')}
                        </div>
                        <div className="mt-2 text-sm opacity-70">
                            {stageSource === 'now-playing'
                                ? (nowPlayingConnectionStatus === 'error'
                                    ? '未能连接到 ws://localhost:9863/api/ws/lyric，请确认 now-playing 服务已在本机运行'
                                    : '请在本机启动 now-playing 服务，并确保播放器正在播放')
                                : (t('options.enableStageModeDesc') || '本地 Stage API 已开启')}
                        </div>
                    </div>
                </div>
            )}

            <AppOverlays model={appOverlaysModel} />

            {currentView === 'player' && !showLyricMatchModal && (
                <PlayerPanel model={playerPanelModel} />
            )}
                </div>
            </div>

            {/* Fixed host so bottom subtitles escape visualizer overflow / rhythm scale clipping. */}
            <div
                id={VISUALIZER_SUBTITLE_PORTAL_ROOT_ID}
                className="pointer-events-none fixed bottom-0 right-0 top-0 z-[120]"
                style={{ left: 'var(--app-sidebar-width, 0px)' }}
            />

            <ThemeQuickEditorHost onSaveAiTheme={saveEditedAiDualTheme} onSaveCustomTheme={saveCustomDualTheme} />

            <CommandPalette
                activeIndex={commandPalette.activeIndex}
                activePreview={commandPalette.activePreview}
                activeCommand={commandPalette.activeCommand}
                isDaylight={isDaylight}
                isComposing={commandPalette.isComposing}
                isExecuting={commandPalette.isExecuting}
                isOpen={commandPalette.isOpen}
                matches={commandPalette.matches}
                query={commandPalette.query}
                theme={theme}
                onActiveCommandChange={commandPalette.setActiveCommand}
                onActiveIndexChange={commandPalette.setActiveIndex}
                onClose={commandPalette.close}
                onCompositionEnd={(value) => {
                    commandPalette.setIsComposing(false);
                    commandPalette.setQuery(value);
                    commandPalette.setMatchQuery(value);
                }}
                onCompositionStart={() => commandPalette.setIsComposing(true)}
                onExecuteActive={commandPalette.executeActive}
                onExecuteMatch={commandPalette.executeMatch}
                onQueryChange={commandPalette.setQuery}
            />

            <AppDialogs model={appDialogsModel} />
            <UserGuideModal theme={theme} />
            <ShortcutsCheatSheet />
            <OnboardingWizard
                isOpen={isOnboardingOpen}
                onClose={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                }}
                onComplete={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                }}
                onConnectNetease={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                    openSettings('options', 'integration');
                }}
                onConnectQQ={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                    openSettings('options', 'integration');
                }}
                onOpenLocal={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                    setHomeViewTab('local');
                }}
                onOpenNavidrome={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                    if (navidromeEnabled) {
                        setHomeViewTab('navidrome');
                        navigateDirectHome({ clearContext: false });
                        return;
                    }
                    openSettings('options', 'integration');
                }}
                onOpenDailyRecommend={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                    setHomeViewTab('daily');
                }}
                onOpenPlayer={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
                    completeOnboarding(appVersion);
                    navigateToPlayer();
                }}
            />
            <WhatsNewModal
                isOpen={isWhatsNewOpen}
                isDaylight={isDaylight}
                onClose={() => {
                    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
                    markWhatsNewSeen(appVersion);
                    setIsWhatsNewOpen(false);
                }}
            />
            <PerformanceHud />
        </AppShell>
    );
}

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MotionValue } from 'framer-motion';
import DockedBar from './FloatingPlayerDockedBar';
import {
    PlayerState,
    LyricData,
    Theme,
    SongResult,
    type Interactive3dSceneTuning,
    type MineradioVisualPresetId,
    type VisualizerBackgroundMode,
    type VisualizerMode,
} from '../types';
import type { LyricColorPresetId } from '../utils/theme/lyricColorPresets';
import LyricsTimelineModal from './modal/LyricsTimelineModal';
import {
    FLOATING_PLAYER_DOCK_MAX_WIDTH_PX,
    resolveFloatingPlayerDockFrameStyle,
} from './floatingPlayerDockLayout';
import { usePerformanceMonitorStore } from '../stores/usePerformanceMonitorStore';
import { resolveFloatingDockGlassStyle } from '../utils/chrome/floatingPlayerDockGlass';
import { useReducedMotionFor } from '../hooks/useReducedMotionFor';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';

// src/components/FloatingPlayerControls.tsx
// Floating dock: left meta, center transport, right tool chips.

type AudioQuality = 'exhigh' | 'lossless' | 'hires';

type FloatingSong = {
    id?: number;
    name: string;
    artists?: Array<{ name: string }>;
    ar?: Array<{ name: string }>;
};

interface FloatingPlayerControlsProps {
    currentSong: FloatingSong | null;
    coverUrl?: string | null;
    playerState: PlayerState;
    currentTime: MotionValue<number>;
    lyricCurrentTime?: MotionValue<number>;
    duration: number;
    loopMode: 'off' | 'all' | 'one';
    playerLyricsVisible?: boolean;
    currentView: 'home' | 'player';
    audioSrc: string | null;
    /** True while the next track URL is still resolving. */
    isAudioSourceLoading?: boolean;
    canTogglePlay?: boolean;
    canSkipTracks?: boolean;
    lyrics: LyricData | null;
    onSeek: (time: number) => void;
    onTogglePlay: () => void;
    onToggleLoop: () => void;
    onPrevTrack?: () => void;
    onNextTrack?: () => void;
    onTogglePlayerLyricsVisible?: () => void;
    onNavigateToPlayer: () => void;
    onNavigateToHome?: () => void;
    noTrackText?: string;
    primaryColor?: string;
    secondaryColor?: string;
    theme?: Theme;
    isDaylight: boolean;
    isHidden?: boolean;
    hideControlBar?: boolean;
    controlsDisabled?: boolean;
    showLyricsLabel?: string;
    hideLyricsLabel?: string;
    listeningModeLabel?: string;
    previousTrackLabel?: string;
    nextTrackLabel?: string;
    playLabel?: string;
    pauseLabel?: string;
    loopOffLabel?: string;
    loopListLabel?: string;
    loopOneLabel?: string;
    playQueue?: SongResult[];
    onPlayQueueSong?: (song: SongResult, queue: SongResult[]) => void;
    queueLabel?: string;
    isImmersiveFullscreen?: boolean;
    onToggleImmersiveFullscreen?: () => void;
    enterFullscreenLabel?: string;
    exitFullscreenLabel?: string;
    /** When true, toggling lyrics on from home also enters listening mode. */
    onRevealLyricsInPlayer?: () => void;
    audioQuality?: AudioQuality;
    onAudioQualityChange?: (quality: AudioQuality) => void;
    canChangeAudioQuality?: boolean;
    qualityExhighLabel?: string;
    qualityLosslessLabel?: string;
    qualityHiresLabel?: string;
    audioQualityLabel?: string;
    visualizerBackgroundMode?: VisualizerBackgroundMode | null;
    interactive3dSceneTuning?: Interactive3dSceneTuning | null;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    visualizerMode?: VisualizerMode;
    onVisualizerModeChange?: (mode: VisualizerMode) => void;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    onOpenSongSettings?: () => void;
    backgroundMenuLabel?: string;
    backgroundModeInteractive3dLabel?: string;
    backgroundModeCommonLabel?: string;
    backgroundModeMonetLabel?: string;
    backgroundPresetSectionLabel?: string;
    lyricsStyleSectionLabel?: string;
    lyricColorSectionLabel?: string;
    openSongSettingsLabel?: string;
    getBackgroundPresetLabel?: (preset: MineradioVisualPresetId) => string;
    getVisualizerModeLabel?: (mode: VisualizerMode) => string;
    /** True while a dock popover (background / quality) is open — pauses idle auto-hide. */
    onDockPopoverOpenChange?: (open: boolean) => void;
    onDownloadSong?: () => void;
    downloadSongLabel?: string;
}

const FloatingPlayerControls: React.FC<FloatingPlayerControlsProps> = ({
    currentSong,
    coverUrl = null,
    playerState,
    currentTime,
    lyricCurrentTime,
    duration,
    loopMode,
    playerLyricsVisible = true,
    currentView,
    isAudioSourceLoading = false,
    canTogglePlay = false,
    canSkipTracks = false,
    lyrics,
    onSeek,
    onTogglePlay,
    onToggleLoop,
    onPrevTrack,
    onNextTrack,
    onTogglePlayerLyricsVisible,
    onNavigateToPlayer,
    onNavigateToHome,
    noTrackText = 'No Track',
    primaryColor = 'var(--text-primary)',
    secondaryColor = 'var(--text-secondary)',
    theme,
    isDaylight,
    isHidden = false,
    hideControlBar = false,
    controlsDisabled = false,
    showLyricsLabel = 'Show lyrics',
    hideLyricsLabel = 'Hide lyrics',
    listeningModeLabel = 'Listening mode',
    previousTrackLabel = 'Previous track',
    nextTrackLabel = 'Next track',
    playLabel = 'Play',
    pauseLabel = 'Pause',
    loopOffLabel = 'Loop: off',
    loopListLabel = 'Loop: list',
    loopOneLabel = 'Loop: one',
    playQueue = [],
    onPlayQueueSong,
    queueLabel = 'Playlist',
    isImmersiveFullscreen = false,
    onToggleImmersiveFullscreen,
    enterFullscreenLabel = 'Fullscreen',
    exitFullscreenLabel = 'Exit fullscreen',
    onRevealLyricsInPlayer,
    audioQuality = 'exhigh',
    onAudioQualityChange,
    canChangeAudioQuality = false,
    qualityExhighLabel = 'HQ',
    qualityLosslessLabel = 'SQ',
    qualityHiresLabel = 'Hi-Res',
    audioQualityLabel = 'Audio quality',
    visualizerBackgroundMode = null,
    interactive3dSceneTuning = null,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
    visualizerMode = 'classic',
    onVisualizerModeChange,
    onApplyLyricColorPreset,
    onOpenSongSettings,
    backgroundMenuLabel = 'Background',
    backgroundModeInteractive3dLabel = '3D',
    backgroundModeCommonLabel = 'Common',
    backgroundModeMonetLabel = 'Monet',
    backgroundPresetSectionLabel = '3D style',
    lyricsStyleSectionLabel = 'Lyric style',
    lyricColorSectionLabel = 'Lyric colors',
    openSongSettingsLabel = 'Song settings',
    getBackgroundPresetLabel,
    getVisualizerModeLabel,
    onDockPopoverOpenChange,
}) => {
    // Timeline modal kept mounted for minimal churn; dock no longer opens it.
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    // Startup overlays must win pointer hit-testing; otherwise Skip never persists.
    const startupOverlayOpen = useSettingsUiStore(
        (s) => s.isOnboardingOpen || s.isWhatsNewOpen,
    );
    const dockHidden = isHidden || startupOverlayOpen;
    const effectsModeActive = currentView === 'player';
    const trackColor = isDaylight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';
    const canSwitchBackground = Boolean(
        interactive3dSceneTuning
        && onVisualizerBackgroundModeChange
        && onInteractive3dSceneTuningChange
        && onVisualizerModeChange,
    );

    // EmotionSelector demoted from primary chrome; mood engine still drives ambient/Lab.
    if (hideControlBar) {
        return null;
    }

    const performanceMode = usePerformanceMonitorStore((s) => s.mode);
    const effectiveTier = usePerformanceMonitorStore((s) => s.effectiveTier);
    const reducedMotion = useReducedMotionFor('uiMicroMotion');
    const glass = useMemo(
        () => resolveFloatingDockGlassStyle({
            performanceMode,
            effectiveTier,
            reducedMotion,
            isDaylight,
        }),
        [effectiveTier, isDaylight, performanceMode, reducedMotion],
    );

    const handleToggleLyrics = () => {
        if (!onTogglePlayerLyricsVisible) return;
        // Home has no lyric canvas — reveal lyrics by entering listening mode.
        if (currentView === 'home' && !playerLyricsVisible) {
            onRevealLyricsInPlayer?.();
            onTogglePlayerLyricsVisible();
            return;
        }
        onTogglePlayerLyricsVisible();
    };

    return (
        <>
            {/* Outer frame spans the content column; inner dock is width-capped and centered. */}
            <div
                className="fixed z-[130] flex justify-center overflow-visible"
                style={resolveFloatingPlayerDockFrameStyle(dockHidden)}
                data-testid="floating-player-dock-frame"
            >
                <motion.div
                    className={glass.dockClassName}
                    initial={false}
                    animate={{
                        opacity: dockHidden ? 0 : 0.94,
                        y: dockHidden ? 16 : 0,
                    }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        ...glass.dockStyle,
                        maxWidth: FLOATING_PLAYER_DOCK_MAX_WIDTH_PX,
                        WebkitAppRegion: 'no-drag',
                        boxShadow: isDaylight
                            ? 'inset 0 0 2px 1px rgba(255,255,255,0.55), inset 0 0 10px 4px rgba(255,255,255,0.22), 0 8px 28px rgba(17,17,26,0.08), 0 16px 48px rgba(17,17,26,0.06)'
                            : 'inset 0 0 2px 1px rgba(255,255,255,0.35), inset 0 0 10px 4px rgba(255,255,255,0.15), 0 8px 28px rgba(17,17,26,0.08), 0 16px 56px rgba(17,17,26,0.08)',
                        pointerEvents: dockHidden ? 'none' : 'auto',
                    } as React.CSSProperties}
                    onClick={(e) => e.stopPropagation()}
                    data-testid="floating-player-dock"
                    data-dock-glass-tier={glass.tier}
                >
                    <DockedBar
                        currentSong={currentSong}
                        coverUrl={coverUrl}
                        playerState={playerState}
                        currentTime={currentTime}
                        duration={duration}
                        isAudioSourceLoading={isAudioSourceLoading}
                        loopMode={loopMode}
                        playerLyricsVisible={playerLyricsVisible}
                        canTogglePlay={canTogglePlay}
                        canSkipTracks={canSkipTracks}
                        onSeek={onSeek}
                        onTogglePlay={onTogglePlay}
                        onToggleLoop={onToggleLoop}
                        onPrevTrack={onPrevTrack}
                        onNextTrack={onNextTrack}
                        onTogglePlayerLyricsVisible={handleToggleLyrics}
                        onToggleEffectsMode={() => {
                            if (effectsModeActive) {
                                onNavigateToHome?.();
                                return;
                            }
                            onNavigateToPlayer();
                        }}
                        onNavigateToHome={onNavigateToHome}
                        effectsModeActive={effectsModeActive}
                        noTrackText={noTrackText}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        trackColor={trackColor}
                        isDaylight={isDaylight}
                        controlsDisabled={controlsDisabled}
                        showLyricsLabel={showLyricsLabel}
                        hideLyricsLabel={hideLyricsLabel}
                        listeningModeLabel={listeningModeLabel}
                        previousTrackLabel={previousTrackLabel}
                        nextTrackLabel={nextTrackLabel}
                        playLabel={playLabel}
                        pauseLabel={pauseLabel}
                        loopOffLabel={loopOffLabel}
                        loopListLabel={loopListLabel}
                        loopOneLabel={loopOneLabel}
                        playQueue={playQueue}
                        onPlayQueueSong={onPlayQueueSong}
                        queueLabel={queueLabel}
                        isImmersiveFullscreen={isImmersiveFullscreen}
                        onToggleImmersiveFullscreen={onToggleImmersiveFullscreen}
                        enterFullscreenLabel={enterFullscreenLabel}
                        exitFullscreenLabel={exitFullscreenLabel}
                        audioQuality={audioQuality}
                        onAudioQualityChange={onAudioQualityChange}
                        canChangeAudioQuality={canChangeAudioQuality}
                        qualityExhighLabel={qualityExhighLabel}
                        qualityLosslessLabel={qualityLosslessLabel}
                        qualityHiresLabel={qualityHiresLabel}
                        audioQualityLabel={audioQualityLabel}
                        canSwitchBackground={canSwitchBackground}
                        visualizerBackgroundMode={visualizerBackgroundMode}
                        interactive3dSceneTuning={interactive3dSceneTuning}
                        onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange}
                        onInteractive3dSceneTuningChange={onInteractive3dSceneTuningChange}
                        visualizerMode={visualizerMode}
                        onVisualizerModeChange={onVisualizerModeChange}
                        theme={theme}
                        onApplyLyricColorPreset={onApplyLyricColorPreset}
                        onOpenSongSettings={onOpenSongSettings}
                        backgroundMenuLabel={backgroundMenuLabel}
                        backgroundModeInteractive3dLabel={backgroundModeInteractive3dLabel}
                        backgroundModeCommonLabel={backgroundModeCommonLabel}
                        backgroundModeMonetLabel={backgroundModeMonetLabel}
                        backgroundPresetSectionLabel={backgroundPresetSectionLabel}
                        lyricsStyleSectionLabel={lyricsStyleSectionLabel}
                        lyricColorSectionLabel={lyricColorSectionLabel}
                        openSongSettingsLabel={openSongSettingsLabel}
                        getBackgroundPresetLabel={getBackgroundPresetLabel}
                        getVisualizerModeLabel={getVisualizerModeLabel}
                        onDockPopoverOpenChange={onDockPopoverOpenChange}
                        onEnsurePlayerView={() => {
                            // Always route — hash/#player and React view can desync after dock hops.
                            onNavigateToPlayer();
                        }}
                        popoverClassName={glass.popoverClassName}
                        popoverStyle={glass.popoverStyle}
                    />
                </motion.div>
            </div>

            <LyricsTimelineModal
                isOpen={isTimelineOpen}
                onClose={() => setIsTimelineOpen(false)}
                lyrics={lyrics}
                duration={duration}
                currentTime={lyricCurrentTime ?? currentTime}
                onSeek={(time) => {
                    const offset = currentTime.get() - (lyricCurrentTime?.get() ?? currentTime.get());
                    onSeek(Math.max(0, time + offset));
                }}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor="var(--text-accent)"
                theme={theme}
                isDaylight={isDaylight}
                disabled={controlsDisabled}
            />
        </>
    );
};

export default FloatingPlayerControls;

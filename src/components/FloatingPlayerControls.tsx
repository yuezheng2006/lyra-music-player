import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Repeat, Repeat1, RepeatOff, SkipBack, SkipForward, Disc3, Maximize, Minimize, Maximize2 } from 'lucide-react';
import { MotionValue } from 'framer-motion';
import ProgressBar from './ProgressBar';
import FloatingPlayerBackgroundMenu from './FloatingPlayerBackgroundMenu';
import FloatingPlayerDockTime from './FloatingPlayerDockTime';
import FloatingPlayerQueueMenu from './FloatingPlayerQueueMenu';
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
import { getSizedCoverUrl } from '../utils/coverUrl';
import { getMineradioPresetLabelFallback } from './visualizer/geometric/mineradioVisualPresets';
import {
    FLOATING_PLAYER_DOCK_MAX_WIDTH_PX,
    FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX,
    FLOATING_PLAYER_PROGRESS_INSET_PX,
    resolveFloatingPlayerDockFrameStyle,
} from './floatingPlayerDockLayout';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import { useMoodEngineStore } from '../stores/useMoodEngineStore';
import { EmotionButton, EmotionSelector } from './moodEngine';

// src/components/FloatingPlayerControls.tsx
// Floating dock: left meta, center transport, right tool chips.

type AudioQuality = 'exhigh' | 'lossless' | 'hires';

type FloatingSong = {
    id?: number;
    name: string;
    artists?: Array<{ name: string }>;
    ar?: Array<{ name: string }>;
};

const AUDIO_QUALITY_OPTIONS: AudioQuality[] = ['exhigh', 'lossless', 'hires'];
const TRANSPORT_ICON_STROKE = 2.1;

const formatSongArtists = (song: FloatingSong | null | undefined): string => {
    const names = song?.ar?.map(artist => artist.name).filter(Boolean)
        ?? song?.artists?.map(artist => artist.name).filter(Boolean)
        ?? [];
    return names.join(', ');
};

/** Soft text chip — 音质等次要徽章。 */
const buildTextChipClass = (
    active: boolean,
    isDaylight: boolean | undefined,
    disabled: boolean,
) => {
    if (disabled) {
        return 'opacity-30 cursor-not-allowed';
    }
    if (active) {
        return isDaylight
            ? 'bg-black/[0.10] text-black'
            : 'bg-white/[0.14] text-white';
    }
    return isDaylight
        ? 'bg-black/[0.05] text-black/55 hover:bg-black/[0.08] hover:text-black/78'
        : 'bg-white/[0.08] text-white/62 hover:bg-white/[0.12] hover:text-white/88';
};

/** 歌词开关：开=实心高对比，关=描边弱化，一眼可辨。 */
const buildModeToggleChipClass = (
    active: boolean,
    isDaylight: boolean | undefined,
    disabled: boolean,
) => {
    if (disabled) {
        return 'opacity-30 cursor-not-allowed';
    }
    if (active) {
        return isDaylight
            ? 'bg-zinc-900 text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] ring-1 ring-black/15'
            : 'bg-white text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.55)]';
    }
    return isDaylight
        ? 'bg-transparent text-black/32 ring-1 ring-black/12 hover:text-black/55 hover:bg-black/[0.04]'
        : 'bg-transparent text-white/32 ring-1 ring-white/14 hover:text-white/62 hover:bg-white/[0.06]';
};

const buildToolButtonClass = (
    isDaylight: boolean | undefined,
    disabled: boolean,
    active = false,
) => {
    if (disabled) {
        return 'opacity-25 cursor-not-allowed hover:opacity-25';
    }
    if (active) {
        return isDaylight
            ? 'text-black bg-black/[0.08]'
            : 'text-white bg-white/[0.12]';
    }
    return isDaylight
        ? 'text-black/55 hover:text-black hover:bg-black/[0.05]'
        : 'text-white/70 hover:text-white hover:bg-white/[0.08]';
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
    onApplyLyricBodyColor?: (color: string) => void;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    backgroundMenuLabel?: string;
    backgroundModeInteractive3dLabel?: string;
    backgroundModeCommonLabel?: string;
    backgroundModeMonetLabel?: string;
    backgroundPresetSectionLabel?: string;
    lyricsStyleSectionLabel?: string;
    lyricColorSectionLabel?: string;
    getBackgroundPresetLabel?: (preset: MineradioVisualPresetId) => string;
    getVisualizerModeLabel?: (mode: VisualizerMode) => string;
    /** True while a dock popover (background / quality) is open — pauses idle auto-hide. */
    onDockPopoverOpenChange?: (open: boolean) => void;
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
    onApplyLyricBodyColor,
    onApplyLyricColorPreset,
    backgroundMenuLabel = 'Background',
    backgroundModeInteractive3dLabel = '3D',
    backgroundModeCommonLabel = 'Common',
    backgroundModeMonetLabel = 'Monet',
    backgroundPresetSectionLabel = '3D style',
    lyricsStyleSectionLabel = 'Lyric style',
    lyricColorSectionLabel = 'Lyric colors',
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
    const selectorOpen = useMoodEngineStore((s) => s.selectorOpen);
    const currentEmotion = useMoodEngineStore((s) => s.currentEmotion);
    const closeSelector = useMoodEngineStore((s) => s.closeSelector);
    const dockHidden = isHidden || startupOverlayOpen;
    const effectsModeActive = currentView === 'player';
    const trackColor = isDaylight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';
    const canSwitchBackground = Boolean(
        interactive3dSceneTuning
        && onVisualizerBackgroundModeChange
        && onInteractive3dSceneTuningChange
        && onVisualizerModeChange,
    );

    const emotionSelector = selectorOpen && currentSong ? (
        <EmotionSelector
            songId={currentSong.id}
            currentEmotion={currentEmotion?.emotion}
            onClose={closeSelector}
        />
    ) : null;

    if (hideControlBar) {
        return emotionSelector;
    }

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
                    className={`pointer-events-auto relative h-full w-full overflow-visible rounded-[50px] border-0 backdrop-blur-2xl transition-colors duration-300 ${
                        isDaylight ? 'bg-white/55' : 'bg-black/10'
                    }`}
                    initial={false}
                    animate={{
                        opacity: dockHidden ? 0 : 0.94,
                        y: dockHidden ? 16 : 0,
                    }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        maxWidth: FLOATING_PLAYER_DOCK_MAX_WIDTH_PX,
                        WebkitAppRegion: 'no-drag',
                        WebkitBackdropFilter: 'blur(24px) saturate(1.8) brightness(1.12)',
                        backdropFilter: 'blur(24px) saturate(1.8) brightness(1.12)',
                        backgroundColor: 'var(--shell-dock-glass)',
                        borderColor: 'var(--shell-border)',
                        boxShadow: isDaylight
                            ? 'inset 0 0 2px 1px rgba(255,255,255,0.55), inset 0 0 10px 4px rgba(255,255,255,0.22), 0 8px 28px rgba(17,17,26,0.08), 0 16px 48px rgba(17,17,26,0.06)'
                            : 'inset 0 0 2px 1px rgba(255,255,255,0.35), inset 0 0 10px 4px rgba(255,255,255,0.15), 0 8px 28px rgba(17,17,26,0.08), 0 16px 56px rgba(17,17,26,0.08)',
                        pointerEvents: dockHidden ? 'none' : 'auto',
                    } as React.CSSProperties}
                    onClick={(e) => e.stopPropagation()}
                    data-testid="floating-player-dock"
                >
                    <DockedBar
                        currentSong={currentSong}
                        coverUrl={coverUrl}
                        playerState={playerState}
                        currentTime={currentTime}
                        duration={duration}
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
                        onApplyLyricBodyColor={onApplyLyricBodyColor}
                        onApplyLyricColorPreset={onApplyLyricColorPreset}
                        backgroundMenuLabel={backgroundMenuLabel}
                        backgroundModeInteractive3dLabel={backgroundModeInteractive3dLabel}
                        backgroundModeCommonLabel={backgroundModeCommonLabel}
                        backgroundModeMonetLabel={backgroundModeMonetLabel}
                        backgroundPresetSectionLabel={backgroundPresetSectionLabel}
                        lyricsStyleSectionLabel={lyricsStyleSectionLabel}
                        lyricColorSectionLabel={lyricColorSectionLabel}
                        getBackgroundPresetLabel={getBackgroundPresetLabel}
                        getVisualizerModeLabel={getVisualizerModeLabel}
                        onDockPopoverOpenChange={onDockPopoverOpenChange}
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
            {emotionSelector}
        </>
    );
};

type DockedBarProps = {
    currentSong: FloatingSong | null;
    coverUrl?: string | null;
    playerState: PlayerState;
    currentTime: MotionValue<number>;
    duration: number;
    loopMode: 'off' | 'all' | 'one';
    playerLyricsVisible: boolean;
    canTogglePlay: boolean;
    canSkipTracks: boolean;
    onSeek: (time: number) => void;
    onTogglePlay: () => void;
    onToggleLoop: () => void;
    onPrevTrack?: () => void;
    onNextTrack?: () => void;
    onTogglePlayerLyricsVisible?: () => void;
    onToggleEffectsMode?: () => void;
    effectsModeActive?: boolean;
    noTrackText: string;
    primaryColor: string;
    secondaryColor: string;
    trackColor?: string;
    isDaylight?: boolean;
    controlsDisabled?: boolean;
    showLyricsLabel: string;
    hideLyricsLabel: string;
    listeningModeLabel: string;
    previousTrackLabel: string;
    nextTrackLabel: string;
    playLabel: string;
    pauseLabel: string;
    loopOffLabel: string;
    loopListLabel: string;
    loopOneLabel: string;
    playQueue: SongResult[];
    onPlayQueueSong?: (song: SongResult, queue: SongResult[]) => void;
    queueLabel: string;
    isImmersiveFullscreen: boolean;
    onToggleImmersiveFullscreen?: () => void;
    enterFullscreenLabel: string;
    exitFullscreenLabel: string;
    audioQuality: AudioQuality;
    onAudioQualityChange?: (quality: AudioQuality) => void;
    canChangeAudioQuality: boolean;
    qualityExhighLabel: string;
    qualityLosslessLabel: string;
    qualityHiresLabel: string;
    audioQualityLabel: string;
    canSwitchBackground: boolean;
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
    interactive3dSceneTuning: Interactive3dSceneTuning | null;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    visualizerMode: VisualizerMode;
    onVisualizerModeChange?: (mode: VisualizerMode) => void;
    theme?: Theme;
    onApplyLyricBodyColor?: (color: string) => void;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    backgroundMenuLabel: string;
    backgroundModeInteractive3dLabel: string;
    backgroundModeCommonLabel: string;
    backgroundModeMonetLabel: string;
    backgroundPresetSectionLabel: string;
    lyricsStyleSectionLabel: string;
    lyricColorSectionLabel: string;
    getBackgroundPresetLabel?: (preset: MineradioVisualPresetId) => string;
    getVisualizerModeLabel?: (mode: VisualizerMode) => string;
    onDockPopoverOpenChange?: (open: boolean) => void;
};

const DockedBar: React.FC<DockedBarProps> = ({
    currentSong,
    coverUrl,
    playerState,
    currentTime,
    duration,
    loopMode,
    playerLyricsVisible,
    canTogglePlay,
    canSkipTracks,
    onSeek,
    onTogglePlay,
    onToggleLoop,
    onPrevTrack,
    onNextTrack,
    onTogglePlayerLyricsVisible,
    onToggleEffectsMode,
    effectsModeActive = false,
    noTrackText,
    primaryColor,
    secondaryColor,
    trackColor,
    isDaylight,
    controlsDisabled = false,
    showLyricsLabel,
    hideLyricsLabel,
    listeningModeLabel,
    previousTrackLabel,
    nextTrackLabel,
    playLabel,
    pauseLabel,
    loopOffLabel,
    loopListLabel,
    loopOneLabel,
    playQueue,
    onPlayQueueSong,
    queueLabel,
    isImmersiveFullscreen,
    onToggleImmersiveFullscreen,
    enterFullscreenLabel,
    exitFullscreenLabel,
    audioQuality,
    onAudioQualityChange,
    canChangeAudioQuality,
    qualityExhighLabel,
    qualityLosslessLabel,
    qualityHiresLabel,
    audioQualityLabel,
    canSwitchBackground,
    visualizerBackgroundMode,
    interactive3dSceneTuning,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
    visualizerMode,
    onVisualizerModeChange,
    theme,
    onApplyLyricBodyColor,
    onApplyLyricColorPreset,
    backgroundMenuLabel,
    backgroundModeInteractive3dLabel,
    backgroundModeCommonLabel,
    backgroundModeMonetLabel,
    backgroundPresetSectionLabel,
    lyricsStyleSectionLabel,
    lyricColorSectionLabel,
    getBackgroundPresetLabel,
    getVisualizerModeLabel,
    onDockPopoverOpenChange,
}) => {
    const skipDisabled = controlsDisabled || !canSkipTracks;
    const lyricsToggleDisabled = controlsDisabled || !onTogglePlayerLyricsVisible;
    const qualityDisabled = controlsDisabled || !canChangeAudioQuality || !onAudioQualityChange;
    const coverArtUrl = coverUrl ? getSizedCoverUrl(coverUrl, 96) : null;
    const artistLabel = formatSongArtists(currentSong);
    const loopActive = loopMode !== 'off';
    const artistColor = isDaylight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.48)';
    const titleColor = isDaylight ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.92)';
    const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
    const [backgroundMenuOpen, setBackgroundMenuOpen] = useState(false);
    const [queueMenuOpen, setQueueMenuOpen] = useState(false);
    const qualityMenuRef = useRef<HTMLDivElement>(null);

    const qualityLabels: Record<AudioQuality, string> = {
        exhigh: qualityExhighLabel,
        lossless: qualityLosslessLabel,
        hires: qualityHiresLabel,
    };

    useEffect(() => {
        onDockPopoverOpenChange?.(qualityMenuOpen || backgroundMenuOpen || queueMenuOpen);
        return () => onDockPopoverOpenChange?.(false);
    }, [backgroundMenuOpen, onDockPopoverOpenChange, qualityMenuOpen, queueMenuOpen]);

    useEffect(() => {
        if (!qualityMenuOpen) return;
        const handlePointerDown = (event: MouseEvent) => {
            if (!qualityMenuRef.current?.contains(event.target as Node)) {
                setQualityMenuOpen(false);
            }
        };
        window.addEventListener('mousedown', handlePointerDown);
        return () => window.removeEventListener('mousedown', handlePointerDown);
    }, [qualityMenuOpen]);

    return (
        <div className="relative h-full w-full overflow-visible">
            {/* Edge scrubber inset clears capsule corners so the rail is not clipped. */}
            <div
                className="absolute top-[4px] z-20 overflow-visible"
                style={{
                    left: FLOATING_PLAYER_PROGRESS_INSET_PX,
                    right: FLOATING_PLAYER_PROGRESS_INSET_PX,
                }}
            >
                <ProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={onSeek}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    trackColor={trackColor}
                    disabled={controlsDisabled}
                    isDaylight={isDaylight}
                    variant="edge"
                />
            </div>

            {/* Mineradio order: cover · quality · loop · prev/play/next · bg · 词 · queue · fullscreen · time */}
            <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-5 pt-2.5 sm:gap-3 sm:px-6 md:px-7">
                <div className="flex min-w-0 items-center gap-2 text-left sm:gap-2.5">
                    {effectsModeActive || !onToggleEffectsMode ? (
                        <div
                            className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[14px]"
                            style={{
                                boxShadow: isDaylight
                                    ? '0 8px 20px rgba(0,0,0,0.14)'
                                    : '0 10px 24px rgba(0,0,0,0.32)',
                                background: coverArtUrl
                                    ? 'transparent'
                                    : (isDaylight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)'),
                            }}
                        >
                            {coverArtUrl ? (
                                <img
                                    src={coverArtUrl}
                                    alt=""
                                    className="absolute inset-0 block h-full w-full scale-[1.02] object-cover"
                                    draggable={false}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center opacity-45" style={{ color: titleColor }}>
                                    <Disc3 size={18} strokeWidth={1.75} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={onToggleEffectsMode}
                            disabled={controlsDisabled}
                            className={`group relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[14px] transition-transform duration-180 ${
                                controlsDisabled ? 'opacity-45 cursor-not-allowed' : 'hover:scale-[1.04] active:scale-95'
                            }`}
                            style={{
                                boxShadow: isDaylight
                                    ? '0 8px 20px rgba(0,0,0,0.14)'
                                    : '0 10px 24px rgba(0,0,0,0.32)',
                                background: coverArtUrl
                                    ? 'transparent'
                                    : (isDaylight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)'),
                            }}
                            title={listeningModeLabel}
                            aria-label={listeningModeLabel}
                            data-testid="floating-player-cover-enter-effects"
                        >
                            {coverArtUrl ? (
                                <img
                                    src={coverArtUrl}
                                    alt=""
                                    className="absolute inset-0 block h-full w-full scale-[1.02] object-cover"
                                    draggable={false}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center opacity-45" style={{ color: titleColor }}>
                                    <Disc3 size={18} strokeWidth={1.75} />
                                </div>
                            )}
                            {/* Qishui-style expand cue: tap cover to enter effects mode. */}
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-70 transition-opacity duration-180 group-hover:opacity-100"
                            >
                                <Maximize2 size={16} strokeWidth={2.2} className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]" />
                            </span>
                        </button>
                    )}
                    <div className="min-w-0 max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
                        <div className="truncate text-[13px] font-bold leading-snug tracking-tight" style={{ color: titleColor }}>
                            {currentSong?.name || noTrackText}
                        </div>
                        {artistLabel ? (
                            <div className="mt-[2px] truncate text-[11px] font-normal leading-snug" style={{ color: artistColor }}>
                                {artistLabel}
                            </div>
                        ) : null}
                    </div>

                    <div className="relative shrink-0" ref={qualityMenuRef}>
                        <button
                            type="button"
                            onClick={() => {
                                if (qualityDisabled) return;
                                setQualityMenuOpen(open => !open);
                            }}
                            disabled={qualityDisabled}
                            className={`inline-flex h-8 min-w-[44px] items-center justify-center rounded-full px-2.5 text-[11px] font-semibold tracking-[0.2px] transition-colors ${buildTextChipClass(qualityMenuOpen, isDaylight, qualityDisabled)}`}
                            title={audioQualityLabel}
                            aria-label={audioQualityLabel}
                            aria-expanded={qualityMenuOpen}
                            aria-haspopup="menu"
                            data-testid="floating-player-quality-trigger"
                        >
                            {qualityLabels[audioQuality]}
                        </button>
                        {qualityMenuOpen ? (
                            <div
                                role="menu"
                                className={`absolute left-0 z-30 min-w-[132px] overflow-hidden rounded-[14px] border p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl ${
                                    isDaylight
                                        ? 'border-black/10 bg-white/95'
                                        : 'border-white/10 bg-black/82'
                                }`}
                                style={{ bottom: `calc(100% + ${FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX}px)` }}
                            >
                                {AUDIO_QUALITY_OPTIONS.map(option => {
                                    const selected = option === audioQuality;
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={selected}
                                            onClick={() => {
                                                onAudioQualityChange?.(option);
                                                setQualityMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-left text-[12px] font-extrabold transition-colors ${
                                                selected
                                                    ? (isDaylight ? 'bg-black/10 text-black' : 'bg-white/15 text-white')
                                                    : (isDaylight ? 'text-black/70 hover:bg-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')
                                            }`}
                                        >
                                            <span>{qualityLabels[option]}</span>
                                            {selected ? <span className="text-[10px] opacity-60">✓</span> : null}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={onToggleLoop}
                        disabled={controlsDisabled}
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(isDaylight, controlsDisabled, loopActive)}`}
                        title={loopMode === 'off' ? loopOffLabel : loopMode === 'one' ? loopOneLabel : loopListLabel}
                        aria-label={loopMode === 'off' ? loopOffLabel : loopMode === 'one' ? loopOneLabel : loopListLabel}
                    >
                        {loopMode === 'off'
                            ? <RepeatOff size={16} strokeWidth={TRANSPORT_ICON_STROKE} />
                            : loopMode === 'one'
                                ? <Repeat1 size={16} strokeWidth={TRANSPORT_ICON_STROKE} />
                                : <Repeat size={16} strokeWidth={TRANSPORT_ICON_STROKE} />}
                    </button>
                </div>

                <div className="flex shrink-0 items-center justify-center gap-0.5 px-1 sm:gap-1">
                    <button
                        type="button"
                        onClick={() => onPrevTrack?.()}
                        disabled={skipDisabled || !onPrevTrack}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(isDaylight, skipDisabled || !onPrevTrack)}`}
                        title={previousTrackLabel}
                        aria-label={previousTrackLabel}
                    >
                        <SkipBack size={18} strokeWidth={TRANSPORT_ICON_STROKE} />
                    </button>

                    <button
                        type="button"
                        onClick={onTogglePlay}
                        disabled={!canTogglePlay || controlsDisabled}
                        className={`mx-0.5 flex h-9 min-w-[56px] items-center justify-center rounded-full px-4 transition-transform shrink-0 sm:min-w-[64px] ${
                            controlsDisabled ? 'opacity-45 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-95'
                        }`}
                        style={{
                            backgroundColor: isDaylight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                            color: isDaylight ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.96)',
                        }}
                        title={playerState === PlayerState.PLAYING ? pauseLabel : playLabel}
                        aria-label={playerState === PlayerState.PLAYING ? pauseLabel : playLabel}
                    >
                        {playerState === PlayerState.PLAYING ? (
                            <Pause size={18} strokeWidth={TRANSPORT_ICON_STROKE} />
                        ) : (
                            <Play size={18} strokeWidth={TRANSPORT_ICON_STROKE} className="ml-0.5" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => onNextTrack?.()}
                        disabled={skipDisabled || !onNextTrack}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(isDaylight, skipDisabled || !onNextTrack)}`}
                        title={nextTrackLabel}
                        aria-label={nextTrackLabel}
                    >
                        <SkipForward size={18} strokeWidth={TRANSPORT_ICON_STROKE} />
                    </button>
                </div>

                <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5">
                    {canSwitchBackground
                        && interactive3dSceneTuning
                        && onVisualizerBackgroundModeChange
                        && onInteractive3dSceneTuningChange
                        && onVisualizerModeChange ? (
                        <FloatingPlayerBackgroundMenu
                            isDaylight={isDaylight}
                            primaryColor={titleColor}
                            disabled={controlsDisabled}
                            visualizerBackgroundMode={visualizerBackgroundMode}
                            interactive3dSceneTuning={interactive3dSceneTuning}
                            onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange}
                            onInteractive3dSceneTuningChange={onInteractive3dSceneTuningChange}
                            visualizerMode={visualizerMode}
                            onVisualizerModeChange={onVisualizerModeChange}
                            theme={theme}
                            onApplyLyricBodyColor={onApplyLyricBodyColor}
                            onApplyLyricColorPreset={onApplyLyricColorPreset}
                            onOpenChange={setBackgroundMenuOpen}
                            backgroundMenuLabel={backgroundMenuLabel}
                            modeInteractive3dLabel={backgroundModeInteractive3dLabel}
                            modeCommonLabel={backgroundModeCommonLabel}
                            modeMonetLabel={backgroundModeMonetLabel}
                            presetSectionLabel={backgroundPresetSectionLabel}
                            lyricsStyleSectionLabel={lyricsStyleSectionLabel}
                            lyricColorSectionLabel={lyricColorSectionLabel}
                            getPresetLabel={(preset) => getBackgroundPresetLabel?.(preset) || getMineradioPresetLabelFallback(preset)}
                            getVisualizerLabel={(mode) => getVisualizerModeLabel?.(mode) || mode}
                            buildToolButtonClass={(disabled, active) => buildToolButtonClass(isDaylight, disabled, active)}
                        />
                    ) : null}

                    <EmotionButton
                        compact
                        className={buildToolButtonClass(isDaylight, controlsDisabled)}
                    />

                    <button
                        type="button"
                        onClick={() => onTogglePlayerLyricsVisible?.()}
                        disabled={lyricsToggleDisabled}
                        aria-pressed={playerLyricsVisible}
                        aria-label={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                        className={`inline-flex h-8 min-w-[32px] shrink-0 items-center justify-center rounded-full px-2.5 text-[12px] font-bold transition-all duration-180 active:scale-95 ${buildModeToggleChipClass(playerLyricsVisible, isDaylight, lyricsToggleDisabled)}`}
                        title={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                    >
                        <span
                            className="leading-none select-none"
                            style={{ fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}
                        >
                            词
                        </span>
                    </button>

                    {onPlayQueueSong ? (
                        <FloatingPlayerQueueMenu
                            playQueue={playQueue}
                            currentSongId={currentSong?.id ?? null}
                            onPlaySong={onPlayQueueSong}
                            isDaylight={isDaylight}
                            open={queueMenuOpen}
                            onOpenChange={setQueueMenuOpen}
                            disabled={controlsDisabled}
                            triggerClassName={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(isDaylight, controlsDisabled, queueMenuOpen)} ${playQueue.length > 1 && !queueMenuOpen ? (isDaylight ? 'ring-1 ring-black/10' : 'ring-1 ring-white/18') : ''}`}
                            queueLabel={`${queueLabel}${playQueue.length > 0 ? ` (${playQueue.length})` : ''}`}
                        />
                    ) : null}

                    {onToggleImmersiveFullscreen ? (
                        <button
                            type="button"
                            onClick={onToggleImmersiveFullscreen}
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(isDaylight, false, isImmersiveFullscreen)}`}
                            title={isImmersiveFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
                            aria-label={isImmersiveFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
                            aria-pressed={isImmersiveFullscreen}
                        >
                            {isImmersiveFullscreen
                                ? <Minimize size={16} strokeWidth={TRANSPORT_ICON_STROKE} />
                                : <Maximize size={16} strokeWidth={TRANSPORT_ICON_STROKE} />}
                        </button>
                    ) : null}

                    <FloatingPlayerDockTime
                        currentTime={currentTime}
                        duration={duration}
                        isDaylight={isDaylight}
                    />
                </div>
            </div>
        </div>
    );
};


export default FloatingPlayerControls;

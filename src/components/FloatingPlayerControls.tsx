import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Repeat, Repeat1, RepeatOff, SkipBack, SkipForward, Disc3, AudioLines, Maximize, Minimize, ListMusic } from 'lucide-react';
import { MotionValue } from 'framer-motion';
import ProgressBar from './ProgressBar';
import FloatingPlayerBackgroundMenu from './FloatingPlayerBackgroundMenu';
import FloatingPlayerDockTime from './FloatingPlayerDockTime';
import {
    PlayerState,
    LyricData,
    Theme,
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
    FLOATING_PLAYER_PROGRESS_INSET_PX,
    resolveFloatingPlayerDockFrameStyle,
} from './floatingPlayerDockLayout';

// src/components/FloatingPlayerControls.tsx
// Mineradio-style floating dock: left meta, center transport, right tool cluster.

type AudioQuality = 'exhigh' | 'lossless' | 'hires';

type FloatingSong = {
    name: string;
    artists?: Array<{ name: string }>;
    ar?: Array<{ name: string }>;
};

const AUDIO_QUALITY_OPTIONS: AudioQuality[] = ['exhigh', 'lossless', 'hires'];

const formatSongArtists = (song: FloatingSong | null | undefined): string => {
    const names = song?.ar?.map(artist => artist.name).filter(Boolean)
        ?? song?.artists?.map(artist => artist.name).filter(Boolean)
        ?? [];
    return names.join(', ');
};

const buildLyricsToggleButtonClass = (
    playerLyricsVisible: boolean,
    isDaylight: boolean | undefined,
    controlsDisabled: boolean,
) => {
    if (controlsDisabled) {
        return 'opacity-35 cursor-not-allowed';
    }
    if (playerLyricsVisible) {
        return isDaylight
            ? 'bg-black/10 text-black'
            : 'bg-white/[0.10] text-white';
    }
    return isDaylight
        ? 'text-black/55 hover:bg-black/[0.05] hover:text-black'
        : 'text-white/70 hover:bg-white/[0.045] hover:text-white';
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
            ? 'bg-black/[0.08] text-black'
            : 'bg-white/[0.08] text-[rgba(210,244,241,0.92)]';
    }
    return isDaylight
        ? 'text-black/55 hover:bg-black/[0.05] hover:text-black'
        : 'text-white/70 hover:bg-white/[0.045] hover:text-white';
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
    onNavigateToPlaylist?: () => void;
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
    backToPlaylistLabel?: string;
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
    backgroundMenuLabel?: string;
    backgroundModeInteractive3dLabel?: string;
    backgroundModeCommonLabel?: string;
    backgroundModeMonetLabel?: string;
    backgroundPresetSectionLabel?: string;
    lyricsStyleSectionLabel?: string;
    lyricColorSectionLabel?: string;
    getBackgroundPresetLabel?: (preset: MineradioVisualPresetId) => string;
    getVisualizerModeLabel?: (mode: VisualizerMode) => string;
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
    onNavigateToPlaylist,
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
    backToPlaylistLabel = 'Back to playlist',
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
    backgroundMenuLabel = 'Background',
    backgroundModeInteractive3dLabel = '3D',
    backgroundModeCommonLabel = 'Common',
    backgroundModeMonetLabel = 'Monet',
    backgroundPresetSectionLabel = '3D style',
    lyricsStyleSectionLabel = 'Lyric style',
    lyricColorSectionLabel = 'Lyric colors',
    getBackgroundPresetLabel,
    getVisualizerModeLabel,
}) => {
    // Timeline modal kept mounted for minimal churn; dock no longer opens it.
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const showListeningEntry = currentView === 'home';
    const showBackToPlaylist = currentView === 'player' && Boolean(onNavigateToPlaylist);
    const trackColor = isDaylight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';
    const canSwitchBackground = Boolean(
        interactive3dSceneTuning
        && onVisualizerBackgroundModeChange
        && onInteractive3dSceneTuningChange
        && onVisualizerModeChange,
    );

    if (hideControlBar) {
        return null;
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
                style={resolveFloatingPlayerDockFrameStyle(isHidden)}
                data-testid="floating-player-dock-frame"
            >
                <motion.div
                    className={`relative h-full w-full overflow-visible rounded-[50px] border-0 backdrop-blur-[12px] ${
                        isDaylight ? 'bg-white/55' : 'bg-black/10'
                    }`}
                    initial={false}
                    animate={{
                        opacity: isHidden ? 0 : 0.94,
                        y: isHidden ? 16 : 0,
                    }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        maxWidth: FLOATING_PLAYER_DOCK_MAX_WIDTH_PX,
                        WebkitAppRegion: 'no-drag',
                        WebkitBackdropFilter: 'blur(12px) saturate(1.8) brightness(1.12)',
                        backdropFilter: 'blur(12px) saturate(1.8) brightness(1.12)',
                        boxShadow: isDaylight
                            ? 'inset 0 0 2px 1px rgba(255,255,255,0.55), inset 0 0 10px 4px rgba(255,255,255,0.22), 0 8px 28px rgba(17,17,26,0.08), 0 16px 48px rgba(17,17,26,0.06)'
                            : 'inset 0 0 2px 1px rgba(255,255,255,0.35), inset 0 0 10px 4px rgba(255,255,255,0.15), 0 8px 28px rgba(17,17,26,0.08), 0 16px 56px rgba(17,17,26,0.08)',
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
                        onEnterListeningMode={showListeningEntry ? onNavigateToPlayer : undefined}
                        onBackToPlaylist={showBackToPlaylist ? onNavigateToPlaylist : undefined}
                        noTrackText={noTrackText}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        trackColor={trackColor}
                        isDaylight={isDaylight}
                        controlsDisabled={controlsDisabled}
                        showLyricsLabel={showLyricsLabel}
                        hideLyricsLabel={hideLyricsLabel}
                        listeningModeLabel={listeningModeLabel}
                        backToPlaylistLabel={backToPlaylistLabel}
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
                        backgroundMenuLabel={backgroundMenuLabel}
                        backgroundModeInteractive3dLabel={backgroundModeInteractive3dLabel}
                        backgroundModeCommonLabel={backgroundModeCommonLabel}
                        backgroundModeMonetLabel={backgroundModeMonetLabel}
                        backgroundPresetSectionLabel={backgroundPresetSectionLabel}
                        lyricsStyleSectionLabel={lyricsStyleSectionLabel}
                        lyricColorSectionLabel={lyricColorSectionLabel}
                        getBackgroundPresetLabel={getBackgroundPresetLabel}
                        getVisualizerModeLabel={getVisualizerModeLabel}
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
    onEnterListeningMode?: () => void;
    onBackToPlaylist?: () => void;
    noTrackText: string;
    primaryColor: string;
    secondaryColor: string;
    trackColor?: string;
    isDaylight?: boolean;
    controlsDisabled?: boolean;
    showLyricsLabel: string;
    hideLyricsLabel: string;
    listeningModeLabel: string;
    backToPlaylistLabel: string;
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
    onEnterListeningMode,
    onBackToPlaylist,
    noTrackText,
    primaryColor,
    secondaryColor,
    trackColor,
    isDaylight,
    controlsDisabled = false,
    showLyricsLabel,
    hideLyricsLabel,
    listeningModeLabel,
    backToPlaylistLabel,
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
}) => {
    const skipDisabled = controlsDisabled || !canSkipTracks;
    const lyricsToggleDisabled = controlsDisabled || !onTogglePlayerLyricsVisible;
    const qualityDisabled = controlsDisabled || !canChangeAudioQuality || !onAudioQualityChange;
    const coverArtUrl = coverUrl ? getSizedCoverUrl(coverUrl, 96) : null;
    const artistLabel = formatSongArtists(currentSong);
    const loopActive = loopMode !== 'off';
    const mutedTransportColor = isDaylight ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.70)';
    const artistColor = isDaylight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.48)';
    const titleColor = isDaylight ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.92)';
    const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
    const qualityMenuRef = useRef<HTMLDivElement>(null);

    const qualityLabels: Record<AudioQuality, string> = {
        exhigh: qualityExhighLabel,
        lossless: qualityLosslessLabel,
        hires: qualityHiresLabel,
    };

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
                className="absolute top-[7px] z-20 overflow-visible"
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

            <div className="grid h-full grid-cols-[minmax(0,1.08fr)_auto_minmax(0,1.08fr)] items-center gap-3 px-5 pt-2.5 sm:gap-4 sm:px-6 md:px-7">
                <div className="flex min-w-0 items-center gap-3 text-left">
                    <div
                        className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px]"
                        style={{
                            boxShadow: isDaylight
                                ? '0 8px 22px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)'
                                : '0 10px 28px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.20), inset 0 0 0 1px rgba(255,255,255,0.08)',
                            background: isDaylight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)',
                        }}
                    >
                        {coverArtUrl ? (
                            <img
                                src={coverArtUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center opacity-45" style={{ color: titleColor }}>
                                <Disc3 size={20} strokeWidth={1.75} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1 max-w-[220px] sm:max-w-[280px]">
                        <div className="truncate text-[13.5px] font-bold leading-snug tracking-tight" style={{ color: titleColor }}>
                            {currentSong?.name || noTrackText}
                        </div>
                        {artistLabel ? (
                            <div className="mt-[3px] truncate text-[11.5px] font-normal leading-snug" style={{ color: artistColor }}>
                                {artistLabel}
                            </div>
                        ) : null}
                    </div>

                    {/* Mineradio: quality pill sits with track meta on the left cluster. */}
                    <div className="relative shrink-0" ref={qualityMenuRef}>
                        <button
                            type="button"
                            onClick={() => {
                                if (qualityDisabled) return;
                                setQualityMenuOpen(open => !open);
                            }}
                            disabled={qualityDisabled}
                            className={`inline-flex h-9 min-w-[56px] items-center justify-center rounded-[13px] px-[11px] text-[11px] font-extrabold tracking-[0.2px] transition-colors ${
                                qualityDisabled
                                    ? 'opacity-25 cursor-not-allowed'
                                    : qualityMenuOpen
                                        ? (isDaylight ? 'bg-black/12 text-black' : 'bg-white/[0.12] text-white')
                                        : (isDaylight
                                            ? 'bg-black/[0.04] text-black/70 hover:bg-black/[0.07]'
                                            : 'bg-white/[0.038] text-[rgba(237,245,255,0.82)] hover:bg-white/[0.07]')
                            }`}
                            style={{
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                            }}
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
                                className={`absolute bottom-[calc(100%+10px)] left-0 z-30 min-w-[132px] overflow-hidden rounded-[14px] border p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl ${
                                    isDaylight
                                        ? 'border-black/10 bg-white/95'
                                        : 'border-white/10 bg-black/82'
                                }`}
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
                </div>

                {/* Center transport: loop · prev · play · next · queue */}
                <div className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5">
                    <button
                        type="button"
                        onClick={onToggleLoop}
                        disabled={controlsDisabled}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-[11px] transition-all duration-180 ${buildToolButtonClass(isDaylight, controlsDisabled, loopActive)}`}
                        title="Loop"
                    >
                        {loopMode === 'off'
                            ? <RepeatOff size={18} strokeWidth={1.9} />
                            : loopMode === 'one'
                                ? <Repeat1 size={18} strokeWidth={1.9} />
                                : <Repeat size={18} strokeWidth={1.9} />}
                    </button>

                    <button
                        type="button"
                        onClick={() => onPrevTrack?.()}
                        disabled={skipDisabled || !onPrevTrack}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-[11px] transition-all duration-180 ${buildToolButtonClass(isDaylight, skipDisabled || !onPrevTrack)}`}
                        style={{ color: mutedTransportColor }}
                        title="Previous"
                    >
                        <SkipBack size={18} strokeWidth={1.9} />
                    </button>

                    <button
                        type="button"
                        onClick={onTogglePlay}
                        disabled={!canTogglePlay || controlsDisabled}
                        className={`mx-0.5 flex h-[46px] w-[46px] items-center justify-center rounded-full border-none transition-transform shrink-0 sm:mx-1 ${
                            controlsDisabled ? 'opacity-45 cursor-not-allowed' : 'hover:scale-[1.04] active:scale-95'
                        }`}
                        style={{
                            backgroundColor: isDaylight ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.92)',
                            color: isDaylight ? '#fff' : 'rgba(12,14,18,0.92)',
                            boxShadow: isDaylight
                                ? '0 8px 22px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)'
                                : '0 0 0 1px rgba(255,255,255,0.28), 0 8px 24px rgba(0,0,0,0.28), 0 0 28px rgba(178,229,255,0.12)',
                        }}
                    >
                        {playerState === PlayerState.PLAYING ? (
                            <Pause size={20} fill="currentColor" />
                        ) : (
                            <Play size={20} fill="currentColor" className="ml-0.5" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => onNextTrack?.()}
                        disabled={skipDisabled || !onNextTrack}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-[11px] transition-all duration-180 ${buildToolButtonClass(isDaylight, skipDisabled || !onNextTrack)}`}
                        style={{ color: mutedTransportColor }}
                        title="Next"
                    >
                        <SkipForward size={18} strokeWidth={1.9} />
                    </button>

                    {onBackToPlaylist ? (
                        <button
                            type="button"
                            onClick={onBackToPlaylist}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-[11px] transition-all duration-180 ${buildToolButtonClass(isDaylight, false)}`}
                            title={backToPlaylistLabel}
                            aria-label={backToPlaylistLabel}
                        >
                            <ListMusic size={18} strokeWidth={1.9} />
                        </button>
                    ) : (
                        <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />
                    )}
                </div>

                <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1">
                    {onEnterListeningMode ? (
                        <button
                            type="button"
                            onClick={onEnterListeningMode}
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-all duration-180 ${buildToolButtonClass(isDaylight, false)}`}
                            title={listeningModeLabel}
                            aria-label={listeningModeLabel}
                        >
                            <AudioLines size={17} strokeWidth={1.9} />
                        </button>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => onTogglePlayerLyricsVisible?.()}
                        disabled={lyricsToggleDisabled}
                        aria-pressed={playerLyricsVisible}
                        aria-label={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-all duration-180 active:scale-95 ${buildLyricsToggleButtonClass(playerLyricsVisible, isDaylight, lyricsToggleDisabled)}`}
                        title={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                    >
                        <span
                            className="text-[13px] font-bold leading-none select-none tracking-wide"
                            style={{ fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}
                        >
                            词
                        </span>
                    </button>

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
                            onApplyLyricColorPreset={onApplyLyricColorPreset}
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

                    {onToggleImmersiveFullscreen ? (
                        <button
                            type="button"
                            onClick={onToggleImmersiveFullscreen}
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-all duration-180 ${buildToolButtonClass(isDaylight, false, isImmersiveFullscreen)}`}
                            title={isImmersiveFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
                            aria-label={isImmersiveFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
                            aria-pressed={isImmersiveFullscreen}
                        >
                            {isImmersiveFullscreen
                                ? <Minimize size={17} strokeWidth={1.9} />
                                : <Maximize size={17} strokeWidth={1.9} />}
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

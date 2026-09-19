import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Play, Pause, Repeat, Repeat1, RepeatOff, SkipBack, SkipForward, Disc3, Home, Maximize, Minimize, Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MotionValue } from 'framer-motion';
import FloatingPlayerProgressRail from './FloatingPlayerProgressRail';
import FloatingPlayerBackgroundMenu from './FloatingPlayerBackgroundMenu';
import FloatingPlayerDockTime from './FloatingPlayerDockTime';
import FloatingPlayerQueueMenu from './FloatingPlayerQueueMenu';
import {
    PlayerState,
    Theme,
    SongResult,
    type Interactive3dSceneTuning,
    type MineradioVisualPresetId,
    type VisualizerBackgroundMode,
    type VisualizerMode,
} from '../types';
import type { LyricColorPresetId } from '../utils/theme/lyricColorPresets';
import { getSizedCoverUrl } from '../utils/coverUrl';
import { getMineradioPresetLabelFallback } from './visualizer/geometric/mineradioVisualPresets';
import { FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX } from './floatingPlayerDockLayout';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import {
    extendInteractive3dParticleYield,
    shouldYieldInteractive3dParticlesForVisualizerModeSwitch,
} from '../utils/visualizer/yieldInteractive3dParticlesForModeSwitch';
import { prefetchVisualizerRegistryEntries } from './visualizer/registry';

// src/components/FloatingPlayerDockedBar.tsx
// Dock transport row: meta, seek, tools, and solid (non-stacked) popovers.

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

type DockedBarProps = {
    currentSong: FloatingSong | null;
    coverUrl?: string | null;
    playerState: PlayerState;
    currentTime: MotionValue<number>;
    duration: number;
    isAudioSourceLoading?: boolean;
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
    onNavigateToHome?: () => void;
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
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    onOpenSongSettings?: () => void;
    backgroundMenuLabel: string;
    backgroundModeInteractive3dLabel: string;
    backgroundModeCommonLabel: string;
    backgroundModeMonetLabel: string;
    backgroundPresetSectionLabel: string;
    lyricsStyleSectionLabel: string;
    lyricColorSectionLabel: string;
    openSongSettingsLabel: string;
    getBackgroundPresetLabel?: (preset: MineradioVisualPresetId) => string;
    getVisualizerModeLabel?: (mode: VisualizerMode) => string;
    onDockPopoverOpenChange?: (open: boolean) => void;
    /** Reveal player view so heavy backgrounds are not covered by the home shell. */
    onEnsurePlayerView?: () => void;
    /** Shared glass: popovers must not stack a second live backdrop-filter. */
    popoverClassName: string;
    popoverStyle: CSSProperties;
};



const DockedBar: React.FC<DockedBarProps> = ({
    currentSong,
    coverUrl,
    playerState,
    currentTime,
    duration,
    isAudioSourceLoading = false,
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
    onNavigateToHome,
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
    onApplyLyricColorPreset,
    onOpenSongSettings,
    backgroundMenuLabel,
    backgroundModeInteractive3dLabel,
    backgroundModeCommonLabel,
    backgroundModeMonetLabel,
    backgroundPresetSectionLabel,
    lyricsStyleSectionLabel,
    lyricColorSectionLabel,
    openSongSettingsLabel,
    getBackgroundPresetLabel,
    getVisualizerModeLabel,
    onDockPopoverOpenChange,
    onEnsurePlayerView,
    popoverClassName,
    popoverStyle,
}) => {
    const { t } = useTranslation();
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

    // Do not hold particles for the whole menu lifetime — that froze 视觉风格 previews
    // (chip selected, WebGL stuck on the previous preset). Lyric-mode switches already
    // arm their own yield; on close, extend yield so teardown does not overlap remounts.
    useEffect(() => {
        if (!backgroundMenuOpen) return undefined;
        return () => {
            useSettingsUiStore.getState().setHoldInteractive3dParticleYield(false);
            const backgroundMode = useSettingsUiStore.getState().visualizerBackgroundMode;
            if (!shouldYieldInteractive3dParticlesForVisualizerModeSwitch(backgroundMode)) return;
            extendInteractive3dParticleYield({
                setYielding: (yielding) => {
                    useSettingsUiStore.setState({ yieldInteractive3dParticles: yielding });
                },
            });
        };
    }, [backgroundMenuOpen]);

    // Prefetch lyric-mode modules so switching 歌词走位 does not wait on lazy import.
    useEffect(() => {
        if (!backgroundMenuOpen) return;
        prefetchVisualizerRegistryEntries();
    }, [backgroundMenuOpen]);

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
            <FloatingPlayerProgressRail
                currentTime={currentTime}
                duration={duration}
                onSeek={onSeek}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                trackColor={trackColor}
                disabled={controlsDisabled}
                isLoading={isAudioSourceLoading}
                isDaylight={isDaylight}
                playQueue={playQueue}
                currentSongId={currentSong?.id}
            />

            {/* Mineradio order: cover · quality · loop · prev/play/next · home · bg · 词 · queue · fullscreen · time */}
            <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-5 pt-2.5 sm:gap-3 sm:px-6 md:px-7">
                <div className="flex min-w-0 items-center gap-2 text-left sm:gap-2.5">
                    {onToggleEffectsMode ? (
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
                            title={effectsModeActive
                                ? (t('ui.backToHome') || '返回主页')
                                : listeningModeLabel}
                            aria-label={effectsModeActive
                                ? (t('ui.backToHome') || '返回主页')
                                : listeningModeLabel}
                            data-testid={effectsModeActive
                                ? 'floating-player-cover-exit-effects'
                                : 'floating-player-cover-enter-effects'}
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
                            {/* Home: shrink cue; library dock: expand into immersive player. */}
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-70 transition-opacity duration-180 group-hover:opacity-100"
                            >
                                {effectsModeActive ? (
                                    <Minimize2 size={16} strokeWidth={2.2} className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]" />
                                ) : (
                                    <Maximize2 size={16} strokeWidth={2.2} className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]" />
                                )}
                            </span>
                        </button>
                    ) : (
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
                    )}
                    <div className="min-w-0 max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
                        <div
                            className="truncate text-[13px] font-bold leading-snug tracking-tight"
                            style={{ color: titleColor }}
                            data-testid="floating-player-dock-title"
                        >
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
                                className={`absolute left-0 z-30 min-w-[132px] overflow-hidden rounded-[14px] p-1.5 ${popoverClassName}`}
                                style={{
                                    ...popoverStyle,
                                    bottom: `calc(100% + ${FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX}px)`,
                                }}
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
                    {effectsModeActive && onNavigateToHome ? (
                        <button
                            type="button"
                            onClick={onNavigateToHome}
                            disabled={controlsDisabled}
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(isDaylight, controlsDisabled)}`}
                            title={t('ui.backToHome') || '返回主页'}
                            aria-label={t('ui.backToHome') || '返回主页'}
                            data-testid="floating-player-go-home"
                        >
                            <Home size={16} strokeWidth={TRANSPORT_ICON_STROKE} />
                        </button>
                    ) : null}

                    {canSwitchBackground
                        && interactive3dSceneTuning
                        && onVisualizerBackgroundModeChange
                        && onInteractive3dSceneTuningChange
                        && onVisualizerModeChange ? (
                        <FloatingPlayerBackgroundMenu
                            isDaylight={isDaylight}
                            disabled={controlsDisabled}
                            visualizerBackgroundMode={visualizerBackgroundMode}
                            interactive3dSceneTuning={interactive3dSceneTuning}
                            onVisualizerBackgroundModeChange={onVisualizerBackgroundModeChange}
                            onInteractive3dSceneTuningChange={onInteractive3dSceneTuningChange}
                            visualizerMode={visualizerMode}
                            onVisualizerModeChange={onVisualizerModeChange}
                            theme={theme}
                            onApplyLyricColorPreset={onApplyLyricColorPreset}
                            onOpenSongSettings={onOpenSongSettings}
                            onOpenChange={setBackgroundMenuOpen}
                            onEnsurePlayerView={onEnsurePlayerView}
                            backgroundMenuLabel={backgroundMenuLabel}
                            backgroundModeCommonLabel={backgroundModeCommonLabel}
                            presetSectionLabel={backgroundPresetSectionLabel}
                            lyricsStyleSectionLabel={lyricsStyleSectionLabel}
                            lyricColorSectionLabel={lyricColorSectionLabel}
                            openSongSettingsLabel={openSongSettingsLabel}
                            getPresetLabel={(preset) => getBackgroundPresetLabel?.(preset) || getMineradioPresetLabelFallback(preset)}
                            getVisualizerLabel={(mode) => getVisualizerModeLabel?.(mode) || mode}
                            buildToolButtonClass={(disabled, active) => buildToolButtonClass(isDaylight, disabled, active)}
                            surfaceClassName={popoverClassName}
                            surfaceStyle={popoverStyle}
                        />
                    ) : null}

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
                            surfaceClassName={`overflow-hidden rounded-[14px] p-1.5 ${popoverClassName}`}
                            surfaceStyle={popoverStyle}
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
                        isLoading={isAudioSourceLoading}
                    />
                </div>
            </div>
        </div>
    );
};



export default DockedBar;

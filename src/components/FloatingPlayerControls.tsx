import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Repeat, Repeat1, RepeatOff, ChartBar, SkipBack, SkipForward } from 'lucide-react';
import { MotionValue } from 'framer-motion';
import ProgressBar from './ProgressBar';
import { PlayerState, LyricData, Theme } from '../types';
import LyricsTimelineModal from './modal/LyricsTimelineModal';
import { getSizedCoverUrl } from '../utils/coverUrl';

const CONTROL_LAYOUT_SPRING = {
    type: 'spring' as const,
    stiffness: 280,
    damping: 24,
};

const HOVER_EXPAND_DELAY_MS = 20;
const HOVER_COLLAPSE_DELAY_MS = 100;
const HOVER_HITBOX_BOTTOM_BUFFER_PX = 32;

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
            ? 'bg-black/14 text-black ring-1 ring-black/15 shadow-[0_0_16px_rgba(0,0,0,0.10)] scale-[1.04]'
            : 'bg-white/20 text-white ring-1 ring-white/28 shadow-[0_0_20px_rgba(255,255,255,0.14)] scale-[1.04]';
    }
    return isDaylight
        ? 'opacity-35 hover:opacity-90 hover:bg-black/5'
        : 'opacity-35 hover:opacity-90 hover:bg-white/10';
};

interface FloatingPlayerControlsProps {
    currentSong: { name: string; } | null;
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
    audioSrc,
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
}) => {
    const glassBgExpanded = isDaylight ? 'bg-white/60 border border-white/20 shadow-xl' : 'bg-black/40 border border-white/5';
    const glassBgCollapsed = isDaylight ? 'bg-white/40 border border-white/20 shadow-lg hover:bg-white/50' : 'bg-black/20 border border-white/5 hover:bg-black/30';
    const trackColor = isDaylight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';

    const [isHovered, setIsHovered] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const expandTimeoutRef = useRef<number | null>(null);
    const collapseTimeoutRef = useRef<number | null>(null);

    const canAutoExpand = canTogglePlay && duration > 0;
    const showExpanded = isHovered || (canAutoExpand && playerState !== PlayerState.PLAYING && currentView !== 'home');

    useEffect(() => {
        return () => {
            if (expandTimeoutRef.current !== null) {
                window.clearTimeout(expandTimeoutRef.current);
            }
            if (collapseTimeoutRef.current !== null) {
                window.clearTimeout(collapseTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (collapseTimeoutRef.current !== null) {
            window.clearTimeout(collapseTimeoutRef.current);
            collapseTimeoutRef.current = null;
        }

        if (expandTimeoutRef.current !== null) {
            return;
        }

        expandTimeoutRef.current = window.setTimeout(() => {
            setIsHovered(true);
            expandTimeoutRef.current = null;
        }, HOVER_EXPAND_DELAY_MS);
    };

    const handleMouseLeave = () => {
        if (expandTimeoutRef.current !== null) {
            window.clearTimeout(expandTimeoutRef.current);
            expandTimeoutRef.current = null;
        }

        if (!isHovered || collapseTimeoutRef.current !== null) {
            return;
        }

        collapseTimeoutRef.current = window.setTimeout(() => {
            setIsHovered(false);
            collapseTimeoutRef.current = null;
        }, HOVER_COLLAPSE_DELAY_MS);
    };

    const handleClick = () => {
        if (currentView === 'home') {
            onNavigateToPlayer();
        }
    };

    if (hideControlBar) {
        return null;
    }

    return (
        <>
            <motion.div
                className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-60 w-full flex justify-center transition-all duration-300 pointer-events-none
                    ${currentView === 'home'
                        ? 'max-w-[calc(100vw-120px)] md:max-w-lg'
                        : 'max-w-[min(960px,calc(100vw-48px))] px-3'}`}
                initial={false}
                animate={{
                    opacity: isHidden ? 0 : 1,
                    y: isHidden ? 24 : 0,
                    scale: isHidden ? 0.97 : 1,
                }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
                style={{ pointerEvents: isHidden ? 'none' : 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="pointer-events-auto w-full flex justify-center"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        paddingBottom: `${HOVER_HITBOX_BOTTOM_BUFFER_PX}px`,
                        marginBottom: `${-HOVER_HITBOX_BOTTOM_BUFFER_PX}px`,
                    }}
                >
                    <motion.div
                        layout
                        transition={{ layout: CONTROL_LAYOUT_SPRING }}
                        onClick={handleClick}
                        className={`backdrop-blur-3xl shadow-2xl overflow-hidden cursor-pointer rounded-full relative transition-colors duration-300
                            ${showExpanded
                                ? `px-4 py-3.5 ${glassBgExpanded} w-full`
                                : `px-4 py-2 ${glassBgCollapsed} ${currentView === 'player' ? 'w-[88%] md:w-[72%]' : 'w-[80%] md:w-[60%]'}`}`}
                    >
                        <motion.div layout transition={{ layout: CONTROL_LAYOUT_SPRING }} className="w-full">
                            {showExpanded ? (
                                <ExpandedView
                                    currentSong={currentSong}
                                    coverUrl={coverUrl}
                                    playerState={playerState}
                                    currentTime={currentTime}
                                    lyricCurrentTime={lyricCurrentTime}
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
                                    onTogglePlayerLyricsVisible={onTogglePlayerLyricsVisible}
                                    onToggleTimeline={() => setIsTimelineOpen(true)}
                                    noTrackText={noTrackText}
                                    primaryColor={primaryColor}
                                    secondaryColor={secondaryColor}
                                    trackColor={trackColor}
                                    hasLyrics={!!lyrics}
                                    isDaylight={isDaylight}
                                    controlsDisabled={controlsDisabled}
                                    showLyricsLabel={showLyricsLabel}
                                    hideLyricsLabel={hideLyricsLabel}
                                />
                            ) : (
                                <CollapsedView
                                    coverUrl={coverUrl}
                                    currentTime={currentTime}
                                    duration={duration}
                                    onSeek={onSeek}
                                    primaryColor={primaryColor}
                                    secondaryColor={secondaryColor}
                                    trackColor={trackColor}
                                    controlsDisabled={controlsDisabled}
                                />
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

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

interface ExpandedViewProps {
    currentSong: { name: string; } | null;
    coverUrl?: string | null;
    playerState: PlayerState;
    currentTime: MotionValue<number>;
    lyricCurrentTime?: MotionValue<number>;
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
    onToggleTimeline: () => void;
    noTrackText: string;
    primaryColor: string;
    secondaryColor: string;
    hasLyrics: boolean;
    trackColor?: string;
    isDaylight?: boolean;
    controlsDisabled?: boolean;
    showLyricsLabel: string;
    hideLyricsLabel: string;
}

const ExpandedView: React.FC<ExpandedViewProps> = ({
    currentSong,
    coverUrl,
    playerState,
    currentTime,
    lyricCurrentTime,
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
    onToggleTimeline,
    noTrackText,
    primaryColor,
    secondaryColor,
    hasLyrics,
    trackColor,
    isDaylight,
    controlsDisabled = false,
    showLyricsLabel,
    hideLyricsLabel,
}) => {
    const iconBtnClass = isDaylight ? 'hover:bg-black/5 text-black/60' : 'hover:bg-white/10 opacity-40 hover:opacity-100';
    const skipDisabled = controlsDisabled || !canSkipTracks;
    const coverArtUrl = coverUrl ? getSizedCoverUrl(coverUrl, 96) : null;

    return (
        <>
            <div className="hidden sm:flex flex-col gap-2.5 w-full min-w-0">
                <div className="flex items-center gap-3 w-full min-w-0">
                    {coverArtUrl ? (
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-md border border-white/10">
                            <img
                                src={coverArtUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                        </div>
                    ) : null}

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrevTrack?.();
                            }}
                            disabled={skipDisabled || !onPrevTrack}
                            className={`p-2 rounded-full transition-colors ${iconBtnClass} ${skipDisabled ? 'opacity-25 cursor-not-allowed hover:opacity-25' : ''}`}
                            style={{ color: primaryColor }}
                            title="Previous"
                        >
                            <SkipBack size={18} fill="currentColor" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlay();
                            }}
                            disabled={!canTogglePlay || controlsDisabled}
                            className={`w-12 h-12 rounded-full bg-(--text-primary) text-black flex items-center justify-center transition-transform shrink-0 shadow-lg border-none ${controlsDisabled ? 'opacity-45 cursor-not-allowed' : 'hover:scale-105'}`}
                            style={{ backgroundColor: primaryColor, color: 'var(--bg-color)' }}
                        >
                            {playerState === PlayerState.PLAYING ? (
                                <Pause size={20} fill="currentColor" />
                            ) : (
                                <Play size={20} fill="currentColor" className="ml-1" />
                            )}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNextTrack?.();
                            }}
                            disabled={skipDisabled || !onNextTrack}
                            className={`p-2 rounded-full transition-colors ${iconBtnClass} ${skipDisabled ? 'opacity-25 cursor-not-allowed hover:opacity-25' : ''}`}
                            style={{ color: primaryColor }}
                            title="Next"
                        >
                            <SkipForward size={18} fill="currentColor" />
                        </button>
                    </div>

                    <div className="flex-1 min-w-0 text-center text-sm font-bold truncate px-2" style={{ color: primaryColor }}>
                        {currentSong?.name || noTrackText}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleLoop();
                            }}
                            disabled={controlsDisabled}
                            className={`p-2 rounded-full transition-colors ${loopMode !== 'off' ? (isDaylight ? 'bg-black/10 text-black' : 'bg-white/20') : 'opacity-40 hover:opacity-100'} ${controlsDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
                            style={{ color: primaryColor }}
                        >
                            {loopMode === 'off'
                                ? <RepeatOff size={18} />
                                : loopMode === 'one'
                                    ? <Repeat1 size={18} />
                                    : <Repeat size={18} />}
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlayerLyricsVisible?.();
                            }}
                            disabled={controlsDisabled || !onTogglePlayerLyricsVisible}
                            aria-pressed={playerLyricsVisible}
                            aria-label={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                            className={`p-2 rounded-full transition-all duration-200 active:scale-95 ${buildLyricsToggleButtonClass(playerLyricsVisible, isDaylight, controlsDisabled || !onTogglePlayerLyricsVisible)}`}
                            style={{ color: playerLyricsVisible ? undefined : primaryColor }}
                            title={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                        >
                            <span
                                className="text-[15px] font-bold leading-none select-none"
                                style={{ fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}
                            >
                                词
                            </span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleTimeline();
                            }}
                            disabled={!hasLyrics}
                            className={`p-2 rounded-full transition-colors ${!hasLyrics ? 'opacity-20 cursor-not-allowed' : `opacity-40 hover:opacity-100 ${isDaylight ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}`}
                            style={{ color: primaryColor }}
                            title="View Lyrics Timeline"
                        >
                            <ChartBar size={18} />
                        </button>
                    </div>
                </div>

                <div className="w-full px-1">
                    <ProgressBar
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={onSeek}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        trackColor={trackColor}
                        disabled={controlsDisabled}
                    />
                </div>
            </div>

            <div className="sm:hidden flex flex-col gap-2 w-full">
                <div className="flex items-center gap-3 px-2">
                    {coverArtUrl ? (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg shadow-md border border-white/10">
                            <img
                                src={coverArtUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                        </div>
                    ) : null}
                    <div className="flex-1 text-center text-sm font-bold truncate" style={{ color: primaryColor }}>
                        {currentSong?.name || noTrackText}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLoop();
                        }}
                        disabled={controlsDisabled}
                        className={`p-2 rounded-full transition-colors ${loopMode !== 'off' ? 'bg-white/20' : 'opacity-40 hover:opacity-100'} ${controlsDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
                        style={{ color: primaryColor }}
                    >
                        {loopMode === 'off'
                            ? <RepeatOff size={20} />
                            : loopMode === 'one'
                                ? <Repeat1 size={20} />
                                : <Repeat size={20} />}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPrevTrack?.();
                        }}
                        disabled={skipDisabled || !onPrevTrack}
                        className={`p-2 rounded-full transition-colors opacity-40 hover:opacity-100 ${skipDisabled ? 'opacity-25 cursor-not-allowed hover:opacity-25' : ''}`}
                        style={{ color: primaryColor }}
                    >
                        <SkipBack size={20} fill="currentColor" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePlay();
                        }}
                        disabled={!canTogglePlay || controlsDisabled}
                        className={`w-12 h-12 rounded-full bg-(--text-primary) text-black flex items-center justify-center transition-transform shrink-0 shadow-lg border-none ${controlsDisabled ? 'opacity-45 cursor-not-allowed' : 'hover:scale-105'}`}
                        style={{ backgroundColor: primaryColor, color: 'var(--bg-color)' }}
                    >
                        {playerState === PlayerState.PLAYING ? (
                            <Pause size={20} fill="currentColor" />
                        ) : (
                            <Play size={20} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNextTrack?.();
                        }}
                        disabled={skipDisabled || !onNextTrack}
                        className={`p-2 rounded-full transition-colors opacity-40 hover:opacity-100 ${skipDisabled ? 'opacity-25 cursor-not-allowed hover:opacity-25' : ''}`}
                        style={{ color: primaryColor }}
                    >
                        <SkipForward size={20} fill="currentColor" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePlayerLyricsVisible?.();
                        }}
                        disabled={controlsDisabled || !onTogglePlayerLyricsVisible}
                        aria-pressed={playerLyricsVisible}
                        aria-label={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                        className={`p-2 rounded-full transition-all duration-200 active:scale-95 ${buildLyricsToggleButtonClass(playerLyricsVisible, isDaylight, controlsDisabled || !onTogglePlayerLyricsVisible)}`}
                        style={{ color: playerLyricsVisible ? undefined : primaryColor }}
                        title={playerLyricsVisible ? hideLyricsLabel : showLyricsLabel}
                    >
                        <span
                            className="text-[16px] font-bold leading-none select-none"
                            style={{ fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif" }}
                        >
                            词
                        </span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleTimeline();
                        }}
                        disabled={!hasLyrics}
                        className={`p-2 rounded-full transition-colors ${!hasLyrics ? 'opacity-20 cursor-not-allowed' : `opacity-40 hover:opacity-100 ${isDaylight ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}`}
                        style={{ color: primaryColor }}
                        title="View Lyrics Timeline"
                    >
                        <ChartBar size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full px-2">
                    <div className="flex-1">
                        <ProgressBar
                            currentTime={currentTime}
                            duration={duration}
                            onSeek={onSeek}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                            disabled={controlsDisabled}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

interface CollapsedViewProps {
    coverUrl?: string | null;
    currentTime: MotionValue<number>;
    duration: number;
    onSeek: (time: number) => void;
    primaryColor: string;
    secondaryColor: string;
    trackColor?: string;
    controlsDisabled?: boolean;
}

const CollapsedView: React.FC<CollapsedViewProps> = ({
    coverUrl,
    currentTime,
    duration,
    onSeek,
    primaryColor,
    secondaryColor,
    trackColor,
    controlsDisabled = false,
}) => {
    const coverArtUrl = coverUrl ? getSizedCoverUrl(coverUrl, 64) : null;

    return (
        <div className="flex items-center w-full gap-3 h-8 px-2">
            {coverArtUrl ? (
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <img
                        src={coverArtUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                    />
                </div>
            ) : null}
            <div className="flex-1 min-w-0">
                <ProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={onSeek}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    trackColor={trackColor}
                    disabled={controlsDisabled}
                />
            </div>
        </div>
    );
};

export default FloatingPlayerControls;

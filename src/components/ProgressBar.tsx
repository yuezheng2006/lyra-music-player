import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { MotionValue, useMotionValueEvent } from 'framer-motion';
import { formatTime } from '../utils/appPlaybackHelpers';
import { resolveProgressFillPercentForUi } from '../utils/playback/mediaClockIsolationMath';

// src/components/ProgressBar.tsx
// Playback scrubber; edge variant is a Qishui-style top-rail progress for the docked bar.

interface ProgressBarProps {
    currentTime: MotionValue<number>;
    duration: number;
    onSeek: (time: number) => void;
    onSeekStart?: () => void;
    onSeekEnd?: () => void;
    primaryColor?: string;
    secondaryColor?: string;
    trackColor?: string;
    disabled?: boolean;
    /** True while the next track URL is resolving — freeze scrubber + show loading rail. */
    isLoading?: boolean;
    isDaylight?: boolean;
    /** default: 带时间标签；edge: 贴顶细线进度，悬停/拖动显示时间气泡 */
    variant?: 'default' | 'edge';
    previousLabel?: string;
    nextLabel?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    currentTime,
    duration,
    onSeek,
    onSeekStart,
    onSeekEnd,
    primaryColor = 'white',
    secondaryColor = 'rgba(255,255,255,0.5)',
    trackColor = 'rgba(255,255,255,0.1)',
    disabled = false,
    isLoading = false,
    isDaylight = false,
    variant = 'default',
    previousLabel,
    nextLabel,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const trackRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const isLoadingRef = useRef(isLoading);
    const interactionDisabled = disabled || isLoading;

    useEffect(() => {
        isDraggingRef.current = isDragging;
    }, [isDragging]);

    useEffect(() => {
        isLoadingRef.current = isLoading;
        if (isLoading) {
            setIsDragging(false);
            setIsHovering(false);
        }
    }, [isLoading]);

    // Keep the latest media time in a ref so hover tooltips can read it without
    // React state. Never setState from the MotionValue clock — re-renders reset
    // the fill `width: 0%` style and freeze the scrubber while the time label still moves.
    const latestTimeRef = useRef(0);

    const applyProgress = (value: number) => {
        const displayValue = isLoadingRef.current ? 0 : value;
        latestTimeRef.current = displayValue;
        const percent = resolveProgressFillPercentForUi(displayValue, duration, isLoadingRef.current);
        if (trackRef.current) {
            trackRef.current.style.setProperty('--progress', `${percent}%`);
        }
        if (progressRef.current) {
            progressRef.current.style.width = `${percent}%`;
        }
        if (timeRef.current) {
            timeRef.current.innerText = isLoadingRef.current ? '--:--' : formatTime(displayValue);
        }
        if (inputRef.current) {
            inputRef.current.value = displayValue.toString();
        }
        if (tooltipRef.current) {
            tooltipRef.current.style.left = `${percent}%`;
            const label = tooltipRef.current.querySelector('[data-testid="progress-edge-tooltip-label"]');
            if (label) {
                label.textContent = isLoadingRef.current
                    ? '…'
                    : `${formatTime(displayValue)} / ${formatTime(duration)}`;
            }
        }
    };

    const updateUI = (value: number, skipDragCheck = false) => {
        if (!skipDragCheck && isDraggingRef.current) return;
        applyProgress(value);
    };

    useLayoutEffect(() => {
        updateUI(currentTime.get(), true);
    }, []);

    useEffect(() => {
        updateUI(currentTime.get(), true);
    }, [duration, isLoading]);

    useMotionValueEvent(currentTime, 'change', (latest: number) => {
        updateUI(latest);
    });

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        if (interactionDisabled) return;
        applyProgress(Number(e.currentTarget.value));
    };

    const isEdge = variant === 'edge';
    const showEdgeTooltip = isEdge && !interactionDisabled && (isDragging || isHovering);
    const edgeTrackColor = isDaylight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.22)';
    const edgeFillColor = isDaylight ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)';
    const edgeThumbBorder = isDaylight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.35)';

    const trackClass = isEdge
        ? `relative h-4 w-full flex items-center group overflow-visible ${interactionDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`
        : `relative h-1.5 flex-1 min-w-[120px] rounded-sm md:rounded-full flex items-center group overflow-hidden ${interactionDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`;
    const fillClass = isEdge
        ? `absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full pointer-events-none transition-[height] duration-150 ${isDragging || isHovering ? 'h-[4px]' : ''}`
        : 'absolute top-0 left-0 h-full rounded-sm md:rounded-full pointer-events-none';
    const loadingRailClass = isEdge
        ? `absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full pointer-events-none ${isDragging || isHovering ? 'h-[4px]' : ''}`
        : 'absolute inset-0 overflow-hidden rounded-sm md:rounded-full pointer-events-none';

    const loadingRail = isLoading ? (
        <div
            className={loadingRailClass}
            style={{ backgroundColor: isEdge ? (trackColor || edgeTrackColor) : undefined }}
            data-testid="progress-loading-rail"
            aria-hidden
        >
            <div
                className="progress-audio-loading-shimmer absolute inset-y-0 w-1/3 rounded-full"
                style={{
                    background: isEdge
                        ? `linear-gradient(90deg, transparent, ${edgeFillColor}, transparent)`
                        : `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                    opacity: isDaylight ? 0.55 : 0.7,
                }}
            />
        </div>
    ) : null;

    const rangeInput = (
        <>
            {!isEdge ? (
                isLoading ? loadingRail : (
                    <div
                        ref={progressRef}
                        className={fillClass}
                        // Width is owned by applyProgress DOM writes — do not bake width:0% into React style.
                        style={{ width: undefined, backgroundColor: primaryColor }}
                    />
                )
            ) : (
                <>
                    {isLoading ? loadingRail : (
                        <>
                            <div
                                className={`absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full pointer-events-none transition-[height] duration-150 ${isDragging || isHovering ? 'h-[4px]' : ''}`}
                                style={{ backgroundColor: trackColor || edgeTrackColor }}
                            />
                            <div
                                ref={progressRef}
                                className={fillClass}
                                style={{ width: undefined, backgroundColor: edgeFillColor }}
                            />
                            <div
                                className={`pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-transform duration-150 ${
                                    isDragging || isHovering ? 'scale-110' : 'scale-100'
                                }`}
                                style={{
                                    left: 'var(--progress, 0%)',
                                    boxShadow: `0 0 0 1px ${edgeThumbBorder}, 0 1px 4px rgba(0,0,0,0.28)`,
                                }}
                            />
                        </>
                    )}
                    <div
                        ref={tooltipRef}
                        className={`pointer-events-none absolute bottom-[calc(100%+8px)] z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium tabular-nums shadow-lg transition-opacity duration-150 ${
                            showEdgeTooltip ? 'opacity-100' : 'opacity-0'
                        } ${isDaylight ? 'bg-zinc-900/90 text-white' : 'bg-black/85 text-white'}`}
                        style={{ left: 'var(--progress, 0%)' }}
                        data-testid="progress-edge-tooltip"
                    >
                        {/* Text painted in applyProgress — avoid React children resetting on hover toggles. */}
                        <span data-testid="progress-edge-tooltip-label">0:00 / {formatTime(duration)}</span>
                        {previousLabel ? (
                            <div className="mt-0.5 max-w-[220px] truncate text-[10px] opacity-70">{previousLabel}</div>
                        ) : null}
                        {nextLabel ? (
                            <div className="max-w-[220px] truncate text-[10px] opacity-70">{nextLabel}</div>
                        ) : null}
                        <span
                            className={`absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent ${
                                isDaylight ? 'border-t-zinc-900/90' : 'border-t-black/85'
                            }`}
                        />
                    </div>
                </>
            )}
            <input
                ref={inputRef}
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                disabled={interactionDisabled}
                defaultValue={0}
                onMouseEnter={() => {
                    if (!interactionDisabled) setIsHovering(true);
                }}
                onMouseLeave={() => {
                    if (!isDraggingRef.current) setIsHovering(false);
                }}
                onMouseDown={() => {
                    if (interactionDisabled) return;
                    setIsDragging(true);
                    setIsHovering(true);
                    onSeekStart?.();
                }}
                onTouchStart={() => {
                    if (interactionDisabled) return;
                    setIsDragging(true);
                    setIsHovering(true);
                    onSeekStart?.();
                }}
                onInput={handleInput}
                onChange={() => {}}
                onMouseUp={(e) => {
                    if (interactionDisabled) return;
                    setIsDragging(false);
                    setIsHovering(false);
                    onSeek(Number(e.currentTarget.value));
                    onSeekEnd?.();
                }}
                onTouchEnd={(e) => {
                    if (interactionDisabled) return;
                    setIsDragging(false);
                    setIsHovering(false);
                    onSeek(Number(e.currentTarget.value));
                    onSeekEnd?.();
                }}
                onClick={(e) => e.stopPropagation()}
                className={`absolute inset-0 w-full h-full opacity-0 ${interactionDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                aria-busy={isLoading || undefined}
            />
        </>
    );

    if (isEdge) {
        return (
            <div
                ref={trackRef}
                className={trackClass}
                style={{ ['--progress' as string]: '0%' }}
                data-testid="progress-edge-track"
                data-loading={isLoading ? 'true' : undefined}
            >
                {rangeInput}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 w-full" data-loading={isLoading ? 'true' : undefined}>
            <span
                ref={timeRef}
                className="text-[10px] font-mono font-medium opacity-60 w-10 shrink-0 text-right tabular-nums"
                style={{ color: secondaryColor }}
            >
                {isLoading ? '--:--' : '00:00'}
            </span>

            <div ref={trackRef} className={trackClass} style={{ backgroundColor: trackColor }}>
                {rangeInput}
            </div>

            <span className="text-[10px] font-mono font-medium opacity-60 w-10 shrink-0 tabular-nums" style={{ color: secondaryColor }}>
                {isLoading ? '--:--' : formatTime(duration)}
            </span>
        </div>
    );
};

export default ProgressBar;

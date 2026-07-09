import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { MotionValue, useMotionValueEvent } from 'framer-motion';
import { formatTime } from '../utils/appPlaybackHelpers';

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
    isDaylight?: boolean;
    /** default: 带时间标签；edge: 贴顶细线进度，悬停/拖动显示时间气泡 */
    variant?: 'default' | 'edge';
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
    isDaylight = false,
    variant = 'default',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [previewTime, setPreviewTime] = useState(0);

    const trackRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        isDraggingRef.current = isDragging;
    }, [isDragging]);

    const applyProgress = (value: number) => {
        const percent = duration > 0 ? Math.min(100, Math.max(0, (value / duration) * 100)) : 0;
        if (trackRef.current) {
            trackRef.current.style.setProperty('--progress', `${percent}%`);
        }
        if (progressRef.current) {
            progressRef.current.style.width = `${percent}%`;
        }
        if (timeRef.current) {
            timeRef.current.innerText = formatTime(value);
        }
        if (inputRef.current) {
            inputRef.current.value = value.toString();
        }
        if (tooltipRef.current) {
            tooltipRef.current.style.left = `${percent}%`;
        }
        setPreviewTime(value);
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
    }, [duration]);

    useMotionValueEvent(currentTime, 'change', (latest: number) => {
        updateUI(latest);
    });

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        if (disabled) return;
        applyProgress(Number(e.currentTarget.value));
    };

    const isEdge = variant === 'edge';
    const showEdgeTooltip = isEdge && !disabled && (isDragging || isHovering);
    const edgeTrackColor = isDaylight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.22)';
    const edgeFillColor = isDaylight ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)';
    const edgeThumbBorder = isDaylight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.35)';

    const trackClass = isEdge
        ? `relative h-4 w-full flex items-center group overflow-visible ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`
        : `relative h-1.5 flex-1 min-w-[120px] rounded-sm md:rounded-full flex items-center group ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`;
    const fillClass = isEdge
        ? `absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full pointer-events-none transition-[height] duration-150 ${isDragging || isHovering ? 'h-[3px]' : ''}`
        : 'absolute top-0 left-0 h-full rounded-sm md:rounded-full pointer-events-none';

    const rangeInput = (
        <>
            {!isEdge ? (
                <div
                    ref={progressRef}
                    className={fillClass}
                    style={{ width: '0%', backgroundColor: primaryColor }}
                />
            ) : (
                <>
                    <div
                        className={`absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full pointer-events-none transition-[height] duration-150 ${isDragging || isHovering ? 'h-[3px]' : ''}`}
                        style={{ backgroundColor: trackColor || edgeTrackColor }}
                    />
                    <div
                        ref={progressRef}
                        className={fillClass}
                        style={{ width: '0%', backgroundColor: edgeFillColor }}
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
                    <div
                        ref={tooltipRef}
                        className={`pointer-events-none absolute bottom-[calc(100%+8px)] z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium tabular-nums shadow-lg transition-opacity duration-150 ${
                            showEdgeTooltip ? 'opacity-100' : 'opacity-0'
                        } ${isDaylight ? 'bg-zinc-900/90 text-white' : 'bg-black/85 text-white'}`}
                        style={{ left: 'var(--progress, 0%)' }}
                        data-testid="progress-edge-tooltip"
                    >
                        {formatTime(previewTime)} / {formatTime(duration)}
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
                disabled={disabled}
                defaultValue={0}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => {
                    if (!isDraggingRef.current) setIsHovering(false);
                }}
                onMouseDown={() => {
                    if (disabled) return;
                    setIsDragging(true);
                    setIsHovering(true);
                    onSeekStart?.();
                }}
                onTouchStart={() => {
                    if (disabled) return;
                    setIsDragging(true);
                    setIsHovering(true);
                    onSeekStart?.();
                }}
                onInput={handleInput}
                onChange={() => {}}
                onMouseUp={(e) => {
                    if (disabled) return;
                    setIsDragging(false);
                    setIsHovering(false);
                    onSeek(Number(e.currentTarget.value));
                    onSeekEnd?.();
                }}
                onTouchEnd={(e) => {
                    if (disabled) return;
                    setIsDragging(false);
                    setIsHovering(false);
                    onSeek(Number(e.currentTarget.value));
                    onSeekEnd?.();
                }}
                onClick={(e) => e.stopPropagation()}
                className={`absolute inset-0 w-full h-full opacity-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
            >
                {rangeInput}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 w-full">
            <span
                ref={timeRef}
                className="text-[10px] font-mono font-medium opacity-60 w-10 shrink-0 text-right tabular-nums"
                style={{ color: secondaryColor }}
            >
                00:00
            </span>

            <div ref={trackRef} className={trackClass} style={{ backgroundColor: trackColor }}>
                {rangeInput}
            </div>

            <span className="text-[10px] font-mono font-medium opacity-60 w-10 shrink-0 tabular-nums" style={{ color: secondaryColor }}>
                {formatTime(duration)}
            </span>
        </div>
    );
};

export default ProgressBar;

import React, { useLayoutEffect, useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import { formatTime } from '../utils/appPlaybackHelpers';

// src/components/FloatingPlayerDockTime.tsx
// Mineradio-style elapsed / duration label; updates via DOM to avoid React churn.

type FloatingPlayerDockTimeProps = {
    currentTime: MotionValue<number>;
    duration: number;
    isDaylight?: boolean;
    /** Freeze elapsed clock while the next track audio URL is resolving. */
    isLoading?: boolean;
};

const FloatingPlayerDockTime: React.FC<FloatingPlayerDockTimeProps> = ({
    currentTime,
    duration,
    isDaylight,
    isLoading = false,
}) => {
    const labelRef = useRef<HTMLSpanElement>(null);
    const isLoadingRef = useRef(isLoading);
    isLoadingRef.current = isLoading;

    const paint = (value: number) => {
        if (!labelRef.current) return;
        if (isLoadingRef.current) {
            labelRef.current.textContent = '--:-- / --:--';
            return;
        }
        labelRef.current.textContent = `${formatTime(value)} / ${formatTime(duration)}`;
    };

    useLayoutEffect(() => {
        paint(currentTime.get());
    }, [duration, isLoading]);

    useMotionValueEvent(currentTime, 'change', paint);

    return (
        <span
            ref={labelRef}
            className={`hidden shrink-0 tabular-nums text-[11px] font-medium tracking-wide sm:inline ${
                isDaylight ? 'text-black/45' : 'text-white/48'
            }`}
            data-testid="floating-player-dock-time"
            data-loading={isLoading ? 'true' : undefined}
            aria-hidden
        >
            {isLoading ? '--:-- / --:--' : `${formatTime(currentTime.get())} / ${formatTime(duration)}`}
        </span>
    );
};

export default FloatingPlayerDockTime;

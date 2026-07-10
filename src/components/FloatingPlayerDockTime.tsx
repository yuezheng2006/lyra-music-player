import React, { useLayoutEffect, useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import { formatTime } from '../utils/appPlaybackHelpers';

// src/components/FloatingPlayerDockTime.tsx
// Mineradio-style elapsed / duration label; updates via DOM to avoid React churn.

type FloatingPlayerDockTimeProps = {
    currentTime: MotionValue<number>;
    duration: number;
    isDaylight?: boolean;
};

const FloatingPlayerDockTime: React.FC<FloatingPlayerDockTimeProps> = ({
    currentTime,
    duration,
    isDaylight,
}) => {
    const labelRef = useRef<HTMLSpanElement>(null);

    const paint = (value: number) => {
        if (labelRef.current) {
            labelRef.current.textContent = `${formatTime(value)} / ${formatTime(duration)}`;
        }
    };

    useLayoutEffect(() => {
        paint(currentTime.get());
    }, [duration]);

    useMotionValueEvent(currentTime, 'change', paint);

    return (
        <span
            ref={labelRef}
            className={`hidden shrink-0 tabular-nums text-[11px] font-medium tracking-wide sm:inline ${
                isDaylight ? 'text-black/45' : 'text-white/48'
            }`}
            data-testid="floating-player-dock-time"
            aria-hidden
        >
            {`${formatTime(currentTime.get())} / ${formatTime(duration)}`}
        </span>
    );
};

export default FloatingPlayerDockTime;

import { useState } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';

// src/hooks/useNowPlayingToastCountdown.ts
// Discrete next-up preview flag. Equality-guarded so currentTime ticks do not rerender.

export const NEXT_UP_LEAD_SEC = 5;

type UseNowPlayingToastCountdownParams = {
    currentTime: MotionValue<number>;
    durationSec: number;
    enabled: boolean;
    hasNextUp: boolean;
};

/** True in the last NEXT_UP_LEAD_SEC of the current track when a successor exists. */
export const useNowPlayingToastCountdown = ({
    currentTime,
    durationSec,
    enabled,
    hasNextUp,
}: UseNowPlayingToastCountdownParams): boolean => {
    const [countdownActive, setCountdownActive] = useState(false);

    useMotionValueEvent(currentTime, 'change', (time) => {
        const shouldPreview = enabled
            && hasNextUp
            && Number.isFinite(durationSec)
            && durationSec > 0
            && durationSec - time > 0
            && durationSec - time <= NEXT_UP_LEAD_SEC;
        setCountdownActive(prev => (prev === shouldPreview ? prev : shouldPreview));
    });

    return countdownActive;
};

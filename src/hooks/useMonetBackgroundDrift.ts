import { useEffect, type RefObject } from 'react';
import { buildMonetDriftTrack } from '../components/visualizer/backgrounds/monetBackgroundDrift';

// src/hooks/useMonetBackgroundDrift.ts
// Plays the Monet drift track on the compositor via Web Animations API.

const prefersReducedMotion = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

export const useMonetBackgroundDrift = (
    ref: RefObject<HTMLDivElement | null>,
    enabled: boolean,
    strength: number,
) => {
    useEffect(() => {
        const element = ref.current;
        if (!element || !enabled || strength <= 0 || typeof element.animate !== 'function') {
            return;
        }

        let animation: Animation | null = null;
        const start = () => {
            animation?.cancel();
            animation = prefersReducedMotion()
                ? null
                : (() => {
                    const track = buildMonetDriftTrack(strength);
                    return element.animate(track.keyframes, {
                        duration: track.durationMs,
                        iterations: Infinity,
                        easing: 'linear',
                    });
                })();
        };

        start();
        const motionQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-reduced-motion: reduce)')
            : null;
        motionQuery?.addEventListener('change', start);
        return () => {
            motionQuery?.removeEventListener('change', start);
            animation?.cancel();
        };
    }, [enabled, ref, strength]);
};

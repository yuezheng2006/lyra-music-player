import { useEffect, type RefObject } from 'react';
import { buildMonetDriftTrack } from '../components/visualizer/backgrounds/monetBackgroundDrift';
import { useReducedMotionFor } from './useReducedMotionFor';

// src/hooks/useMonetBackgroundDrift.ts
// Plays the Monet drift track on the compositor via Web Animations API.

export const useMonetBackgroundDrift = (
    ref: RefObject<HTMLDivElement | null>,
    enabled: boolean,
    strength: number,
) => {
    const reduceBackgroundMotion = useReducedMotionFor('monetBackground');

    useEffect(() => {
        const element = ref.current;
        if (!element || !enabled || strength <= 0 || typeof element.animate !== 'function') {
            return;
        }

        let animation: Animation | null = null;
        const start = () => {
            animation?.cancel();
            animation = reduceBackgroundMotion
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
        return () => {
            animation?.cancel();
        };
    }, [enabled, reduceBackgroundMotion, ref, strength]);
};

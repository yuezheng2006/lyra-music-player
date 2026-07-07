import { useEffect, useRef } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';

// src/components/visualizer/geometric/useGeometricPointer.ts
// Normalized pointer position throttled to one update per animation frame.

export const useGeometricPointer = (): {
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
} => {
    const pointerX = useMotionValue(0.5);
    const pointerY = useMotionValue(0.5);
    const pendingRef = useRef<{ x: number; y: number; } | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const flush = () => {
            rafRef.current = null;
            const pending = pendingRef.current;
            if (!pending) return;
            pointerX.set(pending.x);
            pointerY.set(pending.y);
            pendingRef.current = null;
        };

        const handleMove = (event: MouseEvent) => {
            pendingRef.current = {
                x: event.clientX / Math.max(1, window.innerWidth),
                y: event.clientY / Math.max(1, window.innerHeight),
            };
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(flush);
            }
        };

        window.addEventListener('mousemove', handleMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', handleMove);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [pointerX, pointerY]);

    return { pointerX, pointerY };
};

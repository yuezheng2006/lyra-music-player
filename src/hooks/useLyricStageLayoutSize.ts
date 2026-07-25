import { useLayoutEffect, useState, type RefObject } from 'react';
import { resolveLyricStageLayoutSize } from '../utils/lyrics/resolveLyricStageLayoutSizeMath';

// src/hooks/useLyricStageLayoutSize.ts
// Measure lyric stage shell size; never stamp a fake 240px width from unlaid-out frames.

const readWindowFallbackWidth = () => (
    typeof window === 'undefined' ? 960 : Math.max(320, window.innerWidth - 220)
);

const readWindowFallbackHeight = () => (
    typeof window === 'undefined' ? 720 : Math.max(420, window.innerHeight)
);

/**
 * Observe the lyric stage + visualizer shell. Skips 0-width frames and remeasures on
 * fullscreen / chrome-hide so classic max-width cannot stick at ~156px.
 */
export const useLyricStageLayoutSize = (
    stageRef: RefObject<HTMLElement | null>,
    remountKey?: string | number | boolean,
) => {
    const [stageWidth, setStageWidth] = useState(readWindowFallbackWidth);
    const [shellHeight, setShellHeight] = useState(readWindowFallbackHeight);

    useLayoutEffect(() => {
        const node = stageRef.current;
        if (!node || typeof ResizeObserver === 'undefined') return undefined;

        const shell = (node.closest('[data-visualizer-shell="true"]') as HTMLElement | null)
            ?? node.parentElement;

        const apply = () => {
            const fallbackWidth = readWindowFallbackWidth();
            const fallbackHeight = readWindowFallbackHeight();
            const resolved = resolveLyricStageLayoutSize({
                nodeWidth: node.offsetWidth || 0,
                shellWidth: shell?.clientWidth || shell?.offsetWidth || 0,
                shellHeight: shell?.clientHeight || shell?.offsetHeight || 0,
                fallbackWidth,
                fallbackHeight,
            });
            // Keep last good width if this frame was unlaid-out (avoid 240px floor stamp).
            if (resolved.widthFromMeasure) {
                setStageWidth((prev) => (prev === resolved.width ? prev : resolved.width));
            } else {
                setStageWidth((prev) => (prev >= 320 ? prev : resolved.width));
            }
            setShellHeight((prev) => (prev === resolved.height ? prev : resolved.height));
        };

        apply();
        // Second pass after layout/paint — first fullscreen frame often reports 0 width.
        const raf = window.requestAnimationFrame(apply);
        const observer = new ResizeObserver(() => apply());
        observer.observe(node);
        if (shell) observer.observe(shell);
        window.addEventListener('resize', apply);
        document.addEventListener('fullscreenchange', apply);

        return () => {
            window.cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener('resize', apply);
            document.removeEventListener('fullscreenchange', apply);
        };
    }, [stageRef, remountKey]);

    return { stageWidth, shellHeight };
};

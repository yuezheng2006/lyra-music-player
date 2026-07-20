import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  computeMagneticPullGoal,
  isMagneticPullIdle,
  stepMagneticPull,
  type MagneticPullPoint,
} from '../utils/ui/magneticPullMath';

// src/hooks/useMagneticPull.ts
// Soft magnetic chip pull via refs + rAF (no per-frame React state).

type UseMagneticPullOptions = {
  strength?: number;
  maxPull?: number;
  enabled?: boolean;
};

/**
 * Apply soft magnetic translate3d to target while pointer is over host.
 * Stops the rAF loop when idle; respects prefers-reduced-motion.
 */
export function useMagneticPull(
  hostRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
  { strength = 0.2, maxPull = 10, enabled = true }: UseMagneticPullOptions = {},
) {
  const pullRef = useRef<MagneticPullPoint>({ x: 0, y: 0 });
  const goalRef = useRef<MagneticPullPoint>({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    const target = targetRef.current;
    if (!host || !target || !enabled) {
      if (target) target.style.transform = '';
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      target.style.transform = '';
      return;
    }

    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    const applyTransform = (pull: MagneticPullPoint) => {
      if (pull.x === 0 && pull.y === 0) {
        target.style.transform = '';
        return;
      }
      target.style.transform = `translate3d(${pull.x.toFixed(2)}px, ${pull.y.toFixed(2)}px, 0)`;
    };

    const tick = () => {
      pullRef.current = stepMagneticPull(pullRef.current, goalRef.current);
      if (isMagneticPullIdle(pullRef.current, goalRef.current)) {
        pullRef.current = { x: 0, y: 0 };
        applyTransform(pullRef.current);
        activeRef.current = false;
        stopLoop();
        return;
      }
      applyTransform(pullRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (activeRef.current) return;
      activeRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      goalRef.current = computeMagneticPullGoal(
        event.clientX,
        event.clientY,
        rect.left,
        rect.top,
        rect.width,
        rect.height,
        strength,
        maxPull,
      );
      ensureLoop();
    };

    const onLeave = () => {
      goalRef.current = { x: 0, y: 0 };
      ensureLoop();
    };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);

    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      stopLoop();
      activeRef.current = false;
      goalRef.current = { x: 0, y: 0 };
      pullRef.current = { x: 0, y: 0 };
      target.style.transform = '';
    };
  }, [enabled, hostRef, maxPull, strength, targetRef]);
}

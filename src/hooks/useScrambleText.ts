import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { buildScrambleFrame, scrambleRevealedCount } from '../utils/ui/scrambleTextMath';

// src/hooks/useScrambleText.ts
// DOM-driven scramble reveal (no per-frame React state).

type UseScrambleTextOptions = {
  text: string;
  /** Changes when a new scramble should play (e.g. emotion id). */
  playKey: string | number;
  targetRef: RefObject<HTMLElement | null>;
  durationMs?: number;
  enabled?: boolean;
  /** Called once when scramble finishes (or is skipped). */
  onComplete?: () => void;
};

/**
 * Write scramble frames to targetRef.textContent via rAF.
 */
export function useScrambleText({
  text,
  playKey,
  targetRef,
  durationMs = 780,
  enabled = true,
  onComplete,
}: UseScrambleTextOptions) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!enabled || reducedMotion || !text) {
      target.textContent = text;
      onCompleteRef.current?.();
      return;
    }

    const started = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / durationMs);
      const revealed = scrambleRevealedCount(text, progress);
      target.textContent = progress >= 1 ? text : buildScrambleFrame(text, revealed);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, enabled, playKey, targetRef, text]);
}

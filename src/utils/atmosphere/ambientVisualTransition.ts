// src/utils/atmosphere/ambientVisualTransition.ts
// Pure cross-fade helpers for ambient visual strategy switching.

/** Default cross-fade duration in seconds (Ticket 05: 2–3s). */
export const DEFAULT_AMBIENT_TRANSITION_DURATION = 2.5;

/**
 * Compute cross-fade opacities for a linear transition progress in [0, 1].
 */
export function resolveAmbientCrossFade(progress: number): {
  fadeOut: number;
  fadeIn: number;
} {
  const clamped = Math.min(1, Math.max(0, progress));
  return {
    fadeOut: 1 - clamped,
    fadeIn: clamped,
  };
}

/**
 * Advance transition progress by deltaTime / duration.
 * Returns the new progress clamped to [0, 1].
 */
export function advanceAmbientTransitionProgress(
  progress: number,
  deltaTime: number,
  durationSec: number,
): number {
  const safeDuration = Math.max(0.05, durationSec);
  return Math.min(1, Math.max(0, progress + deltaTime / safeDuration));
}

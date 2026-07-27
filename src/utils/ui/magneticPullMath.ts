// src/utils/ui/magneticPullMath.ts
// Soft magnetic pull goal from pointer vs host center (EmotionButton Variant A).

export type MagneticPullPoint = { x: number; y: number };

/**
 * Compute damped pull toward the pointer within maxPull.
 */
export function computeMagneticPullGoal(
  pointerX: number,
  pointerY: number,
  hostLeft: number,
  hostTop: number,
  hostWidth: number,
  hostHeight: number,
  strength: number,
  maxPull: number,
): MagneticPullPoint {
  const cx = hostLeft + hostWidth / 2;
  const cy = hostTop + hostHeight / 2;
  const dx = pointerX - cx;
  const dy = pointerY - cy;
  const dist = Math.hypot(dx, dy) || 1;
  const reach = Math.max(hostWidth, hostHeight) * 1.8;
  const falloff = Math.max(0, 1 - dist / reach);
  return {
    x: clamp(-maxPull, maxPull, dx * strength * falloff),
    y: clamp(-maxPull, maxPull, dy * strength * falloff),
  };
}

/**
 * Exponential lerp step toward a magnetic goal.
 */
export function stepMagneticPull(
  current: MagneticPullPoint,
  goal: MagneticPullPoint,
  smoothing = 0.18,
): MagneticPullPoint {
  return {
    x: current.x + (goal.x - current.x) * smoothing,
    y: current.y + (goal.y - current.y) * smoothing,
  };
}

/**
 * True when pull has settled at origin (safe to stop rAF).
 */
export function isMagneticPullIdle(pull: MagneticPullPoint, goal: MagneticPullPoint, epsilon = 0.02): boolean {
  return (
    goal.x === 0 &&
    goal.y === 0 &&
    Math.abs(pull.x) < epsilon &&
    Math.abs(pull.y) < epsilon
  );
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

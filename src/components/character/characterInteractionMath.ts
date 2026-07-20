import type { CharacterActionId } from '../../types/character';

// src/components/character/characterInteractionMath.ts
// Pure helpers for Ticket 09 click / hover interaction (cooldown, highlight, specials).

/** Minimum gap between accepted character clicks (ms). */
export const CHARACTER_CLICK_COOLDOWN_MS = 3500;

/** How long a special action owns the mixer before rhythm resumes (seconds). */
export const CHARACTER_SPECIAL_ACTION_DURATION_SEC = 2.2;

/** Raycast sample interval — keep pointer work off every frame. */
export const CHARACTER_RAYCAST_INTERVAL_MS = 48;

/** Hover emissive fade speed (units per second toward target 0–1). */
export const CHARACTER_HOVER_FADE_SPEED = 8;

export type CharacterSpecialActionId = Extract<CharacterActionId, 'wave' | 'spin'>;

/**
 * True when enough time has passed since the last accepted click.
 */
export function canAcceptCharacterClick(
  nowMs: number,
  lastClickAtMs: number | null,
  cooldownMs: number = CHARACTER_CLICK_COOLDOWN_MS,
): boolean {
  if (lastClickAtMs == null) return true;
  return nowMs - lastClickAtMs >= cooldownMs;
}

/**
 * Alternate wave / spin so repeated clicks feel varied.
 */
export function resolveNextSpecialAction(
  lastSpecial: CharacterSpecialActionId | null,
): CharacterSpecialActionId {
  return lastSpecial === 'wave' ? 'spin' : 'wave';
}

/**
 * Whether interaction still owns the character (blocks rhythm playAction).
 */
export function isSpecialActionActive(
  nowSec: number,
  interactionUntilSec: number | null,
): boolean {
  return interactionUntilSec != null && nowSec < interactionUntilSec;
}

/**
 * Throttle raycasts so mousemove does not hit every animation frame.
 */
export function shouldSampleCharacterRaycast(
  nowMs: number,
  lastSampleAtMs: number | null,
  intervalMs: number = CHARACTER_RAYCAST_INTERVAL_MS,
): boolean {
  if (lastSampleAtMs == null) return true;
  return nowMs - lastSampleAtMs >= intervalMs;
}

/**
 * Smooth hover intensity toward 0 or 1.
 */
export function stepHoverIntensity(
  current: number,
  hovered: boolean,
  dtSec: number,
  speed: number = CHARACTER_HOVER_FADE_SPEED,
): number {
  const target = hovered ? 1 : 0;
  const next = current + (target - current) * Math.min(1, Math.max(0, dtSec * speed));
  return Math.min(1, Math.max(0, next));
}

/**
 * Map hover intensity onto a soft warm emissive (r,g,b in 0–1).
 */
export function resolveHoverEmissive(intensity: number): { r: number; g: number; b: number } {
  const t = Math.min(1, Math.max(0, intensity));
  return {
    r: 0.55 * t,
    g: 0.42 * t,
    b: 0.28 * t,
  };
}

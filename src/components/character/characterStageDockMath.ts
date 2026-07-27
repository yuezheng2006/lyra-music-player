import type { CSSProperties } from 'react';

// src/components/character/characterStageDockMath.ts
// Corner-dock geometry for Interactive Character — companion, not a fullscreen hero.

/** Player companion: clear of center lyrics and the floating dock. */
export const CHARACTER_DOCK_SIZE = 'min(36vw, 240px)';

/** @deprecated Same as CHARACTER_DOCK_SIZE — immersive must not invent a fox hero mode. */
export const CHARACTER_DOCK_NORMAL_SIZE = CHARACTER_DOCK_SIZE;
/** @deprecated Immersive keeps the same companion size; only bottom inset changes. */
export const CHARACTER_DOCK_IMMERSIVE_SIZE = CHARACTER_DOCK_SIZE;

const CHARACTER_DOCK_RIGHT_INSET =
  'max(12px, env(safe-area-inset-right, 0px))';
const CHARACTER_DOCK_BOTTOM_NORMAL =
  'calc(var(--app-player-bar-height, 72px) + 16px + env(safe-area-inset-bottom, 0px))';
/** Bar reserve is already 0 in immersive; keep a small stage margin. */
const CHARACTER_DOCK_BOTTOM_IMMERSIVE =
  'calc(20px + env(safe-area-inset-bottom, 0px))';

export type CharacterStageDockLayout = {
  width: string;
  height: string;
  right: string;
  bottom: string;
};

/**
 * Resolve corner-dock CSS for the fox companion.
 * Immersive (= chrome-hide / fullscreen play) only lifts the dock above the
 * vanished bar — size stays companion-scale. No dedicated character fullscreen.
 */
export function resolveCharacterStageDockLayout(
  immersive = false,
): CharacterStageDockLayout {
  return {
    width: CHARACTER_DOCK_SIZE,
    height: CHARACTER_DOCK_SIZE,
    right: CHARACTER_DOCK_RIGHT_INSET,
    bottom: immersive ? CHARACTER_DOCK_BOTTOM_IMMERSIVE : CHARACTER_DOCK_BOTTOM_NORMAL,
  };
}

/** Absolute-position style for the character dock wrapper. */
export function resolveCharacterStageDockStyle(
  immersive = false,
): CSSProperties {
  const layout = resolveCharacterStageDockLayout(immersive);
  return {
    right: layout.right,
    bottom: layout.bottom,
    width: layout.width,
    height: layout.height,
    pointerEvents: 'auto',
  };
}

import { colorWithAlpha } from '../../colorMix';
import type { InteractiveBackgroundPalette } from './types';

// src/components/visualizer/geometric/interactiveBackground/buildInteractiveBackgroundPalette.ts
// Theme colors mapped to canvas-friendly palette stops.

export const buildInteractiveBackgroundPalette = (
    primary: string,
    secondary: string,
    accent: string,
): InteractiveBackgroundPalette => ({
    primary,
    secondary,
    accent,
    primarySoft: colorWithAlpha(primary, 0.08),
    secondarySoft: colorWithAlpha(secondary, 0.06),
    accentSoft: colorWithAlpha(accent, 0.10),
});

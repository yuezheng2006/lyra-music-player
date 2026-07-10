import type { AtmosphereThemeHints, Interactive3dSceneTuning } from '../../types';
import { resolveStoredInteractive3dSceneTuning } from '../../components/visualizer/geometric/interactive3dSceneRegistry';

// src/utils/atmosphere/applyAtmosphereThemeHints.ts
// Applies AI/theme atmosphere intensity hints onto interactive 3D scene tuning.
// Never overrides the normalized user-selected visualPreset (3D style).

const pickNumber = (value: unknown): number | undefined => (
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
);

/** Merges atmosphere intensity hints; keeps the current 3D visual style untouched. */
export const applyAtmosphereThemeHintsToTuning = (
    current: Interactive3dSceneTuning,
    hints: AtmosphereThemeHints | null | undefined,
): Interactive3dSceneTuning | null => {
    if (!hints) return null;

    const merged: Partial<Interactive3dSceneTuning> = { ...current };
    const rhythmIntensity = pickNumber(hints.rhythmIntensity);
    const cinemaShake = pickNumber(hints.cinemaShake);
    const atmosphereSensitivity = pickNumber(hints.atmosphereSensitivity);
    const cameraPunchStrength = pickNumber(hints.cameraPunchStrength);

    if (rhythmIntensity !== undefined) merged.rhythmIntensity = rhythmIntensity;
    if (cinemaShake !== undefined) merged.cinemaShake = cinemaShake;
    if (atmosphereSensitivity !== undefined) merged.atmosphereSensitivity = atmosphereSensitivity;
    if (cameraPunchStrength !== undefined) merged.cameraPunchStrength = cameraPunchStrength;
    // Keep user-selected 3D style sticky across song/theme changes.
    merged.visualPreset = current.visualPreset;

    const next = resolveStoredInteractive3dSceneTuning(merged);

    const changed = (
        next.rhythmIntensity !== current.rhythmIntensity
        || next.cinemaShake !== current.cinemaShake
        || next.atmosphereSensitivity !== current.atmosphereSensitivity
        || next.cameraPunchStrength !== current.cameraPunchStrength
    );
    return changed ? next : null;
};

import { useCallback } from 'react';
import type { DualTheme, Interactive3dSceneTuning } from '../types';
import { applyAtmosphereThemeHintsToTuning } from '../utils/atmosphere/applyAtmosphereThemeHints';
import { deriveAtmosphereThemeHints } from '../utils/atmosphere/deriveAtmosphereThemeHints';

// src/hooks/useAtmosphereThemeBridge.ts
// Bridges AI dual-theme atmosphere intensity into interactive 3D tuning.
// User-selected visualPreset (3D style) is never overwritten on song change.

type UseAtmosphereThemeBridgeParams = {
    getCurrentTuning: () => Interactive3dSceneTuning;
    onTuningChange: (patch: Partial<Interactive3dSceneTuning>) => void;
};

export function useAtmosphereThemeBridge({
    getCurrentTuning,
    onTuningChange,
}: UseAtmosphereThemeBridgeParams) {
    return useCallback((dualTheme: DualTheme) => {
        const hints = deriveAtmosphereThemeHints(dualTheme);
        const next = applyAtmosphereThemeHintsToTuning(getCurrentTuning(), hints);
        if (!next) return;
        onTuningChange(next);
    }, [getCurrentTuning, onTuningChange]);
}

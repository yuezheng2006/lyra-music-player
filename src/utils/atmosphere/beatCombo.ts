// src/utils/atmosphere/beatCombo.ts
// Four-beat grid combo labels shared with Mineradio beat maps.

import type { BeatCombo } from '../../types/atmosphere';

export const comboFromGridIndex = (index: number): BeatCombo => {
    const slot = Math.abs(index) % 4;
    if (slot === 0) return 'downbeat';
    if (slot === 1) return 'push';
    if (slot === 2) return 'drop';
    return 'rebound';
};

export const getComboLift = (combo?: BeatCombo | null): number => {
    if (combo === 'downbeat') return 0.08;
    if (combo === 'drop') return 0.04;
    return 0;
};

export const resolveAccentCombo = (
    combo: BeatCombo,
    kickStrength: number,
): BeatCombo => {
    if (kickStrength > 0.84 && combo !== 'downbeat') {
        return 'accent';
    }
    return combo;
};

import type { BeatEvent } from '../../types/atmosphere';
import { getComboLift } from './beatCombo';
import { clamp01, clampRange } from './math';

// src/utils/atmosphere/triggerScheduledBeat.ts
// Mineradio triggerScheduledBeat pulse formula for scheduled beat events.

export const cameraDynamicsScale = (
    cinemaScale: number,
    extra = 1,
): number => clampRange((cinemaScale || 0.82) * extra, 0.18, 1.42);

export const computeScheduledBeatPulse = (
    beat: BeatEvent | number,
    cinemaScale: number,
): number => {
    const strength = typeof beat === 'number'
        ? 0.42
        : clamp01(beat.strength ?? 0.42);
    const impact = typeof beat === 'number'
        ? strength
        : clamp01(beat.impact ?? strength);

    if (impact < 0.18 && strength < 0.52) return 0;
    if (cinemaScale < 0.52 && impact < 0.46 && strength < 0.74) return 0;

    const body = typeof beat === 'number' ? 0 : clamp01(beat.body ?? 0);
    const combo = typeof beat === 'number' ? null : beat.combo;
    const comboLift = getComboLift(combo);
    const dynScale = cameraDynamicsScale(cinemaScale, 0.88 + impact * 0.16);

    const pulse = (0.14 + strength * 0.46 + impact * 0.18 + body * 0.08 + comboLift) * dynScale;
    return Math.min(0.78, pulse);
};

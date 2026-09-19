import { clampMediaVolume } from '@/utils/appPlaybackHelpers';

// src/utils/playback/parseVolumeCommandInput.ts
// Parse palette volume input: 50 / 50% → 0.5, 0.3 → 0.3.

export const parseVolumeCommandInput = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const percent = trimmed.endsWith('%');
    const numeric = Number(trimmed.replace(/%/g, '').trim());
    if (!Number.isFinite(numeric)) return null;
    const factor = percent || numeric > 1 ? numeric / 100 : numeric;
    return clampMediaVolume(factor);
};

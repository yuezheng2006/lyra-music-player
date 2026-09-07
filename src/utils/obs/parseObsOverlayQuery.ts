import type { VisualizerMode } from '../../types';
import { VISUALIZER_REGISTRY_META } from '../../components/visualizer/registryMeta';

// src/utils/obs/parseObsOverlayQuery.ts
// OBS browser-source URL overrides: mode, fontScale, offsetMs, transparent, hideBg.

const REGISTERED_MODES = new Set(VISUALIZER_REGISTRY_META.map(entry => entry.mode));

export type ObsOverlayQueryOverrides = {
    mode: VisualizerMode | null;
    fontScale: number | null;
    offsetMs: number;
    transparent: boolean | null;
    hideBackground: boolean | null;
    hideSubtitle: boolean | null;
};

const parseFlag = (value: string | null): boolean | null => {
    if (value == null || value === '') return null;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return null;
};

const parseNumber = (value: string | null): number | null => {
    if (value == null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

export const parseObsOverlayQuery = (search: string | URLSearchParams): ObsOverlayQueryOverrides => {
    const params = typeof search === 'string' ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search) : search;
    const modeRaw = params.get('mode')?.trim() || '';
    const fontScaleRaw = parseNumber(params.get('fontScale') ?? params.get('size'));
    const offsetRaw = parseNumber(params.get('offsetMs') ?? params.get('offset'));

    return {
        mode: REGISTERED_MODES.has(modeRaw as VisualizerMode) ? modeRaw as VisualizerMode : null,
        fontScale: fontScaleRaw == null ? null : Math.max(0.5, Math.min(2, fontScaleRaw)),
        offsetMs: offsetRaw == null ? 0 : Math.max(-8000, Math.min(8000, offsetRaw)),
        transparent: parseFlag(params.get('transparent')),
        hideBackground: parseFlag(params.get('hideBg') ?? params.get('hideBackground')),
        hideSubtitle: parseFlag(params.get('hideSubtitle')),
    };
};

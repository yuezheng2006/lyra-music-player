import { useCallback, useEffect, useRef } from 'react';
import type { DualTheme, Interactive3dSceneTuning } from '../types';
import type { TrackAtmosphereSongMeta } from '../types/trackAtmosphereLightPlan';
import { applyAtmosphereThemeHintsToTuning } from '../utils/atmosphere/applyAtmosphereThemeHints';
import { deriveAtmosphereThemeHints } from '../utils/atmosphere/deriveAtmosphereThemeHints';
import { resolveTrackAtmosphereLightPlan } from '../utils/atmosphere/resolveTrackAtmosphereLightPlan';
import { mergeAtmosphereHintsWithTrackPlan } from '../utils/atmosphere/trackAtmosphereLightPlanMath';

// src/hooks/useTrackAtmosphereLightPlanBridge.ts
// Merges curated track light plans into atmosphere intensity on theme/song apply.
// Never overwrites user-selected visualPreset.

type UseTrackAtmosphereLightPlanBridgeParams = {
    songMeta: TrackAtmosphereSongMeta | null;
    getDualTheme?: () => DualTheme | null | undefined;
    getCurrentTuning: () => Interactive3dSceneTuning;
    onTuningChange: (patch: Partial<Interactive3dSceneTuning>) => void;
};

const songMetaKey = (meta: TrackAtmosphereSongMeta | null) => {
    if (!meta) return '';
    return `${meta.songId ?? ''}::${meta.artist ?? ''}::${meta.title ?? ''}`;
};

export function useTrackAtmosphereLightPlanBridge({
    songMeta,
    getDualTheme,
    getCurrentTuning,
    onTuningChange,
}: UseTrackAtmosphereLightPlanBridgeParams) {
    const applyMergedHints = useCallback((
        dualTheme: DualTheme | null | undefined,
        meta: TrackAtmosphereSongMeta | null,
    ) => {
        const themeHints = dualTheme
            ? deriveAtmosphereThemeHints(dualTheme)
            : {};
        const resolved = resolveTrackAtmosphereLightPlan(meta);
        const hints = mergeAtmosphereHintsWithTrackPlan(
            themeHints,
            resolved?.plan ?? null,
        );
        if (
            hints.rhythmIntensity === undefined
            && hints.cinemaShake === undefined
            && hints.atmosphereSensitivity === undefined
            && hints.cameraPunchStrength === undefined
        ) {
            return;
        }
        const next = applyAtmosphereThemeHintsToTuning(getCurrentTuning(), hints);
        if (!next) return;
        onTuningChange(next);
    }, [getCurrentTuning, onTuningChange]);

    const applyFromTheme = useCallback((dualTheme: DualTheme) => {
        applyMergedHints(dualTheme, songMeta);
    }, [applyMergedHints, songMeta]);

    const lastSongKeyRef = useRef('');
    useEffect(() => {
        const key = songMetaKey(songMeta);
        if (!key || key === lastSongKeyRef.current) return;
        lastSongKeyRef.current = key;
        applyMergedHints(getDualTheme?.() ?? null, songMeta);
    }, [songMeta, getDualTheme, applyMergedHints]);

    return applyFromTheme;
}

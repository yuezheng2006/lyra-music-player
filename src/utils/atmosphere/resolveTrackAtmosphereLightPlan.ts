import { listBundledTrackAtmosphereLightPlans } from '../../data/atmosphereLightPlans';
import type {
    TrackAtmosphereLightPlan,
    TrackAtmosphereSongMeta,
} from '../../types/trackAtmosphereLightPlan';
import { findLocalTrackAtmosphereLightPlan } from './localTrackAtmosphereLightPlanCache';
import { findMatchingTrackAtmosphereLightPlan } from './trackAtmosphereLightPlanMath';

// src/utils/atmosphere/resolveTrackAtmosphereLightPlan.ts
// Resolves a track light plan: local override → bundled catalog → null.

export type ResolveTrackAtmosphereLightPlanResult = {
    plan: TrackAtmosphereLightPlan;
    source: 'local' | 'bundled';
};

/** Local overrides win over bundled curated plans. */
export const resolveTrackAtmosphereLightPlan = (
    meta: TrackAtmosphereSongMeta | null | undefined,
): ResolveTrackAtmosphereLightPlanResult | null => {
    if (!meta) return null;

    const local = findLocalTrackAtmosphereLightPlan(meta);
    if (local) {
        return { plan: local, source: 'local' };
    }

    const bundled = findMatchingTrackAtmosphereLightPlan(
        listBundledTrackAtmosphereLightPlans(),
        meta,
    );
    if (bundled) {
        return { plan: bundled, source: 'bundled' };
    }

    return null;
};

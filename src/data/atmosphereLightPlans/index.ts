import type { TrackAtmosphereLightPlan } from '../../types/trackAtmosphereLightPlan';
import { sanitizeTrackAtmosphereLightPlan } from '../../utils/atmosphere/trackAtmosphereLightPlanMath';
import { BUNDLED_TRACK_ATMOSPHERE_LIGHT_PLAN_CATALOG } from './catalog';

// src/data/atmosphereLightPlans/index.ts
// Bundled curated track atmosphere / light plans shipped with the app.

const bundledPlans: TrackAtmosphereLightPlan[] = BUNDLED_TRACK_ATMOSPHERE_LIGHT_PLAN_CATALOG
    .map((entry) => sanitizeTrackAtmosphereLightPlan(entry))
    .filter((plan): plan is TrackAtmosphereLightPlan => Boolean(plan));

/** Returns sanitized bundled plans (immutable snapshot). */
export const listBundledTrackAtmosphereLightPlans = (): TrackAtmosphereLightPlan[] => (
    bundledPlans.map((plan) => ({ ...plan }))
);

export const getBundledTrackAtmosphereLightPlanById = (
    id: string,
): TrackAtmosphereLightPlan | null => (
    bundledPlans.find((plan) => plan.id === id) ?? null
);

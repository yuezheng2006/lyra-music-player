import type {
    TrackAtmosphereLightPlan,
    TrackAtmosphereSongMeta,
} from '../../types/trackAtmosphereLightPlan';
import { listBundledTrackAtmosphereLightPlans } from '../../data/atmosphereLightPlans';
import { listLocalTrackAtmosphereLightPlans } from './localTrackAtmosphereLightPlanCache';
import { resolveTrackAtmosphereLightPlan } from './resolveTrackAtmosphereLightPlan';
import {
    buildTrackAtmosphereFingerprint,
    sanitizeTrackAtmosphereLightPlan,
} from './trackAtmosphereLightPlanMath';

// src/utils/atmosphere/trackAtmosphereLightPlanSettingsMath.ts
// Pure helpers for the track atmosphere light plan settings surface.

export type TrackAtmosphereLightPlanCatalogRow = {
    plan: TrackAtmosphereLightPlan;
    source: 'local' | 'bundled';
    activeForSong: boolean;
};

export const buildTrackAtmosphereLightPlanCatalogRows = (
    meta: TrackAtmosphereSongMeta | null | undefined,
): TrackAtmosphereLightPlanCatalogRow[] => {
    const resolved = resolveTrackAtmosphereLightPlan(meta);
    const activeId = resolved?.plan.id ?? null;
    const localIds = new Set(listLocalTrackAtmosphereLightPlans().map((plan) => plan.id));

    const locals = listLocalTrackAtmosphereLightPlans().map((plan) => ({
        plan,
        source: 'local' as const,
        activeForSong: activeId === plan.id && resolved?.source === 'local',
    }));

    const bundled = listBundledTrackAtmosphereLightPlans()
        .filter((plan) => !localIds.has(plan.id))
        .map((plan) => ({
            plan,
            source: 'bundled' as const,
            activeForSong: activeId === plan.id && resolved?.source === 'bundled',
        }));

    return [...locals, ...bundled];
};

export const describeTrackAtmosphereSongMatch = (
    meta: TrackAtmosphereSongMeta | null | undefined,
) => {
    const fingerprint = buildTrackAtmosphereFingerprint(meta?.artist, meta?.title);
    const resolved = resolveTrackAtmosphereLightPlan(meta);
    return {
        fingerprint,
        resolved,
        songId: meta?.songId != null ? String(meta.songId) : null,
        title: meta?.title ?? null,
        artist: meta?.artist ?? null,
    };
};

export const serializeTrackAtmosphereLightPlan = (plan: TrackAtmosphereLightPlan): string => (
    JSON.stringify(plan, null, 2)
);

/** Parse one plan or `{ plans: [...] }` export payload. */
export const parseTrackAtmosphereLightPlanImport = (
    raw: string,
): { plans: TrackAtmosphereLightPlan[]; errors: string[] } => {
    const errors: string[] = [];
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { plans: [], errors: ['invalid-json'] };
    }

    const candidates = Array.isArray(parsed)
        ? parsed
        : (parsed && typeof parsed === 'object' && Array.isArray((parsed as { plans?: unknown[] }).plans)
            ? (parsed as { plans: unknown[] }).plans
            : [parsed]);

    const plans: TrackAtmosphereLightPlan[] = [];
    candidates.forEach((candidate, index) => {
        const plan = sanitizeTrackAtmosphereLightPlan(candidate);
        if (!plan) {
            errors.push(`invalid-plan:${index}`);
            return;
        }
        plans.push(plan);
    });
    return { plans, errors };
};

import type { TrackAtmosphereLightPlan } from '../../types/trackAtmosphereLightPlan';
import {
    listTrackAtmosphereLightPlanMatchKeys,
    sanitizeTrackAtmosphereLightPlan,
    trackAtmosphereLightPlanMatches,
} from './trackAtmosphereLightPlanMath';
import type { TrackAtmosphereSongMeta } from '../../types/trackAtmosphereLightPlan';

// src/utils/atmosphere/localTrackAtmosphereLightPlanCache.ts
// Local overrides for curated track atmosphere / light plans.

const STORE_KEY = 'lyra-track-atmosphere-light-plan-v1';
const MAX_ENTRIES = 64;

type CacheFile = {
    updatedAt: number;
    plans: Record<string, TrackAtmosphereLightPlan>;
};

const emptyFile = (): CacheFile => ({ updatedAt: 0, plans: {} });

const readCacheFile = (): CacheFile => {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return emptyFile();
        const parsed = JSON.parse(raw) as Partial<CacheFile>;
        if (!parsed || typeof parsed !== 'object' || !parsed.plans || typeof parsed.plans !== 'object') {
            return emptyFile();
        }
        const plans: Record<string, TrackAtmosphereLightPlan> = {};
        for (const [id, value] of Object.entries(parsed.plans)) {
            const sanitized = sanitizeTrackAtmosphereLightPlan(value);
            if (sanitized) plans[id] = sanitized;
        }
        return {
            updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
            plans,
        };
    } catch {
        return emptyFile();
    }
};

const writeCacheFile = (file: CacheFile) => {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(file));
    } catch {
        // Quota or private mode — ignore persistence failures.
    }
};

const trimCacheFile = (file: CacheFile): CacheFile => {
    const ids = Object.keys(file.plans);
    if (ids.length <= MAX_ENTRIES) return file;
    // Drop arbitrary extras beyond cap; prefer keeping newest write via re-upsert order.
    const ranked = ids.slice(0, ids.length - MAX_ENTRIES);
    const nextPlans = { ...file.plans };
    for (const id of ranked) {
        delete nextPlans[id];
    }
    return { ...file, plans: nextPlans };
};

export const listLocalTrackAtmosphereLightPlans = (): TrackAtmosphereLightPlan[] => (
    Object.values(readCacheFile().plans)
);

export const getLocalTrackAtmosphereLightPlanById = (
    id: string,
): TrackAtmosphereLightPlan | null => (
    readCacheFile().plans[id] ?? null
);

/** Find a local override matching the playing song. */
export const findLocalTrackAtmosphereLightPlan = (
    meta: TrackAtmosphereSongMeta | null | undefined,
): TrackAtmosphereLightPlan | null => {
    if (!meta) return null;
    for (const plan of listLocalTrackAtmosphereLightPlans()) {
        if (trackAtmosphereLightPlanMatches(plan, meta)) return plan;
    }
    return null;
};

/** Upsert a sanitized local plan override. Returns the stored plan or null if invalid. */
export const upsertLocalTrackAtmosphereLightPlan = (
    value: unknown,
): TrackAtmosphereLightPlan | null => {
    const plan = sanitizeTrackAtmosphereLightPlan(value);
    if (!plan) return null;
    const file = readCacheFile();
    file.plans[plan.id] = plan;
    file.updatedAt = Date.now();
    writeCacheFile(trimCacheFile(file));
    return plan;
};

export const removeLocalTrackAtmosphereLightPlan = (idOrMatchKey: string): boolean => {
    const file = readCacheFile();
    if (file.plans[idOrMatchKey]) {
        delete file.plans[idOrMatchKey];
        file.updatedAt = Date.now();
        writeCacheFile(file);
        return true;
    }

    // Also allow removal by match key (id:… / fp:…).
    let removed = false;
    for (const [id, plan] of Object.entries(file.plans)) {
        const keys = listTrackAtmosphereLightPlanMatchKeys(plan);
        if (keys.includes(idOrMatchKey) || keys.some((key) => key.endsWith(`:${idOrMatchKey}`))) {
            delete file.plans[id];
            removed = true;
        }
    }
    if (removed) {
        file.updatedAt = Date.now();
        writeCacheFile(file);
    }
    return removed;
};

export const clearLocalTrackAtmosphereLightPlanCache = () => {
    try {
        localStorage.removeItem(STORE_KEY);
    } catch {
        // ignore
    }
};

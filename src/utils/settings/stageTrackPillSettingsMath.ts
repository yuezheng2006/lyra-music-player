// src/utils/settings/stageTrackPillSettingsMath.ts
// Persistence for the now-playing card on the lyrics / home surfaces.

export type StageTrackPillMode = 'auto' | 'always' | 'never';

export const STAGE_TRACK_PILL_MODE_STORAGE_KEY = 'stage_track_pill_mode';
export const STAGE_TRACK_PILL_TIMEOUT_STORAGE_KEY = 'stage_track_pill_timeout_sec';
export const STAGE_TRACK_PILL_ON_HOME_STORAGE_KEY = 'stage_track_pill_on_home';

export const DEFAULT_STAGE_TRACK_PILL_MODE: StageTrackPillMode = 'auto';
export const DEFAULT_STAGE_TRACK_PILL_TIMEOUT_SEC = 10;

export const parseStageTrackPillMode = (value: unknown): StageTrackPillMode => (
    value === 'always' || value === 'never' ? value : DEFAULT_STAGE_TRACK_PILL_MODE
);

export const clampStageTrackPillTimeoutSec = (value: unknown): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_STAGE_TRACK_PILL_TIMEOUT_SEC;
    return Math.max(3, Math.min(60, Math.round(parsed)));
};

export const readStoredStageTrackPillMode = (): StageTrackPillMode => {
    if (typeof window === 'undefined') return DEFAULT_STAGE_TRACK_PILL_MODE;
    return parseStageTrackPillMode(localStorage.getItem(STAGE_TRACK_PILL_MODE_STORAGE_KEY));
};

export const persistStageTrackPillMode = (mode: StageTrackPillMode): StageTrackPillMode => {
    const next = parseStageTrackPillMode(mode);
    if (typeof window !== 'undefined') {
        localStorage.setItem(STAGE_TRACK_PILL_MODE_STORAGE_KEY, next);
    }
    return next;
};

export const readStoredStageTrackPillTimeoutSec = (): number => {
    if (typeof window === 'undefined') return DEFAULT_STAGE_TRACK_PILL_TIMEOUT_SEC;
    return clampStageTrackPillTimeoutSec(localStorage.getItem(STAGE_TRACK_PILL_TIMEOUT_STORAGE_KEY));
};

export const persistStageTrackPillTimeoutSec = (timeoutSec: number): number => {
    const next = clampStageTrackPillTimeoutSec(timeoutSec);
    if (typeof window !== 'undefined') {
        localStorage.setItem(STAGE_TRACK_PILL_TIMEOUT_STORAGE_KEY, String(next));
    }
    return next;
};

export const readStoredStageTrackPillOnHome = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STAGE_TRACK_PILL_ON_HOME_STORAGE_KEY) === 'true';
};

export const persistStageTrackPillOnHome = (enabled: boolean): boolean => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STAGE_TRACK_PILL_ON_HOME_STORAGE_KEY, enabled ? 'true' : 'false');
    }
    return enabled;
};

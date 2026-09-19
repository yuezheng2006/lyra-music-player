// src/utils/settings/sleepTimerSettingsMath.ts
// Persist preferred sleep-timer duration. Armed state is session-only.

export const SLEEP_TIMER_HOURS_STORAGE_KEY = 'sleep_timer_hours';
export const SLEEP_TIMER_MINUTES_STORAGE_KEY = 'sleep_timer_minutes';
export const SLEEP_TIMER_MAX_HOURS = 999;
export const SLEEP_TIMER_MAX_MINUTES_FIELD = 59;

const readStoredInteger = (key: string, max: number): number => {
    if (typeof window === 'undefined') return 0;
    const raw = Number(localStorage.getItem(key));
    if (!Number.isFinite(raw)) return 0;
    return Math.min(max, Math.max(0, Math.floor(raw)));
};

export const clampSleepTimerHours = (hours: number): number => (
    Math.min(SLEEP_TIMER_MAX_HOURS, Math.max(0, Math.floor(hours) || 0))
);

export const clampSleepTimerMinutes = (minutes: number): number => (
    Math.min(SLEEP_TIMER_MAX_MINUTES_FIELD, Math.max(0, Math.floor(minutes) || 0))
);

export const readStoredSleepTimerHours = (): number => (
    readStoredInteger(SLEEP_TIMER_HOURS_STORAGE_KEY, SLEEP_TIMER_MAX_HOURS)
);

export const readStoredSleepTimerMinutes = (): number => (
    readStoredInteger(SLEEP_TIMER_MINUTES_STORAGE_KEY, SLEEP_TIMER_MAX_MINUTES_FIELD)
);

export const persistSleepTimerHours = (hours: number): number => {
    const clamped = clampSleepTimerHours(hours);
    if (typeof window !== 'undefined') {
        localStorage.setItem(SLEEP_TIMER_HOURS_STORAGE_KEY, String(clamped));
    }
    return clamped;
};

export const persistSleepTimerMinutes = (minutes: number): number => {
    const clamped = clampSleepTimerMinutes(minutes);
    if (typeof window !== 'undefined') {
        localStorage.setItem(SLEEP_TIMER_MINUTES_STORAGE_KEY, String(clamped));
    }
    return clamped;
};

export const formatSleepTimerRemaining = (remainingMs: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

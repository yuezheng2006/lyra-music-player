import type { StoreApi } from 'zustand';
import {
    DEFAULT_LYRIC_STAFF_ABSORB_MODE,
    DEFAULT_LYRIC_STAFF_MIN_DWELL_SECONDS,
    LYRIC_STAFF_MIN_DWELL_RANGE,
    type LyricStaffAbsorbMode,
    type LyricStaffPolicy,
} from '../../utils/lyrics/staffCreditsPolicy';
import type { SettingsUiState } from './types';

// src/stores/settingsUi/createSettingsUiActionsLyricStaff.ts
// Persist the opening-credits policy independently from the user regex filter.

type SetState = StoreApi<SettingsUiState>['setState'];

export const createSettingsUiActionsLyricStaff = (set: SetState) => ({
    handleSetLyricStaffPolicy: (policy: LyricStaffPolicy) => {
        set({ lyricStaffPolicy: policy });
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem('lyrics_staff_policy', policy);
    },
    handleSetLyricStaffMinDwellSeconds: (seconds: number) => {
        const next = Number.isFinite(seconds)
            ? Math.min(LYRIC_STAFF_MIN_DWELL_RANGE.max, Math.max(LYRIC_STAFF_MIN_DWELL_RANGE.min, seconds))
            : DEFAULT_LYRIC_STAFF_MIN_DWELL_SECONDS;
        set({ lyricStaffMinDwellSeconds: next });
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem('lyrics_staff_min_dwell', String(next));
    },
    handleSetLyricStaffAbsorbMode: (mode: LyricStaffAbsorbMode) => {
        set({ lyricStaffAbsorbMode: mode });
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem('lyrics_staff_absorb_mode', mode);
    },
    handleSetLyricStaffPattern: (pattern: string) => {
        const next = pattern.trim();
        set({ lyricStaffPattern: next });
        if (typeof window === 'undefined') {
            return;
        }
        if (next) {
            localStorage.setItem('lyrics_staff_pattern', next);
        } else {
            localStorage.removeItem('lyrics_staff_pattern');
        }
    },
});

import type { StoreApi } from 'zustand';
import type { SettingsUiState } from './types';
import { persistGlobalLyricTimelineOffsetMs } from '../../utils/playback/globalLyricTimelineOffsetMath';
import { persistPreventDisplaySleepDuringPlayback } from '../../utils/settings/displaySleepSettingsMath';
import { persistDesktopLyricsYFactor } from '../../utils/desktopLyrics/desktopLyricsPlacementMath';
import {
    persistStageTrackPillMode,
    persistStageTrackPillOnHome,
    persistStageTrackPillTimeoutSec,
    type StageTrackPillMode,
} from '../../utils/settings/stageTrackPillSettingsMath';

// src/stores/settingsUi/createSettingsUiActionsLyricClock.ts
// Device-level lyric clock offset and desktop display-sleep preference.

type SetState = StoreApi<SettingsUiState>['setState'];

export const createSettingsUiActionsLyricClock = (set: SetState) => ({
    handleSetGlobalLyricTimelineOffsetMs: (offsetMs: number) => {
        set({ globalLyricTimelineOffsetMs: persistGlobalLyricTimelineOffsetMs(offsetMs) });
    },
    handleTogglePreventDisplaySleepDuringPlayback: (enable: boolean) => {
        set({ preventDisplaySleepDuringPlayback: persistPreventDisplaySleepDuringPlayback(enable) });
    },
    handleSetStageTrackPillMode: (mode: StageTrackPillMode) => {
        set({ stageTrackPillMode: persistStageTrackPillMode(mode) });
    },
    handleSetStageTrackPillTimeoutSec: (timeoutSec: number) => {
        set({ stageTrackPillTimeoutSec: persistStageTrackPillTimeoutSec(timeoutSec) });
    },
    handleToggleStageTrackPillOnHome: (enable: boolean) => {
        set({ stageTrackPillOnHome: persistStageTrackPillOnHome(enable) });
    },
    handleSetDesktopLyricsYFactor: (factor: number) => {
        set({ desktopLyricsYFactor: persistDesktopLyricsYFactor(factor) });
    },
});

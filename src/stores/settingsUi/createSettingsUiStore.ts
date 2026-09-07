import { create } from 'zustand';
import type { SettingsUiState } from './types';
import { buildSettingsUiInitialState } from './buildSettingsUiInitialState';
import { createSettingsUiActionsAppearance } from './createSettingsUiActionsAppearance';
import { createSettingsUiActionsTuning } from './createSettingsUiActionsTuning';
import { createSettingsUiActionsLyricClock } from './createSettingsUiActionsLyricClock';
import { createSettingsUiActionsLyricStaff } from './createSettingsUiActionsLyricStaff';
import { createSettingsUiActionsSleepTimer } from './createSettingsUiActionsSleepTimer';

// src/stores/settingsUi/createSettingsUiStore.ts
// Assembles the settings UI zustand store from initial state and action slices.

export const useSettingsUiStore = create<SettingsUiState>((set, get) => ({
    ...buildSettingsUiInitialState(set),
    ...createSettingsUiActionsAppearance(set, get),
    ...createSettingsUiActionsTuning(set, get),
    ...createSettingsUiActionsLyricClock(set),
    ...createSettingsUiActionsLyricStaff(set),
    ...createSettingsUiActionsSleepTimer(set, get),
}));

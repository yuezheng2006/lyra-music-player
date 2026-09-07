import type { StoreApi } from 'zustand';
import i18n from '../../i18n/config';
import { persistSleepTimerHours, persistSleepTimerMinutes } from '../../utils/settings/sleepTimerSettingsMath';
import { notify } from './notify';
import type { SettingsUiState } from './types';

// src/stores/settingsUi/createSettingsUiActionsSleepTimer.ts
// Session-armed sleep timer; preferred hours/minutes persist, enabled does not.

type SetState = StoreApi<SettingsUiState>['setState'];
type GetState = StoreApi<SettingsUiState>['getState'];

export const createSettingsUiActionsSleepTimer = (set: SetState, get: GetState) => ({
    handleToggleSleepTimer: (enable: boolean) => {
        if (enable && get().sleepTimerHours === 0 && get().sleepTimerMinutes === 0) {
            notify(get, {
                type: 'error',
                text: i18n.t('commandPalette.sleepTimerDurationRequired'),
            });
            return;
        }
        set(state => ({
            sleepTimerEnabled: enable,
            sleepTimerActivationId: enable
                ? state.sleepTimerActivationId + 1
                : state.sleepTimerActivationId,
        }));
        notify(get, {
            type: 'info',
            text: i18n.t(enable ? 'status.sleepTimerOn' : 'status.sleepTimerOff'),
        });
    },
    handleSetSleepTimerHours: (hours: number) => {
        const clamped = persistSleepTimerHours(hours);
        set(state => ({
            sleepTimerHours: clamped,
            sleepTimerEnabled: clamped === 0 && state.sleepTimerMinutes === 0
                ? false
                : state.sleepTimerEnabled,
        }));
    },
    handleSetSleepTimerMinutes: (minutes: number) => {
        const clamped = persistSleepTimerMinutes(minutes);
        set(state => ({
            sleepTimerMinutes: clamped,
            sleepTimerEnabled: state.sleepTimerHours === 0 && clamped === 0
                ? false
                : state.sleepTimerEnabled,
        }));
    },
});

import type { StatusMessage } from '../../types';
import type { SettingsUiState } from './types';

// src/stores/settingsUi/notify.ts
// Push a status toast through the injected App status setter.

export const notify = (get: () => SettingsUiState, message: StatusMessage) => {
    get().statusSetter?.(message);
};

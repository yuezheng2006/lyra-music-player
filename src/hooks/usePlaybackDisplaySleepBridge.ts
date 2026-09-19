import { useEffect } from 'react';
import { PlayerState } from '../types';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';

// src/hooks/usePlaybackDisplaySleepBridge.ts
// Asks Electron to keep the display awake while music is playing.

export const usePlaybackDisplaySleepBridge = (playerState: PlayerState) => {
    const preventDisplaySleepDuringPlayback = useSettingsUiStore(
        state => state.preventDisplaySleepDuringPlayback,
    );

    useEffect(() => {
        const setActive = window.electron?.setPlaybackDisplaySleepActive;
        if (!setActive) return;

        const shouldBlock = preventDisplaySleepDuringPlayback && playerState === PlayerState.PLAYING;
        void setActive(shouldBlock);
        return () => {
            void setActive(false);
        };
    }, [playerState, preventDisplaySleepDuringPlayback]);
};

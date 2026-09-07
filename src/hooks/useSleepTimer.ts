import { useEffect, useRef } from 'react';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import { runSleepTimerExpiryAction } from './sleepTimerExpiry';

// src/hooks/useSleepTimer.ts
// App-level countdown so closing settings or the command palette does not cancel the timer.

const TICK_MS = 1000;

type UseSleepTimerOptions = {
    onExpireFallback: () => void;
};

export const useSleepTimer = ({ onExpireFallback }: UseSleepTimerOptions) => {
    const onExpireFallbackRef = useRef(onExpireFallback);
    const enabled = useSettingsUiStore(state => state.sleepTimerEnabled);
    const hours = useSettingsUiStore(state => state.sleepTimerHours);
    const minutes = useSettingsUiStore(state => state.sleepTimerMinutes);
    const activationId = useSettingsUiStore(state => state.sleepTimerActivationId);

    useEffect(() => {
        onExpireFallbackRef.current = onExpireFallback;
    }, [onExpireFallback]);

    useEffect(() => {
        if (!enabled || (hours === 0 && minutes === 0)) {
            useSettingsUiStore.setState({ sleepTimerDeadlineMs: null });
            return;
        }

        const totalMs = (hours * 3600 + minutes * 60) * 1000;
        const deadline = Date.now() + totalMs;
        useSettingsUiStore.setState({ sleepTimerDeadlineMs: deadline });
        const timer = window.setInterval(() => {
            if (Date.now() >= deadline) {
                window.clearInterval(timer);
                useSettingsUiStore.setState({
                    sleepTimerEnabled: false,
                    sleepTimerDeadlineMs: null,
                });

                void runSleepTimerExpiryAction({
                    quitApp: window.electron?.quitApp,
                    onFallback: () => onExpireFallbackRef.current(),
                });
            }
        }, TICK_MS);

        return () => {
            window.clearInterval(timer);
            useSettingsUiStore.setState({ sleepTimerDeadlineMs: null });
        };
    }, [activationId, enabled, hours, minutes]);
};

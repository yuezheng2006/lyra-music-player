import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getVisualizerModeLabel } from '../components/visualizer/registry';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import type { VisualizerMode } from '../types';
import { stepOrderedValue } from '../utils/visualizer/stepOrderedValue';

// src/hooks/useVisualizerModeStepper.ts
// Arrow-step lyric modes without toasting every click; announce the final mode after the burst.

const STEP_NOTIFY_DELAY_MS = 700;

export const useVisualizerModeStepper = (modes: VisualizerMode[]) => {
    const { t } = useTranslation();
    const modesRef = useRef(modes);
    const notifyTimerRef = useRef<number | null>(null);
    modesRef.current = modes;

    const cancelScheduledNotify = useCallback(() => {
        if (notifyTimerRef.current === null) return;
        window.clearTimeout(notifyTimerRef.current);
        notifyTimerRef.current = null;
    }, []);

    const scheduleNotify = useCallback(() => {
        cancelScheduledNotify();
        notifyTimerRef.current = window.setTimeout(() => {
            notifyTimerRef.current = null;
            const state = useSettingsUiStore.getState();
            const modeLabel = getVisualizerModeLabel(state.visualizerMode, key => t(key));
            state.statusSetter?.({
                type: 'info',
                text: t('status.visualizerSwitched', { mode: modeLabel }),
            });
        }, STEP_NOTIFY_DELAY_MS);
    }, [cancelScheduledNotify, t]);

    const step = useCallback((direction: -1 | 1) => {
        const availableModes = modesRef.current;
        if (availableModes.length < 2) return;
        const state = useSettingsUiStore.getState();
        const target = stepOrderedValue(availableModes, state.visualizerMode, direction);
        state.handleSetVisualizerMode(target, { notify: false });
        scheduleNotify();
    }, [scheduleNotify]);

    useEffect(() => () => cancelScheduledNotify(), [cancelScheduledNotify]);

    return step;
};

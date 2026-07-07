import type { BeatMap } from '../../types/atmosphere';
import {
    type BeatCameraState,
    scheduleBeatCamera,
} from './beatCameraEnvelope';
import { computeScheduledBeatPulse } from './triggerScheduledBeat';

// src/utils/atmosphere/beatMapScheduler.ts
// Steps offline beat-map events with Mineradio-style lookahead and pulse decay.

export interface BeatMapSchedulerState {
    pulseIdx: number;
    cameraIdx: number;
    scheduledPulse: number;
    lastTime: number;
}

const LOOKAHEAD_SEC = 0.075;

export const createBeatMapSchedulerState = (): BeatMapSchedulerState => ({
    pulseIdx: 0,
    cameraIdx: 0,
    scheduledPulse: 0,
    lastTime: -1,
});

export const resetBeatMapSchedulerState = (state: BeatMapSchedulerState) => {
    state.pulseIdx = 0;
    state.cameraIdx = 0;
    state.scheduledPulse = 0;
    state.lastTime = -1;
};

export const syncBeatMapScheduler = (
    state: BeatMapSchedulerState,
    beatMap: BeatMap | null,
    currentTimeSec: number,
) => {
    if (!beatMap) {
        resetBeatMapSchedulerState(state);
        return;
    }

    const pulseBeats = beatMap.pulseBeats.length ? beatMap.pulseBeats : beatMap.cameraBeats;
    const cameraBeats = beatMap.cameraBeats.length ? beatMap.cameraBeats : beatMap.beats;

    state.pulseIdx = pulseBeats.findIndex(beat => beat.time >= currentTimeSec - 0.04);
    state.cameraIdx = cameraBeats.findIndex(beat => beat.time >= currentTimeSec - 0.04);
    if (state.pulseIdx < 0) state.pulseIdx = pulseBeats.length;
    if (state.cameraIdx < 0) state.cameraIdx = cameraBeats.length;
    state.scheduledPulse = 0;
    state.lastTime = currentTimeSec;
};

export const tickBeatMapScheduler = (
    state: BeatMapSchedulerState,
    beatMap: BeatMap | null,
    currentTimeSec: number,
    dt: number,
    cinemaScale: number,
    cameraState: BeatCameraState,
): number => {
    const safeDt = Math.max(0.001, Math.min(0.08, dt || 0.016));
    state.scheduledPulse *= Math.pow(0.32, safeDt);

    if (!beatMap) {
        state.lastTime = currentTimeSec;
        return state.scheduledPulse;
    }

    if (state.lastTime >= 0 && Math.abs(currentTimeSec - state.lastTime) > 0.55) {
        syncBeatMapScheduler(state, beatMap, currentTimeSec);
    }

    const pulseBeats = beatMap.pulseBeats.length ? beatMap.pulseBeats : beatMap.cameraBeats;
    while (state.pulseIdx < pulseBeats.length) {
        const beat = pulseBeats[state.pulseIdx];
        if (beat.time > currentTimeSec + LOOKAHEAD_SEC) break;
        if (beat.time >= currentTimeSec - 0.04) {
            const pulse = computeScheduledBeatPulse(beat, cinemaScale);
            state.scheduledPulse = Math.max(state.scheduledPulse, pulse);
        }
        state.pulseIdx += 1;
    }

    const cameraBeats = beatMap.cameraBeats.length ? beatMap.cameraBeats : beatMap.beats;
    while (state.cameraIdx < cameraBeats.length) {
        const beat = cameraBeats[state.cameraIdx];
        if (beat.time > currentTimeSec + LOOKAHEAD_SEC) break;
        if (beat.time >= currentTimeSec - 0.04) {
            scheduleBeatCamera(cameraState, beat, cinemaScale);
        }
        state.cameraIdx += 1;
    }

    state.lastTime = currentTimeSec;
    return state.scheduledPulse;
};

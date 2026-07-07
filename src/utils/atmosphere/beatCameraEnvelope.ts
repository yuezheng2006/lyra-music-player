import type { BeatCombo, BeatEvent } from '../../types/atmosphere';
import { comboFromGridIndex } from './beatCombo';
import { clamp01, clampRange } from './math';
import { cameraDynamicsScale } from './triggerScheduledBeat';

// src/utils/atmosphere/beatCameraEnvelope.ts
// ADSR beat camera envelope adapted from Mineradio scheduleBeatCamera / updateBeatCamera.

export interface BeatCameraEvent {
    start: number;
    amp: number;
    attack: number;
    hold: number;
    release: number;
    zoomAmp: number;
    phiAmp: number;
    rollAmp: number;
    combo: BeatCombo;
    phase: number;
}

export interface BeatCameraState {
    events: BeatCameraEvent[];
    punch: number;
    radiusKick: number;
    phiKick: number;
    rollKick: number;
    prevAudioTime: number;
}

export interface BeatCameraFrame {
    punch: number;
    radiusKick: number;
    phiKick: number;
    rollKick: number;
}

const easeBeatCamera = (x: number) => {
    const t = clamp01(x);
    return t * t * (3 - 2 * t);
};

export const createBeatCameraState = (): BeatCameraState => ({
    events: [],
    punch: 0,
    radiusKick: 0,
    phiKick: 0,
    rollKick: 0,
    prevAudioTime: -1,
});

export const resetBeatCameraState = (state: BeatCameraState) => {
    state.events.length = 0;
    state.punch = 0;
    state.radiusKick = 0;
    state.phiKick = 0;
    state.rollKick = 0;
    state.prevAudioTime = -1;
};

export const scheduleBeatCamera = (
    state: BeatCameraState,
    beat: BeatEvent | number,
    cinemaScale: number,
) => {
    const time = typeof beat === 'number' ? beat : beat.time;
    if (!Number.isFinite(time)) return;

    const strength = typeof beat === 'number'
        ? 0.72
        : clamp01(beat.strength ?? 0.72);
    const visualImpact = typeof beat === 'number'
        ? strength
        : clamp01(beat.impact ?? strength);
    const lowTone = typeof beat === 'number' ? 0.62 : clamp01(beat.low ?? 0.62);
    const bodyTone = typeof beat === 'number' ? 0.22 : clamp01(beat.body ?? 0.22);
    const snapTone = typeof beat === 'number' ? 0.16 : clamp01(beat.snap ?? 0.16);
    const mass = clamp01(lowTone * 0.72 + bodyTone * 0.36 + strength * 0.2);

    if (typeof beat !== 'number' && visualImpact < 0.13 && strength < 0.56) return;

    const dynScale = cameraDynamicsScale(cinemaScale, 0.92 + visualImpact * 0.12 + mass * 0.08);
    let amp = clampRange(0.15 + strength * 0.34 + mass * 0.13 + snapTone * 0.04, 0.18, 0.72);
    amp *= 0.68 + visualImpact * 0.46;
    amp *= dynScale;

    const combo = typeof beat === 'number'
        ? comboFromGridIndex(Math.floor(time * 2.7))
        : (beat.combo ?? comboFromGridIndex(beat.index ?? Math.floor(time * 2.7)));

    let zoomAmp = 0.070 + mass * 0.190 + strength * 0.045;
    zoomAmp *= 0.76 + dynScale * 0.28;

    state.events.push({
        start: time,
        amp,
        attack: 0.028,
        hold: 0.030,
        release: 0.185,
        zoomAmp,
        phiAmp: 0.002 + bodyTone * 0.012,
        rollAmp: snapTone > 0.42 ? 0.003 + snapTone * 0.004 : 0.0008,
        combo,
        phase: (typeof beat === 'number' ? time : (beat.index ?? time)) * 1.37,
    });

    if (state.events.length > 8) {
        state.events.splice(0, state.events.length - 8);
    }
};

export const updateBeatCamera = (
    state: BeatCameraState,
    currentTimeSec: number,
    dt: number,
    paused: boolean,
): BeatCameraFrame => {
    const safeDt = Math.max(0.001, Math.min(0.08, dt || 0.016));

    if (paused) {
        state.punch *= Math.pow(0.08, safeDt);
        state.radiusKick *= Math.pow(0.05, safeDt);
        state.phiKick *= Math.pow(0.05, safeDt);
        state.rollKick *= Math.pow(0.05, safeDt);
        state.events.length = 0;
        state.prevAudioTime = currentTimeSec;
        return {
            punch: state.punch,
            radiusKick: state.radiusKick,
            phiKick: state.phiKick,
            rollKick: state.rollKick,
        };
    }

    if (state.prevAudioTime >= 0 && Math.abs(currentTimeSec - state.prevAudioTime) > 0.55) {
        state.events.length = 0;
    }
    state.prevAudioTime = currentTimeSec;

    let punch = 0;
    let radiusKick = 0;
    let phiKick = 0;
    let rollKick = 0;
    let leadEvent: BeatCameraEvent | null = null;
    let leadPunch = 0;
    let leadVal = 0;

    for (let i = state.events.length - 1; i >= 0; i -= 1) {
        const ev = state.events[i];
        const local = currentTimeSec - ev.start;
        let val = 0;

        if (local < 0) {
            val = 0;
        } else if (local < ev.attack) {
            val = easeBeatCamera(local / ev.attack);
        } else if (local < ev.attack + ev.hold) {
            val = 1;
        } else if (local < ev.attack + ev.hold + ev.release) {
            val = 1 - easeBeatCamera((local - ev.attack - ev.hold) / ev.release);
        } else {
            state.events.splice(i, 1);
            continue;
        }

        const evPunch = val * ev.amp;
        punch = Math.max(punch, evPunch);
        if (evPunch > leadPunch) {
            leadEvent = ev;
            leadPunch = evPunch;
            leadVal = val;
        }
    }

    if (leadEvent) {
        const sign = Math.sin(leadEvent.phase) >= 0 ? 1 : -1;
        const combo = leadEvent.combo;
        if (combo === 'downbeat') {
            radiusKick = leadPunch * leadEvent.zoomAmp;
            phiKick = -leadPunch * 0.0032;
        } else if (combo === 'push') {
            radiusKick = leadPunch * leadEvent.zoomAmp * 0.72;
            phiKick = -leadPunch * 0.0014;
        } else if (combo === 'drop') {
            radiusKick = leadPunch * leadEvent.zoomAmp * 0.46;
            phiKick = leadPunch * leadEvent.phiAmp * 0.92;
        } else if (combo === 'rebound') {
            radiusKick = leadPunch * leadEvent.zoomAmp * 0.30;
            phiKick = -leadPunch * leadEvent.phiAmp * 0.22;
        } else if (combo === 'accent') {
            radiusKick = leadPunch * leadEvent.zoomAmp * 0.90;
            phiKick = -leadPunch * 0.0022;
            rollKick = sign * leadPunch * leadEvent.rollAmp * 0.55;
        }
        void leadVal;
    }

    state.punch = punch;
    state.radiusKick = radiusKick;
    state.phiKick = phiKick;
    state.rollKick = rollKick;

    return { punch, radiusKick, phiKick, rollKick };
};

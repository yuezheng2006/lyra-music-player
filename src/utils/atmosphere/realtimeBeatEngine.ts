// src/utils/atmosphere/realtimeBeatEngine.ts
// Realtime beat/onset engine adapted from Mineradio processRealtimeBeatEngine.

import type { AtmosphereSample } from '../../types/atmosphere';
import { clamp01, follow } from './math';

export interface RealtimeBeatState {
    subFast: number;
    subSlow: number;
    lowFast: number;
    lowSlow: number;
    bodyFast: number;
    bodySlow: number;
    vocalFast: number;
    vocalSlow: number;
    snapFast: number;
    snapSlow: number;
    prevSub: number;
    prevLow: number;
    prevBody: number;
    prevVocal: number;
    prevSnap: number;
    prevRms: number;
    onsetAvg: number;
    onsetPeak: number;
    subPeak: number;
    lowPeak: number;
    bodyPeak: number;
    vocalPeak: number;
    snapPeak: number;
    lastHitAt: number;
    tempoGap: number;
    tempoConfidence: number;
    beatCount: number;
    primedFrames: number;
    warmupUntil: number;
    pulse: number;
    score: number;
}

export interface RealtimeBeatTickResult {
    sample: AtmosphereSample;
    pulse: number;
    score: number;
    hit: boolean;
    tempoGap: number;
}

export const createRealtimeBeatState = (warmupUntil = 0): RealtimeBeatState => ({
    subFast: 0,
    subSlow: 0,
    lowFast: 0,
    lowSlow: 0,
    bodyFast: 0,
    bodySlow: 0,
    vocalFast: 0,
    vocalSlow: 0,
    snapFast: 0,
    snapSlow: 0,
    prevSub: 0,
    prevLow: 0,
    prevBody: 0,
    prevVocal: 0,
    prevSnap: 0,
    prevRms: 0,
    onsetAvg: 0.012,
    onsetPeak: 0.06,
    subPeak: 0.14,
    lowPeak: 0.18,
    bodyPeak: 0.16,
    vocalPeak: 0.16,
    snapPeak: 0.14,
    lastHitAt: -10,
    tempoGap: 0,
    tempoConfidence: 0,
    beatCount: 0,
    primedFrames: 0,
    warmupUntil,
    pulse: 0,
    score: 0,
});

const bandRms = (
    data: Uint8Array,
    sampleRate: number,
    fftSize: number,
    hz0: number,
    hz1: number,
) => {
    const binHz = sampleRate / fftSize;
    const start = Math.max(1, Math.floor(hz0 / binHz));
    const end = Math.min(data.length - 1, Math.ceil(hz1 / binHz));
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
        const value = data[i] / 255;
        sum += value * value;
        count += 1;
    }
    return count ? Math.sqrt(sum / count) : 0;
};

export const tickRealtimeBeatEngine = (
    state: RealtimeBeatState,
    frequencyData: Uint8Array,
    timeDomainData: Uint8Array,
    sampleRate: number,
    fftSize: number,
    currentTimeSec: number,
    dt: number,
): RealtimeBeatTickResult => {
    const safeDt = Math.max(0.001, Math.min(0.08, dt || 0.016));
    const sub = bandRms(frequencyData, sampleRate, fftSize, 38, 74);
    const kick = bandRms(frequencyData, sampleRate, fftSize, 52, 165);
    const body = bandRms(frequencyData, sampleRate, fftSize, 165, 420);
    const vocal = bandRms(frequencyData, sampleRate, fftSize, 420, 2600);
    const snap = bandRms(frequencyData, sampleRate, fftSize, 1800, 9200);
    const low = Math.min(1, kick * 0.86 + sub * 0.42);

    let rms = 0;
    for (let i = 0; i < timeDomainData.length; i += 1) {
        const tv = (timeDomainData[i] - 128) / 128;
        rms += tv * tv;
    }
    rms = Math.sqrt(rms / Math.max(1, timeDomainData.length));

    state.subFast = follow(state.subFast, sub, safeDt, 0.018, 0.064);
    state.subSlow = follow(state.subSlow, sub, safeDt, 0.32, 0.52);
    state.lowFast = follow(state.lowFast, low, safeDt, 0.016, 0.07);
    state.lowSlow = follow(state.lowSlow, low, safeDt, 0.3, 0.54);
    state.bodyFast = follow(state.bodyFast, body, safeDt, 0.02, 0.082);
    state.bodySlow = follow(state.bodySlow, body, safeDt, 0.36, 0.6);
    state.vocalFast = follow(state.vocalFast, vocal, safeDt, 0.026, 0.09);
    state.vocalSlow = follow(state.vocalSlow, vocal, safeDt, 0.34, 0.58);
    state.snapFast = follow(state.snapFast, snap, safeDt, 0.012, 0.06);
    state.snapSlow = follow(state.snapSlow, snap, safeDt, 0.3, 0.52);

    const peakDecay = 0.99;
    state.subPeak = Math.max(state.subPeak * Math.pow(peakDecay, safeDt * 60), sub, 0.045);
    state.lowPeak = Math.max(state.lowPeak * Math.pow(0.989, safeDt * 60), low, 0.06);
    state.bodyPeak = Math.max(state.bodyPeak * Math.pow(peakDecay, safeDt * 60), body, 0.04);
    state.vocalPeak = Math.max(state.vocalPeak * Math.pow(peakDecay, safeDt * 60), vocal, 0.04);
    state.snapPeak = Math.max(state.snapPeak * Math.pow(peakDecay, safeDt * 60), snap, 0.035);

    const subFlux = Math.max(0, sub - state.prevSub);
    const lowFlux = Math.max(0, low - state.prevLow);
    const bodyFlux = Math.max(0, body - state.prevBody);
    const vocalFlux = Math.max(0, vocal - state.prevVocal);
    const snapFlux = Math.max(0, snap - state.prevSnap);
    const rmsFlux = Math.max(0, rms - state.prevRms);
    const subRise = Math.max(0, state.subFast - state.subSlow);
    const lowRise = Math.max(0, state.lowFast - state.lowSlow);
    const bodyRise = Math.max(0, state.bodyFast - state.bodySlow);
    const vocalRise = Math.max(0, state.vocalFast - state.vocalSlow);
    const snapRise = Math.max(0, state.snapFast - state.snapSlow);
    const drumOnset = subRise * 0.88 + subFlux * 0.66 + lowRise * 1.62 + lowFlux * 1.34;
    const musicalOnset = bodyRise * 0.34 + bodyFlux * 0.24 + vocalRise * 0.52
        + vocalFlux * 0.36 + snapRise * 0.08 + snapFlux * 0.06 + rmsFlux * 0.2;
    const onset = drumOnset + musicalOnset * 0.16;

    state.onsetAvg = follow(state.onsetAvg, onset, safeDt, 1.1, 0.34);
    state.onsetPeak = Math.max(state.onsetPeak * Math.pow(0.988, safeDt * 60), onset, 0.032);
    const floor = state.onsetAvg * 0.84;
    const score = clamp01((onset - floor) / Math.max(0.014, state.onsetPeak - floor));

    state.prevSub = sub;
    state.prevLow = low;
    state.prevBody = body;
    state.prevVocal = vocal;
    state.prevSnap = snap;
    state.prevRms = rms;

    state.primedFrames += 1;
    const warmingUp = currentTimeSec < state.warmupUntil || state.primedFrames < 18;
    const gapFromLast = currentTimeSec - state.lastHitAt;
    const expectedGap = state.tempoGap > 0 ? state.tempoGap : 0;
    const phaseWindow = expectedGap > 0
        ? Math.max(0.055, Math.min(0.105, expectedGap * 0.16))
        : 0;
    const tempoDue = expectedGap > 0
        && gapFromLast > expectedGap - phaseWindow
        && gapFromLast < expectedGap + phaseWindow;
    const lowNorm = clamp01(low / Math.max(0.06, state.lowPeak * 0.72));
    const subNorm = clamp01(sub / Math.max(0.045, state.subPeak * 0.7));
    const lowPresence = Math.max(lowNorm, subNorm * 0.74);
    const strongHit = !warmingUp && score > 0.58 && lowPresence > 0.34;
    const assistedHit = !warmingUp && tempoDue && score > 0.34 && lowPresence > 0.28;
    const hit = strongHit || assistedHit;

    if (hit) {
        state.lastHitAt = currentTimeSec;
        state.beatCount += 1;
        if (state.beatCount >= 2 && gapFromLast > 0.24 && gapFromLast < 1.2) {
            state.tempoGap = state.tempoGap > 0
                ? state.tempoGap * 0.72 + gapFromLast * 0.28
                : gapFromLast;
            state.tempoConfidence = Math.min(1, state.tempoConfidence + 0.18);
        }
    }

    const pulseTarget = hit ? 1 : Math.max(0, score * 0.42 + lowPresence * 0.18);
    state.pulse = follow(state.pulse, pulseTarget, safeDt, hit ? 0.018 : 0.05, 0.12);
    state.score = score;

    const sample: AtmosphereSample = {
        energy: clamp01((low + body + vocal) / 3),
        low: clamp01(low),
        body: clamp01(body),
        vocal: clamp01(vocal),
        melody: clamp01(vocal * 0.72 + body * 0.28),
        lowOnset: clamp01(drumOnset),
        energyOnset: clamp01(onset),
    };

    return {
        sample,
        pulse: state.pulse,
        score,
        hit,
        tempoGap: state.tempoGap,
    };
};

export const resetRealtimeBeatEngine = (state: RealtimeBeatState, warmupUntil = 0) => {
    Object.assign(state, createRealtimeBeatState(warmupUntil));
};

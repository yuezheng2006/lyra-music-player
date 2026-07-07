import type { BeatEvent, BeatMap } from '../../types/atmosphere';
import { comboFromGridIndex, resolveAccentCombo } from './beatCombo';
import { clamp01, clampRange } from './math';
import {
    bandAt,
    buildSectionSteps,
    estimateStep,
    findPodcastCandidates,
    getPowerPercentiles,
    nearestCandidate,
    scorePhase,
    type EnergyArray,
} from './podcastDjBeatMapAnalysis';

// src/utils/atmosphere/podcastDjBeatMap.ts
// Builds long-form podcast DJ beat maps from server-style low/hit energy frames.

export type PodcastDjBeat = BeatEvent & {
    dj: true;
    grid: true;
    kickOnly: true;
    server: true;
    step: number;
};

export interface PodcastDjBeatMap extends BeatMap {
    beats: PodcastDjBeat[];
    cameraBeats: PodcastDjBeat[];
    sectionSteps: number[];
    tempoSource: 'podcast-dj-server-low-offline' | 'podcast-dj-server-empty';
    debug: {
        candidates: number;
        hopSec: number;
        lowRef: number;
        step: number;
    };
}

const EMPTY_DEBUG = { candidates: 0, hopSec: 0, lowRef: 0, step: 0 };

const emptyPodcastBeatMap = (
    duration: number,
    hopSec = 0,
    lowRef = 0,
): PodcastDjBeatMap => ({
    kicks: [],
    beats: [],
    pulseBeats: [],
    cameraBeats: [],
    duration,
    visualBeatCount: 0,
    tempoSource: 'podcast-dj-server-empty',
    analyzedAt: Date.now(),
    sectionSteps: [],
    debug: { ...EMPTY_DEBUG, hopSec, lowRef },
});

// Converts podcast low-band energy into a stable DJ grid for long spoken/audio-show material.
export const buildBeatMapFromLowEnergy = (
    lowEnergy: EnergyArray,
    hitEnergy: EnergyArray,
    hopSec: number,
    durationSec = 0,
): PodcastDjBeatMap => {
    const nFrames = Math.min(lowEnergy.length, hitEnergy.length);
    const safeHopSec = Math.max(0.001, Number(hopSec) || 0.01);
    const duration = durationSec || nFrames * safeHopSec;
    if (nFrames < 20) return emptyPodcastBeatMap(duration, safeHopSec);

    const analysis = findPodcastCandidates(lowEnergy, hitEnergy, safeHopSec, nFrames);
    const { candidates, lowFloor, lowRef, lowCeil, hitRef } = analysis;
    if (!candidates.length) return emptyPodcastBeatMap(duration, safeHopSec, lowRef);

    const { p30, p50, p96 } = getPowerPercentiles(candidates);
    let strong = candidates.filter(candidate => candidate.power >= p50 && candidate.lowTone > 0.34);
    if (strong.length < 16) strong = candidates.slice();

    let globalStep = clampRange(estimateStep(strong) || estimateStep(candidates) || 0.5, 0.32, 0.86);
    const phaseSource = (strong.filter(candidate => candidate.time < Math.min(duration, 180)).slice(0, 72)
        || strong.slice(0, 1));
    let anchor = phaseSource[0]?.time || 0;
    let anchorScore = -Infinity;
    phaseSource.forEach((candidate) => {
        const score = scorePhase(candidates, candidate.time, globalStep, duration, p30 * 0.08);
        if (score > anchorScore) {
            anchorScore = score;
            anchor = candidate.time;
        }
    });
    const halfStep = globalStep * 0.5;
    if (halfStep >= 0.31 && scorePhase(candidates, anchor, halfStep, duration, p30 * 0.08) > anchorScore * 1.04) {
        globalStep = halfStep;
    }
    while (anchor - globalStep > 0.05) anchor -= globalStep;

    const { sectionLen, sectionSteps } = buildSectionSteps(strong, duration, globalStep);
    const stepAt = (time: number) =>
        sectionSteps[Math.max(0, Math.min(sectionSteps.length - 1, Math.floor(time / sectionLen)))]
        || globalStep;

    const beats: PodcastDjBeat[] = [];
    let cursorIdx = 0;
    for (let gridTime = anchor, gridIndex = 0; gridTime < duration - 0.04; gridIndex += 1) {
        const localStep = stepAt(gridTime);
        const windowSec = clampRange(localStep * 0.2, 0.06, 0.135);
        while (cursorIdx < candidates.length && candidates[cursorIdx].time < gridTime - windowSec) cursorIdx += 1;
        const best = nearestCandidate(candidates, gridTime, windowSec, cursorIdx);
        const frame = Math.max(0, Math.min(nFrames - 1, Math.round(gridTime / safeHopSec)));
        const gridLow = bandAt(lowEnergy, frame, nFrames - 1);
        const gridLowTone = Math.min(2.6, gridLow / lowRef);
        const gridHitTone = Math.min(2.6, bandAt(hitEnergy, frame, nFrames - 1) / hitRef);
        const distPenalty = best ? 1 - Math.min(1, Math.abs(best.time - gridTime) / windowSec) * 0.26 : 0.54;
        const basePower = best ? best.power * distPenalty : gridLowTone * 0.25 + gridHitTone * 0.06;
        const powerRel = clamp01((basePower - p30 * 0.78) / Math.max(0.001, p96 - p30 * 0.78));
        const lowRel = clamp01((gridLow - lowFloor) / Math.max(0.0001, lowCeil - lowFloor));
        const hitTone = best ? Math.max(gridHitTone * 0.62, best.hitTone) : gridHitTone;
        const kickRel = clamp01(powerRel * 0.74 + lowRel * 0.22 + clamp01((hitTone - 0.26) / 1.7) * 0.04);
        const combo = resolveAccentCombo(comboFromGridIndex(gridIndex), kickRel);
        const visualRel = kickRel > 0.76 ? 0.76 + (kickRel - 0.76) * 0.52 : kickRel;
        const downLift = combo === 'downbeat' ? (visualRel > 0.18 ? 0.016 + visualRel * 0.036 : visualRel * 0.028) : 0;
        const softGrid = (!best && lowRel < 0.2) || kickRel < 0.16;
        let impact = Math.max(0.02, Math.min(0.88, 0.022 + Math.pow(visualRel, 1.62) * 0.86 + downLift));
        let strength = Math.max(0.12, Math.min(0.93, 0.13 + Math.pow(visualRel, 1.12) * 0.68 + downLift * 0.7));
        if (softGrid) {
            impact *= combo === 'downbeat' ? 0.48 : 0.3;
            strength *= 0.58 + clamp01((kickRel - 0.1) / 0.58) * 0.22;
        }
        const timingPull = best ? 0.24 + clamp01((kickRel - 0.25) / 0.65) * 0.46 : 0;
        const time = best ? gridTime * (1 - timingPull) + best.time * timingPull : gridTime;
        const camera = impact >= 0.13 || (combo === 'downbeat' && kickRel >= 0.14) || Boolean(best && kickRel >= 0.18);
        const low = clampRange(0.52 + visualRel * 0.32 + (best?.lowTone ?? gridLowTone) * 0.035 - (combo === 'accent' ? 0.1 : 0), 0.42, 0.9);
        const body = clampRange(0.06 + visualRel * 0.12 + (combo === 'push' ? 0.18 : 0) + (combo === 'drop' ? 0.24 : 0), 0.035, 0.54);
        const snap = clampRange(0.026 + (combo === 'accent' ? 0.4 : 0) + (combo === 'rebound' ? 0.08 : 0) + visualRel * 0.038, 0.015, 0.62);
        beats.push({ time, strength, confidence: clampRange(0.46 + kickRel * 0.43 + (best ? 0.08 : -0.03), 0.44, 0.99), impact, primary: camera, camera, pulse: impact > 0.16 || (combo === 'downbeat' && kickRel >= 0.18), tone: 'grid', low, body, snap, combo, index: beats.length, step: localStep, dj: true, grid: true, kickOnly: true, server: true });
        gridTime += localStep;
    }

    const cameraBeats = beats.filter(beat => beat.camera !== false);
    const pulseBeats = beats.filter(beat => beat.pulse !== false && ((beat.impact ?? 0) >= 0.16 || beat.combo === 'downbeat'));
    return {
        kicks: beats.map(beat => beat.time),
        beats,
        pulseBeats,
        cameraBeats,
        gridStep: globalStep,
        sectionSteps,
        tempoSource: 'podcast-dj-server-low-offline',
        duration,
        visualBeatCount: cameraBeats.length,
        analyzedAt: Date.now(),
        debug: { candidates: candidates.length, hopSec: safeHopSec, lowRef, step: globalStep },
    };
};

export const PODCAST_DJ_DURATION_THRESHOLD_SEC = 600;

export const shouldUsePodcastDjBeatMap = (
    durationSec: number,
    contentType?: string | null,
) => durationSec >= PODCAST_DJ_DURATION_THRESHOLD_SEC || contentType === 'podcast';

/** Alias kept for beat map analyzer integration. */
export const buildPodcastDjBeatMapFromLowEnergy = buildBeatMapFromLowEnergy;

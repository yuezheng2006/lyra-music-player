import type { BeatEvent, BeatMap } from '../../../types/atmosphere';
import { comboFromGridIndex, resolveAccentCombo } from '../beatCombo';
import { median, percentile } from '../math';
import type { BeatCandidate } from './detectBeatCandidates';
import { bandAt } from './extractEnergyFrames';

// src/utils/atmosphere/beatMap/buildBeatEvents.ts
// Converts beat candidates into camera/pulse beat events.

export const buildBeatEvents = (
    candidates: BeatCandidate[],
    series: {
        lowEnergy: Float32Array;
        bodyEnergy: Float32Array;
        vocalEnergy: Float32Array;
        hitEnergy: Float32Array;
    },
    duration: number,
): BeatMap => {
    const scores = candidates.map(candidate => candidate.score).sort((a, b) => a - b);
    const p75 = scores.length ? scores[Math.floor(scores.length * 0.75)] : 1;
    const p92 = scores.length ? scores[Math.floor(scores.length * 0.92)] : Math.max(1, p75);
    const lowRef = Math.max(0.0004, percentile(series.lowEnergy, 0.86));
    const hitRef = Math.max(0.0004, percentile(series.hitEnergy, 0.86));
    const bodyRef = Math.max(0.0004, percentile(series.bodyEnergy, 0.86));
    const vocalRef = Math.max(0.0004, percentile(series.vocalEnergy, 0.86));

    const beats: BeatEvent[] = candidates.map((candidate, index) => {
        const lowTone = Math.min(2, bandAt(series.lowEnergy, candidate.frame) / lowRef);
        const bodyTone = Math.min(2, bandAt(series.bodyEnergy, candidate.frame) / bodyRef);
        const vocalTone = Math.min(2, bandAt(series.vocalEnergy, candidate.frame) / vocalRef);
        const snapTone = Math.min(2, bandAt(series.hitEnergy, candidate.frame) / hitRef);
        const toneTotal = Math.max(0.001, lowTone + bodyTone * 0.72 + snapTone * 0.58);
        const lowMix = lowTone / toneTotal;
        const bodyMix = (bodyTone * 0.72) / toneTotal;
        const snapMix = (snapTone * 0.58) / toneTotal;
        const lowDominance = lowTone / Math.max(0.001, vocalTone * 0.84 + bodyTone * 0.36 + snapTone * 0.1);
        const strength = Math.max(
            0.18,
            Math.min(1, (candidate.score - p75 * 0.36) / Math.max(0.001, p92 - p75 * 0.36)),
        );
        const drumLike = lowTone > 0.38 && (lowMix > 0.42 || lowDominance > 0.72);
        const combo = resolveAccentCombo(comboFromGridIndex(index), strength);
        return {
            time: candidate.time,
            strength,
            confidence: Math.max(0.22, Math.min(1, candidate.score / Math.max(0.001, p92))),
            primary: drumLike && strength >= 0.5,
            camera: drumLike && strength >= 0.42,
            pulse: drumLike && strength >= 0.42,
            tone: snapMix > 0.34 && snapTone > 0.55
                ? 'snap'
                : bodyMix > 0.36 && bodyTone > 0.55
                    ? 'body'
                    : lowMix > 0.55
                        ? 'deep'
                        : 'mixed',
            low: lowMix,
            body: bodyMix,
            snap: snapMix,
            impact: strength,
            combo,
            index,
        };
    });

    const strongTimes = beats
        .filter(beat => beat.primary && beat.strength > 0.55)
        .map(beat => beat.time);
    const gaps: number[] = [];
    for (let i = 1; i < strongTimes.length; i += 1) {
        const gap = strongTimes[i] - strongTimes[i - 1];
        if (gap >= 0.26 && gap <= 0.86) gaps.push(gap);
    }
    const gridStep = median(gaps);
    const cameraBeats = beats.filter(beat => beat.camera);
    const pulseBeats = beats.filter(
        beat => beat.pulse !== false && (beat.primary || (beat.strength >= 0.16 && (beat.low ?? 0) > 0.35)),
    );

    return {
        kicks: beats.map(beat => beat.time),
        beats,
        pulseBeats,
        cameraBeats,
        duration,
        visualBeatCount: cameraBeats.length,
        tempoSource: 'folia-offline-analyzer',
        analyzedAt: Date.now(),
        gridStep: gridStep > 0 ? gridStep : undefined,
    };
};

export const createEmptyBeatMap = (duration: number): BeatMap => ({
    kicks: [],
    beats: [],
    pulseBeats: [],
    cameraBeats: [],
    duration,
    visualBeatCount: 0,
    tempoSource: 'empty',
    analyzedAt: Date.now(),
});

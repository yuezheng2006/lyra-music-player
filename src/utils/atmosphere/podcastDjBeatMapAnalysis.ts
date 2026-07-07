import { clamp01, clampRange, median, percentile } from './math';

// src/utils/atmosphere/podcastDjBeatMapAnalysis.ts
// Candidate and grid helpers for podcast DJ beat-map analysis.

export type EnergyArray = Float32Array | number[];

export type PodcastCandidate = {
    frame: number;
    time: number;
    power: number;
    lowTone: number;
    hitTone: number;
};

export const bandAt = (values: EnergyArray, index: number, maxIndex: number) => {
    const idx = Math.max(0, Math.min(maxIndex, index | 0));
    const a = values[Math.max(0, idx - 1)] || 0;
    const b = values[idx] || 0;
    const c = values[Math.min(maxIndex, idx + 1)] || 0;
    return (a + b * 2 + c) * 0.25;
};

// Finds onset candidates from low/hit energy while suppressing duplicate peaks inside one beat gap.
export const findPodcastCandidates = (
    lowEnergy: EnergyArray,
    hitEnergy: EnergyArray,
    hopSec: number,
    nFrames: number,
) => {
    const lowFloor = Math.max(0.0004, percentile(lowEnergy, 0.22));
    const lowMid = Math.max(lowFloor + 0.0002, percentile(lowEnergy, 0.58));
    const lowRef = Math.max(lowMid + 0.0002, percentile(lowEnergy, 0.86));
    const lowCeil = Math.max(lowRef + 0.0004, percentile(lowEnergy, 0.96));
    const hitRef = Math.max(0.0004, percentile(hitEnergy, 0.86));
    const onset = new Float32Array(nFrames);

    for (let i = 4; i < nFrames; i += 1) {
        const prev = lowEnergy[i - 1] * 0.62 + lowEnergy[i - 2] * 0.28 + lowEnergy[i - 3] * 0.1;
        const lowRise = Math.max(0, lowEnergy[i] - prev);
        const wideRise = Math.max(0, (lowEnergy[i] + lowEnergy[i - 1]) * 0.5
            - (lowEnergy[i - 3] + lowEnergy[i - 4]) * 0.5);
        const peakRise = Math.max(0, hitEnergy[i] - hitEnergy[i - 2] * 0.84);
        onset[i] = lowRise * 1.72 + wideRise * 0.86 + peakRise * 0.1;
    }

    const winN = Math.max(52, Math.round(0.82 / hopSec));
    const minGap = Math.max(18, Math.round(0.215 / hopSec));
    const candidates: PodcastCandidate[] = [];
    let sum = 0;
    let square = 0;
    for (let i = 0; i < winN; i += 1) {
        const value = onset[i] || 0;
        sum += value;
        square += value * value;
    }

    for (let frame = winN + 4; frame < nFrames - 4; frame += 1) {
        const mean = sum / winN;
        const std = Math.sqrt(Math.max(0, square / winN - mean * mean));
        const threshold = mean + std * 1.66 + lowRef * 0.0038;
        const value = onset[frame];
        if (value > threshold && value >= onset[frame - 1] && value > onset[frame + 1]) {
            let peakFrame = frame;
            let peakScore = value + lowEnergy[frame] * 0.1;
            for (let pf = frame - 2; pf <= frame + 3; pf += 1) {
                const score = (onset[pf] || 0) + (lowEnergy[pf] || 0) * 0.1;
                if (score > peakScore) {
                    peakScore = score;
                    peakFrame = pf;
                }
            }
            const lowTone = Math.min(2.6, bandAt(lowEnergy, peakFrame, nFrames - 1) / lowRef);
            const hitTone = Math.min(2.6, bandAt(hitEnergy, peakFrame, nFrames - 1) / hitRef);
            const lowRel = clamp01((bandAt(lowEnergy, peakFrame, nFrames - 1) - lowFloor)
                / Math.max(0.0001, lowCeil - lowFloor));
            const score = (value - threshold) / Math.max(0.0006, std + mean * 0.38 + lowRef * 0.012);
            if (score > 0.16 && (lowTone > 0.32 || lowRel > 0.22 || hitTone > 0.52)) {
                const power = score * 0.56
                    + Math.pow(clamp01((lowTone - 0.22) / 1.42), 0.82) * 0.34
                    + Math.min(1.5, hitTone) * 0.08
                    + lowRel * 0.1;
                const next = { frame: peakFrame, time: peakFrame * hopSec, power, lowTone, hitTone };
                const last = candidates[candidates.length - 1];
                if (last && next.frame - last.frame < minGap) {
                    if (next.power > last.power) candidates[candidates.length - 1] = next;
                } else {
                    candidates.push(next);
                }
            }
        }
        const old = onset[frame - winN] || 0;
        const next = onset[frame] || 0;
        sum += next - old;
        square += next * next - old * old;
    }

    return { candidates, lowFloor, lowRef, lowCeil, hitRef };
};

export const estimateStep = (candidates: PodcastCandidate[]) => {
    if (candidates.length < 3) return 0;
    const histogram = new Map<number, number>();
    const gaps: number[] = [];
    for (let a = 0; a < candidates.length; a += 1) {
        for (let b = a + 1; b < candidates.length && b < a + 10; b += 1) {
            const rawGap = candidates[b].time - candidates[a].time;
            if (rawGap < 0.24) continue;
            if (rawGap > 2.55) break;
            for (let div = 1; div <= 6; div += 1) {
                const gap = rawGap / div;
                if (gap < 0.31) break;
                if (gap > 0.86) continue;
                const key = Math.round(gap / 0.006);
                const weight = Math.sqrt(Math.max(0.001, candidates[a].power * candidates[b].power))
                    / Math.sqrt((b - a) * div);
                histogram.set(key, (histogram.get(key) || 0) + weight);
                gaps.push(gap);
            }
        }
    }
    let bestKey = 0;
    let bestScore = 0;
    histogram.forEach((value, key) => {
        const score = value + (histogram.get(key - 1) || 0) * 0.72
            + (histogram.get(key + 1) || 0) * 0.72;
        if (score > bestScore) {
            bestScore = score;
            bestKey = key;
        }
    });
    return bestKey ? bestKey * 0.006 : median(gaps);
};

export const nearestCandidate = (
    candidates: PodcastCandidate[],
    center: number,
    windowSec: number,
    startIdx: number,
) => {
    let best: PodcastCandidate | null = null;
    let bestScore = -Infinity;
    let idx = startIdx;
    while (idx < candidates.length && candidates[idx].time < center - windowSec) idx += 1;
    for (let i = idx; i < candidates.length && candidates[i].time <= center + windowSec; i += 1) {
        const dist = Math.abs(candidates[i].time - center);
        const score = candidates[i].power * (1 - (dist / Math.max(0.001, windowSec)) * 0.42);
        if (score > bestScore) {
            best = candidates[i];
            bestScore = score;
        }
    }
    return best;
};

export const scorePhase = (
    candidates: PodcastCandidate[],
    anchorTime: number,
    step: number,
    duration: number,
    penalty: number,
) => {
    let start = anchorTime;
    while (start - step > 0.05) start -= step;
    const end = Math.min(duration, 180);
    const windowSec = clampRange(step * 0.18, 0.055, 0.125);
    let score = 0;
    let count = 0;
    let cursor = 0;
    for (let time = start; time < end; time += step) {
        while (cursor < candidates.length && candidates[cursor].time < time - windowSec) cursor += 1;
        let best = 0;
        for (let i = cursor; i < candidates.length && candidates[i].time <= time + windowSec; i += 1) {
            const dist = Math.abs(candidates[i].time - time);
            best = Math.max(best, candidates[i].power * (1 - (dist / windowSec) * 0.44));
        }
        score += best || -penalty;
        count += 1;
    }
    return count ? score / count : -Infinity;
};

export const buildSectionSteps = (
    strong: PodcastCandidate[],
    duration: number,
    globalStep: number,
) => {
    const sectionLen = duration > 3600 ? 96 : 72;
    const sectionCount = Math.max(1, Math.ceil(duration / sectionLen));
    const sectionSteps: number[] = [];
    for (let section = 0; section < sectionCount; section += 1) {
        const t0 = section * sectionLen;
        const t1 = Math.min(duration, t0 + sectionLen);
        const segment = strong.filter(candidate => candidate.time >= t0 && candidate.time < t1);
        const prevStep = sectionSteps[sectionSteps.length - 1] || globalStep;
        let localStep = estimateStep(segment) || prevStep || globalStep;
        localStep = clampRange(localStep, prevStep * 0.94, prevStep * 1.06);
        localStep = clampRange(localStep, globalStep * 0.86, globalStep * 1.14);
        sectionSteps.push(localStep * 0.3 + prevStep * 0.7);
    }
    return { sectionLen, sectionSteps };
};

export const getPowerPercentiles = (candidates: PodcastCandidate[]) => {
    const powers = candidates.map(candidate => candidate.power);
    return {
        p30: percentile(powers, 0.3),
        p50: percentile(powers, 0.5),
        p96: Math.max(percentile(powers, 0.9) + 0.001, percentile(powers, 0.965)),
    };
};

import { percentile } from '../math';

// src/utils/atmosphere/beatMap/detectBeatCandidates.ts
// Detects onset peaks from low-frequency energy curves.

export interface BeatCandidate {
    frame: number;
    time: number;
    score: number;
}

export const detectBeatCandidates = (
    lowEnergy: Float32Array,
    hitEnergy: Float32Array,
    hopSec: number,
): BeatCandidate[] => {
    const frameCount = lowEnergy.length;
    const lowFloor = Math.max(0.0004, percentile(lowEnergy, 0.22));
    const lowRef = Math.max(lowFloor + 0.0002, percentile(lowEnergy, 0.86));

    const onset = new Float32Array(frameCount);
    for (let i = 4; i < frameCount; i += 1) {
        const prev = lowEnergy[i - 1] * 0.62 + lowEnergy[i - 2] * 0.28 + lowEnergy[i - 3] * 0.1;
        const lowRise = Math.max(0, lowEnergy[i] - prev);
        const wideRise = Math.max(
            0,
            (lowEnergy[i] + lowEnergy[i - 1]) * 0.5 - (lowEnergy[i - 3] + lowEnergy[i - 4]) * 0.5,
        );
        const peakRise = Math.max(0, hitEnergy[i] - hitEnergy[i - 2] * 0.84);
        onset[i] = lowRise * 1.72 + wideRise * 0.86 + peakRise * 0.1;
    }

    const winN = Math.max(52, Math.round(0.82 / hopSec));
    const minFrameGap = Math.max(18, Math.round(0.215 / hopSec));
    const candidates: BeatCandidate[] = [];
    let sumO = 0;
    let sqO = 0;
    for (let i = 0; i < winN; i += 1) {
        const value = onset[i] || 0;
        sumO += value;
        sqO += value * value;
    }

    for (let frame = winN + 4; frame < frameCount - 4; frame += 1) {
        const mean = sumO / winN;
        const std = Math.sqrt(Math.max(0, sqO / winN - mean * mean));
        const threshold = mean + std * 1.66 + lowRef * 0.0038;
        const value = onset[frame];
        if (value > threshold && value >= onset[frame - 1] && value > onset[frame + 1]) {
            let peakFrame = frame;
            for (let j = frame - 2; j <= frame + 2; j += 1) {
                if ((onset[j] || 0) > (onset[peakFrame] || 0)) peakFrame = j;
            }
            candidates.push({
                frame: peakFrame,
                time: peakFrame * hopSec,
                score: value,
            });
            frame += minFrameGap;
        }
        const outgoing = onset[frame - winN] || 0;
        const incoming = onset[frame] || 0;
        sumO += incoming - outgoing;
        sqO += incoming * incoming - outgoing * outgoing;
    }

    return candidates;
};

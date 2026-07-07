import { makeBiquad, runBiquad } from './biquadFilter';

// src/utils/atmosphere/beatMap/extractEnergyFrames.ts
// Builds per-frame low/body/vocal/hit energy curves from an audio buffer.

export interface EnergyFrameSeries {
    frameCount: number;
    hopSec: number;
    lowEnergy: Float32Array;
    bodyEnergy: Float32Array;
    vocalEnergy: Float32Array;
    hitEnergy: Float32Array;
}

export const extractEnergyFrames = (buffer: AudioBuffer, hopSec = 0.01): EnergyFrameSeries => {
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const hopSize = Math.max(1, Math.round(sampleRate * hopSec));
    const frameCount = Math.max(1, Math.floor(channelData.length / hopSize));
    const lowEnergy = new Float32Array(frameCount);
    const hitEnergy = new Float32Array(frameCount);
    const bodyEnergy = new Float32Array(frameCount);
    const vocalEnergy = new Float32Array(frameCount);

    const hp = makeBiquad('highpass', 38, 0.72, sampleRate);
    const lpLow = makeBiquad('lowpass', 180, 0.72, sampleRate);
    const lpBody = makeBiquad('lowpass', 420, 0.72, sampleRate);
    const lpVocal = makeBiquad('lowpass', 2600, 0.72, sampleRate);
    const lpHit = makeBiquad('lowpass', 9200, 0.72, sampleRate);

    for (let frame = 0; frame < frameCount; frame += 1) {
        const start = frame * hopSize;
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < hopSize; i += 1) {
            const sample = channelData[start + i] || 0;
            sum += sample * sample;
            peak = Math.max(peak, Math.abs(sample));
        }
        const rms = Math.sqrt(sum / hopSize);
        lowEnergy[frame] = Math.abs(runBiquad(lpLow, runBiquad(hp, rms)));
        bodyEnergy[frame] = Math.abs(runBiquad(lpBody, runBiquad(hp, rms)));
        vocalEnergy[frame] = Math.abs(runBiquad(lpVocal, runBiquad(hp, rms)));
        hitEnergy[frame] = Math.abs(runBiquad(lpHit, runBiquad(hp, peak)));
    }

    return {
        frameCount,
        hopSec,
        lowEnergy,
        bodyEnergy,
        vocalEnergy,
        hitEnergy,
    };
};

export const bandAt = (arr: Float32Array, index: number) => {
    const idx = Math.max(0, Math.min(arr.length - 1, index | 0));
    const a = arr[Math.max(0, idx - 1)] || 0;
    const b = arr[idx] || 0;
    const c = arr[Math.min(arr.length - 1, idx + 1)] || 0;
    return (a + b * 2 + c) * 0.25;
};

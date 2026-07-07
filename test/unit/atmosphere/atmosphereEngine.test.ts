import { describe, expect, it } from 'vitest';
import { analyzeBeatMapFromAudioBuffer } from '@/utils/atmosphere/beatMapAnalyzer';
import {
    applyCinemaProfileFromBeatMap,
    buildMoodProfile,
    createCinemaTrackProfile,
    getScheduledBeatPulse,
    updateCinemaTrackProfile,
} from '@/utils/atmosphere/moodProfile';
import {
    createRealtimeBeatState,
    resetRealtimeBeatEngine,
    tickRealtimeBeatEngine,
} from '@/utils/atmosphere/realtimeBeatEngine';

const createKickBuffer = (durationSec = 2, sampleRate = 44100) => {
    const frameLength = Math.floor(durationSec * sampleRate);
    const buffer = {
        duration: durationSec,
        sampleRate,
        numberOfChannels: 1,
        length: frameLength,
        getChannelData: () => {
            const data = new Float32Array(frameLength);
            const kickInterval = Math.floor(sampleRate * 0.5);
            for (let i = 0; i < frameLength; i += kickInterval) {
                for (let j = 0; j < Math.min(900, frameLength - i); j += 1) {
                    const t = j / sampleRate;
                    data[i + j] += Math.sin(t * 120 * Math.PI * 2) * Math.exp(-t * 18) * 0.8;
                }
            }
            return data;
        },
    } as unknown as AudioBuffer;

    return buffer;
};

describe('realtimeBeatEngine', () => {
    it('detects strong low-frequency hits after warmup', () => {
        const state = createRealtimeBeatState(-100);
        const fftSize = 2048;
        const frequencyData = new Uint8Array(fftSize / 2);
        const timeDomainData = new Uint8Array(fftSize).fill(128);
        let maxPulse = 0;
        let maxScore = 0;

        for (let frame = 0; frame < 200; frame += 1) {
            frequencyData.fill(8);
            timeDomainData.fill(128);
            if (frame % 10 === 0) {
                for (let i = 2; i < 24; i += 1) {
                    frequencyData[i] = 255;
                }
                for (let i = 0; i < timeDomainData.length; i += 1) {
                    timeDomainData[i] = frame % 20 === 0 ? 220 : 140;
                }
            }

            const result = tickRealtimeBeatEngine(
                state,
                frequencyData,
                timeDomainData,
                44100,
                fftSize,
                frame * 0.05,
                0.05,
            );
            maxPulse = Math.max(maxPulse, result.pulse);
            maxScore = Math.max(maxScore, result.score);
        }

        expect(maxScore).toBeGreaterThan(0.1);
        expect(maxPulse).toBeGreaterThan(0.05);
    });

    it('resets state cleanly', () => {
        const state = createRealtimeBeatState(0);
        state.pulse = 0.9;
        state.beatCount = 12;
        resetRealtimeBeatEngine(state, 1.5);
        expect(state.pulse).toBe(0);
        expect(state.beatCount).toBe(0);
        expect(state.warmupUntil).toBe(1.5);
    });
});

describe('moodProfile', () => {
    it('ramps cinema scale with energetic samples', () => {
        const profile = createCinemaTrackProfile();
        for (let i = 0; i < 240; i += 1) {
            updateCinemaTrackProfile(profile, {
                energy: 0.8,
                low: 0.75,
                body: 0.55,
                vocal: 0.2,
                melody: 0.35,
                lowOnset: 0.6,
                energyOnset: 0.5,
            });
        }

        expect(profile.scale).toBeGreaterThan(0.82);
        const mood = buildMoodProfile(profile, {
            energy: 0.8,
            low: 0.75,
            body: 0.55,
            vocal: 0.2,
            melody: 0.35,
            lowOnset: 0.6,
            energyOnset: 0.5,
        }, null);
        expect(mood.aggression).toBeGreaterThan(0.4);
        expect(mood.energy).toBeGreaterThan(0.4);
    });

    it('uses offline beat map density and scheduled pulse window', () => {
        const profile = createCinemaTrackProfile();
        const beatMap = analyzeBeatMapFromAudioBuffer(createKickBuffer(4));
        applyCinemaProfileFromBeatMap(profile, beatMap);
        expect(beatMap.cameraBeats.length).toBeGreaterThan(0);
        expect(profile.density).toBeGreaterThan(0);

        const pulse = getScheduledBeatPulse(beatMap, beatMap.cameraBeats[0]?.time ?? 0, 0.09);
        expect(pulse).toBeGreaterThan(0);
    });
});

describe('beatMapAnalyzer', () => {
    it('builds camera beats from synthetic kick track', () => {
        const beatMap = analyzeBeatMapFromAudioBuffer(createKickBuffer(6));
        expect(beatMap.duration).toBe(6);
        expect(beatMap.cameraBeats.length).toBeGreaterThan(0);
        expect(beatMap.visualBeatCount).toBe(beatMap.cameraBeats.length);
        expect(beatMap.tempoSource).toBe('folia-offline-analyzer');
    });
});

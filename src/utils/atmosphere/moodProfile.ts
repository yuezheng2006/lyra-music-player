// src/utils/atmosphere/moodProfile.ts
// Derives cinema/mood parameters from realtime samples and offline beat maps.

import type { AtmosphereSample, BeatMap, MoodProfile } from '../../types/atmosphere';
import { DEFAULT_MOOD_PROFILE } from '../../types/atmosphere';
import { clamp01, clampRange } from './math';
import { computeScheduledBeatPulse } from './triggerScheduledBeat';

export interface CinemaTrackProfile {
    scale: number;
    target: number;
    frames: number;
    energyAvg: number;
    lowAvg: number;
    vocalAvg: number;
    melodyAvg: number;
    punchPeak: number;
    density: number;
}

export const createCinemaTrackProfile = (): CinemaTrackProfile => ({
    scale: 0.82,
    target: 0.82,
    frames: 0,
    energyAvg: 0,
    lowAvg: 0,
    vocalAvg: 0,
    melodyAvg: 0,
    punchPeak: 0.1,
    density: 0,
});

export const resetCinemaTrackProfile = (profile: CinemaTrackProfile) => {
    profile.scale = 0.82;
    profile.target = 0.82;
    profile.frames = 0;
    profile.energyAvg = 0;
    profile.lowAvg = 0;
    profile.vocalAvg = 0;
    profile.melodyAvg = 0;
    profile.punchPeak = 0.1;
    profile.density = 0;
};

export const updateCinemaTrackProfile = (
    profile: CinemaTrackProfile,
    sample: AtmosphereSample,
) => {
    profile.frames += 1;
    const early = profile.frames < 360;
    const k = early ? 0.02 : 0.006;
    const follow = (current: number, next: number, multiplier = 1) =>
        current + (next - current) * k * multiplier;

    profile.energyAvg = follow(profile.energyAvg, clamp01(sample.energy));
    profile.lowAvg = follow(profile.lowAvg, clamp01(sample.low));
    profile.vocalAvg = follow(profile.vocalAvg, clamp01(sample.vocal), 0.8);
    profile.melodyAvg = follow(profile.melodyAvg, clamp01(sample.melody), 0.8);

    const punchRaw = clamp01(
        (sample.lowOnset || 0) * 2.4
        + (sample.energyOnset || 0) * 1.5
        + sample.low * 0.16,
    );
    profile.punchPeak = Math.max(0.1, profile.punchPeak * 0.9975, punchRaw);

    const lowDrive = clamp01((profile.lowAvg - 0.2) / 0.42);
    const loudDrive = clamp01((profile.energyAvg - 0.18) / 0.4);
    const punchDrive = clamp01((profile.punchPeak - 0.13) / 0.36);
    const vocalSoft = clamp01(
        (profile.vocalAvg * 0.72 + profile.melodyAvg * 0.42 - profile.lowAvg * 0.34 - 0.08) / 0.42,
    );
    const quietSoft = clamp01((0.24 - profile.energyAvg) / 0.18);

    let target = 0.54
        + lowDrive * 0.28
        + loudDrive * 0.22
        + punchDrive * 0.34
        - vocalSoft * 0.34
        - quietSoft * 0.18;

    if (profile.density) {
        target += clamp01((profile.density - 0.55) / 1.6) * 0.14;
    }

    target = clampRange(target, 0.28, 1.12);
    profile.target = target;
    profile.scale += (target - profile.scale) * (target > profile.scale ? 0.03 : 0.045);
};

export const applyCinemaProfileFromBeatMap = (
    profile: CinemaTrackProfile,
    beatMap: BeatMap | null,
) => {
    if (!beatMap?.duration) return;

    const events = (beatMap.cameraBeats.length ? beatMap.cameraBeats : beatMap.beats)
        .filter(event => event.camera !== false);
    if (!events.length) return;

    let sumImpact = 0;
    let sumLow = 0;
    let primary = 0;
    events.forEach((event) => {
        sumImpact += Math.max(event.impact || 0, event.strength || 0);
        sumLow += event.low || 0;
        if (event.primary !== false) primary += 1;
    });

    const avgImpact = sumImpact / events.length;
    const avgLow = sumLow / events.length;
    const density = events.length / Math.max(20, beatMap.duration);
    profile.density = density;

    const target = 0.44
        + clamp01((avgImpact - 0.2) / 0.55) * 0.38
        + clamp01((avgLow - 0.24) / 0.48) * 0.18
        + clamp01((density - 0.45) / 1.65) * 0.2
        + clamp01(primary / Math.max(1, events.length)) * 0.08;

    profile.target = clampRange(target, 0.28, 1.12);
    profile.scale += (target - profile.scale) * (target < profile.scale ? 0.55 : 0.22);
};

export const buildMoodProfile = (
    cinemaProfile: CinemaTrackProfile,
    sample: AtmosphereSample,
    beatMap: BeatMap | null,
): MoodProfile => {
    const density = beatMap?.duration
        ? (beatMap.cameraBeats.length || beatMap.beats.length) / Math.max(20, beatMap.duration)
        : cinemaProfile.density;

    const energy = clamp01(cinemaProfile.energyAvg * 0.62 + sample.energy * 0.38);
    const aggression = clamp01(cinemaProfile.lowAvg * 0.48 + cinemaProfile.punchPeak * 0.52);
    const groove = clamp01(
        density > 0
            ? clamp01((density - 0.35) / 1.4) * 0.55 + cinemaProfile.scale * 0.45
            : cinemaProfile.scale * 0.72,
    );
    const space = clamp01(1 - cinemaProfile.vocalAvg * 0.42 - sample.vocal * 0.18);
    const brightness = clamp01(sample.melody * 0.55 + sample.body * 0.25 + (1 - sample.low) * 0.2);
    const warmth = clamp01(sample.low * 0.42 + sample.body * 0.28 + (1 - sample.vocal * 0.35) * 0.3);
    const stability = clamp01(
        beatMap?.gridStep && beatMap.gridStep > 0
            ? 0.55 + clamp01(beatMap.gridStep / 0.9) * 0.35
            : DEFAULT_MOOD_PROFILE.stability,
    );

    return {
        energy,
        aggression,
        groove,
        space,
        brightness,
        warmth,
        stability,
    };
};

export const getScheduledBeatPulse = (
    beatMap: BeatMap | null,
    currentTimeSec: number,
    windowSec = 0.09,
): number => {
    if (!beatMap) return 0;

    const events = beatMap.pulseBeats.length ? beatMap.pulseBeats : beatMap.cameraBeats;
    if (!events.length) return 0;

    let best = 0;
    for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        const delta = Math.abs(event.time - currentTimeSec);
        if (delta > windowSec) continue;
        const proximity = 1 - delta / windowSec;
        const pulse = computeScheduledBeatPulse(event, 0.82) * proximity;
        best = Math.max(best, pulse);
    }
    return clamp01(best);
};

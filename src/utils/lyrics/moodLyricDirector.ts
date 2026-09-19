// src/utils/lyrics/moodLyricDirector.ts
// Discrete MoodLyric profile for speaker-stage lyric motion (no per-frame React state).

import type { EmotionTag } from '../../types/moodEngine';

export type MoodLyricEnterStyle = 'rise' | 'fade' | 'bloom';

export interface MoodLyricDirectorInput {
    emotion?: EmotionTag | null;
    /** 0–1 atmosphere / energy band sample (discrete buckets only). */
    energy?: number;
    /** Approximate BPM; 0 when unknown. */
    bpm?: number;
    speakerActive: boolean;
}

export interface MoodLyricProfile {
    signature: string;
    floatAmpPx: number;
    breatheScale: number;
    glowSoftness: number;
    idleDriftPx: number;
    enterStyle: MoodLyricEnterStyle;
    beatScaleBoost: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const resolveEnergyBand = (energy: number): 'low' | 'mid' | 'high' => {
    if (energy < 0.33) return 'low';
    if (energy < 0.66) return 'mid';
    return 'high';
};

const resolveTempoBand = (bpm: number): 'slow' | 'mid' | 'fast' => {
    if (!Number.isFinite(bpm) || bpm <= 0) return 'mid';
    if (bpm < 90) return 'slow';
    if (bpm > 130) return 'fast';
    return 'mid';
};

/** Maps emotion + energy/tempo bands into a stable speaker-stage motion profile. */
export const resolveMoodLyricProfile = (input: MoodLyricDirectorInput): MoodLyricProfile => {
    if (!input.speakerActive) {
        return {
            signature: 'off',
            floatAmpPx: 0,
            breatheScale: 1,
            glowSoftness: 0,
            idleDriftPx: 0,
            enterStyle: 'fade',
            beatScaleBoost: 0,
        };
    }

    const emotion = input.emotion ?? 'neutral';
    const energyBand = resolveEnergyBand(clamp01(input.energy ?? 0.45));
    const tempoBand = resolveTempoBand(input.bpm ?? 0);

    // Amplitudes stay discrete but must read clearly vs default classic float (~14px / no scale).
    let floatAmpPx = 14;
    let breatheScale = 1.04;
    let glowSoftness = 0.52;
    let idleDriftPx = 5;
    let enterStyle: MoodLyricEnterStyle = 'rise';
    let beatScaleBoost = 0.028;

    switch (emotion) {
        case 'energetic':
        case 'angry':
        case 'uplifting':
            floatAmpPx = 22;
            breatheScale = 1.065;
            glowSoftness = 0.62;
            beatScaleBoost = 0.045;
            enterStyle = 'bloom';
            break;
        case 'sad':
        case 'melancholic':
            floatAmpPx = 10;
            breatheScale = 1.028;
            glowSoftness = 0.7;
            idleDriftPx = 8;
            beatScaleBoost = 0.016;
            enterStyle = 'fade';
            break;
        case 'calm':
        case 'relaxed':
            floatAmpPx = 12;
            breatheScale = 1.034;
            glowSoftness = 0.58;
            idleDriftPx = 6;
            beatScaleBoost = 0.02;
            enterStyle = 'rise';
            break;
        case 'romantic':
            floatAmpPx = 16;
            breatheScale = 1.045;
            glowSoftness = 0.66;
            idleDriftPx = 6;
            beatScaleBoost = 0.028;
            enterStyle = 'bloom';
            break;
        case 'happy':
            floatAmpPx = 18;
            breatheScale = 1.05;
            glowSoftness = 0.56;
            beatScaleBoost = 0.036;
            enterStyle = 'rise';
            break;
        case 'tense':
            floatAmpPx = 12;
            breatheScale = 1.032;
            glowSoftness = 0.42;
            beatScaleBoost = 0.038;
            enterStyle = 'fade';
            break;
        default:
            break;
    }

    if (energyBand === 'high') {
        floatAmpPx += 4;
        breatheScale += 0.012;
        beatScaleBoost += 0.01;
    } else if (energyBand === 'low') {
        floatAmpPx = Math.max(8, floatAmpPx - 3);
        breatheScale = Math.max(1.022, breatheScale - 0.008);
        glowSoftness += 0.06;
    }

    if (tempoBand === 'fast') {
        floatAmpPx += 2;
        beatScaleBoost += 0.006;
    } else if (tempoBand === 'slow') {
        idleDriftPx += 2;
        breatheScale = Math.max(1.022, breatheScale - 0.004);
    }

    const signature = `${emotion}|${energyBand}|${tempoBand}|${floatAmpPx.toFixed(1)}|${breatheScale.toFixed(3)}`;

    return {
        signature,
        floatAmpPx,
        breatheScale,
        glowSoftness: clamp01(glowSoftness),
        idleDriftPx,
        enterStyle,
        beatScaleBoost,
    };
};

/** CSS custom properties for speaker-stage lyric containers. */
export const moodLyricProfileToCssVars = (profile: MoodLyricProfile): Record<string, string> => ({
    '--mood-float-amp': `${profile.floatAmpPx}px`,
    '--mood-breathe-scale': String(profile.breatheScale),
    '--mood-glow-softness': String(profile.glowSoftness),
    '--mood-idle-drift': `${profile.idleDriftPx}px`,
    '--mood-beat-scale-boost': String(profile.beatScaleBoost),
    '--mood-enter-style': profile.enterStyle,
});

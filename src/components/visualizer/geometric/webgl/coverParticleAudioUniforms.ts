import type { AudioBands } from '../../../../types';
import { clamp01 } from '../../../../utils/atmosphere/math';
import { readMotionBandValue } from './readMotionBandValue';

// src/components/visualizer/geometric/webgl/coverParticleAudioUniforms.ts
// Maps Folia 0–255 analyser bands to Mineradio-style 0–1 WebGL uniforms.

export type CoverParticleAudioUniforms = {
    bass: number;
    mid: number;
    treble: number;
    beat: number;
    energy: number;
};

const env = (prev: number, next: number, attack: number, release: number) => {
    const k = next > prev ? attack : release;
    return prev + (next - prev) * k;
};

/** 将 MotionValue / 原始频段读成 0–1。Folia bridge 输出 0–255，Mineradio shader 期望 0–1。 */
export const normalizeMotionBand01 = (
    value: Parameters<typeof readMotionBandValue>[0],
): number => clamp01(readMotionBandValue(value) / 255);

/** 根据 spectrum 是否为空判断当前是否在真实播放音频。 */
export const isMusicSpectrumActive = (audioBands: AudioBands | undefined): boolean => {
    const spectrum = audioBands?.spectrum?.get();
    return Boolean(spectrum && spectrum.length > 0);
};

/** 按 Mineradio Emily 封面粒子曲线平滑并限幅音频 uniform。 */
export class CoverParticleAudioSmoother {
    private smoothBass = 0;

    private smoothMid = 0;

    private smoothTreble = 0;

    private smoothEnergy = 0;

    reset() {
        this.smoothBass = 0;
        this.smoothMid = 0;
        this.smoothTreble = 0;
        this.smoothEnergy = 0;
    }

    tick(
        audioBands: AudioBands | undefined,
        beat: number,
        intensity: number,
        dt: number,
        musicActive: boolean,
        atmosphereEnergy = 0,
    ): CoverParticleAudioUniforms {
        const beatClamped = clamp01(beat);
        const frameScale = Math.min(1, Math.max(0.001, dt) * 60);

        if (!musicActive) {
            this.smoothBass *= 0.91;
            this.smoothMid *= 0.91;
            this.smoothTreble *= 0.91;
            this.smoothEnergy *= 0.91;
            const idleBreath = normalizeMotionBand01(audioBands?.bass) * 0.55;
            return {
                bass: Math.min(0.90, (this.smoothBass * 1.05 + idleBreath + beatClamped * 0.12) * intensity),
                mid: Math.min(0.72, (this.smoothMid * 1.12 + idleBreath * 0.45) * intensity),
                treble: Math.min(0.62, (this.smoothTreble * 1.20 + idleBreath * 0.35) * intensity),
                beat: beatClamped * 0.82,
                energy: Math.max(this.smoothEnergy, atmosphereEnergy * 0.35),
            };
        }

        const rb = normalizeMotionBand01(audioBands?.bass);
        const rm = clamp01(
            normalizeMotionBand01(audioBands?.mid) * 0.72
            + normalizeMotionBand01(audioBands?.vocal) * 0.28,
        );
        const rt = normalizeMotionBand01(audioBands?.treble);
        const re = clamp01(
            (rb + rm + rt) / 3 * 0.55
            + normalizeMotionBand01(audioBands?.bass) * 0.25
            + atmosphereEnergy * 0.20,
        );

        this.smoothBass = env(
            this.smoothBass,
            Math.min(0.82, rb * 0.78 + re * 0.025),
            0.28 * frameScale,
            0.075 * frameScale,
        );
        this.smoothMid = env(
            this.smoothMid,
            Math.min(0.68, rm * 0.64 + re * 0.025),
            0.18 * frameScale,
            0.060 * frameScale,
        );
        this.smoothTreble = env(
            this.smoothTreble,
            Math.min(0.56, rt * 0.54),
            0.18 * frameScale,
            0.055 * frameScale,
        );
        this.smoothEnergy = env(
            this.smoothEnergy,
            Math.min(0.72, re),
            0.16 * frameScale,
            0.055 * frameScale,
        );

        const bass = Math.min(0.90, this.smoothBass * 1.05 + beatClamped * 0.18) * intensity;
        const mid = Math.min(0.72, this.smoothMid * 1.12) * intensity;
        const treble = Math.min(0.62, this.smoothTreble * 1.20) * intensity;

        return {
            bass: Math.max(bass, 0.06 * intensity),
            mid: Math.max(mid, 0.05 * intensity),
            treble: Math.max(treble, 0.04 * intensity),
            beat: beatClamped,
            energy: Math.max(this.smoothEnergy, beatClamped * 0.30, atmosphereEnergy * 0.42),
        };
    }
}

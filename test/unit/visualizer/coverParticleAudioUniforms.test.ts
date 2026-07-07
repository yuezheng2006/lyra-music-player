import { describe, expect, it } from 'vitest';
import {
    CoverParticleAudioSmoother,
    isMusicSpectrumActive,
    normalizeMotionBand01,
} from '../../../src/components/visualizer/geometric/webgl/coverParticleAudioUniforms';

describe('coverParticleAudioUniforms', () => {
    it('normalizes 0–255 motion bands to 0–1', () => {
        expect(normalizeMotionBand01(127.5)).toBeCloseTo(0.5, 3);
        expect(normalizeMotionBand01(255)).toBe(1);
        expect(normalizeMotionBand01(0)).toBe(0);
    });

    it('detects active playback from non-empty spectrum', () => {
        expect(isMusicSpectrumActive({
            bass: { get: () => 0 } as never,
            spectrum: { get: () => new Uint8Array([10, 20]) } as never,
        } as never)).toBe(true);
        expect(isMusicSpectrumActive({
            bass: { get: () => 0 } as never,
            spectrum: { get: () => new Uint8Array(0) } as never,
        } as never)).toBe(false);
    });

    it('maps strong bass into Mineradio-style capped uniforms while playing', () => {
        const smoother = new CoverParticleAudioSmoother();
        let uniforms = { bass: 0, mid: 0, treble: 0, beat: 0, energy: 0 };

        for (let frame = 0; frame < 30; frame += 1) {
            uniforms = smoother.tick(
                { bass: 220, mid: 140, treble: 90, vocal: 120 },
                0.62,
                0.85,
                0.016,
                true,
                0.48,
            );
        }

        expect(uniforms.bass).toBeGreaterThan(0.12);
        expect(uniforms.bass).toBeLessThanOrEqual(0.90 * 0.85 + 1e-6);
        expect(uniforms.energy).toBeGreaterThan(0.1);
        expect(uniforms.beat).toBeCloseTo(0.62, 2);
    });

    it('keeps idle silk breathing when music is not active', () => {
        const smoother = new CoverParticleAudioSmoother();
        const uniforms = smoother.tick({ bass: 28 }, 0, 0.85, 0.016, false, 0);

        expect(uniforms.bass).toBeGreaterThan(0);
        expect(uniforms.mid).toBeGreaterThan(0);
    });
});

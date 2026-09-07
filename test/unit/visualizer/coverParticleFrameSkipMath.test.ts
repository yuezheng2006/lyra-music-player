import { describe, expect, it } from 'vitest';
import { resolveCoverParticleEffectiveFrameSkip } from '@/utils/visualizer/coverParticleFrameSkipMath';
import { coverParticleTextureSizeForQualityTier } from '@/components/visualizer/geometric/webgl/prepareCoverParticleTexture';

// Guards idle / Electron paint stride and tiered cover upload sizes.

describe('coverParticleFrameSkipMath', () => {
    it('keeps Retina Electron floor at 8 while music is active', () => {
        expect(resolveCoverParticleEffectiveFrameSkip({
            profileFrameSkip: 2,
            isElectron: true,
            devicePixelRatio: 2,
            musicActive: true,
        })).toBe(8);
    });

    it('doubles stride when music is idle', () => {
        expect(resolveCoverParticleEffectiveFrameSkip({
            profileFrameSkip: 8,
            isElectron: true,
            devicePixelRatio: 2,
            musicActive: false,
        })).toBe(16);
    });

    it('uses profile skip on non-Electron when active', () => {
        expect(resolveCoverParticleEffectiveFrameSkip({
            profileFrameSkip: 2,
            isElectron: false,
            devicePixelRatio: 1,
            musicActive: true,
        })).toBe(2);
    });
});

describe('coverParticleTextureSizeForQualityTier', () => {
    it('shrinks cover uploads on balanced and lite tiers', () => {
        expect(coverParticleTextureSizeForQualityTier('high')).toBe(768);
        expect(coverParticleTextureSizeForQualityTier('balanced')).toBe(512);
        expect(coverParticleTextureSizeForQualityTier('lite')).toBe(384);
    });
});

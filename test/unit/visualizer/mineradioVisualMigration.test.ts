import { describe, expect, it } from 'vitest';
import { computeCinemaDrift } from '@/utils/atmosphere/cinemaDrift';
import {
    applyMineradioVisualPreset,
    INTERACTIVE3D_VISUAL_PRESET_BUNDLES,
    normalizeInteractive3dVisualPreset,
} from '@/components/visualizer/geometric/mineradioVisualPresets';
import { resolveStoredInteractive3dSceneTuning } from '@/components/visualizer/geometric/interactive3dSceneRegistry';

describe('Mineradio visual migration', () => {
    it('applies starfield preset bundle without extra canvas layers', () => {
        const tuning = applyMineradioVisualPreset('starfield');
        expect(tuning.visualPreset).toBe('starfield');
        expect(tuning.enableBloomParticles).toBe(false);
        expect(tuning.enableFloatingParticles).toBe(false);
        expect(tuning.enableCoverParticles).toBe(true);
        expect(tuning.enableDomShapes).toBe(false);
    });

    it('keeps quality tier when switching presets', () => {
        const tuning = applyMineradioVisualPreset('tunnel', resolveStoredInteractive3dSceneTuning({ qualityTier: 'lite' }));
        expect(tuning.qualityTier).toBe('lite');
        expect(tuning.visualPreset).toBe('tunnel');
    });

    it('normalizes legacy preset ids to the three shipped styles', () => {
        expect(normalizeInteractive3dVisualPreset('requiem')).toBe('emily');
        expect(normalizeInteractive3dVisualPreset('vinyl')).toBe('tunnel');
        expect(normalizeInteractive3dVisualPreset('void')).toBe('emily');
    });

    it('normalizes new Mineradio tuning fields from partial storage', () => {
        expect(resolveStoredInteractive3dSceneTuning({})).toMatchObject(INTERACTIVE3D_VISUAL_PRESET_BUNDLES.emily);
    });

    it('computes idle cinema drift from Mineradio updateCinema curve', () => {
        const frame = computeCinemaDrift(1.5, 0.5, { thetaKick: 0, phiKick: 0, radiusKick: 0 });
        expect(frame.thetaKick).not.toBe(0);
        expect(frame.radiusKick).not.toBe(0);
    });
});

import { describe, expect, it } from 'vitest';
import { computeCinemaDrift } from '@/utils/atmosphere/cinemaDrift';
import {
    applyMineradioVisualPreset,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
    normalizeInteractive3dVisualPreset,
} from '@/components/visualizer/geometric/mineradioVisualPresets';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';
import { resolveStoredInteractive3dSceneTuning } from '@/components/visualizer/geometric/interactive3dSceneRegistry';

describe('Mineradio visual migration', () => {
    it('applies quantum cube preset bundle as a structured WebGL style', () => {
        const tuning = applyMineradioVisualPreset('quantumCube');
        expect(tuning.visualPreset).toBe('quantumCube');
        expect(tuning.enableBloomParticles).toBe(true);
        expect(tuning.enableFloatingParticles).toBe(true);
        expect(tuning.enableCoverParticles).toBe(true);
        expect(tuning.enableDomShapes).toBe(false);
    });

    it('keeps quality tier when switching presets', () => {
        const tuning = applyMineradioVisualPreset('mineradioOrbit', resolveStoredInteractive3dSceneTuning({ qualityTier: 'lite' }));
        expect(tuning.qualityTier).toBe('lite');
        expect(tuning.visualPreset).toBe('mineradioOrbit');
    });

    it('applies Mineradio original preset bundles', () => {
        const tunnel = applyMineradioVisualPreset('mineradioTunnel');
        const vinylPreset = applyMineradioVisualPreset('mineradioVinyl');

        expect(tunnel.visualPreset).toBe('mineradioTunnel');
        expect(tunnel.enableCoverParticles).toBe(true);
        expect(tunnel.enableBassRipples).toBe(false);
        expect(vinylPreset.visualPreset).toBe('mineradioVinyl');
        expect(vinylPreset.enableCoverParticles).toBe(true);
        expect(vinylPreset.enableBloomParticles).toBe(true);
    });

    it('keeps the visible cover particles bright across every supported preset', () => {
        for (const preset of INTERACTIVE3D_VISUAL_PRESET_OPTIONS) {
            const tuning = applyMineradioVisualPreset(preset);
            expect(tuning.enableCoverParticles).toBe(true);
            expect(tuning.enableBloomParticles).toBe(true);
            expect(tuning.bloomStrength).toBeGreaterThan(0);
        }
    });

    it('normalizes legacy preset ids to shipped styles', () => {
        expect(normalizeInteractive3dVisualPreset('requiem')).toBe('emily');
        expect(normalizeInteractive3dVisualPreset('vinyl')).toBe('quantumCube');
        expect(normalizeInteractive3dVisualPreset('starfield')).toBe('quantumCube');
        expect(normalizeInteractive3dVisualPreset('tunnel')).toBe('emily');
        expect(normalizeInteractive3dVisualPreset('aurora')).toBe('emily');
        expect(normalizeInteractive3dVisualPreset('terrain')).toBe('emily');
        expect(normalizeInteractive3dVisualPreset('mineradioVoid')).toBe('emily');
        expect(normalizeInteractive3dVisualPreset('void')).toBe('emily');
        expect(normalizeInteractive3dVisualPreset('nebula')).toBe('mineradioGalaxy');
        expect(normalizeInteractive3dVisualPreset('orbit')).toBe('mineradioOrbit');
        expect(normalizeInteractive3dVisualPreset('wallpaper')).toBe('mineradioGalaxy');
    });

    it('falls back removed presets to the cover preset when applying bundles', () => {
        expect(applyMineradioVisualPreset('aurora').visualPreset).toBe('emily');
        expect(applyMineradioVisualPreset('terrain').visualPreset).toBe('emily');
        expect(applyMineradioVisualPreset('mineradioVoid').visualPreset).toBe('emily');
    });

    it('normalizes new Mineradio tuning fields from partial storage', () => {
        expect(resolveStoredInteractive3dSceneTuning({})).toMatchObject(DEFAULT_INTERACTIVE3D_SCENE_TUNING);
    });

    it('computes idle cinema drift from Mineradio updateCinema curve', () => {
        const frame = computeCinemaDrift(1.5, 0.5, { thetaKick: 0, phiKick: 0, radiusKick: 0 });
        expect(frame.thetaKick).not.toBe(0);
        expect(frame.radiusKick).not.toBe(0);
    });
});

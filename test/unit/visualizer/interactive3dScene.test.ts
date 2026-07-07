import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';
import {
    INTERACTIVE3D_SCENE_EFFECTS,
    resolveInteractive3dQualityProfile,
    resolveStoredInteractive3dSceneTuning,
} from '@/components/visualizer/geometric/interactive3dSceneRegistry';

describe('interactive3d scene registry', () => {
    it('maps each runtime effect component to a unique UI test id', () => {
        const testIds = INTERACTIVE3D_SCENE_EFFECTS.map(effect => effect.testId);
        expect(new Set(testIds).size).toBe(testIds.length);
        expect(testIds).toContain('interactive3d-effect-orbit-field');
        expect(testIds).toContain('interactive3d-effect-dom-shapes');
        expect(testIds).toContain('interactive3d-effect-bloom-particles');
        expect(testIds).toContain('interactive3d-effect-floating-particles');
        expect(testIds).toContain('interactive3d-effect-cover-particles');
    });

    it('normalizes persisted tuning and applies user layer toggles over quality caps', () => {
        const tuning = resolveStoredInteractive3dSceneTuning({
            qualityTier: 'lite',
            enableBassRipples: false,
            enableDomShapes: false,
        });

        expect(tuning.qualityTier).toBe('lite');
        expect(tuning.enableBassRipples).toBe(false);

        const profile = resolveInteractive3dQualityProfile(tuning);
        expect(profile.tier).toBe('lite');
        expect(profile.enableRipples).toBe(false);
        expect(profile.enableDomShapes).toBe(false);
        expect(profile.shapeCount).toBe(0);
    });

    it('honors explicit dom-shape enablement even on lite quality tier', () => {
        const tuning = resolveStoredInteractive3dSceneTuning({
            qualityTier: 'lite',
            enableDomShapes: true,
        });
        const profile = resolveInteractive3dQualityProfile(tuning);

        expect(profile.enableDomShapes).toBe(true);
        expect(profile.shapeCount).toBeGreaterThanOrEqual(8);
    });

    it('falls back to defaults for invalid quality tier', () => {
        expect(resolveStoredInteractive3dSceneTuning({
            qualityTier: 'invalid' as never,
        })).toEqual(DEFAULT_INTERACTIVE3D_SCENE_TUNING);
    });

    it('normalizes camera control mode and rejects unknown values', () => {
        expect(resolveStoredInteractive3dSceneTuning({
            cameraControl: 'wasd',
        }).cameraControl).toBe('wasd');

        expect(resolveStoredInteractive3dSceneTuning({
            cameraControl: 'invalid' as never,
        }).cameraControl).toBe(DEFAULT_INTERACTIVE3D_SCENE_TUNING.cameraControl);
    });
});

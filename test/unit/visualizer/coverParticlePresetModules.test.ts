import { describe, expect, it } from 'vitest';
import {
    COVER_PARTICLE_PRESET_MODULES,
    resolveCoverParticlePresetModule,
} from '@/components/visualizer/geometric/webgl/presets';
import {
    INTERACTIVE3D_SCENE_EFFECTS,
    INTERACTIVE3D_VISUAL_PRESET_REGISTRY,
} from '@/components/visualizer/geometric/interactive3dSceneRegistry';
import {
    resolveCoverParticleWebGLEffectEnablement,
} from '@/components/visualizer/geometric/webgl/effects/coverParticleEffectRegistry';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';

describe('cover particle preset modules', () => {
    it('registers the three shipped visual presets', () => {
        expect(COVER_PARTICLE_PRESET_MODULES.map(module => module.id)).toEqual([
            'emily',
            'mineradioTunnel',
            'mineradioGalaxy',
        ]);
        expect(INTERACTIVE3D_VISUAL_PRESET_REGISTRY).toHaveLength(3);
    });

    it('maps legacy preset ids onto shipped modules via normalize', () => {
        expect(resolveCoverParticlePresetModule('mineradioVinyl').id).toBe('emily');
        expect(resolveCoverParticlePresetModule('aurora').id).toBe('emily');
        expect(resolveCoverParticlePresetModule('mineradioOrbit').id).toBe('emily');
    });

    it('normalizes retired tunnel/galaxy ids onto emily (bass-ripple capable)', () => {
        expect(resolveCoverParticlePresetModule('emily').supportsBassRipples).toBe(true);
        expect(resolveCoverParticlePresetModule('mineradioTunnel').id).toBe('emily');
        expect(resolveCoverParticlePresetModule('mineradioGalaxy').id).toBe('emily');
        expect(resolveCoverParticlePresetModule('mineradioTunnel').supportsBassRipples).toBe(true);
    });
});

describe('interactive3d scene effect implementation kinds', () => {
    it('tags cover as cover-atmosphere runtime and bass / bloom as legacy WebGL modules', () => {
        const byId = Object.fromEntries(
            INTERACTIVE3D_SCENE_EFFECTS.map(effect => [effect.id, effect]),
        );
        expect(byId['cover-particles']?.componentName).toBe('CoverAtmosphereStage');
        expect(byId['cover-particles']?.implementationKind).toBe('cover-atmosphere-runtime');
        expect(byId['bass-ripple']?.implementationKind).toBe('webgl-effect');
        expect(byId['bloom-particles']?.implementationKind).toBe('webgl-effect');
        expect(byId['orbit-field']?.implementationKind).toBe('canvas-dead');
    });

    it('gates bass ripples for emily and bloom for high tier', () => {
        const emily = resolveCoverParticlePresetModule('emily');
        const enablement = resolveCoverParticleWebGLEffectEnablement({
            tuning: {
                ...DEFAULT_INTERACTIVE3D_SCENE_TUNING,
                enableBassRipples: true,
                enableBloomParticles: true,
            },
            qualityProfile: {
                tier: 'high',
                particleTarget: 420,
                maxBeatParticles: 36,
                devicePixelRatioCap: 1.25,
                enableRipples: true,
                enableBeatBursts: true,
                enableDomShapes: true,
                shapeCount: 12,
                frameSkip: 2,
            },
            presetModule: emily,
            smartAtmosphereEnabled: true,
        });
        expect(enablement['bass-ripple']).toBe(true);
        expect(enablement['bloom-particles']).toBe(true);
        expect(enablement['cover-particles']).toBe(true);
    });
});

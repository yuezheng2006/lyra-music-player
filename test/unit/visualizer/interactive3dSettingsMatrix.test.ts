import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';
import { applyMineradioVisualPreset } from '@/components/visualizer/geometric/mineradioVisualPresets';
import {
    INTERACTIVE3D_SCENE_EFFECTS,
    resolveStoredInteractive3dSceneTuning,
} from '@/components/visualizer/geometric/interactive3dSceneRegistry';
import { INTERACTIVE3D_VISUAL_PRESET_OPTIONS } from '@/components/visualizer/geometric/mineradioVisualPresets';
import {
    isInteractive3dWebGLOnlyPath,
    resolveInactiveInteractive3dSceneEffects,
    resolveInteractive3dBackgroundRenderer,
    resolveInteractive3dEffectiveSettings,
    resolveInteractive3dSettingsConflicts,
    shouldShowInteractive3dSceneLayerToggle,
} from '@/components/visualizer/resolveInteractive3dEffectiveSettings';

const baseInput = {
    visualizerBackgroundMode: 'interactive3d' as const,
    visualizerMode: 'classic' as const,
    staticMode: false,
    disableGeometricBackground: false,
    paused: false,
    enableSmartAtmosphere: true,
    interactive3dSceneTuning: DEFAULT_INTERACTIVE3D_SCENE_TUNING,
};

describe('interactive3d settings matrix', () => {
    it('exposes the shipped WebGL visual preset options', () => {
        expect(INTERACTIVE3D_VISUAL_PRESET_OPTIONS).toEqual([
            'emily',
            'quantumCube',
            'mineradioTunnel',
            'mineradioOrbit',
            'mineradioVinyl',
            'mineradioGalaxy',
        ]);
    });

    it('uses WebGL cover renderer on player page with interactive3d background', () => {
        expect(resolveInteractive3dBackgroundRenderer(baseInput)).toBe('webgl-cover');
    });

    it('marks canvas scene layers inactive on the WebGL-only path', () => {
        const inactive = resolveInactiveInteractive3dSceneEffects(baseInput);
        expect(inactive).toContain('orbit-field');
        expect(inactive).toContain('background-wash');
        expect(inactive).toContain('dom-shapes');
        expect(shouldShowInteractive3dSceneLayerToggle('cover-particles', baseInput)).toBe(true);
        expect(shouldShowInteractive3dSceneLayerToggle('orbit-field', baseInput)).toBe(false);
    });

    it('treats bass ripples as emily-only even when stored tuning enables them', () => {
        const starfield = applyMineradioVisualPreset('starfield');
        const inactive = resolveInactiveInteractive3dSceneEffects({
            ...baseInput,
            interactive3dSceneTuning: resolveStoredInteractive3dSceneTuning({
                ...starfield,
                enableBassRipples: true,
            }),
        });

        expect(inactive).toContain('bass-ripple');
    });

    it('switches to static placeholder when background paused off player view', () => {
        expect(resolveInteractive3dBackgroundRenderer({
            ...baseInput,
            paused: true,
        })).toBe('static-placeholder');
    });

    it('renders no interactive3d background when cover particles disabled', () => {
        expect(resolveInteractive3dBackgroundRenderer({
            ...baseInput,
            interactive3dSceneTuning: resolveStoredInteractive3dSceneTuning({
                enableCoverParticles: false,
            }),
        })).toBe('none');
    });

    it('keeps the stored default interactive3d background when monet controls lyrics', () => {
        expect(resolveInteractive3dEffectiveSettings({
            visualizerBackgroundMode: null,
            visualizerMode: 'monet',
        }).resolvedBackgroundMode).toBe('interactive3d');
    });

    it('allows monet lyrics with explicit interactive3d background selection', () => {
        const effective = resolveInteractive3dEffectiveSettings({
            ...baseInput,
            visualizerMode: 'monet',
        });

        expect(effective.resolvedBackgroundMode).toBe('interactive3d');
        expect(effective.renderer).toBe('webgl-cover');
        expect(effective.conflicts.some(conflict => conflict.id === 'monet-lyrics-with-3d-bg')).toBe(true);
    });

    it('reports smart atmosphere and unused canvas layer conflicts', () => {
        const conflicts = resolveInteractive3dSettingsConflicts({
            ...baseInput,
            enableSmartAtmosphere: false,
        });

        expect(conflicts.some(conflict => conflict.id === 'smart-atmosphere-off')).toBe(true);
        expect(conflicts.some(conflict => conflict.id === 'canvas-layers-unused')).toBe(true);
    });

    it('maps every registered scene effect to a visibility decision', () => {
        for (const effect of INTERACTIVE3D_SCENE_EFFECTS) {
            expect(typeof shouldShowInteractive3dSceneLayerToggle(effect.id, baseInput)).toBe('boolean');
        }
    });

    it('identifies interactive3d as WebGL-only path regardless of animation mode', () => {
        expect(isInteractive3dWebGLOnlyPath({
            visualizerBackgroundMode: 'interactive3d',
            visualizerMode: 'fume',
        })).toBe(true);
    });
});

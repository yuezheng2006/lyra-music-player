import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';
import { INTERACTIVE3D_SCENE_EFFECTS } from '@/components/visualizer/geometric/interactive3dSceneRegistry';
import { INTERACTIVE3D_VISUAL_PRESET_OPTIONS } from '@/components/visualizer/geometric/mineradioVisualPresets';
import {
    isInteractive3dWebGLOnlyPath,
    resolveInactiveInteractive3dSceneEffects,
    resolveInteractive3dBackgroundRenderer,
    resolveInteractive3dEffectiveSettings,
    resolveInteractive3dSettingsConflicts,
} from '@/components/visualizer/resolveInteractive3dEffectiveSettings';

const retiredInput = {
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
        ]);
    });

    it('does not activate a 3D renderer after interactive3d retirement', () => {
        expect(resolveInteractive3dBackgroundRenderer(retiredInput)).toBe('none');
        expect(resolveInactiveInteractive3dSceneEffects(retiredInput)).toEqual([]);
        expect(isInteractive3dWebGLOnlyPath({
            visualizerBackgroundMode: 'interactive3d',
            visualizerMode: 'fume',
        })).toBe(false);
    });

    it('falls back null background storage to common even when monet controls lyrics', () => {
        expect(resolveInteractive3dEffectiveSettings({
            visualizerBackgroundMode: null,
            visualizerMode: 'monet',
        }).resolvedBackgroundMode).toBe('common');
    });

    it('maps explicit interactive3d selection to common', () => {
        const effective = resolveInteractive3dEffectiveSettings({
            ...retiredInput,
            visualizerMode: 'monet',
        });

        expect(effective.resolvedBackgroundMode).toBe('common');
        expect(effective.renderer).toBe('none');
        expect(effective.webglActive).toBe(false);
        expect(effective.conflicts).toEqual([]);
    });

    it('does not report 3D-only atmosphere conflicts after retirement', () => {
        const conflicts = resolveInteractive3dSettingsConflicts({
            ...retiredInput,
            enableSmartAtmosphere: false,
        });

        expect(conflicts.some(conflict => conflict.id === 'smart-atmosphere-off')).toBe(false);
    });

    it('still enumerates registered scene effects', () => {
        expect(INTERACTIVE3D_SCENE_EFFECTS.length).toBeGreaterThan(0);
    });
});

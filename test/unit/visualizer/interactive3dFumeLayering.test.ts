import { describe, expect, it } from 'vitest';
import {
    resolvePlayerGeometricBackgroundDisabled,
    shouldDrawFumeCanvasBackground,
    shouldEnableInteractive3dWebGlLyrics,
} from '../../../src/components/visualizer/resolveInteractive3dFumeLayering';

describe('interactive3d Fume layering', () => {
    it('keeps shell geometric background enabled in interactive3d even when settings subview is open', () => {
        expect(resolvePlayerGeometricBackgroundDisabled('interactive3d', true)).toBe(false);
        expect(resolvePlayerGeometricBackgroundDisabled('interactive3d', false)).toBe(false);
    });

    it('disables shell geometric background outside interactive3d', () => {
        expect(resolvePlayerGeometricBackgroundDisabled('common', false)).toBe(true);
        expect(resolvePlayerGeometricBackgroundDisabled('monet', true)).toBe(true);
    });

    it('skips Fume canvas backdrop when interactive3d shell already renders WebGL cover stage', () => {
        expect(shouldDrawFumeCanvasBackground('interactive3d', false)).toBe(false);
        expect(shouldDrawFumeCanvasBackground('common', false)).toBe(true);
        expect(shouldDrawFumeCanvasBackground('common', true)).toBe(false);
    });

    it('keeps WebGL LyricStage off so DOM lyrics do not double-draw', () => {
        expect(shouldEnableInteractive3dWebGlLyrics('interactive3d')).toBe(false);
        expect(shouldEnableInteractive3dWebGlLyrics('common')).toBe(false);
    });
});

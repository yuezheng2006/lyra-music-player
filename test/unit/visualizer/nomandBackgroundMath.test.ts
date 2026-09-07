import { describe, expect, it } from 'vitest';
import { DEFAULT_NOMAND_BACKGROUND_TUNING } from '../../../src/types/nomandBackground';
import {
    getLensDistortionOverscan,
    getPaperTextureOverscan,
    listNomandEffectIds,
    registerNomandEffectId,
    resolveDaylightInversion,
    resolveHalftoneInversion,
    resolveNomandImageSource,
    resolveStoredNomandBackgroundTuning,
} from '../../../src/utils/visualizer/nomandApi';

describe('nomandBackgroundMath', () => {
    it('resolves cover first, then uploaded, and flips for uploaded-global', () => {
        expect(resolveNomandImageSource({
            imageSource: 'cover-derived',
            coverUrl: 'cover.jpg',
            uploadedUrl: 'upload.jpg',
        })).toBe('cover.jpg');
        expect(resolveNomandImageSource({
            imageSource: 'uploaded-global',
            coverUrl: 'cover.jpg',
            uploadedUrl: 'upload.jpg',
        })).toBe('upload.jpg');
        expect(resolveNomandImageSource({
            imageSource: 'cover-derived',
            coverUrl: null,
            uploadedUrl: 'upload.jpg',
        })).toBe('upload.jpg');
    });

    it('clamps stored tuning and falls back to defaults', () => {
        const next = resolveStoredNomandBackgroundTuning({
            effect: 'not-a-real-effect',
            size: 99,
            colorSteps: 0.4,
            lensDistortionBulge: -4,
            overlayOpacity: 3,
        });
        expect(next.effect).toBe(DEFAULT_NOMAND_BACKGROUND_TUNING.effect);
        expect(next.size).toBe(20);
        expect(next.colorSteps).toBe(1);
        expect(next.lensDistortionBulge).toBe(-1);
        expect(next.overlayOpacity).toBe(1);
    });

    it('registers extra effect ids without losing builtins', () => {
        registerNomandEffectId('plugin-demo');
        const ids = listNomandEffectIds();
        expect(ids).toContain('dithering');
        expect(ids).toContain('plugin-demo');
        expect(resolveStoredNomandBackgroundTuning({ effect: 'plugin-demo' }).effect).toBe('plugin-demo');
    });

    it('flips luminance on daylight when not keeping original colors', () => {
        expect(resolveDaylightInversion(false, false, true)).toBe(true);
        expect(resolveDaylightInversion(false, true, true)).toBe(false);
        expect(resolveHalftoneInversion(false, false, false)).toBe(true);
    });

    it('keeps distorting shaders pre-zoomed above 1', () => {
        expect(getPaperTextureOverscan(1, 1)).toBeGreaterThan(1);
        expect(getLensDistortionOverscan(0.8, 0.8)).toBeGreaterThan(1);
        expect(getLensDistortionOverscan(0, 0)).toBeGreaterThanOrEqual(1);
    });
});

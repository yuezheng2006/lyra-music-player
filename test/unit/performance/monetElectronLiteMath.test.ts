import { describe, expect, it } from 'vitest';
import {
    resolveMonetAudioCanvasDpr,
    resolveMonetAudioFrameSkip,
    resolveMonetAudioShadowBlurScale,
    shouldDisableMonetCompositorEffects,
    shouldForceMonetAudioStatic,
    shouldUseMonetStaticDecor,
} from '@/utils/performance/monetElectronLiteMath';

// test/unit/performance/monetElectronLiteMath.test.ts

describe('monetElectronLiteMath', () => {
    it('forces Electron Monet into static audio + no compositor filters', () => {
        expect(shouldForceMonetAudioStatic({
            staticMode: false,
            isElectron: true,
        })).toBe(true);

        expect(shouldUseMonetStaticDecor({
            staticMode: false,
            isElectron: true,
            gpuUnstable: false,
        })).toBe(true);

        expect(shouldDisableMonetCompositorEffects({
            isElectron: true,
        })).toBe(true);

        expect(resolveMonetAudioCanvasDpr({
            devicePixelRatio: 2,
            isElectron: true,
        })).toBe(1);

        expect(resolveMonetAudioShadowBlurScale({
            isElectron: true,
        })).toBe(0);

        expect(resolveMonetAudioFrameSkip({
            isElectron: true,
            gpuUnstable: true,
        })).toBe(3);
    });

    it('keeps browser Monet fully animated', () => {
        expect(shouldForceMonetAudioStatic({
            staticMode: false,
            isElectron: false,
        })).toBe(false);

        expect(shouldDisableMonetCompositorEffects({
            isElectron: false,
        })).toBe(false);

        expect(resolveMonetAudioShadowBlurScale({
            isElectron: false,
        })).toBe(1);
    });
});

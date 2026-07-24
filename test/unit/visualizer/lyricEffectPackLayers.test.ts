import { describe, expect, it } from 'vitest';
import { resolveLyricEffectPack } from '@/utils/lyricEffectPacks';
import { isLyricEffectPackNeonActive } from '@/components/visualizer/LyricEffectPackLayers';

// test/unit/visualizer/lyricEffectPackLayers.test.ts
// Neon scan is active-word only; pack resolve stays intensity-aware.

describe('LyricEffectPackLayers helpers', () => {
    it('marks neon scan only for active words', () => {
        const neon = resolveLyricEffectPack('neon', 'strong');
        expect(isLyricEffectPackNeonActive(neon, 'active')).toBe(true);
        expect(isLyricEffectPackNeonActive(neon, 'waiting')).toBe(false);
        expect(isLyricEffectPackNeonActive(neon, 'passed')).toBe(false);
    });

    it('keeps none pack inert for neon', () => {
        const none = resolveLyricEffectPack('none', 'extreme');
        expect(isLyricEffectPackNeonActive(none, 'active')).toBe(false);
    });
});

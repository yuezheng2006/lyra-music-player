import { describe, expect, it } from 'vitest';
import {
    moodLyricProfileToCssVars,
    resolveMoodLyricProfile,
} from '../../../src/utils/lyrics/moodLyricDirector';

// test/unit/lyrics/moodLyricDirector.test.ts

describe('resolveMoodLyricProfile', () => {
    it('returns off profile when speaker is inactive', () => {
        const profile = resolveMoodLyricProfile({
            speakerActive: false,
            emotion: 'energetic',
            energy: 0.9,
        });
        expect(profile.signature).toBe('off');
        expect(profile.floatAmpPx).toBe(0);
        expect(profile.breatheScale).toBe(1);
    });

    it('boosts energetic / high-energy motion', () => {
        const calm = resolveMoodLyricProfile({
            speakerActive: true,
            emotion: 'calm',
            energy: 0.2,
            bpm: 80,
        });
        const energetic = resolveMoodLyricProfile({
            speakerActive: true,
            emotion: 'energetic',
            energy: 0.9,
            bpm: 140,
        });
        expect(energetic.floatAmpPx).toBeGreaterThan(calm.floatAmpPx);
        expect(energetic.beatScaleBoost).toBeGreaterThan(calm.beatScaleBoost);
        expect(energetic.enterStyle).toBe('bloom');
    });

    it('keeps signature stable for same discrete bands', () => {
        const a = resolveMoodLyricProfile({
            speakerActive: true,
            emotion: 'happy',
            energy: 0.41,
            bpm: 110,
        });
        const b = resolveMoodLyricProfile({
            speakerActive: true,
            emotion: 'happy',
            energy: 0.44,
            bpm: 112,
        });
        expect(a.signature).toBe(b.signature);
    });
});

describe('moodLyricProfileToCssVars', () => {
    it('emits CSS custom properties', () => {
        const vars = moodLyricProfileToCssVars(resolveMoodLyricProfile({
            speakerActive: true,
            emotion: 'romantic',
            energy: 0.5,
        }));
        expect(vars['--mood-float-amp']).toMatch(/px$/);
        expect(Number(vars['--mood-breathe-scale'])).toBeGreaterThan(1);
        expect(vars['--mood-enter-style']).toBe('bloom');
    });
});

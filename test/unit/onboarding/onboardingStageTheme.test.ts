import { describe, expect, it } from 'vitest';
import { resolveOnboardingStageTheme } from '@/components/onboarding/onboardingStageTheme';

describe('resolveOnboardingStageTheme', () => {
    it('uses cool blue-white for step 1', () => {
        expect(resolveOnboardingStageTheme(1).ringHue).toBe(210);
    });

    it('uses cyan for step 2', () => {
        expect(resolveOnboardingStageTheme(2).ringHue).toBe(185);
    });

    it('uses warm silver for step 3', () => {
        expect(resolveOnboardingStageTheme(3).ringHue).toBe(35);
    });

    it('grows ring radius across steps', () => {
        const a = resolveOnboardingStageTheme(1).ringRadius;
        const b = resolveOnboardingStageTheme(2).ringRadius;
        const c = resolveOnboardingStageTheme(3).ringRadius;
        expect(a).toBeLessThan(b);
        expect(b).toBeLessThan(c);
    });
});

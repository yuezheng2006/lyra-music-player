import { describe, expect, it } from 'vitest';
import { greetingI18nKey, resolveGreetingPeriod } from '@/utils/home/greetingMath';

// test/unit/home/greetingMath.test.ts

describe('greetingMath', () => {
    it('maps hours into greeting periods', () => {
        expect(resolveGreetingPeriod(3)).toBe('lateNight');
        expect(resolveGreetingPeriod(7)).toBe('morning');
        expect(resolveGreetingPeriod(10)).toBe('forenoon');
        expect(resolveGreetingPeriod(12)).toBe('noon');
        expect(resolveGreetingPeriod(15)).toBe('afternoon');
        expect(resolveGreetingPeriod(20)).toBe('evening');
        expect(resolveGreetingPeriod(23)).toBe('night');
    });

    it('wraps out-of-range hours', () => {
        expect(resolveGreetingPeriod(24)).toBe('lateNight');
        expect(resolveGreetingPeriod(-1)).toBe('night');
    });

    it('returns i18n keys for the greeting card', () => {
        expect(greetingI18nKey(1)).toBe('home.greetingLateNight');
        expect(greetingI18nKey(9)).toBe('home.greetingForenoon');
    });
});

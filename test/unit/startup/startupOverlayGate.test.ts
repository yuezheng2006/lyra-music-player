import { describe, expect, it } from 'vitest';
import { resolveStartupOverlay } from '@/utils/startupOverlayGate';

// test/unit/startup/startupOverlayGate.test.ts

describe('resolveStartupOverlay', () => {
    it('prefers first-run onboarding over whats-new', () => {
        expect(resolveStartupOverlay({
            onboardingCompleted: false,
            lastSeenGuideVersion: null,
            appVersion: '1.0.3',
        })).toBe('onboarding');
    });

    it('shows whats-new after onboarding when the version changed', () => {
        expect(resolveStartupOverlay({
            onboardingCompleted: true,
            lastSeenGuideVersion: '1.0.2',
            appVersion: '1.0.3',
        })).toBe('whats-new');
    });

    it('shows nothing for returning users on the same version', () => {
        expect(resolveStartupOverlay({
            onboardingCompleted: true,
            lastSeenGuideVersion: '1.0.3',
            appVersion: '1.0.3',
        })).toBe(null);
    });
});

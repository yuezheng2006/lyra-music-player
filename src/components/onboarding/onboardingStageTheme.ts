// src/components/onboarding/onboardingStageTheme.ts
// Maps onboarding steps to lightweight stage look parameters.

export type OnboardingStageStep = 1 | 2 | 3;

export type OnboardingStageTheme = {
    ringHue: number;
    ringRadius: number;
    particleTint: string;
    exposure: number;
};

const THEMES: Record<OnboardingStageStep, OnboardingStageTheme> = {
    1: { ringHue: 210, ringRadius: 1.15, particleTint: '#e8eef8', exposure: 0.85 },
    2: { ringHue: 185, ringRadius: 1.35, particleTint: '#b8e7ff', exposure: 0.95 },
    3: { ringHue: 35, ringRadius: 1.55, particleTint: '#f0e6d8', exposure: 1.05 },
};

/** Resolve the premiere stage theme for a wizard step. */
export function resolveOnboardingStageTheme(step: OnboardingStageStep): OnboardingStageTheme {
    return THEMES[step];
}

// src/utils/startupOverlayGate.ts
// Decides which first-run / version overlay should open after boot.

export type StartupOverlayKind = 'onboarding' | 'whats-new' | null;

export type ResolveStartupOverlayParams = {
    onboardingCompleted: boolean;
    lastSeenGuideVersion: string | null;
    appVersion: string | null | undefined;
};

/**
 * Prefer first-run onboarding over What's New when both would apply.
 * Returning users only see What's New after a version bump.
 */
export function resolveStartupOverlay({
    onboardingCompleted,
    lastSeenGuideVersion,
    appVersion,
}: ResolveStartupOverlayParams): StartupOverlayKind {
    if (!onboardingCompleted) {
        return 'onboarding';
    }

    if (!appVersion) {
        return null;
    }

    if (lastSeenGuideVersion !== appVersion) {
        return 'whats-new';
    }

    return null;
}

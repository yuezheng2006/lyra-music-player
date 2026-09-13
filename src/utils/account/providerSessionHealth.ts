// src/utils/account/providerSessionHealth.ts
// Portable session badge resolver (Mineradio-style copy), without VIP API payloads.

export type ProviderSessionBadge =
    | 'guest'
    | 'ready'
    | 'auth_incomplete';

export type ResolveProviderSessionBadgeInput = {
    isLoggedIn: boolean;
    /** Cookie / token blob present but login may still be incomplete. */
    hasSessionMaterial?: boolean;
    /** QQ: qm_keyst / music_key ready for playback URLs. */
    playbackKeyReady?: boolean;
};

/**
 * Maps coarse auth signals to a UI badge. Membership/VIP “待同步” needs sidecar
 * probes Lyra does not yet expose — keep that out until those fields exist.
 */
export const resolveProviderSessionBadge = (
    input: ResolveProviderSessionBadgeInput,
): ProviderSessionBadge => {
    if (input.isLoggedIn && input.playbackKeyReady === false) {
        return 'auth_incomplete';
    }
    if (input.isLoggedIn) {
        return 'ready';
    }
    if (input.hasSessionMaterial) {
        return 'auth_incomplete';
    }
    return 'guest';
};

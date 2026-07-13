// src/utils/featureFlags.ts
// Compile-time product feature gates for user-facing surfaces.

/**
 * When false, Navidrome is hidden from sidebar, onboarding, settings,
 * command palette, and panel tabs. Playback/service code stays for later re-enable.
 */
export const NAVIDROME_UI_ENABLED = false;

export function isNavidromeUiEnabled(): boolean {
    return NAVIDROME_UI_ENABLED;
}

/**
 * When false, YouTube Music is hidden from sidebar and home routing.
 * Playback/service code can remain for later re-enable.
 */
export const YTMUSIC_UI_ENABLED = true;

export function isYtmusicUiEnabled(): boolean {
    return YTMUSIC_UI_ENABLED;
}

/**
 * When false, Discord Rich Presence is hidden from settings and command palette.
 * Electron bridge code can remain dormant for later re-enable.
 */
export const DISCORD_PRESENCE_UI_ENABLED = false;

export function isDiscordPresenceUiEnabled(): boolean {
    return DISCORD_PRESENCE_UI_ENABLED;
}

// src/utils/ui/homePeerSectionMath.ts
// Peer default cards only exist for filter-enabled sources — demote them to shortcuts.

/**
 * Peer defaults are injected only for providers already on in「来源」.
 * A second discovery block + legal banner would duplicate the filter row.
 */
export const shouldShowHomePeerLegalNotice = (_specialItemCount: number): boolean => false;

/**
 * Peer shortcuts open the same channels as「来源」pills.
 * Keep them only when the fold has no personal playlists / liked rows yet,
 * so logged-in homes are not a second discovery wall.
 */
export const shouldShowHomePeerShortcuts = (
    specialItemCount: number,
    personalItemCount = 0,
): boolean => specialItemCount > 0 && personalItemCount <= 0;

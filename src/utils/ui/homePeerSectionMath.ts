// src/utils/ui/homePeerSectionMath.ts
// Guest discovery is the listening desk. Peer chip rows must not occupy the fold.

/**
 * Peer defaults are injected only for providers already on in「来源」.
 * A second discovery block + legal banner would duplicate the filter row.
 */
export const shouldShowHomePeerLegalNotice = (_specialItemCount: number): boolean => false;

/**
 * Per-source shortcut shelves were a directory, not a workbench.
 * The cover mosaic + personal-library invite replace them.
 */
export const shouldShowHomePeerLibrary = (
    _specialItemCount: number,
    _personalItemCount = 0,
): boolean => false;

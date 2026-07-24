// src/utils/visualizer/monetTitleLayoutMath.ts
// Monet title wrap policy: keep medium titles on one line when the column is wide enough.

/** CJK-heavy titles around this length still fit one line at Monet title scale. */
export const MONET_TITLE_NOWRAP_MAX_CHARS = 26;

/** Prefer a single-line title when the string is not especially long. */
export const shouldPreferMonetTitleNowrap = (title: string | null | undefined): boolean => {
    const text = (title ?? '').trim();
    if (!text) return true;
    // Spread counts code points so emoji / CJK are not split into UTF-16 units.
    return [...text].length <= MONET_TITLE_NOWRAP_MAX_CHARS;
};

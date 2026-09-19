// src/components/command-palette/search/normalize.ts
// Single text-normalize entry for palette matching. Queue search must use the same folding.

export const normalizeSearchText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

/** Split a normalized string on spaces. Empty input yields [] instead of ['']. */
export const splitWords = (value: string): string[] => (value ? value.split(' ').filter(Boolean) : []);

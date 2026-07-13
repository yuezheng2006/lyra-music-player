import { PLAYER_PAGE_SHORTCUTS as CATALOG_SHORTCUTS, type ShortcutEntry } from '../shortcuts/shortcutCatalog';

// src/components/modal/userGuideContent.ts
// User guide page metadata; player shortcuts derive from shortcutCatalog.

export type UserGuideShortcut = ShortcutEntry;

export type GuidePage = 1 | 2 | 3 | 4 | 5 | 6;

export const USER_GUIDE_PAGE_COUNT = 6;
/** @deprecated Version highlights now use lastSeenGuideVersion !== __APP_VERSION__. Kept for docs/comments only. */
export const USER_GUIDE_AUTO_OPEN_VERSION: string | null = null;

export const PLAYER_PAGE_SHORTCUTS: UserGuideShortcut[] = CATALOG_SHORTCUTS;

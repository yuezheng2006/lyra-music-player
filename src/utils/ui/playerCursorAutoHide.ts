// src/utils/ui/playerCursorAutoHide.ts
// Folia-shaped lyric-page idle cursor: hide the pointer on the visual layer only.

export const shouldHidePlayerCursor = (params: {
    isPlayerView: boolean;
    isPlayerChromeHidden: boolean;
    autoHideCursorWithPlayerChrome: boolean;
}): boolean => (
    params.isPlayerView
    && params.isPlayerChromeHidden
    && params.autoHideCursorWithPlayerChrome
);

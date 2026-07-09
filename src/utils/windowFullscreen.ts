// Electron / browser window fullscreen helpers for combined fullscreen play.

export type WindowFullscreenChangedState = {
    isFullscreen: boolean;
};

export function isBrowserDocumentFullscreen(): boolean {
    if (typeof document === 'undefined') {
        return false;
    }
    return Boolean(document.fullscreenElement);
}

export async function setBrowserDocumentFullscreen(enabled: boolean): Promise<boolean> {
    if (typeof document === 'undefined') {
        return false;
    }

    try {
        if (enabled) {
            if (document.fullscreenElement) {
                return true;
            }
            const root = document.documentElement;
            if (typeof root.requestFullscreen !== 'function') {
                return false;
            }
            await root.requestFullscreen();
            return isBrowserDocumentFullscreen();
        }

        if (!document.fullscreenElement) {
            return false;
        }
        if (typeof document.exitFullscreen !== 'function') {
            return false;
        }
        await document.exitFullscreen();
        return isBrowserDocumentFullscreen();
    } catch {
        return isBrowserDocumentFullscreen();
    }
}

export async function readWindowFullscreen(): Promise<boolean> {
    const electronApi = window.electron;
    if (electronApi?.isWindowFullscreen) {
        try {
            return Boolean(await electronApi.isWindowFullscreen());
        } catch {
            return false;
        }
    }
    return isBrowserDocumentFullscreen();
}

/** Enter or leave OS / document fullscreen. Returns the resulting fullscreen state. */
export async function setWindowFullscreen(enabled: boolean): Promise<boolean> {
    const electronApi = window.electron;
    if (electronApi?.setWindowFullscreen) {
        try {
            return Boolean(await electronApi.setWindowFullscreen(enabled));
        } catch {
            return readWindowFullscreen();
        }
    }
    return setBrowserDocumentFullscreen(enabled);
}

/** Fully active: player-only fill + OS/document fullscreen. */
export function isFullscreenPlayActive(params: {
    currentView: string;
    isPlayerChromeHidden: boolean;
    isWindowFullscreen: boolean;
}): boolean {
    return params.currentView === 'player'
        && params.isPlayerChromeHidden
        && params.isWindowFullscreen;
}

/** Any half-state that the combined toggle should treat as “on” and exit together. */
export function isFullscreenPlayEngaged(params: {
    currentView: string;
    isPlayerChromeHidden: boolean;
    isWindowFullscreen: boolean;
}): boolean {
    return params.isWindowFullscreen
        || (params.currentView === 'player' && params.isPlayerChromeHidden);
}

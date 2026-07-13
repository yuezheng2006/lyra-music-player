// src/components/shortcuts/shortcutKeyboardGuards.ts
// Pure guards for shortcut cheat-sheet open, mod-shift chords, and Esc-to-exit-fullscreen.

export function isTextEntryTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName.toLowerCase();
    return tagName === 'input'
        || tagName === 'textarea'
        || tagName === 'select'
        || target.isContentEditable;
}

export function hasFoliaKeyboardWindow(root: ParentNode | Document = document): boolean {
    return Boolean(root.querySelector('[data-folia-keyboard-window="true"]'));
}

const isMacPlatform = (): boolean => (
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac')
);

/** Primary modifier: Cmd on macOS, Ctrl elsewhere. */
export function hasPrimaryModifier(params: {
    metaKey: boolean;
    ctrlKey: boolean;
    isMac?: boolean;
}): boolean {
    const isMac = params.isMac ?? isMacPlatform();
    return isMac
        ? (params.metaKey && !params.ctrlKey)
        : (params.ctrlKey && !params.metaKey);
}

/**
 * Cmd/Ctrl+Letter chords for view/panel actions (no Shift/Alt) to avoid bare-key mishits.
 */
export function isModKeyChord(params: {
    code: string;
    expectedCode: string;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    isMac?: boolean;
}): boolean {
    if (params.code !== params.expectedCode) {
        return false;
    }
    if (params.shiftKey || params.altKey) {
        return false;
    }
    return hasPrimaryModifier(params);
}

/** Esc exits immersive / half-state fullscreen only when no modal owns the key. */
export function shouldExitFullscreenOnEscape(params: {
    isTextEntryTarget: boolean;
    hasBlockingWindow: boolean;
    isFullscreenPlayEngaged: boolean;
}): boolean {
    if (params.isTextEntryTarget || params.hasBlockingWindow) {
        return false;
    }
    return params.isFullscreenPlayEngaged;
}

/**
 * Cmd+/ or Cmd+? (mac) / Ctrl+/ or Ctrl+? (win/linux) opens the cheat sheet.
 * Shift is allowed because `?` is Shift+/ on common layouts.
 */
export function shouldOpenShortcutsCheatSheet(params: {
    code: string;
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey?: boolean;
    hasBlockingWindow: boolean;
    isMac?: boolean;
}): boolean {
    if (params.hasBlockingWindow || params.altKey) {
        return false;
    }

    const isSlash = params.code === 'Slash'
        || params.key === '/'
        || params.key === '?'
        || params.code === 'IntlBackslash';
    if (!isSlash) {
        return false;
    }

    return hasPrimaryModifier(params);
}

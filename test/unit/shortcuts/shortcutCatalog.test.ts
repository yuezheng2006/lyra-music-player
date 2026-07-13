import { describe, expect, it } from 'vitest';
import {
    PLAYER_PAGE_SHORTCUTS,
    SHORTCUT_GROUPS,
    findShortcutById,
} from '@/components/shortcuts/shortcutCatalog';
import {
    isModKeyChord,
    shouldExitFullscreenOnEscape,
    shouldOpenShortcutsCheatSheet,
} from '@/components/shortcuts/shortcutKeyboardGuards';

// test/unit/shortcuts/shortcutCatalog.test.ts

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');
const mod = isMac ? 'Cmd' : 'Ctrl';

describe('shortcutCatalog', () => {
    it('exposes three display groups for the cheat sheet', () => {
        expect(SHORTCUT_GROUPS.map(group => group.id)).toEqual(['playback', 'panels', 'view']);
        expect(PLAYER_PAGE_SHORTCUTS.length).toBe(
            SHORTCUT_GROUPS.reduce((total, group) => total + group.entries.length, 0),
        );
    });

    it('uses Cmd/Ctrl+letter chords for fullscreen, chrome hide, panel, and command palette', () => {
        const fullscreen = findShortcutById('immersive-fullscreen');
        const chromeHide = findShortcutById('hide-player-chrome');
        const exitFullscreen = findShortcutById('exit-fullscreen');
        const cheatSheet = findShortcutById('open-shortcuts-cheatsheet');
        const commandPalette = findShortcutById('open-command-palette');
        const rightPanel = findShortcutById('toggle-right-panel');

        expect(fullscreen?.keys).toEqual([mod, 'F']);
        expect(chromeHide?.keys).toEqual([mod, 'H']);
        expect(commandPalette?.keys).toEqual([mod, 'S']);
        expect(rightPanel?.keys).toEqual([mod, 'P']);
        expect(exitFullscreen?.keys).toEqual(['Esc']);
        expect(cheatSheet?.keys).toEqual([mod, '/']);
    });
});

describe('shortcutKeyboardGuards', () => {
    it('matches mod+letter chords and rejects bare keys or shift chords', () => {
        expect(isModKeyChord({
            code: 'KeyF',
            expectedCode: 'KeyF',
            metaKey: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            isMac: true,
        })).toBe(true);

        expect(isModKeyChord({
            code: 'KeyF',
            expectedCode: 'KeyF',
            metaKey: false,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            isMac: true,
        })).toBe(false);

        expect(isModKeyChord({
            code: 'KeyF',
            expectedCode: 'KeyF',
            metaKey: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: true,
            isMac: true,
        })).toBe(false);

        expect(isModKeyChord({
            code: 'KeyP',
            expectedCode: 'KeyP',
            metaKey: false,
            ctrlKey: true,
            altKey: false,
            shiftKey: false,
            isMac: false,
        })).toBe(true);
    });

    it('opens the cheat sheet for Cmd/Ctrl+/ and Cmd/Ctrl+?', () => {
        expect(shouldOpenShortcutsCheatSheet({
            code: 'Slash',
            key: '/',
            metaKey: true,
            ctrlKey: false,
            altKey: false,
            hasBlockingWindow: false,
            isMac: true,
        })).toBe(true);

        expect(shouldOpenShortcutsCheatSheet({
            code: 'Slash',
            key: '/',
            metaKey: false,
            ctrlKey: false,
            altKey: false,
            hasBlockingWindow: false,
            isMac: true,
        })).toBe(false);
    });

    it('exits fullscreen on Esc only when engaged and no modal owns the key', () => {
        expect(shouldExitFullscreenOnEscape({
            isTextEntryTarget: false,
            hasBlockingWindow: false,
            isFullscreenPlayEngaged: true,
        })).toBe(true);

        expect(shouldExitFullscreenOnEscape({
            isTextEntryTarget: false,
            hasBlockingWindow: false,
            isFullscreenPlayEngaged: false,
        })).toBe(false);
    });
});

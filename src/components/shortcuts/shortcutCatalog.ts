// src/components/shortcuts/shortcutCatalog.ts
// Single source of truth for player-page keyboard shortcuts shown in the cheat sheet and user guide.

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');
const mod = isMac ? 'Cmd' : 'Ctrl';

const modOnly = (key: string): Pick<ShortcutEntry, 'keys' | 'separator'> => ({
    keys: [mod, key],
    separator: '+',
});

export type ShortcutGroupId = 'playback' | 'panels' | 'view';

export type ShortcutEntry = {
    id: string;
    group: ShortcutGroupId;
    titleKey: string;
    fallback: string;
    keys: string[];
    separator?: '+' | '/';
};

export type ShortcutGroup = {
    id: ShortcutGroupId;
    titleKey: string;
    fallback: string;
    entries: ShortcutEntry[];
};

const PLAYBACK_SHORTCUTS: ShortcutEntry[] = [
    {
        id: 'play-pause',
        group: 'playback',
        titleKey: 'help.playPause',
        fallback: 'Play / Pause',
        keys: ['Space'],
    },
    {
        id: 'previous-track',
        group: 'playback',
        titleKey: 'help.previousTrack',
        fallback: 'Previous Track',
        keys: [mod, '←'],
        separator: '+',
    },
    {
        id: 'next-track',
        group: 'playback',
        titleKey: 'help.nextTrack',
        fallback: 'Next Track',
        keys: [mod, '→'],
        separator: '+',
    },
    {
        id: 'seek-backward',
        group: 'playback',
        titleKey: 'help.seekBackward',
        fallback: 'Seek Backward 5s',
        keys: ['←'],
    },
    {
        id: 'seek-forward',
        group: 'playback',
        titleKey: 'help.seekForward',
        fallback: 'Seek Forward 5s',
        keys: ['→'],
    },
];

const PANEL_SHORTCUTS: ShortcutEntry[] = [
    {
        id: 'open-command-palette',
        group: 'panels',
        titleKey: 'help.openCommandPalette',
        fallback: 'Open command palette',
        ...modOnly('S'),
    },
    {
        id: 'toggle-right-panel',
        group: 'panels',
        titleKey: 'help.toggleRightPanel',
        fallback: 'Toggle right panel',
        ...modOnly('P'),
    },
    {
        id: 'open-shortcuts-cheatsheet',
        group: 'panels',
        titleKey: 'help.openShortcutsCheatSheet',
        fallback: 'Open shortcuts cheat sheet',
        ...modOnly('/'),
    },
];

const VIEW_SHORTCUTS: ShortcutEntry[] = [
    {
        id: 'immersive-fullscreen',
        group: 'view',
        titleKey: 'help.browserFullscreen',
        fallback: 'Fullscreen player',
        ...modOnly('F'),
    },
    {
        id: 'hide-player-chrome',
        group: 'view',
        titleKey: 'help.hidePlayerChrome',
        fallback: 'Hide player chrome',
        ...modOnly('H'),
    },
    {
        id: 'exit-fullscreen',
        group: 'view',
        titleKey: 'help.exitFullscreenShortcut',
        fallback: 'Exit fullscreen',
        keys: ['Esc'],
    },
];

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        id: 'playback',
        titleKey: 'help.shortcutGroupPlayback',
        fallback: 'Playback',
        entries: PLAYBACK_SHORTCUTS,
    },
    {
        id: 'panels',
        titleKey: 'help.shortcutGroupPanels',
        fallback: 'Panels & commands',
        entries: PANEL_SHORTCUTS,
    },
    {
        id: 'view',
        titleKey: 'help.shortcutGroupView',
        fallback: 'View',
        entries: VIEW_SHORTCUTS,
    },
];

/** Flat list used by the legacy user-guide shortcuts page. */
export const PLAYER_PAGE_SHORTCUTS: ShortcutEntry[] = SHORTCUT_GROUPS.flatMap(group => group.entries);

export function findShortcutById(id: string): ShortcutEntry | undefined {
    return PLAYER_PAGE_SHORTCUTS.find(entry => entry.id === id);
}

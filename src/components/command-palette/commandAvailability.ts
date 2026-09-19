import { isDiscordPresenceUiEnabled, isNavidromeUiEnabled } from '../../utils/featureFlags';
import { useAddToPlaylistStore } from '../../stores/useAddToPlaylistStore';
import type { CommandPaletteCommand, CommandPaletteContext } from './types';

// src/components/command-palette/commandAvailability.ts
// Filters the registry for the current runtime (Electron, Navidrome, Discord, …).

const isElectronWindow = () => {
    const isWebBrowser = typeof window !== 'undefined';
    return isWebBrowser && Boolean((window as Window & { electron?: unknown }).electron);
};

const ELECTRON_ONLY_COMMAND_IDS = new Set([
    'settings-desktop',
    'desktop-lyrics-toggle',
    'desktop-lyrics-lock-toggle',
    'open-download-directory',
    'download-current-song',
    'download-search-results',
    'toggle-auto-resync-download-folder',
]);

const NAVIDROME_COMMAND_IDS = new Set([
    'search-navidrome',
    'home-navidrome',
    'panel-navi',
]);

/** Commands the palette may show for this context. */
export const getAvailableCommandPaletteCommands = (
    commands: CommandPaletteCommand[],
    context?: CommandPaletteContext,
): CommandPaletteCommand[] => {
    const electron = isElectronWindow();
    const inBrowser = typeof window !== 'undefined';

    return commands.filter(command => {
        if (NAVIDROME_COMMAND_IDS.has(command.id)) {
            return isNavidromeUiEnabled();
        }

        if (command.id === 'settings-discord-presence') {
            return isDiscordPresenceUiEnabled();
        }

        if (ELECTRON_ONLY_COMMAND_IDS.has(command.id) && inBrowser && !electron) {
            return false;
        }

        if (command.id === 'playback-auto-match-best-lyric') {
            return Boolean(context?.enableAlternativeLyricSources);
        }

        if (command.id === 'playback-add-to-playlist') {
            return context ? useAddToPlaylistStore.getState().availability.canAdd : true;
        }

        if (command.id === 'theme-generate-current') {
            return context ? context.canGenerateAITheme && !context.isGeneratingTheme : true;
        }

        if (command.id === 'theme-quick-editor') {
            return context ? context.canOpenThemeQuickEditor : true;
        }

        if (command.group === 'search') {
            if (command.id === 'search-current') return true;
            if (context) {
                return false;
            }
        }
        return true;
    });
};

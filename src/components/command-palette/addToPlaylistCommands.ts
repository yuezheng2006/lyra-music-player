import type { CommandPaletteCommand } from './types';
import { openAddToPlaylist, useAddToPlaylistStore } from '../../stores/useAddToPlaylistStore';

// src/components/command-palette/addToPlaylistCommands.ts
// Open the current-song playlist picker from anywhere; the host owns the dialog.

export const ADD_TO_PLAYLIST_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'playback-add-to-playlist',
        group: 'playback',
        title: 'Add to a playlist',
        description: 'Put the current song in one of your playlists',
        keywords: [
            'add to playlist',
            'playlist',
            'collect',
            '添加到歌单',
            '收藏到歌单',
            '加入歌单',
            'tianjiadaogedan',
            'jiarugedan',
            'tjdgd',
            'jrgd',
        ],
        execute: () => {
            if (!useAddToPlaylistStore.getState().availability.canAdd) {
                return false;
            }
            openAddToPlaylist();
            return true;
        },
    },
];

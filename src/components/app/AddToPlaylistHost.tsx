import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { LocalPlaylist, NeteasePlaylist, SongResult } from '../../types';
import PlaylistSelectionDialog from '../shared/PlaylistSelectionDialog';
import TextInputDialog from '../shared/TextInputDialog';
import { useAddToPlaylistStore } from '../../stores/useAddToPlaylistStore';
import { resolveAddToPlaylistAvailability, resolveAddToPlaylistSongKind } from '../../utils/addToPlaylistAvailability';

// src/components/app/AddToPlaylistHost.tsx
// Playlist picker for the current song, lifted out of UnifiedPanel so it is not tied to the
// player panel being on screen. The cover star only requests open; source split and dialogs live here.

type PlaylistEntry = { id: string; name: string; description?: string };

type AddToPlaylistHostProps = {
    isDaylight: boolean;
    currentSong: SongResult | null;
    isStageContext?: boolean;
    localPlaylists: LocalPlaylist[];
    neteasePlaylists: NeteasePlaylist[];
    onAddCurrentSongToLocalPlaylist: (playlistId: string) => Promise<void>;
    onCreateCurrentLocalPlaylist: (name: string) => Promise<void>;
    onAddCurrentSongToNeteasePlaylist: (playlistId: number) => Promise<void>;
    onAddCurrentSongToNavidromePlaylist: (playlistId: string) => Promise<void>;
    onCreateCurrentNavidromePlaylist: (name: string) => Promise<void>;
};

export const AddToPlaylistHost: React.FC<AddToPlaylistHostProps> = ({
    isDaylight,
    currentSong,
    isStageContext = false,
    localPlaylists,
    neteasePlaylists,
    onAddCurrentSongToLocalPlaylist,
    onCreateCurrentLocalPlaylist,
    onAddCurrentSongToNeteasePlaylist,
    onAddCurrentSongToNavidromePlaylist,
    onCreateCurrentNavidromePlaylist,
}) => {
    const { t } = useTranslation();
    const { isOpen, close, setAvailability } = useAddToPlaylistStore(useShallow(state => ({
        isOpen: state.isOpen,
        close: state.close,
        setAvailability: state.setAvailability,
    })));
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [navidromePlaylists, setNavidromePlaylists] = useState<PlaylistEntry[]>([]);

    const songKind = resolveAddToPlaylistSongKind(currentSong, isStageContext);
    const noPlaylistsReason = t('localMusic.noPlaylistsFound') || 'No playlists yet';
    const availability = useMemo(() => resolveAddToPlaylistAvailability({
        song: currentSong,
        isStageContext,
        neteasePlaylistCount: neteasePlaylists.length,
        noPlaylistsReason,
    }), [currentSong, isStageContext, neteasePlaylists.length, noPlaylistsReason]);

    const refreshNavidromePlaylists = useCallback(async () => {
        const { getNavidromeConfig, navidromeApi } = await import('../../services/navidromeService');
        const config = getNavidromeConfig();
        if (!config) {
            setNavidromePlaylists([]);
            return;
        }

        const playlists = await navidromeApi.getPlaylists(config);
        setNavidromePlaylists(playlists.map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            description: `${playlist.songCount} ${t('playlist.tracks')}`,
        })));
    }, [t]);

    useEffect(() => {
        if (songKind !== 'navidrome') {
            setNavidromePlaylists([]);
            return;
        }

        let cancelled = false;
        const load = async () => {
            await refreshNavidromePlaylists();
            if (cancelled) {
                return;
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [currentSong?.id, refreshNavidromePlaylists, songKind]);

    const availablePlaylists = useMemo<PlaylistEntry[]>(() => {
        if (songKind === 'local') {
            return localPlaylists.map((playlist) => ({
                id: playlist.id,
                name: playlist.name,
                description: `${playlist.songIds.length} ${t('playlist.tracks')}`,
            }));
        }
        if (songKind === 'netease') {
            return neteasePlaylists.map((playlist) => ({
                id: String(playlist.id),
                name: playlist.name,
                description: `${playlist.trackCount || 0} ${t('playlist.tracks')}`,
            }));
        }
        if (songKind === 'navidrome') {
            return navidromePlaylists;
        }
        return [];
    }, [localPlaylists, navidromePlaylists, neteasePlaylists, songKind, t]);

    useEffect(() => {
        if (isOpen && !availability.canAdd) {
            close();
        }
    }, [availability.canAdd, close, isOpen]);

    useEffect(() => {
        setAvailability(availability);
    }, [availability, setAvailability]);

    return (
        <>
            <PlaylistSelectionDialog
                isOpen={isOpen}
                onClose={close}
                isDaylight={isDaylight}
                title={t('localMusic.addToPlaylist') || '添加到歌单'}
                description={t('home.playlists') || 'Playlists'}
                playlists={availablePlaylists}
                onSelect={async (playlistId) => {
                    if (songKind === 'local') {
                        await onAddCurrentSongToLocalPlaylist(String(playlistId));
                        return;
                    }
                    if (songKind === 'netease') {
                        await onAddCurrentSongToNeteasePlaylist(Number(playlistId));
                        return;
                    }
                    if (songKind === 'navidrome') {
                        await onAddCurrentSongToNavidromePlaylist(String(playlistId));
                        await refreshNavidromePlaylists();
                    }
                }}
                onCreate={(songKind === 'local' || songKind === 'navidrome') ? () => {
                    close();
                    setIsCreateOpen(true);
                } : undefined}
                createLabel={t(songKind === 'navidrome' ? 'navidrome.createPlaylist' : 'localMusic.createPlaylist') || '新建歌单'}
            />

            <TextInputDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                isDaylight={isDaylight}
                title={t(songKind === 'navidrome' ? 'navidrome.createPlaylist' : 'localMusic.createPlaylist') || '新建歌单'}
                description={t('localMusic.enterPlaylistName') || '输入歌单名称'}
                placeholder={t('localMusic.enterPlaylistName') || '输入歌单名称'}
                confirmLabel={t('options.save') || '保存'}
                onConfirm={async (name) => {
                    if (songKind === 'local') {
                        await onCreateCurrentLocalPlaylist(name);
                        return;
                    }
                    if (songKind === 'navidrome') {
                        await onCreateCurrentNavidromePlaylist(name);
                        await refreshNavidromePlaylists();
                    }
                }}
            />
        </>
    );
};

export default AddToPlaylistHost;

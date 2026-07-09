import { useCallback, useEffect, useState } from 'react';
import type { NeteasePlaylist } from '../types';
import { fetchQQUserPlaylists } from '../services/musicProviders/qqMusicLibrary';
import { getQQMusicAuth, QQ_MUSIC_AUTH_CHANGED_EVENT } from '../services/musicProviders/qqMusicAuth';

// src/hooks/useQQMusicLibrary.ts
// Loads QQ Music playlists when QQ Music login is available.

export function useQQMusicLibrary({ enabled }: { enabled: boolean }) {
    const [playlists, setPlaylists] = useState<NeteasePlaylist[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!enabled) {
            setPlaylists([]);
            return;
        }

        if (!getQQMusicAuth().isLoggedIn) {
            setPlaylists([]);
            return;
        }

        setIsLoading(true);
        try {
            setPlaylists(await fetchQQUserPlaylists());
        } catch (error) {
            console.error('[QQMusic] Failed to load playlists', error);
            setPlaylists([]);
        } finally {
            setIsLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const handleAuthChanged = () => {
            void refresh();
        };
        window.addEventListener(QQ_MUSIC_AUTH_CHANGED_EVENT, handleAuthChanged);
        window.addEventListener('storage', handleAuthChanged);
        return () => {
            window.removeEventListener(QQ_MUSIC_AUTH_CHANGED_EVENT, handleAuthChanged);
            window.removeEventListener('storage', handleAuthChanged);
        };
    }, [refresh]);

    return {
        isLoading,
        playlists,
        refresh,
    };
}

import { useEffect, useState } from 'react';
import { fetchPersonalizedPlaylists } from '../services/personalizedPlaylistService';
import type { PersonalizedPlaylistItem } from '../utils/home/personalizedPlaylistMath';

// src/hooks/usePersonalizedPlaylists.ts
// Cached NetEase personalized playlists for the signed-in home shelf.

export const usePersonalizedPlaylists = (enabled: boolean) => {
    const [items, setItems] = useState<PersonalizedPlaylistItem[]>([]);
    const [loading, setLoading] = useState(enabled);

    useEffect(() => {
        if (!enabled) {
            setItems([]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        void fetchPersonalizedPlaylists().then((next) => {
            if (cancelled) return;
            setItems(next);
            setLoading(false);
        }).catch(() => {
            if (cancelled) return;
            setItems([]);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return { items, loading };
};

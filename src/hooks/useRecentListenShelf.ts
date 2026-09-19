import { useEffect, useState } from 'react';
import { getPlayHistory, type PlayHistoryEntry } from '../services/playHistoryService';
import { useListeningDeskModel } from './useListeningDeskModel';
import { pickRecentListenEntries, RECENT_LISTEN_LIMIT } from '../utils/home/recentListenMath';

// src/hooks/useRecentListenShelf.ts
// Load unique recent plays for the signed-in greeting card.

export const useRecentListenShelf = () => {
    const { songs } = useListeningDeskModel();
    const [entries, setEntries] = useState<PlayHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const excludeKey = songs.map(song => String(song.id)).join('|');

    useEffect(() => {
        let cancelled = false;
        const excludeSongIds = excludeKey ? excludeKey.split('|') : [];
        void getPlayHistory(40).then((history) => {
            if (cancelled) return;
            setEntries(pickRecentListenEntries(history, {
                limit: RECENT_LISTEN_LIMIT,
                excludeSongIds,
            }));
            setLoading(false);
        }).catch(() => {
            if (cancelled) return;
            setEntries([]);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [excludeKey]);

    return { entries, loading };
};

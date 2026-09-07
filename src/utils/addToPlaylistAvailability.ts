import type { AddToPlaylistAvailability } from '../stores/useAddToPlaylistStore';
import type { SongResult } from '../types';
import {
    isLocalPlaybackSong,
    isNavidromePlaybackSong,
    isStagePlaybackSong,
    isYtmPlaybackSong,
} from './appPlaybackGuards';

// src/utils/addToPlaylistAvailability.ts
// Same source split UnifiedPanel used: local / NetEase-shaped online / Navidrome.
// Local and Navidrome can create a playlist on the spot, so an empty list is not a refusal.

export type AddToPlaylistSongKind = 'none' | 'local' | 'netease' | 'navidrome';

export const resolveAddToPlaylistSongKind = (
    song: SongResult | null | undefined,
    isStageContext = false,
): AddToPlaylistSongKind => {
    if (!song) {
        return 'none';
    }
    if (isStageContext || isStagePlaybackSong(song) || isYtmPlaybackSong(song)) {
        return 'none';
    }
    if (isNavidromePlaybackSong(song)) {
        return 'navidrome';
    }
    if (isLocalPlaybackSong(song)) {
        return 'local';
    }
    return 'netease';
};

export const resolveAddToPlaylistAvailability = ({
    song,
    isStageContext = false,
    neteasePlaylistCount,
    noPlaylistsReason,
}: {
    song: SongResult | null | undefined;
    isStageContext?: boolean;
    neteasePlaylistCount: number;
    noPlaylistsReason?: string;
}): AddToPlaylistAvailability => {
    const kind = resolveAddToPlaylistSongKind(song, isStageContext);
    if (kind === 'none') {
        return { isApplicable: false, canAdd: false };
    }

    const canAdd = kind === 'local' || kind === 'navidrome' || neteasePlaylistCount > 0;
    return {
        isApplicable: true,
        canAdd,
        disabledReason: canAdd ? undefined : noPlaylistsReason,
    };
};

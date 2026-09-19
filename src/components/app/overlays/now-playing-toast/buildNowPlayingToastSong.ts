import type { SongResult } from '../../../../types';
import { toSafeRemoteUrl } from '../../../../utils/appPlaybackHelpers';
import { isLocalPlaybackSong, isYtmPlaybackSong, resolveNavidromePlaybackCarrier } from '../../../../utils/appPlaybackGuards';
import type { NowPlayingToastSong } from '../NowPlayingToast';

// src/components/app/overlays/now-playing-toast/buildNowPlayingToastSong.ts

const resolveSongArtistLabel = (song: SongResult): string => {
    const artists = song.ar?.length ? song.ar : song.artists;
    return artists?.map(artist => artist.name).filter(Boolean).join(', ') || '';
};

const resolveToastCoverUrl = (song: SongResult): string | null => {
    const localSong = isLocalPlaybackSong(song) ? song.localData : null;
    const navidromeSong = resolveNavidromePlaybackCarrier(song);
    const ytmCover = isYtmPlaybackSong(song) ? song.ytmData.coverUrl : null;
    const candidates = [
        song.al?.picUrl,
        song.album?.picUrl,
        ytmCover,
        localSong?.matchedCoverUrl,
        navidromeSong?.navidromeData?.coverArtUrl,
    ];
    for (const candidate of candidates) {
        if (typeof candidate !== 'string' || !candidate.trim()) continue;
        const safe = toSafeRemoteUrl(candidate.trim());
        if (safe) return safe;
    }
    return null;
};

/** Maps a queue song onto the now-playing card's display fields. */
export const buildNowPlayingToastSong = (song: SongResult | null): NowPlayingToastSong | null => {
    if (!song) return null;
    return {
        title: song.name || '',
        artist: resolveSongArtistLabel(song) || null,
        coverUrl: resolveToastCoverUrl(song),
    };
};

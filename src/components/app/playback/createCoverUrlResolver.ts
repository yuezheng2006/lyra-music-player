import type { SongResult } from '../../../types';
import { toSafeRemoteUrl } from '../../../utils/appPlaybackHelpers';
import { isLocalPlaybackSong, resolveNavidromePlaybackCarrier } from '../../../utils/appPlaybackGuards';
import { createSongCoverPlaceholder } from '../../../utils/coverPlaceholders';

// src/components/app/playback/createCoverUrlResolver.ts
// Resolves the effective cover URL; falls back to a generated placeholder when missing.

const resolveSongArtistLabel = (song: SongResult | null) => {
    if (!song) return '';
    const artists = song.ar?.length ? song.ar : song.artists;
    return artists?.map(artist => artist.name).filter(Boolean).join(', ') || '';
};

type SongCoverCarrier = SongResult & {
    picUrl?: string | null;
    coverUrl?: string | null;
    coverImgUrl?: string | null;
    coverArtUrl?: string | null;
    matchedCoverUrl?: string | null;
};

const normalizeCoverCandidate = (url: unknown): string | null => (
    typeof url === 'string' && url.trim() ? toSafeRemoteUrl(url.trim()) || null : null
);

const coverObjectUrlCache = new WeakMap<Blob, string>();

const resolveCoverCandidate = (candidate: unknown): string | null => {
    const normalized = normalizeCoverCandidate(candidate);
    if (normalized) return normalized;
    if (typeof Blob !== 'undefined' && candidate instanceof Blob) {
        const cached = coverObjectUrlCache.get(candidate);
        if (cached) return cached;
        const objectUrl = URL.createObjectURL(candidate);
        coverObjectUrlCache.set(candidate, objectUrl);
        return objectUrl;
    }
    return null;
};

const resolveSongCoverUrl = (song: SongResult | null): string | null => {
    if (!song) return null;
    const carrier = song as SongCoverCarrier;
    const navidromeSong = resolveNavidromePlaybackCarrier(song);
    const localSong = isLocalPlaybackSong(song) ? song.localData : null;
    const embeddedLocalCover = localSong?.embeddedCover ?? null;
    const candidates = [
        carrier.al?.picUrl,
        carrier.album?.picUrl,
        carrier.matchedCoverUrl,
        carrier.coverUrl,
        carrier.coverImgUrl,
        carrier.picUrl,
        carrier.coverArtUrl,
        localSong?.useOnlineCover ? localSong?.matchedCoverUrl : null,
        localSong?.useOnlineCover ? embeddedLocalCover : null,
        localSong?.useOnlineCover ? null : embeddedLocalCover,
        localSong?.matchedCoverUrl,
        navidromeSong?.navidromeData?.coverArtUrl,
    ];

    for (const candidate of candidates) {
        const resolved = resolveCoverCandidate(candidate);
        if (resolved) return resolved;
    }

    return null;
};

export const createCoverUrlResolver = (
    cachedCoverUrl: string | null,
    currentSong: SongResult | null,
) => {
    return () => {
        const cached = resolveCoverCandidate(cachedCoverUrl);
        if (cached) return cached;
        const remote = resolveSongCoverUrl(currentSong);
        if (remote) return remote;
        if (!currentSong) return null;
        return createSongCoverPlaceholder(currentSong.name, resolveSongArtistLabel(currentSong));
    };
};

import type { SongResult } from '../../types';
import { getSongMusicProviderId } from '../../services/musicProviders/registry';
import {
    isLocalPlaybackSong,
    isNavidromePlaybackSong,
    isStagePlaybackSong,
    isYtmPlaybackSong,
} from '../appPlaybackGuards';
import { hasQQMusicSession } from '../onlineLibraryAccess';
import { hasStoredNeteaseCookie } from '../neteaseGuestMode';
import { isCatalogFullTrack } from './catalogClipMath';
import { resolveSongDurationSec } from '../appPlaybackHelpers';

// src/utils/playback/onlineSongPlayAccess.ts
// Guests do not open session-gated catalogs or 30s permission previews.

export type OnlinePlaySessions = {
    netease: boolean;
    qq: boolean;
};

/** Cookie/session snapshot — do not wait on profile hydrate. */
export const readOnlinePlaySessions = (): OnlinePlaySessions => ({
    netease: hasStoredNeteaseCookie(),
    qq: hasQQMusicSession(),
});

const isOwnedLibrarySong = (song: SongResult | null | undefined): boolean => (
    Boolean(song)
    && (
        isLocalPlaybackSong(song)
        || isNavidromePlaybackSong(song)
        || isYtmPlaybackSong(song)
        || isStagePlaybackSong(song)
    )
);

/** NetEase/QQ need that platform's login. Peer free sources do not. */
export const hasProviderSessionForSong = (
    song: SongResult,
    sessions: OnlinePlaySessions = readOnlinePlaySessions(),
): boolean => {
    if (isOwnedLibrarySong(song)) return true;
    const provider = getSongMusicProviderId(song);
    if (provider === 'netease') return sessions.netease;
    if (provider === 'qq') return sessions.qq;
    return true;
};

/** Listing-time gate: no session-gated catalog, no titled/short clips. */
export const canOpenOnlineSong = (
    song: SongResult,
    sessions: OnlinePlaySessions = readOnlinePlaySessions(),
): boolean => {
    if (isOwnedLibrarySong(song)) return true;
    if (!hasProviderSessionForSong(song, sessions)) return false;
    return isCatalogFullTrack(song);
};

/**
 * Loaded stream is a 30s-class trial while the catalog lists a full song.
 * Logged-in NetEase/QQ may still receive official VIP previews; peers never should.
 */
export const isPermissionPreviewStream = (
    mediaDurationSec: number,
    catalogDurationSec: number,
): boolean => {
    if (!Number.isFinite(mediaDurationSec) || mediaDurationSec <= 0 || mediaDurationSec > 60) {
        return false;
    }
    if (!Number.isFinite(catalogDurationSec) || catalogDurationSec < 90) {
        return false;
    }
    return mediaDurationSec <= catalogDurationSec * 0.4;
};

export const shouldRejectPermissionPreviewStream = (
    song: SongResult | null | undefined,
    mediaDurationSec: number,
    sessions: OnlinePlaySessions = readOnlinePlaySessions(),
): boolean => {
    if (!song || isOwnedLibrarySong(song)) return false;
    if (!isPermissionPreviewStream(mediaDurationSec, resolveSongDurationSec(song))) {
        return false;
    }
    const provider = getSongMusicProviderId(song);
    if (provider === 'netease') return !sessions.netease;
    if (provider === 'qq') return !sessions.qq;
    return true;
};

// src/utils/account/qqPlaylistLoadErrorMessage.ts
// Maps QQPlaylistLoadError codes to i18n keys (Folia loadNotPublic pattern).

import type { QQPlaylistLoadErrorCode } from '../../services/musicProviders/qqMusicLibrary';
import { QQPlaylistLoadError } from '../../services/musicProviders/qqMusicLibrary';

export const QQ_PLAYLIST_LOAD_ERROR_I18N_KEY: Record<QQPlaylistLoadErrorCode, string> = {
    'not-public': 'playlist.loadNotPublic',
    unreadable: 'playlist.loadUnreadable',
};

type TranslateFn = (key: string) => string;

/** Resolve a user-facing label for a QQ playlist load failure. */
export const resolveQQPlaylistLoadErrorLabel = (
    error: unknown,
    t: TranslateFn,
): string => {
    if (error instanceof QQPlaylistLoadError) {
        const key = QQ_PLAYLIST_LOAD_ERROR_I18N_KEY[error.code];
        const fallback = error.code === 'not-public'
            ? 'This playlist is not public and cannot be loaded yet'
            : 'Could not load this playlist';
        return t(key) || fallback;
    }
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }
    return t('playlist.loadFailed') || 'Failed to load playlist';
};

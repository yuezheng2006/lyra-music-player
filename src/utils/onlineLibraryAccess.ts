import { getQQMusicAuth } from '../services/musicProviders/qqMusicAuth';
import { hasStoredNeteaseCookie } from './neteaseGuestMode';
import type { NeteaseUser } from '../types';

// src/utils/onlineLibraryAccess.ts
// Resolves which online providers are available for playlist/search surfaces.

export const hasQQMusicSession = () => getQQMusicAuth().isLoggedIn;

/** Accepts full NeteaseUser or a minimal guest-connect payload. */
export const hasNeteaseSession = (user: Pick<NeteaseUser, 'userId'> | { userId?: number } | null | undefined) =>
    Boolean(user && hasStoredNeteaseCookie());

export const hasAnyOnlineMusicSession = (user: Pick<NeteaseUser, 'userId'> | { userId?: number } | null | undefined) =>
    hasNeteaseSession(user) || hasQQMusicSession();

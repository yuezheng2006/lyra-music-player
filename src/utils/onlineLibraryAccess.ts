import { getQQMusicAuth } from '../services/musicProviders/qqMusicAuth';
import { getQishuiAuth } from '../services/musicProviders/qishuiMusicAuth';
import { getKugouAuth } from '../services/musicProviders/kugouMusicAuth';
import { hasStoredNeteaseCookie } from './neteaseGuestMode';
import type { NeteaseUser } from '../types';

// src/utils/onlineLibraryAccess.ts
// Resolves which online providers are available for playlist/search surfaces.

export const hasQQMusicSession = () => getQQMusicAuth().isLoggedIn;

export const hasQishuiSession = () => getQishuiAuth().isLoggedIn;

export const hasKugouSession = () => getKugouAuth().isLoggedIn;

/** Accepts full NeteaseUser or a minimal guest-connect payload. */
export const hasNeteaseSession = (user: Pick<NeteaseUser, 'userId'> | { userId?: number } | null | undefined) =>
    Boolean(user && hasStoredNeteaseCookie());

export const hasAnyOnlineMusicSession = (user: Pick<NeteaseUser, 'userId'> | { userId?: number } | null | undefined) =>
    hasNeteaseSession(user) || hasQQMusicSession() || hasQishuiSession();

/** Sidebar 歌单 + keep playlist tab across boot, even before user profile hydrates. */
export const hasPersonalLibraryAccess = () =>
    hasQQMusicSession() || hasStoredNeteaseCookie();

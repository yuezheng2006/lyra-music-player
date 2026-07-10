// src/utils/neteaseGuestMode.ts
// Detects when the app should defer Netease bootstrap and use QQ library instead.

import { getQQMusicAuth } from '../services/musicProviders/qqMusicAuth';
import { useOnlineGuestStore } from '../stores/useOnlineGuestStore';

export const hasStoredNeteaseCookie = (): boolean => {
    if (typeof localStorage === 'undefined') {
        return false;
    }
    return Boolean(localStorage.getItem('netease_cookie')?.trim());
};

export const shouldUseQQGuestLibrary = (): boolean => {
    if (hasStoredNeteaseCookie()) {
        return false;
    }
    return useOnlineGuestStore.getState().entered && getQQMusicAuth().isLoggedIn;
};

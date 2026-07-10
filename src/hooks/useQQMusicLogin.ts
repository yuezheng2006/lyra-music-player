import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    clearStoredQQMusicCookie,
    getQQMusicAuth,
    QQ_MUSIC_AUTH_CHANGED_EVENT,
    setStoredQQMusicCookie,
} from '../services/musicProviders/qqMusicAuth';

// src/hooks/useQQMusicLogin.ts
// Shared QQ Music scan login, logout, and auth state for settings, account, and guest entry points.

export type QQMusicLoginFlowStatus = 'idle' | 'opening' | 'saved' | 'partial' | 'cancelled' | 'failed';

export const useQQMusicLogin = () => {
    const { t } = useTranslation();
    const [auth, setAuth] = useState(() => getQQMusicAuth());
    const [flowStatus, setFlowStatus] = useState<QQMusicLoginFlowStatus>('idle');

    const canOpenOfficialLogin = typeof window !== 'undefined'
        && typeof window.electron?.openQQMusicLogin === 'function';

    const refreshAuth = useCallback(() => {
        setAuth(getQQMusicAuth());
    }, []);

    useEffect(() => {
        const handleChange = () => refreshAuth();
        window.addEventListener(QQ_MUSIC_AUTH_CHANGED_EVENT, handleChange);
        window.addEventListener('storage', handleChange);
        return () => {
            window.removeEventListener(QQ_MUSIC_AUTH_CHANGED_EVENT, handleChange);
            window.removeEventListener('storage', handleChange);
        };
    }, [refreshAuth]);

    const flowMessage = useMemo(() => {
        switch (flowStatus) {
            case 'opening':
                return t('options.qqMusicOfficialLoginOpening') || 'Waiting for QQ Music login...';
            case 'saved':
                return t('options.qqMusicOfficialLoginSuccess') || 'QQ Music login saved';
            case 'partial':
                return t('options.qqMusicOfficialLoginPartial') || 'Login saved, but playback token may still be missing';
            case 'cancelled':
                return t('options.qqMusicOfficialLoginCancelled') || 'QQ Music login was cancelled';
            case 'failed':
                return t('options.qqMusicOfficialLoginFailed') || 'QQ Music login failed';
            default:
                return '';
        }
    }, [flowStatus, t]);

    const statusText = auth.isLoggedIn
        ? (t('account.qqMusicLoginReady', { uin: auth.uin }) || `Logged in · ${auth.uin}`)
        : auth.hasCookie
            ? (t('account.qqMusicIncomplete') || 'Cookie missing playback token')
            : (t('account.qqMusicAnonymous') || 'Login required');

    const openLogin = useCallback(async (): Promise<boolean> => {
        if (!canOpenOfficialLogin) return false;

        setFlowStatus('opening');
        try {
            const result = await window.electron!.openQQMusicLogin();
            if (result.ok && result.cookie) {
                setStoredQQMusicCookie(result.cookie);
                refreshAuth();
                setFlowStatus(result.partial ? 'partial' : 'saved');
                window.setTimeout(() => setFlowStatus('idle'), 2400);
                return true;
            }
            setFlowStatus(result.cancelled ? 'cancelled' : 'failed');
            window.setTimeout(() => setFlowStatus('idle'), 2400);
            return false;
        } catch {
            setFlowStatus('failed');
            window.setTimeout(() => setFlowStatus('idle'), 2400);
            return false;
        }
    }, [canOpenOfficialLogin, refreshAuth]);

    const logout = useCallback(() => {
        void window.electron?.clearQQMusicLogin?.();
        clearStoredQQMusicCookie();
        setFlowStatus('idle');
        refreshAuth();
    }, [refreshAuth]);

    return {
        auth,
        canOpenOfficialLogin,
        flowMessage,
        flowStatus,
        isBusy: flowStatus === 'opening',
        logout,
        openLogin,
        refreshAuth,
        statusText,
    };
};

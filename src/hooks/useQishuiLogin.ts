import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    clearStoredQishuiCookie,
    getQishuiAuth,
    QISHUI_AUTH_CHANGED_EVENT,
    setStoredQishuiCookie,
} from '../services/musicProviders/qishuiMusicAuth';

// src/hooks/useQishuiLogin.ts
// Shared Qishui scan login, logout, and auth state for settings, account, and guest entry points.

export type QishuiLoginFlowStatus = 'idle' | 'opening' | 'saved' | 'cancelled' | 'failed' | 'unavailable';

export const useQishuiLogin = () => {
    const { t } = useTranslation();
    const [auth, setAuth] = useState(() => getQishuiAuth());
    const [flowStatus, setFlowStatus] = useState<QishuiLoginFlowStatus>('idle');

    const canOpenOfficialLogin = typeof window !== 'undefined'
        && typeof window.electron?.openQishuiLogin === 'function';

    const refreshAuth = useCallback(() => {
        setAuth(getQishuiAuth());
    }, []);

    useEffect(() => {
        const handleChange = () => refreshAuth();
        window.addEventListener(QISHUI_AUTH_CHANGED_EVENT, handleChange);
        window.addEventListener('storage', handleChange);
        return () => {
            window.removeEventListener(QISHUI_AUTH_CHANGED_EVENT, handleChange);
            window.removeEventListener('storage', handleChange);
        };
    }, [refreshAuth]);

    const flowMessage = useMemo(() => {
        switch (flowStatus) {
            case 'opening':
                return t('options.qishuiOfficialLoginOpening') || 'Waiting for Qishui login...';
            case 'saved':
                return t('options.qishuiOfficialLoginSuccess') || 'Qishui login saved';
            case 'cancelled':
                return t('options.qishuiOfficialLoginCancelled') || 'Qishui login was cancelled';
            case 'failed':
                return t('options.qishuiOfficialLoginFailed') || 'Qishui login failed';
            case 'unavailable':
                return t('options.qishuiOfficialLoginDesktopOnly') || 'Official QR login is available in the desktop app.';
            default:
                return '';
        }
    }, [flowStatus, t]);

    const statusText = auth.isLoggedIn
        ? (t('account.qishuiLoginReady', { uid: auth.userLabel }) || `Logged in · ${auth.userLabel}`)
        : (t('account.qishuiAnonymous') || 'Login required');

    const openLogin = useCallback(async (): Promise<boolean> => {
        if (!canOpenOfficialLogin) {
            setFlowStatus('unavailable');
            window.setTimeout(() => setFlowStatus('idle'), 3200);
            return false;
        }

        setFlowStatus('opening');
        try {
            const result = await window.electron!.openQishuiLogin();
            if (result.ok && result.cookie) {
                setStoredQishuiCookie(result.cookie);
                refreshAuth();
                setFlowStatus('saved');
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
        clearStoredQishuiCookie();
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    clearStoredKugouCookie,
    getKugouAuth,
    KUGOU_AUTH_CHANGED_EVENT,
    setStoredKugouCookie,
} from '../services/musicProviders/kugouMusicAuth';

// src/hooks/useKugouLogin.ts
// In-app Kugou QR login (Folia): poll status in the panel, not a BrowserWindow.

export type KugouLoginFlowStatus =
    | 'idle'
    | 'starting'
    | 'waiting'
    | 'scanned'
    | 'saved'
    | 'expired'
    | 'failed'
    | 'unavailable';

const POLL_MS = 3000;
const MAX_POLLS = 40;

export const useKugouLogin = () => {
    const { t } = useTranslation();
    const [auth, setAuth] = useState(() => getKugouAuth());
    const [flowStatus, setFlowStatus] = useState<KugouLoginFlowStatus>('idle');
    const [qrImage, setQrImage] = useState('');
    const pollCountRef = useRef(0);
    const activeRef = useRef(true);

    const canOpenOfficialLogin = typeof window !== 'undefined'
        && typeof window.electron?.startKugouQrLogin === 'function'
        && typeof window.electron?.checkKugouQrLogin === 'function';

    const refreshAuth = useCallback(() => {
        setAuth(getKugouAuth());
    }, []);

    useEffect(() => {
        activeRef.current = true;
        const handleChange = () => refreshAuth();
        window.addEventListener(KUGOU_AUTH_CHANGED_EVENT, handleChange);
        window.addEventListener('storage', handleChange);
        return () => {
            activeRef.current = false;
            window.removeEventListener(KUGOU_AUTH_CHANGED_EVENT, handleChange);
            window.removeEventListener('storage', handleChange);
            if (typeof window.electron?.cancelKugouQrLogin === 'function') {
                void window.electron.cancelKugouQrLogin();
            }
        };
    }, [refreshAuth]);

    const flowMessage = useMemo(() => {
        switch (flowStatus) {
            case 'starting':
                return t('options.kugouOfficialLoginOpening');
            case 'waiting':
                return t('options.kugouQrWaiting');
            case 'scanned':
                return t('options.kugouQrScanned');
            case 'saved':
                return t('options.kugouOfficialLoginSuccess');
            case 'expired':
                return t('options.kugouQrExpired');
            case 'failed':
                return t('options.kugouOfficialLoginFailed');
            case 'unavailable':
                return t('options.kugouOfficialLoginDesktopOnly');
            default:
                return '';
        }
    }, [flowStatus, t]);

    const statusText = auth.isLoggedIn
        ? t('account.kugouLoginReady', { uid: auth.userLabel })
        : t('account.kugouAnonymous');

    const startLogin = useCallback(async (): Promise<boolean> => {
        if (!canOpenOfficialLogin) {
            setFlowStatus('unavailable');
            setQrImage('');
            return false;
        }

        pollCountRef.current = 0;
        setFlowStatus('starting');
        setQrImage('');
        try {
            const started = await window.electron!.startKugouQrLogin();
            if (!activeRef.current) return false;
            if (!started.ok) {
                setFlowStatus('failed');
                return false;
            }
            setQrImage(String(started.qrcodeImg || '').trim());
            setFlowStatus('waiting');
            return true;
        } catch {
            if (activeRef.current) setFlowStatus('failed');
            return false;
        }
    }, [canOpenOfficialLogin]);

    useEffect(() => {
        if (flowStatus !== 'waiting' && flowStatus !== 'scanned') return undefined;

        const poll = async () => {
            if (!canOpenOfficialLogin) return;
            pollCountRef.current += 1;
            if (pollCountRef.current > MAX_POLLS) {
                setFlowStatus((current) => (current === 'waiting' || current === 'scanned' ? 'expired' : current));
                setQrImage('');
                void window.electron?.cancelKugouQrLogin?.();
                return;
            }
            try {
                const checked = await window.electron!.checkKugouQrLogin();
                if (!activeRef.current) return;
                if (!checked.ok) {
                    setFlowStatus((current) => (current === 'waiting' || current === 'scanned' ? 'failed' : current));
                    return;
                }
                if (checked.status === 4 && checked.cookie) {
                    setStoredKugouCookie(checked.cookie);
                    refreshAuth();
                    setQrImage('');
                    setFlowStatus('saved');
                    window.setTimeout(() => {
                        if (activeRef.current) setFlowStatus('idle');
                    }, 2400);
                    return;
                }
                if (checked.status === 0) {
                    setQrImage('');
                    setFlowStatus('expired');
                    return;
                }
                if (checked.status === 2 || checked.status === 3) {
                    setFlowStatus((current) => (current === 'waiting' ? 'scanned' : current));
                }
            } catch {
                if (activeRef.current) {
                    setFlowStatus((current) => (current === 'waiting' || current === 'scanned' ? 'failed' : current));
                }
            }
        };

        const timer = window.setInterval(() => {
            void poll();
        }, POLL_MS);
        void poll();
        return () => window.clearInterval(timer);
    }, [canOpenOfficialLogin, flowStatus, refreshAuth]);

    const logout = useCallback(() => {
        void window.electron?.cancelKugouQrLogin?.();
        clearStoredKugouCookie();
        setQrImage('');
        setFlowStatus('idle');
        refreshAuth();
    }, [refreshAuth]);

    return {
        auth,
        canOpenOfficialLogin,
        flowMessage,
        flowStatus,
        isBusy: flowStatus === 'starting' || flowStatus === 'waiting' || flowStatus === 'scanned',
        logout,
        openLogin: startLogin,
        qrImage,
        refreshAuth,
        statusText,
    };
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { neteaseApi } from '../services/netease';

// src/hooks/useNeteaseQrLogin.ts
// Netease Cloud Music QR login flow for guest connect cards.

export const useNeteaseQrLogin = (onSuccess: () => void) => {
    const { t } = useTranslation();
    const [active, setActive] = useState(false);
    const [qrCodeImg, setQrCodeImg] = useState('');
    const [status, setStatus] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const qrCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const cancel = useCallback(() => {
        setActive(false);
        setQrCodeImg('');
        setStatus('');
        setIsSuccess(false);
        if (qrCheckInterval.current) {
            clearInterval(qrCheckInterval.current);
            qrCheckInterval.current = null;
        }
    }, []);

    const start = useCallback(async () => {
        setActive(true);
        setIsSuccess(false);
        setQrCodeImg('');
        setStatus(t('home.loadingQr'));
        if (qrCheckInterval.current) {
            clearInterval(qrCheckInterval.current);
            qrCheckInterval.current = null;
        }

        try {
            const keyRes = await neteaseApi.getQrKey();
            const key = keyRes.data.unikey;
            const createRes = await neteaseApi.createQr(key);
            setQrCodeImg(createRes.data.qrimg);
            setStatus(t('home.scanQr'));

            qrCheckInterval.current = setInterval(async () => {
                try {
                    const checkRes = await neteaseApi.checkQr(key);
                    const code = checkRes.code;

                    if (code === 800) {
                        setStatus(t('home.qrExpired'));
                        if (qrCheckInterval.current) clearInterval(qrCheckInterval.current);
                        return;
                    }
                    if (code === 802) {
                        setStatus(t('home.qrScanned'));
                        return;
                    }
                    if (code === 803) {
                        setStatus(t('home.loginSuccess'));
                        setIsSuccess(true);
                        if (qrCheckInterval.current) clearInterval(qrCheckInterval.current);
                        if (checkRes.cookie) {
                            localStorage.setItem('netease_cookie', checkRes.cookie);
                        }
                        window.setTimeout(() => {
                            onSuccess();
                            cancel();
                        }, 900);
                    }
                } catch (error) {
                    console.error(error);
                }
            }, 3000);
        } catch {
            setStatus(t('home.loginError'));
        }
    }, [cancel, onSuccess, t]);

    useEffect(() => () => {
        if (qrCheckInterval.current) clearInterval(qrCheckInterval.current);
    }, []);

    return {
        active,
        cancel,
        isSuccess,
        qrCodeImg,
        start,
        status,
    };
};

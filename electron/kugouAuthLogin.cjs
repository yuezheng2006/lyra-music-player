const { createKugouWebClient, kugouCookieHasLogin } = require('../shared/kugouWebClient.cjs');

// electron/kugouAuthLogin.cjs
// In-app QR session (Folia-style): renderer shows the image, main process polls the key.

const KUGOU_LOGIN_PARTITION = 'persist:lyra-kugou-login';

const createKugouAuthLogin = (deps = {}) => {
    const repository = deps.repository;
    const webClient = deps.webClient || createKugouWebClient();
    let pendingQrcode = '';

    const persistCookie = (cookie) => {
        if (!cookie || !kugouCookieHasLogin(cookie) || !repository) return;
        repository.saveCookie(cookie);
    };

    const readStoredCookie = () => {
        const loaded = repository?.loadCookie?.();
        if (loaded?.ok && kugouCookieHasLogin(loaded.cookie)) {
            return { ok: true, cookie: loaded.cookie };
        }
        return { ok: true, cookie: '' };
    };

    const startQrSession = async () => {
        let qr;
        try {
            qr = await webClient.createQrKey();
        } catch (error) {
            pendingQrcode = '';
            return { ok: false, error: error instanceof Error ? error.message : 'qr-key-failed' };
        }
        pendingQrcode = String(qr.qrcode || '').trim();
        if (!pendingQrcode) {
            return { ok: false, error: 'qr-key-failed' };
        }
        return {
            ok: true,
            qrcodeImg: String(qr.qrcodeImg || '').trim(),
            qrUrl: String(qr.qrUrl || '').trim(),
        };
    };

    const checkQrSession = async () => {
        if (!pendingQrcode) {
            return { ok: false, error: 'no-session' };
        }
        try {
            const checked = await webClient.checkQr(pendingQrcode);
            const status = Number(checked.status);
            if (status === 4 && checked.cookie) {
                persistCookie(checked.cookie);
                pendingQrcode = '';
                return {
                    ok: true,
                    status: 4,
                    cookie: checked.cookie,
                    userid: String(checked.userid || ''),
                };
            }
            if (status === 0) {
                pendingQrcode = '';
                return { ok: true, status: 0 };
            }
            return { ok: true, status: Number.isFinite(status) ? status : -1 };
        } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : 'qr-check-failed' };
        }
    };

    const cancelQrSession = () => {
        pendingQrcode = '';
        return { ok: true };
    };

    const clearLoginSession = () => {
        pendingQrcode = '';
        repository?.clearCookie?.();
        return { ok: true };
    };

    const registerIpcHandlers = (ipcMain) => {
        ipcMain.handle('kugou-login-qr-start', () => startQrSession());
        ipcMain.handle('kugou-login-qr-check', () => checkQrSession());
        ipcMain.handle('kugou-login-qr-cancel', () => cancelQrSession());
        ipcMain.handle('kugou-get-login-cookie', () => readStoredCookie());
        ipcMain.handle('kugou-clear-login', () => clearLoginSession());
    };

    return {
        cancelQrSession,
        checkQrSession,
        clearLoginSession,
        readStoredCookie,
        registerIpcHandlers,
        startQrSession,
    };
};

module.exports = {
    KUGOU_LOGIN_PARTITION,
    createKugouAuthLogin,
};

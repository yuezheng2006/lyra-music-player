import { createRequire } from 'module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { createKugouAuthLogin } = require('../../../electron/kugouAuthLogin.cjs') as {
    createKugouAuthLogin: (deps: Record<string, unknown>) => {
        startQrSession: () => Promise<{ ok: boolean; qrcodeImg?: string; error?: string }>;
        checkQrSession: () => Promise<{ ok: boolean; status?: number; cookie?: string; error?: string }>;
        cancelQrSession: () => { ok: boolean };
    };
};

// test/unit/electron/kugouAuthLogin.test.ts
// In-app QR session persists cookie on status 4 and expires on status 0.

describe('kugouAuthLogin', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns QR payload from startQrSession', async () => {
        const login = createKugouAuthLogin({
            repository: { saveCookie: vi.fn(), loadCookie: () => ({ ok: true, cookie: '' }) },
            webClient: {
                createQrKey: async () => ({
                    qrcode: 'key',
                    qrcodeImg: 'data:image/png;base64,abc',
                    qrUrl: 'https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=key',
                }),
            },
        });

        await expect(login.startQrSession()).resolves.toEqual({
            ok: true,
            qrcodeImg: 'data:image/png;base64,abc',
            qrUrl: 'https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=key',
        });
    });

    it('persists the cookie when QR status becomes 4', async () => {
        const saveCookie = vi.fn();
        const login = createKugouAuthLogin({
            repository: { saveCookie, loadCookie: () => ({ ok: true, cookie: '' }) },
            webClient: {
                createQrKey: async () => ({ qrcode: 'key', qrcodeImg: 'data:image/png;base64,abc', qrUrl: 'https://example.invalid' }),
                checkQr: async () => ({ status: 4, cookie: 'token=abcdefghij; userid=9', userid: '9' }),
            },
        });

        await login.startQrSession();
        const result = await login.checkQrSession();
        expect(result).toEqual({
            ok: true,
            status: 4,
            cookie: 'token=abcdefghij; userid=9',
            userid: '9',
        });
        expect(saveCookie).toHaveBeenCalledWith('token=abcdefghij; userid=9');
    });

    it('reports expired when QR status is 0', async () => {
        const login = createKugouAuthLogin({
            repository: { loadCookie: () => ({ ok: true, cookie: '' }) },
            webClient: {
                createQrKey: async () => ({ qrcode: 'key', qrcodeImg: '', qrUrl: 'https://example.invalid' }),
                checkQr: async () => ({ status: 0 }),
            },
        });

        await login.startQrSession();
        await expect(login.checkQrSession()).resolves.toEqual({ ok: true, status: 0 });
        await expect(login.checkQrSession()).resolves.toEqual({ ok: false, error: 'no-session' });
    });
});

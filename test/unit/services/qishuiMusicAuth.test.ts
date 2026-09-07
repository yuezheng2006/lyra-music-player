import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    QISHUI_COOKIE_STORAGE_KEY,
    clearStoredQishuiCookie,
    getQishuiAuth,
    getStoredQishuiCookie,
    parseQishuiUserLabel,
    qishuiCookieHasLogin,
    resetQishuiAuthCookieMemory,
    setStoredQishuiCookie,
} from '@/services/musicProviders/qishuiMusicAuth';

// test/unit/services/qishuiMusicAuth.test.ts
// Renderer Qishui auth treats Douyin sessionid as the login ticket.

const createLocalStorageMock = () => {
    const values = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => values.set(key, value)),
        removeItem: vi.fn((key: string) => values.delete(key)),
    };
};

describe('qishuiMusicAuth', () => {
    afterEach(() => {
        resetQishuiAuthCookieMemory();
        vi.unstubAllGlobals();
    });

    it('detects login from sessionid and labels uid_tt', () => {
        expect(qishuiCookieHasLogin('sessionid=abcdefghij; uid_tt=123456789012')).toBe(true);
        expect(parseQishuiUserLabel('sessionid=abcdefghij; uid_tt=123456789012')).toBe('123456789012');
        expect(qishuiCookieHasLogin('sessionid=nope')).toBe(false);
    });

    it('persists a valid session cookie in localStorage when Electron persist is missing', () => {
        const storage = createLocalStorageMock();
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { dispatchEvent: () => true });

        setStoredQishuiCookie('sessionid=abcdefghij; sid_tt=token1234');
        expect(getStoredQishuiCookie()).toBe('sessionid=abcdefghij; sid_tt=token1234');
        expect(storage.setItem).toHaveBeenCalledWith(
            QISHUI_COOKIE_STORAGE_KEY,
            'sessionid=abcdefghij; sid_tt=token1234',
        );
        expect(getQishuiAuth().isLoggedIn).toBe(true);
    });

    it('rejects incomplete cookies and can clear the session', () => {
        const storage = createLocalStorageMock();
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { dispatchEvent: () => true });

        setStoredQishuiCookie('sessionid=short');
        expect(getQishuiAuth().isLoggedIn).toBe(false);
        setStoredQishuiCookie('sessionid=abcdefghij');
        clearStoredQishuiCookie();
        expect(getQishuiAuth().cookieHeader).toBe('');
        expect(storage.removeItem).toHaveBeenCalledWith(QISHUI_COOKIE_STORAGE_KEY);
    });
});

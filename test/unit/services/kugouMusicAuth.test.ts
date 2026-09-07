import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    KUGOU_COOKIE_STORAGE_KEY,
    clearStoredKugouCookie,
    getKugouAuth,
    getStoredKugouCookie,
    kugouCookieHasLogin,
    parseKugouUserLabel,
    resetKugouAuthCookieMemory,
    setStoredKugouCookie,
} from '@/services/musicProviders/kugouMusicAuth';

// test/unit/services/kugouMusicAuth.test.ts
// Renderer Kugou auth treats token+userid as the login ticket.

const createLocalStorageMock = () => {
    const values = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => values.set(key, value)),
        removeItem: vi.fn((key: string) => values.delete(key)),
    };
};

describe('kugouMusicAuth', () => {
    afterEach(() => {
        resetKugouAuthCookieMemory();
        vi.unstubAllGlobals();
    });

    it('detects login from token and userid', () => {
        expect(kugouCookieHasLogin('token=abcdefghij; userid=12345')).toBe(true);
        expect(parseKugouUserLabel('token=abcdefghij; userid=12345678901299')).toBe('123456789012');
        expect(kugouCookieHasLogin('token=short; userid=1')).toBe(false);
        expect(kugouCookieHasLogin('token=abcdefghij; userid=0')).toBe(false);
    });

    it('persists a valid session cookie in localStorage when Electron persist is missing', () => {
        const storage = createLocalStorageMock();
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { dispatchEvent: () => true });

        setStoredKugouCookie('token=abcdefghij; userid=12345');
        expect(getStoredKugouCookie()).toBe('token=abcdefghij; userid=12345');
        expect(storage.setItem).toHaveBeenCalledWith(
            KUGOU_COOKIE_STORAGE_KEY,
            'token=abcdefghij; userid=12345',
        );
        expect(getKugouAuth().isLoggedIn).toBe(true);
    });

    it('rejects incomplete cookies and can clear the session', () => {
        const storage = createLocalStorageMock();
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { dispatchEvent: () => true });

        setStoredKugouCookie('token=short');
        expect(getKugouAuth().isLoggedIn).toBe(false);
        setStoredKugouCookie('token=abcdefghij; userid=12345');
        clearStoredKugouCookie();
        expect(getKugouAuth().cookieHeader).toBe('');
        expect(storage.removeItem).toHaveBeenCalledWith(KUGOU_COOKIE_STORAGE_KEY);
    });
});

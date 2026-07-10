import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    QQ_MUSIC_COOKIE_STORAGE_KEY,
    QQ_MUSIC_GUID_STORAGE_KEY,
    clearStoredQQMusicCookie,
    getQQMusicAuth,
    getQQMusicKeyFromCookie,
    getQQMusicPlaybackKeyFromCookie,
    getStoredQQMusicCookie,
    normalizeQQMusicCookieInput,
    parseQQMusicUin,
    setStoredQQMusicCookie,
    syncQQMusicAuthFromElectron,
} from '@/services/musicProviders/qqMusicAuth';

const createLocalStorageMock = () => {
    const values = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => values.set(key, value)),
        removeItem: vi.fn((key: string) => values.delete(key)),
    };
};

describe('qqMusicAuth', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('parses numeric uin from QQ Music cookies', () => {
        expect(parseQQMusicUin('uin=o123456789; qm_keyst=abc')).toBe('123456789');
        expect(parseQQMusicUin('wxuin=987654321;')).toBe('987654321');
        expect(parseQQMusicUin('login_type=2; wxuin=o000123456;')).toBe('123456');
        expect(parseQQMusicUin('qqmusic_uin=o123;')).toBe('123');
        expect(parseQQMusicUin('qm_keyst=abc')).toBe('0');
    });

    it('extracts QQ Music login and playback keys', () => {
        expect(getQQMusicKeyFromCookie('uin=o123; psrf_qqaccess_token=token')).toBe('token');
        expect(getQQMusicKeyFromCookie('uin=o123; wxrefresh_token=wx')).toBe('wx');
        expect(getQQMusicPlaybackKeyFromCookie('uin=o123; wxskey=playback')).toBe('playback');
        expect(getQQMusicPlaybackKeyFromCookie('uin=o123; psrf_qqaccess_token=token')).toBe('');
    });

    it('normalizes QQ Music cookie input', () => {
        expect(normalizeQQMusicCookieInput('qqmusic_uin=o000123; qm_keyst=abc')).toBe('qqmusic_uin=o000123; qm_keyst=abc; uin=123');
        expect(normalizeQQMusicCookieInput('login_type=2; wxuin=o000456; wxskey=play')).toBe('login_type=2; wxuin=o000456; wxskey=play; uin=456');
    });

    it('stores, clears, and resolves configured QQ Music auth', () => {
        const localStorage = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorage);

        setStoredQQMusicCookie('  uin=o123456789; qqmusic_key=abc;  ');

        expect(getStoredQQMusicCookie()).toBe('uin=123456789; qqmusic_key=abc');
        expect(getQQMusicAuth()).toEqual({
            cookieHeader: 'uin=123456789; qqmusic_key=abc',
            guid: expect.any(String),
            hasCookie: true,
            isLoggedIn: true,
            musicKey: 'abc',
            playbackKey: 'abc',
            playbackKeyReady: true,
            uin: '123456789',
        });
        expect(localStorage.setItem).toHaveBeenCalledWith(QQ_MUSIC_COOKIE_STORAGE_KEY, 'uin=123456789; qqmusic_key=abc');
        expect(localStorage.setItem).toHaveBeenCalledWith(QQ_MUSIC_GUID_STORAGE_KEY, expect.any(String));

        clearStoredQQMusicCookie();

        expect(getStoredQQMusicCookie()).toBe('');
        expect(localStorage.removeItem).toHaveBeenCalledWith(QQ_MUSIC_COOKIE_STORAGE_KEY);
    });

    it('falls back to anonymous QQ Music auth without localStorage', () => {
        expect(getQQMusicAuth()).toEqual({
            cookieHeader: 'tmeLoginType=-1;',
            guid: '10000',
            hasCookie: false,
            isLoggedIn: false,
            musicKey: '',
            playbackKey: '',
            playbackKeyReady: false,
            uin: '0',
        });
    });

    it('hydrates QQ Music auth from Electron login partition', async () => {
        const localStorage = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorage);
        vi.stubGlobal('window', {
            electron: {
                getQQMusicLoginCookie: vi.fn(async () => ({
                    ok: true,
                    cookie: 'uin=o123456789; qm_keyst=partition-key',
                    playbackReady: true,
                })),
            },
        });

        const auth = await syncQQMusicAuthFromElectron();

        expect(auth.isLoggedIn).toBe(true);
        expect(auth.playbackKeyReady).toBe(true);
        expect(getStoredQQMusicCookie()).toBe('uin=123456789; qm_keyst=partition-key');
    });
});

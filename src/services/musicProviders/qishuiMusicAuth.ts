// src/services/musicProviders/qishuiMusicAuth.ts
// Stores Qishui / Douyin web session cookies for sidecar Luna requests.

export const QISHUI_COOKIE_STORAGE_KEY = 'qishui_music_cookie';
export const QISHUI_AUTH_CHANGED_EVENT = 'lyra:qishui-auth-changed';

let memoryCookie: string | null = null;

const canUseLocalStorage = () => typeof localStorage !== 'undefined';

const hasElectronQishuiAuthPersist = () => (
    typeof window !== 'undefined'
    && typeof window.electron?.saveQishuiAuthSession === 'function'
);

const notifyQishuiAuthChanged = () => {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
        window.dispatchEvent(new CustomEvent(QISHUI_AUTH_CHANGED_EVENT));
    } catch {
        // Node tests stub `window` without CustomEvent.
    }
};

const readLocalStorageCookie = (): string => {
    if (!canUseLocalStorage()) return '';
    try {
        return localStorage.getItem(QISHUI_COOKIE_STORAGE_KEY)?.trim() || '';
    } catch {
        return '';
    }
};

const writeLocalStorageCookie = (cookie: string) => {
    if (!canUseLocalStorage()) return;
    try {
        if (!cookie) {
            localStorage.removeItem(QISHUI_COOKIE_STORAGE_KEY);
            return;
        }
        localStorage.setItem(QISHUI_COOKIE_STORAGE_KEY, cookie);
    } catch {
        // Ignore quota / private-mode failures.
    }
};

const persistElectronQishuiAuthSession = (cookie: string) => {
    void window.electron!.saveQishuiAuthSession(cookie).catch(() => {});
};

/** Resets in-memory cookie cache between unit tests. */
export const resetQishuiAuthCookieMemory = () => {
    memoryCookie = null;
};

export const parseQishuiCookie = (cookie: string | null | undefined): Record<string, string> => {
    const entries: Record<string, string> = {};
    String(cookie || '').split(';').forEach((part) => {
        const raw = part.trim();
        if (!raw) return;
        const index = raw.indexOf('=');
        if (index <= 0) return;
        entries[raw.slice(0, index).trim()] = raw.slice(index + 1).trim();
    });
    return entries;
};

export const qishuiCookieHasLogin = (cookie: string | null | undefined): boolean => {
    const values = parseQishuiCookie(cookie);
    const session = values.sessionid || values.sessionid_ss || '';
    const sid = values.sid_tt || '';
    return session.length >= 8 || sid.length >= 8;
};

export const parseQishuiUserLabel = (cookie: string | null | undefined): string => {
    const values = parseQishuiCookie(cookie);
    const uid = String(values.uid_tt || values.uid_tt_ss || '').trim();
    if (uid) return uid.slice(0, 12);
    const session = String(values.sessionid || '').trim();
    return session ? session.slice(0, 8) : '';
};

export const getStoredQishuiCookie = (): string => {
    if (memoryCookie !== null) return memoryCookie;
    return readLocalStorageCookie();
};

export const setStoredQishuiCookie = (cookie: string) => {
    const normalized = String(cookie || '').trim();
    if (!normalized || !qishuiCookieHasLogin(normalized)) {
        clearStoredQishuiCookie();
        return;
    }
    memoryCookie = normalized;
    if (hasElectronQishuiAuthPersist()) {
        writeLocalStorageCookie('');
        persistElectronQishuiAuthSession(normalized);
        notifyQishuiAuthChanged();
        return;
    }
    writeLocalStorageCookie(normalized);
    notifyQishuiAuthChanged();
};

export const clearStoredQishuiCookie = () => {
    memoryCookie = '';
    writeLocalStorageCookie('');
    if (typeof window !== 'undefined' && typeof window.electron?.clearQishuiLogin === 'function') {
        void window.electron.clearQishuiLogin();
    }
    notifyQishuiAuthChanged();
};

export type QishuiAuth = {
    cookieHeader: string;
    hasCookie: boolean;
    isLoggedIn: boolean;
    userLabel: string;
};

export const getQishuiAuth = (): QishuiAuth => {
    const storedCookie = getStoredQishuiCookie();
    const isLoggedIn = qishuiCookieHasLogin(storedCookie);
    return {
        cookieHeader: isLoggedIn ? storedCookie : '',
        hasCookie: storedCookie.length > 0,
        isLoggedIn,
        userLabel: parseQishuiUserLabel(storedCookie),
    };
};

/** Payload sent to the music-provider sidecar for Qishui search / audio. */
export const getQishuiSidecarAuthPayload = () => {
    const auth = getQishuiAuth();
    return {
        cookieHeader: auth.cookieHeader,
        isLoggedIn: auth.isLoggedIn,
        userLabel: auth.userLabel,
    };
};

export const syncQishuiAuthFromElectron = async (): Promise<QishuiAuth> => {
    if (typeof window === 'undefined' || typeof window.electron?.getQishuiLoginCookie !== 'function') {
        return getQishuiAuth();
    }

    try {
        const result = await window.electron.getQishuiLoginCookie();
        if (result.ok && result.cookie?.trim()) {
            setStoredQishuiCookie(result.cookie);
            return getQishuiAuth();
        }
    } catch {
        // Fall through to leftover localStorage.
    }

    const leftover = readLocalStorageCookie();
    if (leftover && hasElectronQishuiAuthPersist()) {
        setStoredQishuiCookie(leftover);
    }

    return getQishuiAuth();
};

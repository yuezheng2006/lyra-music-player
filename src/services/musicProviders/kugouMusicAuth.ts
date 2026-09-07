// src/services/musicProviders/kugouMusicAuth.ts
// Stores Kugou token+userid cookies for sidecar authenticated play URLs.

export const KUGOU_COOKIE_STORAGE_KEY = 'kugou_music_cookie';
export const KUGOU_AUTH_CHANGED_EVENT = 'lyra:kugou-auth-changed';

let memoryCookie: string | null = null;

const canUseLocalStorage = () => typeof localStorage !== 'undefined';

const hasElectronKugouAuthPersist = () => (
    typeof window !== 'undefined'
    && typeof window.electron?.saveKugouAuthSession === 'function'
);

const notifyKugouAuthChanged = () => {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    try {
        window.dispatchEvent(new CustomEvent(KUGOU_AUTH_CHANGED_EVENT));
    } catch {
        // Node tests stub `window` without CustomEvent.
    }
};

const readLocalStorageCookie = (): string => {
    if (!canUseLocalStorage()) return '';
    try {
        return localStorage.getItem(KUGOU_COOKIE_STORAGE_KEY)?.trim() || '';
    } catch {
        return '';
    }
};

const writeLocalStorageCookie = (cookie: string) => {
    if (!canUseLocalStorage()) return;
    try {
        if (!cookie) {
            localStorage.removeItem(KUGOU_COOKIE_STORAGE_KEY);
            return;
        }
        localStorage.setItem(KUGOU_COOKIE_STORAGE_KEY, cookie);
    } catch {
        // Ignore quota / private-mode failures.
    }
};

const persistElectronKugouAuthSession = (cookie: string) => {
    void window.electron!.saveKugouAuthSession(cookie).catch(() => {});
};

/** Resets in-memory cookie cache between unit tests. */
export const resetKugouAuthCookieMemory = () => {
    memoryCookie = null;
};

export const parseKugouCookie = (cookie: string | null | undefined): Record<string, string> => {
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

export const kugouCookieHasLogin = (cookie: string | null | undefined): boolean => {
    const values = parseKugouCookie(cookie);
    const token = String(values.token || '').trim();
    const userid = String(values.userid || '').trim();
    return token.length >= 8 && userid.length > 0 && userid !== '0';
};

export const parseKugouUserLabel = (cookie: string | null | undefined): string => {
    const userid = String(parseKugouCookie(cookie).userid || '').trim();
    return userid && userid !== '0' ? userid.slice(0, 12) : '';
};

export const getStoredKugouCookie = (): string => {
    if (memoryCookie !== null) return memoryCookie;
    return readLocalStorageCookie();
};

export const setStoredKugouCookie = (cookie: string) => {
    const normalized = String(cookie || '').trim();
    if (!normalized || !kugouCookieHasLogin(normalized)) {
        clearStoredKugouCookie();
        return;
    }
    memoryCookie = normalized;
    if (hasElectronKugouAuthPersist()) {
        writeLocalStorageCookie('');
        persistElectronKugouAuthSession(normalized);
        notifyKugouAuthChanged();
        return;
    }
    writeLocalStorageCookie(normalized);
    notifyKugouAuthChanged();
};

export const clearStoredKugouCookie = () => {
    memoryCookie = '';
    writeLocalStorageCookie('');
    if (typeof window !== 'undefined' && typeof window.electron?.clearKugouLogin === 'function') {
        void window.electron.clearKugouLogin();
    }
    notifyKugouAuthChanged();
};

export type KugouAuth = {
    cookieHeader: string;
    hasCookie: boolean;
    isLoggedIn: boolean;
    userLabel: string;
};

export const getKugouAuth = (): KugouAuth => {
    const storedCookie = getStoredKugouCookie();
    const isLoggedIn = kugouCookieHasLogin(storedCookie);
    return {
        cookieHeader: isLoggedIn ? storedCookie : '',
        hasCookie: storedCookie.length > 0,
        isLoggedIn,
        userLabel: parseKugouUserLabel(storedCookie),
    };
};

/** Payload sent to the music-provider sidecar for authenticated Kugou audio. */
export const getKugouSidecarAuthPayload = () => {
    const auth = getKugouAuth();
    return {
        cookieHeader: auth.cookieHeader,
        isLoggedIn: auth.isLoggedIn,
        userLabel: auth.userLabel,
    };
};

export const syncKugouAuthFromElectron = async (): Promise<KugouAuth> => {
    if (typeof window === 'undefined' || typeof window.electron?.getKugouLoginCookie !== 'function') {
        return getKugouAuth();
    }

    try {
        const result = await window.electron.getKugouLoginCookie();
        if (result.ok && result.cookie?.trim()) {
            setStoredKugouCookie(result.cookie);
            return getKugouAuth();
        }
    } catch {
        // Fall through to leftover localStorage.
    }

    const leftover = readLocalStorageCookie();
    if (leftover && hasElectronKugouAuthPersist()) {
        setStoredKugouCookie(leftover);
    }

    return getKugouAuth();
};

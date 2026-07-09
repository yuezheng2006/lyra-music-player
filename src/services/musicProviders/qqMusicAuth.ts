// src/services/musicProviders/qqMusicAuth.ts
// Stores and resolves QQ Music login cookie details for provider requests.

export const QQ_MUSIC_COOKIE_STORAGE_KEY = 'qq_music_cookie';
export const QQ_MUSIC_GUID_STORAGE_KEY = 'qq_music_guid';
export const QQ_MUSIC_AUTH_CHANGED_EVENT = 'folia:qq-music-auth-changed';

const DEFAULT_QQ_MUSIC_COOKIE = 'tmeLoginType=-1;';
const DEFAULT_QQ_MUSIC_UIN = '0';
const DEFAULT_QQ_MUSIC_GUID = '10000';

const canUseLocalStorage = () => typeof localStorage !== 'undefined';

const notifyQQMusicAuthChanged = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(QQ_MUSIC_AUTH_CHANGED_EVENT));
};

export const parseQQMusicCookie = (cookie: string | null | undefined): Record<string, string> => {
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

const normalizeQQUin = (value: string | null | undefined): string => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.replace(/^0+/, '') || digits || DEFAULT_QQ_MUSIC_UIN;
};

export const parseQQMusicUin = (cookie: string | null | undefined): string => {
    const values = parseQQMusicCookie(cookie);
    const raw = Number(values.login_type) === 2
        ? (values.wxuin || values.uin || values.p_uin)
        : (values.uin || values.qqmusic_uin || values.wxuin || values.p_uin);
    return normalizeQQUin(raw);
};

export const getQQMusicKeyFromCookie = (cookie: string | null | undefined): string => {
    const values = parseQQMusicCookie(cookie);
    return values.qm_keyst
        || values.qqmusic_key
        || values.music_key
        || values.p_skey
        || values.skey
        || values.psrf_qqaccess_token
        || values.psrf_qqrefresh_token
        || values.wxrefresh_token
        || values.wxskey
        || '';
};

export const getQQMusicPlaybackKeyFromCookie = (cookie: string | null | undefined): string => {
    const values = parseQQMusicCookie(cookie);
    return values.qm_keyst || values.qqmusic_key || values.music_key || values.wxskey || '';
};

export const normalizeQQMusicCookieInput = (cookie: string): string => {
    const values = parseQQMusicCookie(cookie);
    if (Number(values.login_type) === 2 && values.wxuin && !values.uin) {
        values.uin = values.wxuin;
    }
    if (!values.uin && (values.qqmusic_uin || values.p_uin)) {
        values.uin = values.qqmusic_uin || values.p_uin;
    }
    if (values.uin) {
        values.uin = normalizeQQUin(values.uin);
    }
    return Object.entries(values)
        .filter(([, value]) => value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
};

export const getStoredQQMusicCookie = (): string => {
    if (!canUseLocalStorage()) return '';
    try {
        return localStorage.getItem(QQ_MUSIC_COOKIE_STORAGE_KEY)?.trim() || '';
    } catch {
        return '';
    }
};

export const setStoredQQMusicCookie = (cookie: string) => {
    if (!canUseLocalStorage()) return;
    const normalizedCookie = normalizeQQMusicCookieInput(cookie);
    if (!normalizedCookie) {
        localStorage.removeItem(QQ_MUSIC_COOKIE_STORAGE_KEY);
        notifyQQMusicAuthChanged();
        return;
    }
    localStorage.setItem(QQ_MUSIC_COOKIE_STORAGE_KEY, normalizedCookie);
    notifyQQMusicAuthChanged();
};

export const clearStoredQQMusicCookie = () => {
    if (!canUseLocalStorage()) return;
    localStorage.removeItem(QQ_MUSIC_COOKIE_STORAGE_KEY);
    notifyQQMusicAuthChanged();
};

const createQQMusicGuid = () => String(Math.floor(100000000 + Math.random() * 900000000));

export const getQQMusicGuid = (): string => {
    if (!canUseLocalStorage()) return DEFAULT_QQ_MUSIC_GUID;
    try {
        const existingGuid = localStorage.getItem(QQ_MUSIC_GUID_STORAGE_KEY);
        if (existingGuid) return existingGuid;
        const nextGuid = createQQMusicGuid();
        localStorage.setItem(QQ_MUSIC_GUID_STORAGE_KEY, nextGuid);
        return nextGuid;
    } catch {
        return DEFAULT_QQ_MUSIC_GUID;
    }
};

export type QQMusicAuth = {
    cookieHeader: string;
    guid: string;
    hasCookie: boolean;
    isLoggedIn: boolean;
    musicKey: string;
    playbackKey: string;
    playbackKeyReady: boolean;
    uin: string;
};

export const getQQMusicAuth = (): QQMusicAuth => {
    const storedCookie = getStoredQQMusicCookie();
    const uin = parseQQMusicUin(storedCookie);
    const musicKey = getQQMusicKeyFromCookie(storedCookie);
    const playbackKey = getQQMusicPlaybackKeyFromCookie(storedCookie);
    return {
        cookieHeader: storedCookie || DEFAULT_QQ_MUSIC_COOKIE,
        guid: getQQMusicGuid(),
        hasCookie: storedCookie.length > 0,
        isLoggedIn: uin !== DEFAULT_QQ_MUSIC_UIN && musicKey.length > 0,
        musicKey,
        playbackKey,
        playbackKeyReady: playbackKey.length > 0,
        uin,
    };
};

// Hydrates renderer QQ auth from Electron's persisted login partition on startup.
export const syncQQMusicAuthFromElectron = async (): Promise<QQMusicAuth> => {
    if (typeof window === 'undefined' || typeof window.electron?.getQQMusicLoginCookie !== 'function') {
        return getQQMusicAuth();
    }

    try {
        const result = await window.electron.getQQMusicLoginCookie();
        if (result.ok && result.cookie?.trim()) {
            const normalizedCookie = normalizeQQMusicCookieInput(result.cookie);
            if (normalizedCookie && normalizedCookie !== getStoredQQMusicCookie()) {
                setStoredQQMusicCookie(normalizedCookie);
            }
        }
    } catch {
        // Keep localStorage auth if Electron partition sync fails.
    }

    return getQQMusicAuth();
};

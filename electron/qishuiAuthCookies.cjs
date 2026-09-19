// electron/qishuiAuthCookies.cjs
// Cookie domain / login detection for the isolated Qishui Passport Web session.

const QISHUI_LOGIN_COOKIE_PRIORITY = [
    'sessionid',
    'sessionid_ss',
    'sid_tt',
    'sid_guard',
    'uid_tt',
    'uid_tt_ss',
    'passport_csrf_token',
    'odin_tt',
];

const QISHUI_COOKIE_DOMAINS = [
    'douyin.com',
    'qishui.com',
    'snssdk.com',
    'bytedance.com',
    'iesdouyin.com',
];

const parseCookieHeader = (cookie) => {
    const entries = {};
    String(cookie || '').split(';').forEach((part) => {
        const raw = part.trim();
        if (!raw) return;
        const index = raw.indexOf('=');
        if (index <= 0) return;
        entries[raw.slice(0, index).trim()] = raw.slice(index + 1).trim();
    });
    return entries;
};

const isQishuiCookieDomain = (domain) => {
    const normalized = String(domain || '').replace(/^\./, '').toLowerCase();
    return QISHUI_COOKIE_DOMAINS.some((suffix) => (
        normalized === suffix || normalized.endsWith(`.${suffix}`)
    ));
};

const qishuiCookieHasLogin = (cookie) => {
    const values = parseCookieHeader(cookie);
    const session = values.sessionid || values.sessionid_ss || '';
    const sid = values.sid_tt || '';
    return session.length >= 8 || sid.length >= 8;
};

/** Passport QR / captcha use window.open (often about:blank first). Denying that looks like a dead click. */
const resolveQishuiLoginPopupAction = (url) => {
    const raw = String(url || '').trim();
    if (!raw || raw === 'about:blank' || raw.startsWith('about:blank')) {
        return 'allow';
    }
    try {
        const protocol = new URL(raw).protocol;
        return protocol === 'https:' || protocol === 'http:' ? 'allow' : 'deny';
    } catch {
        return 'deny';
    }
};

const parseQishuiUserLabel = (cookie) => {
    const values = parseCookieHeader(cookie);
    const uid = String(values.uid_tt || values.uid_tt_ss || '').trim();
    if (uid) return uid.slice(0, 12);
    const session = String(values.sessionid || '').trim();
    return session ? session.slice(0, 8) : '';
};

const buildQishuiCookieHeader = (cookies) => {
    const picked = new Map();
    (cookies || []).forEach((cookie) => {
        if (!cookie?.name || !isQishuiCookieDomain(cookie.domain)) return;
        picked.set(cookie.name, cookie.value || '');
    });
    const ordered = [];
    QISHUI_LOGIN_COOKIE_PRIORITY.forEach((name) => {
        if (!picked.has(name)) return;
        ordered.push([name, picked.get(name)]);
        picked.delete(name);
    });
    picked.forEach((value, name) => ordered.push([name, value]));
    return ordered
        .filter(([name, value]) => name && value != null && String(value) !== '')
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
};

module.exports = {
    QISHUI_LOGIN_COOKIE_PRIORITY,
    buildQishuiCookieHeader,
    isQishuiCookieDomain,
    parseCookieHeader,
    parseQishuiUserLabel,
    qishuiCookieHasLogin,
    resolveQishuiLoginPopupAction,
};

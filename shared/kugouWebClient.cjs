const crypto = require('crypto');

// shared/kugouWebClient.cjs
// Signed Kugou web/android requests for QR login and authenticated play URLs.
// Salts/app ids follow MakcRe/KuGouMusicApi (MIT). No youth VIP endpoints.

const WEB_SALT = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt';
const ANDROID_SALT = 'OIlwieks28dk2k092lksi2UIkp';
const SIGN_KEY_SALT = '57ae12eb6890223e355ccfcb74edf70d';
const SRCAPPID = 2919;
const APPID = 1005;
const CLIENTVER = 20489;
const QR_CREATE_APPID = 1001;
const QR_H5_APPID = 1005;
const QR_H5_BASE = 'https://h5.kugou.com/apps/loginQRCode/html/index.html';

const md5 = (value) => crypto.createHash('md5').update(String(value)).digest('hex');

const signatureWebParams = (params, data = '') => {
    const paramsString = Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .sort()
        .join('');
    return md5(`${WEB_SALT}${paramsString}${data || ''}${WEB_SALT}`);
};

const signatureAndroidParams = (params, data = '') => {
    const paramsString = Object.keys(params)
        .sort()
        .map((key) => `${key}=${typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]}`)
        .join('');
    return md5(`${ANDROID_SALT}${paramsString}${data || ''}${ANDROID_SALT}`);
};

const parseKugouCookie = (cookie) => {
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

const kugouCookieHasLogin = (cookie) => {
    const values = parseKugouCookie(cookie);
    const token = String(values.token || '').trim();
    const userid = String(values.userid || '').trim();
    return token.length >= 8 && userid.length > 0 && userid !== '0';
};

const buildKugouCookieHeader = ({ token, userid, vipToken, vipType, dfid } = {}) => {
    const parts = [];
    if (token) parts.push(`token=${String(token).trim()}`);
    if (userid) parts.push(`userid=${String(userid).trim()}`);
    if (dfid && dfid !== '-') parts.push(`dfid=${String(dfid).trim()}`);
    if (vipToken) parts.push(`vip_token=${String(vipToken).trim()}`);
    if (vipType) parts.push(`vip_type=${String(vipType).trim()}`);
    return parts.join('; ');
};

const parseKugouUserLabel = (cookie) => {
    const userid = String(parseKugouCookie(cookie).userid || '').trim();
    return userid && userid !== '0' ? userid.slice(0, 12) : '';
};

const createDeviceIds = (cookie) => {
    const parsed = parseKugouCookie(cookie);
    const userid = String(parsed.userid || '0');
    const token = String(parsed.token || '');
    return {
        mid: parsed.mid || md5(`lyra-kugou:${userid}:${token}`).slice(0, 32),
        dfid: parsed.dfid || '-',
        userid,
        token,
        vipToken: parsed.vip_token || '',
        vipType: parsed.vip_type || '0',
    };
};

const pickAudioUrl = (value) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = pickAudioUrl(item);
            if (found) return found;
        }
        return '';
    }
    if (value && typeof value === 'object') {
        return pickAudioUrl(value.url || value.backupUrl || value.play_url || value.playUrl);
    }
    return '';
};

const firstMediaUrl = (url) => {
    const raw = String(url || '').trim();
    return raw.split(/,\s*(?=https?:\/\/)/i)[0]?.trim() || raw;
};

const createKugouWebClient = (deps = {}) => {
        const fetchImpl = deps.fetchImpl || ((...args) => globalThis.fetch(...args));
    const nowMs = deps.nowMs || (() => Date.now());

    const fetchKugouJson = async ({
        baseURL,
        url,
        method = 'GET',
        params = {},
        cookie = '',
        encryptType = 'web',
        encryptKey = false,
        headers = {},
        timeoutMs = 8000,
    }) => {
        if (typeof fetchImpl !== 'function') {
            throw new Error('kugou-fetch-unavailable');
        }
        const device = createDeviceIds(cookie);
        const clienttime = Math.floor(nowMs() / 1000);
        const merged = {
            dfid: device.dfid,
            mid: device.mid,
            uuid: '-',
            appid: APPID,
            clientver: CLIENTVER,
            clienttime,
            ...params,
        };
        if (device.token) merged.token = device.token;
        if (device.userid && device.userid !== '0') merged.userid = device.userid;
        if (encryptKey) {
            merged.key = md5(`${String(merged.hash || '')}${SIGN_KEY_SALT}${merged.appid || APPID}${merged.mid}${merged.userid || 0}`);
        }
        merged.signature = encryptType === 'android'
            ? signatureAndroidParams(merged, '')
            : signatureWebParams(merged, '');

        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(merged)) {
            if (value === undefined || value === null) continue;
            search.set(key, String(value));
        }
        const target = `${baseURL}${url}?${search.toString()}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetchImpl(target, {
                method,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    Accept: 'application/json,text/plain,*/*',
                    ...headers,
                },
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`kugou-http-${response.status}`);
            }
            return response.json();
        } finally {
            clearTimeout(timer);
        }
    };

    const createQrKey = async () => {
        const payload = await fetchKugouJson({
            baseURL: 'https://login-user.kugou.com',
            url: '/v2/qrcode',
            encryptType: 'web',
            params: {
                appid: QR_CREATE_APPID,
                type: 1,
                plat: 4,
                qrcode_txt: `${QR_H5_BASE}?appid=${QR_H5_APPID}&`,
                srcappid: SRCAPPID,
            },
        });
        const qrcode = String(payload?.data?.qrcode || payload?.qrcode || '').trim();
        if (!qrcode) {
            throw new Error('kugou-qr-key-failed');
        }
        return {
            qrcode,
            qrcodeImg: String(payload?.data?.qrcode_img || payload?.qrcode_img || '').trim(),
            qrUrl: `${QR_H5_BASE}?qrcode=${encodeURIComponent(qrcode)}`,
        };
    };

    const checkQr = async (key) => {
        const payload = await fetchKugouJson({
            baseURL: 'https://login-user.kugou.com',
            url: '/v2/get_userinfo_qrcode',
            encryptType: 'web',
            params: {
                plat: 4,
                appid: APPID,
                srcappid: SRCAPPID,
                qrcode: key,
            },
        });
        const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
        const status = Number(data.status);
        if (status === 4 && data.token && data.userid) {
            return {
                status: 4,
                cookie: buildKugouCookieHeader({
                    token: data.token,
                    userid: data.userid,
                    dfid: data.dfid,
                    vipToken: data.vip_token,
                    vipType: data.vip_type,
                }),
                userid: String(data.userid),
                token: String(data.token),
            };
        }
        return { status: Number.isFinite(status) ? status : -1 };
    };

    const fetchAuthenticatedAudioUrl = async ({ hash, albumId = '', cookie, quality = 320 } = {}) => {
        const safeHash = String(hash || '').trim().toLowerCase();
        if (!safeHash || !kugouCookieHasLogin(cookie)) {
            return '';
        }
        const payload = await fetchKugouJson({
            baseURL: 'https://gateway.kugou.com',
            url: '/v5/url',
            encryptType: 'android',
            encryptKey: true,
            cookie,
            headers: { 'x-router': 'trackercdn.kugou.com' },
            params: {
                album_id: Number(albumId || 0) || 0,
                area_code: 1,
                hash: safeHash,
                ssa_flag: 'is_fromtrack',
                version: 11430,
                page_id: 151369488,
                quality,
                album_audio_id: 0,
                behavior: 'play',
                pid: 2,
                cmd: 26,
                pidversion: 3001,
                IsFreePart: 0,
                ppage_id: '463467626,350369493,788954147',
                cdnBackup: 1,
                module: '',
                clientver: 11430,
            },
        });
        const audioUrl = pickAudioUrl(payload?.url) || pickAudioUrl(payload?.data) || pickAudioUrl(payload);
        return audioUrl ? firstMediaUrl(audioUrl) : '';
    };

    return {
        checkQr,
        createQrKey,
        fetchAuthenticatedAudioUrl,
        fetchKugouJson,
    };
};

const defaultClient = createKugouWebClient();

module.exports = {
    APPID,
    QR_H5_BASE,
    SRCAPPID,
    buildKugouCookieHeader,
    createKugouWebClient,
    checkQr: defaultClient.checkQr,
    createQrKey: defaultClient.createQrKey,
    fetchAuthenticatedAudioUrl: defaultClient.fetchAuthenticatedAudioUrl,
    kugouCookieHasLogin,
    parseKugouCookie,
    parseKugouUserLabel,
    signatureAndroidParams,
    signatureWebParams,
};

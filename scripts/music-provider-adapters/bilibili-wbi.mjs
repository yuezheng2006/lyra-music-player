import crypto from 'node:crypto';

// scripts/music-provider-adapters/bilibili-wbi.mjs
// Minimal Bilibili WBI signer + SPI buvid bootstrap for space APIs.

const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
  26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
  20, 34, 44, 52,
];

const getMixinKey = (orig) => MIXIN_KEY_ENC_TAB.map((i) => orig[i]).join('').slice(0, 32);

const md5 = (value) => crypto.createHash('md5').update(value).digest('hex');

const fileKeyFromUrl = (url) => {
  const name = String(url || '').split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};

/** Build `wts` + `w_rid` query string for a WBI-protected endpoint. */
export function encWbi(params, imgKey, subKey) {
  const mixinKey = getMixinKey(`${imgKey}${subKey}`);
  const withTs = { ...params, wts: Math.round(Date.now() / 1000) };
  const chrFilter = /[!'()*]/g;
  const query = Object.keys(withTs)
    .sort()
    .map((key) => {
      const value = String(withTs[key]).replace(chrFilter, '');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  return `${query}&w_rid=${md5(query + mixinKey)}`;
}

let cachedWbiKeys = null;
let cachedWbiAt = 0;
let cachedBuvidCookie = '';
let cachedBuvidAt = 0;

const CACHE_MS = 30 * 60 * 1000;

export async function getWbiKeys(fetchJson) {
  if (cachedWbiKeys && Date.now() - cachedWbiAt < CACHE_MS) {
    return cachedWbiKeys;
  }
  const nav = await fetchJson('https://api.bilibili.com/x/web-interface/nav');
  const imgUrl = nav?.data?.wbi_img?.img_url || '';
  const subUrl = nav?.data?.wbi_img?.sub_url || '';
  const imgKey = fileKeyFromUrl(imgUrl);
  const subKey = fileKeyFromUrl(subUrl);
  if (!imgKey || !subKey) {
    throw new Error('Bilibili WBI keys unavailable');
  }
  cachedWbiKeys = { imgKey, subKey };
  cachedWbiAt = Date.now();
  return cachedWbiKeys;
}

/** Resolve a real buvid3/buvid4 pair; unsigned space calls often hit -352 without it. */
export async function getBuvidCookie(fetchJson) {
  if (cachedBuvidCookie && Date.now() - cachedBuvidAt < CACHE_MS) {
    return cachedBuvidCookie;
  }
  const spi = await fetchJson('https://api.bilibili.com/x/frontend/finger/spi');
  const buvid3 = String(spi?.data?.b_3 || '').trim();
  const buvid4 = String(spi?.data?.b_4 || '').trim();
  if (!buvid3) {
    return cachedBuvidCookie || 'buvid3=00000000-0000-0000-0000-000000000000infoc';
  }
  cachedBuvidCookie = buvid4 ? `buvid3=${buvid3}; buvid4=${buvid4}` : `buvid3=${buvid3}`;
  cachedBuvidAt = Date.now();
  return cachedBuvidCookie;
}

/** Test helper: clear in-memory WBI / buvid caches. */
export function resetBilibiliWbiCache() {
  cachedWbiKeys = null;
  cachedWbiAt = 0;
  cachedBuvidCookie = '';
  cachedBuvidAt = 0;
}

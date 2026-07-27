// shared/mediaRequestHeaders.cjs
// Hostname → Referer / CORS rules for third-party audio CDNs in Electron.

/**
 * @param {string} hostname
 * @returns {{ referer?: string, origin?: string } | null}
 */
function resolveMediaRequestOverride(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (!host) return null;

  if (
    host === 'bilibili.com'
    || host.endsWith('.bilibili.com')
    || host === 'bilivideo.com'
    || host.endsWith('.bilivideo.com')
    || host.endsWith('.bilivideo.cn')
  ) {
    return {
      referer: 'https://www.bilibili.com/',
      origin: 'https://www.bilibili.com',
    };
  }

  if (host === 'kugou.com' || host.endsWith('.kugou.com')) {
    return { referer: 'https://www.kugou.com/' };
  }

  // 汽水 / 抖音点播：缺 Referer 时常返回 HTML/deny，HTMLAudio 报 Format error。
  if (
    host === 'douyinvod.com'
    || host.endsWith('.douyinvod.com')
    || host === 'douyin.com'
    || host.endsWith('.douyin.com')
    || host.includes('bytecdn')
    || host.includes('byteimg')
    || host.endsWith('.zjcdn.com')
  ) {
    return {
      referer: 'https://music.douyin.com/',
      origin: 'https://music.douyin.com',
    };
  }

  return null;
}

/** Hosts that need CORS headers rewritten for <audio> / fetch from the app origin. */
function shouldBypassMediaCors(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (!host) return false;
  if (
    host === 'qq.com'
    || host.endsWith('.qq.com')
    || host === 'kugou.com'
    || host.endsWith('.kugou.com')
    || host === 'bilibili.com'
    || host.endsWith('.bilibili.com')
    || host === 'bilivideo.com'
    || host.endsWith('.bilivideo.com')
    || host.endsWith('.bilivideo.cn')
    || host === 'amll-ttml-db.stevexmh.net'
  ) {
    return true;
  }
  if (
    host === 'douyinvod.com'
    || host.endsWith('.douyinvod.com')
    || host === 'douyin.com'
    || host.endsWith('.douyin.com')
    || host.includes('bytecdn')
    || host.endsWith('.zjcdn.com')
  ) {
    return true;
  }
  return false;
}

module.exports = {
  resolveMediaRequestOverride,
  shouldBypassMediaCors,
};

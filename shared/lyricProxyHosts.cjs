// shared/lyricProxyHosts.cjs
// Host allowlist for lyric/cover proxy (CJS for Electron).

function isAllowedLyricProxyHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  const host = hostname.toLowerCase();
  return (
    host === 'qq.com' ||
    host.endsWith('.qq.com') ||
    host === 'gtimg.cn' ||
    host.endsWith('.gtimg.cn') ||
    host === 'kugou.com' ||
    host.endsWith('.kugou.com') ||
    host === '126.net' ||
    host.endsWith('.126.net') ||
    host === '163.com' ||
    host.endsWith('.163.com') ||
    host === 'douyinpic.com' ||
    host.endsWith('.douyinpic.com') ||
    host === 'byteimg.com' ||
    host.endsWith('.byteimg.com') ||
    host === 'amll-ttml-db.stevexmh.net'
  );
}

function isAmllDbHost(hostname) {
  return typeof hostname === 'string' && hostname.toLowerCase() === 'amll-ttml-db.stevexmh.net';
}

function resolveCoverProxyReferer(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === '126.net' || host.endsWith('.126.net') || host === '163.com' || host.endsWith('.163.com')) {
      return 'https://music.163.com/';
    }
    if (
      host === 'qq.com' ||
      host.endsWith('.qq.com') ||
      host === 'gtimg.cn' ||
      host.endsWith('.gtimg.cn')
    ) {
      return 'https://y.qq.com/';
    }
    if (host === 'kugou.com' || host.endsWith('.kugou.com')) {
      return 'https://www.kugou.com/';
    }
    if (
      host === 'douyinpic.com'
      || host.endsWith('.douyinpic.com')
      || host === 'byteimg.com'
      || host.endsWith('.byteimg.com')
    ) {
      return 'https://qishui.douyin.com/';
    }
  } catch {
    // ignore invalid urls
  }
  return 'https://music.163.com/';
}

module.exports = {
  isAllowedLyricProxyHost,
  isAmllDbHost,
  resolveCoverProxyReferer,
};

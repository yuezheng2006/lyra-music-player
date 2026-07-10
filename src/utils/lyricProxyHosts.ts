// src/utils/lyricProxyHosts.ts
// Host allowlist helpers for lyric/cover proxy (frontend).

export function isAllowedLyricProxyHost(hostname: string): boolean {
  if (!hostname) return false;
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
    host === 'amll-ttml-db.stevexmh.net'
  );
}

export function isAmllDbHost(hostname: string): boolean {
  return hostname.toLowerCase() === 'amll-ttml-db.stevexmh.net';
}

/** Prefer a CDN-friendly Referer when proxying cover artwork. */
export function resolveCoverProxyReferer(url: string): string {
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
  } catch {
    // ignore invalid urls
  }
  return 'https://music.163.com/';
}

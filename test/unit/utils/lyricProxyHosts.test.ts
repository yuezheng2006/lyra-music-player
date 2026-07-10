import { describe, expect, it } from 'vitest';
import {
  isAllowedLyricProxyHost,
  resolveCoverProxyReferer,
} from '@/utils/lyricProxyHosts';

// test/unit/utils/lyricProxyHosts.test.ts

describe('lyricProxyHosts', () => {
  it('allows Netease cover CDN hosts used by album art', () => {
    expect(isAllowedLyricProxyHost('p1.music.126.net')).toBe(true);
    expect(isAllowedLyricProxyHost('p2.music.126.net')).toBe(true);
    expect(isAllowedLyricProxyHost('music.126.net')).toBe(true);
    expect(isAllowedLyricProxyHost('y.gtimg.cn')).toBe(true);
    expect(isAllowedLyricProxyHost('c.y.qq.com')).toBe(true);
    expect(isAllowedLyricProxyHost('p3-luna.douyinpic.com')).toBe(true);
    expect(isAllowedLyricProxyHost('p3.douyinpic.com')).toBe(true);
    expect(isAllowedLyricProxyHost('p26-sign.byteimg.com')).toBe(true);
  });

  it('rejects unrelated hosts', () => {
    expect(isAllowedLyricProxyHost('evil.example.com')).toBe(false);
    expect(isAllowedLyricProxyHost('')).toBe(false);
  });

  it('picks CDN-friendly referers for cover proxy', () => {
    expect(resolveCoverProxyReferer('https://p1.music.126.net/abc.jpg')).toBe('https://music.163.com/');
    expect(resolveCoverProxyReferer('https://y.gtimg.cn/music/photo_new/T002.jpg')).toBe('https://y.qq.com/');
  });
});

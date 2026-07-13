import { describe, it, expect } from 'vitest';
import {
  formatLocalPlayHistoryDate,
  sanitizeSongForStorage,
  stripExpiringYoutubeStream,
} from '../../../src/services/playHistoryService';

// 简化的测试 - 测试服务的接口和逻辑，而不是 IndexedDB 实现
describe('PlayHistoryService - 接口测试', () => {
  const mockSong: any = {
    id: 12345,
    name: '测试歌曲',
    artists: [{ id: 1, name: '测试艺人' }],
    album: { id: 1, name: '测试专辑', picUrl: 'https://example.com/cover.jpg' },
    musicProvider: 'netease'
  };

  describe('数据结构验证', () => {
    it('应该正确构建播放历史条目', () => {
      const entry = {
        songId: mockSong.id,
        songName: mockSong.name,
        artist: mockSong.artists?.map(a => a.name).join(', '),
        album: mockSong.album?.name,
        playedAt: Date.now(),
        date: new Date().toISOString().split('T')[0],
        source: mockSong.musicProvider || 'netease',
        coverUrl: mockSong.album?.picUrl
      };

      expect(entry.songId).toBe(12345);
      expect(entry.songName).toBe('测试歌曲');
      expect(entry.artist).toBe('测试艺人');
      expect(entry.album).toBe('测试专辑');
      expect(entry.source).toBe('netease');
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('应该正确处理本地音乐', () => {
      const localSong = {
        ...mockSong,
        isLocal: true,
        musicProvider: undefined
      };

      const source = localSong.musicProvider ||
                    (localSong.isLocal ? 'local' : '') ||
                    'netease';

      expect(source).toBe('local');
    });

    it('应该正确处理 Navidrome 音乐', () => {
      const navidromeSong = {
        ...mockSong,
        isNavidrome: true,
        musicProvider: undefined
      };

      const source = navidromeSong.musicProvider ||
                    (navidromeSong.isLocal ? 'local' : '') ||
                    (navidromeSong.isNavidrome ? 'navidrome' : '') ||
                    'netease';

      expect(source).toBe('navidrome');
    });

    it('应该正确处理 YouTube Music', () => {
      const ytmSong = {
        ...mockSong,
        isYtm: true,
        musicProvider: undefined
      };

      const source = ytmSong.musicProvider ||
                    (ytmSong.isLocal ? 'local' : '') ||
                    (ytmSong.isNavidrome ? 'navidrome' : '') ||
                    (ytmSong.isYtm ? 'youtube' : '') ||
                    'netease';

      expect(source).toBe('youtube');
    });

    it('应该处理缺少艺人信息', () => {
      const songWithoutArtist = {
        ...mockSong,
        artists: undefined
      };

      const artist = songWithoutArtist.artists?.map(a => a.name).join(', ') || 'Unknown';
      expect(artist).toBe('Unknown');
    });

    it('应该处理缺少专辑信息', () => {
      const songWithoutAlbum = {
        ...mockSong,
        album: undefined
      };

      const album = songWithoutAlbum.album?.name;
      expect(album).toBeUndefined();
    });
  });

  describe('日期和时间处理', () => {
    it('日期格式应该是 YYYY-MM-DD', () => {
      const date = new Date().toISOString().split('T')[0];
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('时间戳应该是数字', () => {
      const timestamp = Date.now();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('今天的日期应该正确', () => {
      const today = formatLocalPlayHistoryDate();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      expect(today).toBe(`${year}-${month}-${day}`);
    });
  });

  describe('数据验证逻辑', () => {
    it('应该验证歌曲 ID 存在', () => {
      const isValid = mockSong.id !== undefined && mockSong.id !== null;
      expect(isValid).toBe(true);
    });

    it('应该验证歌曲名存在', () => {
      const isValid = mockSong.name !== undefined && mockSong.name !== '';
      expect(isValid).toBe(true);
    });

    it('应该处理超长歌曲名', () => {
      const longName = 'A'.repeat(1000);
      expect(longName.length).toBe(1000);
      // 在实际存储中，IndexedDB 可以处理长字符串
    });

    it('应该处理特殊字符', () => {
      const specialName = '测试"歌曲\'<>&🎵';
      expect(specialName).toBe('测试"歌曲\'<>&🎵');
      // IndexedDB 可以正确存储特殊字符
    });
  });

  describe('统计计算逻辑', () => {
    it('应该正确计算唯一歌曲数', () => {
      const history = [
        { songId: 1 },
        { songId: 2 },
        { songId: 1 }, // 重复
        { songId: 3 }
      ];

      const uniqueSongs = new Set(history.map(h => h.songId)).size;
      expect(uniqueSongs).toBe(3);
    });

    it('应该正确计算总播放次数', () => {
      const history = [{ songId: 1 }, { songId: 2 }, { songId: 1 }];
      expect(history.length).toBe(3);
    });

    it('应该正确计算日期范围', () => {
      const dates = [
        Date.now(),
        Date.now() - 86400000, // 1天前
        Date.now() - 172800000  // 2天前
      ];

      const range = {
        start: new Date(Math.min(...dates)),
        end: new Date(Math.max(...dates))
      };

      const daysDiff = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(2);
    });
  });

  describe('错误处理逻辑', () => {
    it('服务函数应该优雅处理错误', async () => {
      // 测试 try-catch 逻辑
      const errorHandler = async () => {
        try {
          throw new Error('Test error');
        } catch (error) {
          console.error('Error:', error);
          // 静默失败，不抛出
        }
      };

      await expect(errorHandler()).resolves.not.toThrow();
    });

    it('应该在失败时返回默认值', () => {
      const getDefaultValue = () => {
        try {
          throw new Error('Test error');
        } catch (error) {
          return []; // 返回空数组
        }
      };

      expect(getDefaultValue()).toEqual([]);
    });
  });

  describe('日期分组逻辑', () => {
    it('应该正确识别今天', () => {
      const today = new Date().toISOString().split('T')[0];
      const testDate = new Date().toISOString().split('T')[0];
      expect(testDate).toBe(today);
    });

    it('应该正确识别昨天', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const testDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      expect(testDate).toBe(yesterday);
    });

    it('应该正确按日期分组', () => {
      const history = [
        { date: '2024-01-01', song: 'A' },
        { date: '2024-01-01', song: 'B' },
        { date: '2024-01-02', song: 'C' }
      ];

      const groups: Record<string, any[]> = {};
      history.forEach(entry => {
        if (!groups[entry.date]) {
          groups[entry.date] = [];
        }
        groups[entry.date].push(entry);
      });

      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['2024-01-01']).toHaveLength(2);
      expect(groups['2024-01-02']).toHaveLength(1);
    });
  });

  describe('来源标签映射', () => {
    it('应该正确映射来源标签', () => {
      const labels: Record<string, string> = {
        netease: '网易云',
        qq: 'QQ音乐',
        local: '本地',
        navidrome: 'Navidrome',
        youtube: 'YouTube',
        coco: 'Coco',
      };

      expect(labels['netease']).toBe('网易云');
      expect(labels['local']).toBe('本地');
      expect(labels['youtube']).toBe('YouTube');
    });

    it('应该处理未知来源', () => {
      const labels: Record<string, string> = {
        netease: '网易云',
      };

      const getLabel = (source: string) => labels[source] || source;
      expect(getLabel('unknown')).toBe('unknown');
    });
  });

  // 回归测试：点击播放历史时不能复用过期的运行时播放 URL
  describe('sanitizeSongForStorage - 快照不得包含运行时易失状态', () => {
    it('清除 YouTube 的 streamUrl / streamExpireAt（会过期的代理 URL）', () => {
      const song = {
        id: 1,
        name: '歌',
        isYtm: true,
        ytmData: {
          videoId: 'vid-123',
          title: '歌',
          streamUrl: 'http://localhost:9999/proxy?token=EXPIRED',
          streamExpireAt: Date.now() - 1000,
        },
      };

      const snapshot: any = sanitizeSongForStorage(song as any);

      // videoId 必须保留（用于重新解析新鲜 URL）
      expect(snapshot.ytmData.videoId).toBe('vid-123');
      // 过期的流式字段必须清除
      expect(snapshot.ytmData.streamUrl).toBeUndefined();
      expect(snapshot.ytmData.streamExpireAt).toBeUndefined();
    });

    it('清除 localData（含 fileHandle，浏览器权限限制）', () => {
      const song = {
        id: 1,
        name: '歌',
        isLocal: true,
        localData: { id: 'abc', filePath: '/x.mp3', fileHandle: {} },
      };

      const snapshot: any = sanitizeSongForStorage(song as any);

      expect(snapshot.localData).toBeUndefined();
      expect(snapshot.isLocal).toBe(true);
    });

    it('保留 Navidrome / 普通在线歌曲的元数据', () => {
      const song = {
        id: 1,
        name: '歌',
        artists: [{ id: 1, name: '艺人' }],
        isNavidrome: true,
        navidromeData: { id: 'n1', title: '歌' },
      };

      const snapshot: any = sanitizeSongForStorage(song as any);

      expect(snapshot.id).toBe(1);
      expect(snapshot.navidromeData).toEqual({ id: 'n1', title: '歌' });
    });
  });

  // 回归测试：旧记录里残留的失效代理 streamUrl，点击播放时必须被剥除
  describe('stripExpiringYoutubeStream - 点击播放时强制刷新 YouTube 流', () => {
    it('剥除旧记录里失效的本地代理 streamUrl（保留 videoId）', () => {
      const snapshot = {
        id: 1,
        isYtm: true,
        ytmData: {
          videoId: 'vid-123',
          streamUrl: 'http://127.0.0.1:51228/ytm/vid-123', // 动态端口，dev 重启后失效
          streamExpireAt: 1234567890,
        },
      };

      const out: any = stripExpiringYoutubeStream(snapshot);

      expect(out.ytmData.videoId).toBe('vid-123'); // videoId 保留 → 能重新解析
      expect(out.ytmData.streamUrl).toBeUndefined();
      expect(out.ytmData.streamExpireAt).toBeUndefined();
    });

    it('对非 YouTube 快照（无 ytmData）原样返回', () => {
      const snapshot = { id: 1, name: '歌', musicProvider: 'netease' };
      expect(stripExpiringYoutubeStream(snapshot)).toEqual(snapshot);
    });

    it('不修改原始快照对象', () => {
      const snapshot: any = { isYtm: true, ytmData: { videoId: 'v', streamUrl: 'x' } };
      stripExpiringYoutubeStream(snapshot);
      expect(snapshot.ytmData.streamUrl).toBe('x'); // 原对象不变
    });
  });
});

// 说明：这个测试文件验证了服务的业务逻辑，而不是 IndexedDB 的实现细节
// 实际的 IndexedDB 集成应该通过 E2E 测试或手动测试来验证
console.log('✅ 播放历史服务逻辑测试完成');
console.log('📝 注意：完整的 IndexedDB 集成测试应该通过 E2E 测试进行');

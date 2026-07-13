import { openDB } from './db';
import type { UnifiedSong } from '../types';

const PLAY_HISTORY_STORE = 'play_history';

export interface PlayHistoryEntry {
  id?: number;
  songId: string | number;
  songName: string;
  artist: string;
  album?: string;
  playedAt: number;
  date: string; // YYYY-MM-DD format
  source: string;
  coverUrl?: string;
  /** 完整歌曲对象的序列化快照，用于点击历史记录时重新播放。 */
  songSnapshot?: unknown;
}

/** Local calendar day key (YYYY-MM-DD) — avoids UTC drift near midnight. */
export const formatLocalPlayHistoryDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 检查 play_history 表是否存在，如果不存在则自动重建数据库
 */
async function ensurePlayHistoryStore(): Promise<IDBDatabase> {
  const db = await openDB();

  // 检查是否有 play_history 表
  if (!db.objectStoreNames.contains(PLAY_HISTORY_STORE)) {
    console.warn('[PlayHistory] play_history store not found, rebuilding database...');

    // 关闭当前连接
    db.close();

    // 删除旧数据库
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase('KineticPlayerDB');
      deleteRequest.onsuccess = () => {
        console.log('[PlayHistory] Old database deleted, will reload page');
        resolve();
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onblocked = () => {
        console.warn('[PlayHistory] Database deletion blocked, forcing reload...');
      };
    });

    // 等待一下再重新打开
    await new Promise(resolve => setTimeout(resolve, 100));

    // 刷新页面以重新初始化数据库
    console.log('[PlayHistory] Reloading page to initialize database...');
    location.reload();

    // 返回一个永远不会 resolve 的 Promise，因为页面会刷新
    return new Promise(() => {});
  }

  return db;
}

/**
 * 清理歌曲对象中不可序列化或运行时易失的字段，只保留重新播放所需数据。
 * - localData 整体不存（含 fileHandle，浏览器权限限制）；播放时靠 localSongs 列表按名称+时长回退匹配。
 * - ytmData.streamUrl / streamExpireAt 不存（本地代理 URL 会过期）；播放时按 videoId 重新解析。
 *   根因：onPlayYtmSong 见到 streamUrl 是代理格式就直接复用，不检查 expireAt，导致用过期 URL 播放失败。
 */
export function sanitizeSongForStorage(song: UnifiedSong): unknown {
  const { localData, ...snapshot } = song as any;
  if (snapshot.ytmData) {
    const { streamUrl, streamExpireAt, ...ytmRest } = snapshot.ytmData;
    snapshot.ytmData = ytmRest;
  }
  return snapshot;
}

/**
 * 点击播放历史时，剥除 YouTube 缓存的 streamUrl / streamExpireAt。
 * 根因：onPlayYtmSong 见 streamUrl 是本地代理格式就直接复用、不检查过期；
 * 而代理端口是动态的（dev 重启即失效），旧记录里残留的 streamUrl 必然失效。
 * 清掉后 onPlayYtmSong 会按 videoId 重新解析出新鲜 URL。
 * 对新旧的快照都生效，无需用户清历史。
 */
export function stripExpiringYoutubeStream(snapshot: unknown): unknown {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  const s = snapshot as any;
  if (!s.ytmData) return s;
  const { streamUrl, streamExpireAt, ...ytmRest } = s.ytmData;
  return { ...s, ytmData: ytmRest };
}

/**
 * 记录一次播放（所有渠道通用）
 */
export async function recordPlay(song: UnifiedSong): Promise<void> {
  try {
    const db = await ensurePlayHistoryStore();

    const entry: PlayHistoryEntry = {
      songSnapshot: sanitizeSongForStorage(song),
      songId: song.id,
      songName: song.name,
      artist: song.artists?.map(a => a.name).join(', ') || song.ar?.map(a => a.name).join(', ') || 'Unknown',
      album: song.album?.name || song.al?.name,
      playedAt: Date.now(),
      date: formatLocalPlayHistoryDate(),
      source: song.musicProvider ||
              (song.isLocal ? 'local' : '') ||
              (song.isNavidrome ? 'navidrome' : '') ||
              (song.isYtm ? 'youtube' : '') ||
              'netease',
      coverUrl: song.album?.picUrl || song.al?.picUrl,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([PLAY_HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(PLAY_HISTORY_STORE);
      store.add(entry);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    // 静默失败，不影响播放
    console.error('[PlayHistory] Failed to record play:', error);
  }
}

/**
 * 获取播放历史
 */
export async function getPlayHistory(limit: number = 1000): Promise<PlayHistoryEntry[]> {
  try {
    const db = await ensurePlayHistoryStore();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([PLAY_HISTORY_STORE], 'readonly');
      const store = tx.objectStore(PLAY_HISTORY_STORE);
      const index = store.index('playedAt');
      const request = index.openCursor(null, 'prev'); // 倒序

      const results: PlayHistoryEntry[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PlayHistory] Failed to get play history:', error);
    return [];
  }
}

/**
 * 获取播放历史统计信息
 */
export async function getPlayHistoryStats(): Promise<{
  totalPlays: number;
  uniqueSongs: number;
  dateRange: { start: Date | null; end: Date | null };
}> {
  try {
    const history = await getPlayHistory(10000);

    if (history.length === 0) {
      return {
        totalPlays: 0,
        uniqueSongs: 0,
        dateRange: { start: null, end: null }
      };
    }

    const uniqueSongIds = new Set(history.map(h => h.songId));
    const dates = history.map(h => h.playedAt);

    return {
      totalPlays: history.length,
      uniqueSongs: uniqueSongIds.size,
      dateRange: {
        start: new Date(Math.min(...dates)),
        end: new Date(Math.max(...dates))
      }
    };
  } catch (error) {
    console.error('[PlayHistory] Failed to get stats:', error);
    return {
      totalPlays: 0,
      uniqueSongs: 0,
      dateRange: { start: null, end: null }
    };
  }
}

/**
 * 清除所有播放历史
 */
export async function clearPlayHistory(): Promise<void> {
  try {
    const db = await ensurePlayHistoryStore();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([PLAY_HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(PLAY_HISTORY_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PlayHistory] Failed to clear history:', error);
    throw error;
  }
}

/**
 * 删除指定日期之前的历史记录
 */
export async function cleanOldHistory(keepDays: number = 90): Promise<number> {
  try {
    const db = await ensurePlayHistoryStore();
    const cutoffDate = formatLocalPlayHistoryDate(
      new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000),
    );

    return new Promise((resolve, reject) => {
      const tx = db.transaction([PLAY_HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(PLAY_HISTORY_STORE);
      const index = store.index('date');
      const range = IDBKeyRange.upperBound(cutoffDate, true);

      let deletedCount = 0;
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[PlayHistory] Failed to clean old history:', error);
    return 0;
  }
}

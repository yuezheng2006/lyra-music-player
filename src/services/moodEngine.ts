// src/services/moodEngine.ts
// Mood Engine - Hybrid emotion recognition system
// 情绪引擎 - 混合情绪识别系统

import type { MoodProfile } from '../types/atmosphere';
import type {
  EmotionTag,
  SongEmotion,
  UserEmotionCorrection,
} from '../types/moodEngine';
import { inferEmotionFromMoodProfile } from '../types/moodEngine';

/**
 * 情绪引擎服务
 * Mood Engine Service
 */
export class MoodEngineService {
  private emotionCache: Map<number, SongEmotion> = new Map();
  private dbName = 'lyra-mood-engine';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  /**
   * 初始化 IndexedDB
   * Initialize IndexedDB
   */
  private async initDatabase(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          console.warn('[MoodEngine] IndexedDB open failed; using memory cache only.', request.error);
          this.db = null;
          finish();
        };
        request.onsuccess = () => {
          this.db = request.result;
          finish();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 创建 emotions 存储
          if (!db.objectStoreNames.contains('emotions')) {
            const emotionStore = db.createObjectStore('emotions', { keyPath: 'songId' });
            emotionStore.createIndex('emotion', 'emotion', { unique: false });
            emotionStore.createIndex('source', 'source', { unique: false });
          }

          // 创建 corrections 存储
          if (!db.objectStoreNames.contains('corrections')) {
            const correctionStore = db.createObjectStore('corrections', { keyPath: 'songId' });
            correctionStore.createIndex('correctedAt', 'correctedAt', { unique: false });
          }
        };
      } catch (error) {
        console.warn('[MoodEngine] IndexedDB unavailable; using memory cache only.', error);
        this.db = null;
        finish();
      }
    });
  }

  /**
   * 从 API 获取情绪标签（优先级1）
   * Get emotion from API (Priority 1)
   *
   * TODO: 实际对接 QQ音乐/网易云 API
   */
  private async getEmotionFromAPI(songId: number): Promise<EmotionTag | null> {
    // 这里应该调用实际的音乐平台 API
    // 目前返回 null，表示 API 无数据
    // TODO: Implement actual API calls to QQ Music / Netease Cloud Music
    return null;
  }

  /**
   * 从本地音频特征分析推断情绪（优先级2）
   * Infer emotion from local audio analysis (Priority 2)
   */
  private inferEmotionFromLocal(moodProfile: MoodProfile): EmotionTag {
    return inferEmotionFromMoodProfile(moodProfile);
  }

  /**
   * 获取歌曲的情绪数据
   * Get emotion data for a song
   */
  async getSongEmotion(
    songId: number,
    moodProfile?: MoodProfile,
  ): Promise<SongEmotion | null> {
    // 1. 检查缓存
    if (this.emotionCache.has(songId)) {
      return this.emotionCache.get(songId)!;
    }

    // 2. 检查数据库
    const stored = await this.getEmotionFromDB(songId);
    if (stored) {
      this.emotionCache.set(songId, stored);
      return stored;
    }

    // 3. 尝试从 API 获取
    const apiEmotion = await this.getEmotionFromAPI(songId);
    if (apiEmotion) {
      const emotion: SongEmotion = {
        songId,
        emotion: apiEmotion,
        source: 'api',
        confidence: 0.85,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.saveEmotionToDB(emotion);
      this.emotionCache.set(songId, emotion);
      return emotion;
    }

    // 4. 如果有 MoodProfile，使用本地分析
    if (moodProfile) {
      const localEmotion = this.inferEmotionFromLocal(moodProfile);
      const emotion: SongEmotion = {
        songId,
        emotion: localEmotion,
        source: 'local',
        confidence: 0.65,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.saveEmotionToDB(emotion);
      this.emotionCache.set(songId, emotion);
      return emotion;
    }

    return null;
  }

  /**
   * 用户修正歌曲情绪
   * User corrects song emotion
   */
  async correctEmotion(
    songId: number,
    newEmotion: EmotionTag,
  ): Promise<void> {
    const current = await this.getSongEmotion(songId);

    // 保存修正记录
    const correction: UserEmotionCorrection = {
      songId,
      originalEmotion: current?.emotion || 'neutral',
      correctedEmotion: newEmotion,
      correctedAt: Date.now(),
    };
    await this.saveCorrectionToDB(correction);

    // 更新情绪数据
    const updatedEmotion: SongEmotion = {
      songId,
      emotion: newEmotion,
      source: 'user',
      confidence: 1.0,
      createdAt: current?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await this.saveEmotionToDB(updatedEmotion);
    this.emotionCache.set(songId, updatedEmotion);
  }

  /**
   * 从数据库获取情绪数据
   * Get emotion from database
   */
  private async getEmotionFromDB(songId: number): Promise<SongEmotion | null> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['emotions'], 'readonly');
        const store = transaction.objectStore('emotions');
        const request = store.get(songId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * 保存情绪数据到数据库
   * Save emotion to database
   */
  private async saveEmotionToDB(emotion: SongEmotion): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['emotions'], 'readwrite');
        const store = transaction.objectStore('emotions');
        const request = store.put(emotion);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * 保存用户修正记录到数据库
   * Save user correction to database
   */
  private async saveCorrectionToDB(correction: UserEmotionCorrection): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['corrections'], 'readwrite');
        const store = transaction.objectStore('corrections');
        const request = store.put(correction);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * 获取用户的所有修正记录
   * Get all user corrections
   */
  async getUserCorrections(): Promise<UserEmotionCorrection[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return [];

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['corrections'], 'readonly');
        const store = transaction.objectStore('corrections');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * 清除缓存
   * Clear cache
   */
  clearCache(): void {
    this.emotionCache.clear();
  }
}

// 单例实例
export const moodEngineService = new MoodEngineService();

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// E2E 测试：播放历史功能
test.describe('播放历史功能 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 IndexedDB
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('KineticPlayerDB');
    });
    await page.reload();
  });

  test('应该在数据库中创建 play_history 表', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 等待应用加载
    await page.waitForTimeout(2000);

    // 检查数据库版本和表
    const dbInfo = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('KineticPlayerDB');
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          resolve({
            version: db.version,
            tables: Array.from(db.objectStoreNames)
          });
        };
      });
    });

    expect(dbInfo).toMatchObject({
      version: 6,
      tables: expect.arrayContaining(['play_history'])
    });
  });

  test('播放歌曲后应该自动记录到历史', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 等待应用加载
    await page.waitForTimeout(2000);

    // 查找并点击一首歌（需要根据实际 UI 调整选择器）
    const firstSong = page.locator('[data-testid="song-item"]').first();
    if (await firstSong.count() > 0) {
      await firstSong.click();

      // 等待播放开始
      await page.waitForTimeout(1000);

      // 检查数据库中是否有记录
      const historyCount = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('KineticPlayerDB');
          request.onsuccess = (event: any) => {
            const db = event.target.result;
            const tx = db.transaction(['play_history'], 'readonly');
            const store = tx.objectStore('play_history');
            const countRequest = store.count();
            countRequest.onsuccess = () => resolve(countRequest.result);
          };
        });
      });

      expect(historyCount).toBeGreaterThan(0);
    }
  });

  test('应该能打开播放历史页面', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 点击侧边栏的"播放历史"按钮
    const historyButton = page.locator('button:has-text("播放历史"), button[aria-label*="历史"]');

    if (await historyButton.count() > 0) {
      await historyButton.click();

      // 等待页面加载
      await page.waitForTimeout(1000);

      // 检查页面标题
      await expect(page.locator('text=播放历史, text=Play History')).toBeVisible();
    }
  });

  test('播放多首歌曲后，历史页面应该显示所有记录', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 模拟播放多首歌曲
    const songs = page.locator('[data-testid="song-item"]');
    const songCount = await songs.count();

    if (songCount >= 3) {
      // 播放前 3 首歌
      for (let i = 0; i < 3; i++) {
        await songs.nth(i).click();
        await page.waitForTimeout(500);
      }

      // 打开播放历史页面
      const historyButton = page.locator('button:has-text("播放历史")');
      await historyButton.click();
      await page.waitForTimeout(1000);

      // 检查是否显示了记录
      const historyItems = page.locator('[data-testid="history-item"]');
      const historyItemCount = await historyItems.count();

      expect(historyItemCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('统计数据应该正确显示', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 先插入一些测试数据
    await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((resolve) => {
        const request = indexedDB.open('KineticPlayerDB');
        request.onsuccess = (event: any) => resolve(event.target.result);
      });

      const tx = db.transaction(['play_history'], 'readwrite');
      const store = tx.objectStore('play_history');

      // 插入 5 条记录
      for (let i = 0; i < 5; i++) {
        store.add({
          songId: i,
          songName: `测试歌曲 ${i}`,
          artist: '测试艺人',
          playedAt: Date.now() - i * 1000,
          date: new Date().toISOString().split('T')[0],
          source: 'test'
        });
      }

      await new Promise(resolve => {
        tx.oncomplete = () => resolve(undefined);
      });
    });

    // 打开播放历史页面
    const historyButton = page.locator('button:has-text("播放历史")');
    await historyButton.click();
    await page.waitForTimeout(1000);

    // 检查统计数据
    await expect(page.locator('text=5')).toBeVisible(); // 总播放次数
  });

  test('清除历史功能应该正常工作', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 插入测试数据
    await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((resolve) => {
        const request = indexedDB.open('KineticPlayerDB');
        request.onsuccess = (event: any) => resolve(event.target.result);
      });

      const tx = db.transaction(['play_history'], 'readwrite');
      const store = tx.objectStore('play_history');
      store.add({
        songId: 1,
        songName: '测试歌曲',
        artist: '测试艺人',
        playedAt: Date.now(),
        date: new Date().toISOString().split('T')[0],
        source: 'test'
      });

      await new Promise(resolve => {
        tx.oncomplete = () => resolve(undefined);
      });
    });

    // 打开播放历史页面
    const historyButton = page.locator('button:has-text("播放历史")');
    await historyButton.click();
    await page.waitForTimeout(1000);

    // 点击清除按钮
    const clearButton = page.locator('button:has-text("清除"), button:has-text("Clear")');

    if (await clearButton.count() > 0) {
      // 点击清除按钮
      await clearButton.click();

      // 确认对话框
      page.on('dialog', dialog => dialog.accept());
      await page.waitForTimeout(500);

      // 检查是否显示空状态
      await expect(page.locator('text=暂无播放历史, text=No play history')).toBeVisible();
    }
  });

  test('按日期分组应该正常工作', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 插入不同日期的测试数据
    await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((resolve) => {
        const request = indexedDB.open('KineticPlayerDB');
        request.onsuccess = (event: any) => resolve(event.target.result);
      });

      const tx = db.transaction(['play_history'], 'readwrite');
      const store = tx.objectStore('play_history');

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // 今天的记录
      store.add({
        songId: 1,
        songName: '今天的歌',
        artist: '艺人',
        playedAt: Date.now(),
        date: today,
        source: 'test'
      });

      // 昨天的记录
      store.add({
        songId: 2,
        songName: '昨天的歌',
        artist: '艺人',
        playedAt: Date.now() - 86400000,
        date: yesterday,
        source: 'test'
      });

      await new Promise(resolve => {
        tx.oncomplete = () => resolve(undefined);
      });
    });

    // 打开播放历史页面
    const historyButton = page.locator('button:has-text("播放历史")');
    await historyButton.click();
    await page.waitForTimeout(1000);

    // 检查是否有"今天"和"昨天"的分组
    await expect(page.locator('text=今天, text=Today')).toBeVisible();
    await expect(page.locator('text=昨天, text=Yesterday')).toBeVisible();
  });

  test('来源标签应该正确显示', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 插入不同来源的测试数据
    await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((resolve) => {
        const request = indexedDB.open('KineticPlayerDB');
        request.onsuccess = (event: any) => resolve(event.target.result);
      });

      const tx = db.transaction(['play_history'], 'readwrite');
      const store = tx.objectStore('play_history');

      const sources = ['netease', 'local', 'navidrome', 'youtube'];

      sources.forEach((source, i) => {
        store.add({
          songId: i,
          songName: `${source} 歌曲`,
          artist: '艺人',
          playedAt: Date.now() - i * 1000,
          date: new Date().toISOString().split('T')[0],
          source
        });
      });

      await new Promise(resolve => {
        tx.oncomplete = () => resolve(undefined);
      });
    });

    // 打开播放历史页面
    const historyButton = page.locator('button:has-text("播放历史")');
    await historyButton.click();
    await page.waitForTimeout(1000);

    // 检查来源标签
    await expect(page.locator('text=网易云')).toBeVisible();
    await expect(page.locator('text=本地')).toBeVisible();
  });

  test('应该响应主题切换', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 打开播放历史页面
    const historyButton = page.locator('button:has-text("播放历史")');
    if (await historyButton.count() > 0) {
      await historyButton.click();
      await page.waitForTimeout(1000);

      // 获取初始背景色
      const initialBg = await page.evaluate(() => {
        const element = document.querySelector('[class*="pointer-events-auto"]');
        return element ? window.getComputedStyle(element).backgroundColor : null;
      });

      // 切换主题（需要根据实际 UI 调整）
      const themeToggle = page.locator('button[aria-label*="主题"], button[aria-label*="theme"]');
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        // 检查背景色是否改变
        const newBg = await page.evaluate(() => {
          const element = document.querySelector('[class*="pointer-events-auto"]');
          return element ? window.getComputedStyle(element).backgroundColor : null;
        });

        expect(newBg).not.toBe(initialBg);
      }
    }
  });
});

// 性能测试
test.describe('播放历史性能测试', () => {
  test('处理大量数据时应该保持流畅', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 插入大量测试数据
    const startTime = Date.now();

    await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((resolve) => {
        const request = indexedDB.open('KineticPlayerDB');
        request.onsuccess = (event: any) => resolve(event.target.result);
      });

      const tx = db.transaction(['play_history'], 'readwrite');
      const store = tx.objectStore('play_history');

      // 插入 1000 条记录
      for (let i = 0; i < 1000; i++) {
        store.add({
          songId: i,
          songName: `歌曲 ${i}`,
          artist: `艺人 ${i % 10}`,
          playedAt: Date.now() - i * 1000,
          date: new Date(Date.now() - (i % 30) * 86400000).toISOString().split('T')[0],
          source: ['netease', 'local', 'navidrome'][i % 3]
        });
      }

      await new Promise(resolve => {
        tx.oncomplete = () => resolve(undefined);
      });
    });

    const insertTime = Date.now() - startTime;
    console.log(`插入 1000 条记录耗时: ${insertTime}ms`);

    // 打开播放历史页面
    const loadStartTime = Date.now();
    const historyButton = page.locator('button:has-text("播放历史")');
    await historyButton.click();
    await page.waitForTimeout(2000);

    const loadTime = Date.now() - loadStartTime;
    console.log(`加载页面耗时: ${loadTime}ms`);

    // 性能断言
    expect(insertTime).toBeLessThan(5000); // 插入应该在 5 秒内完成
    expect(loadTime).toBeLessThan(3000); // 加载应该在 3 秒内完成

    // 检查是否正确显示
    await expect(page.locator('text=1000')).toBeVisible(); // 总数
  });

  test('滚动大列表应该流畅', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 插入测试数据
    await page.evaluate(async () => {
      const db: IDBDatabase = await new Promise((resolve) => {
        const request = indexedDB.open('KineticPlayerDB');
        request.onsuccess = (event: any) => resolve(event.target.result);
      });

      const tx = db.transaction(['play_history'], 'readwrite');
      const store = tx.objectStore('play_history');

      for (let i = 0; i < 200; i++) {
        store.add({
          songId: i,
          songName: `歌曲 ${i}`,
          artist: '艺人',
          playedAt: Date.now() - i * 1000,
          date: new Date().toISOString().split('T')[0],
          source: 'test'
        });
      }

      await new Promise(resolve => {
        tx.oncomplete = () => resolve(undefined);
      });
    });

    // 打开播放历史页面
    const historyButton = page.locator('button:has-text("播放历史")');
    await historyButton.click();
    await page.waitForTimeout(1000);

    // 执行滚动
    const scrollContainer = page.locator('[class*="overflow-y-auto"]').first();

    // 测试滚动性能
    const scrollStartTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await scrollContainer.evaluate((el) => {
        el.scrollTop += 100;
      });
      await page.waitForTimeout(10);
    }
    const scrollTime = Date.now() - scrollStartTime;

    // 滚动应该很快完成
    expect(scrollTime).toBeLessThan(500);
  });
});

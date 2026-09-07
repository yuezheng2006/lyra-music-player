import { describe, expect, it } from 'vitest';
import {
  applySongDownloadQueueItemResult,
  buildSongDownloadDedupeKey,
  createEmptySongDownloadQueueProgress,
  downloadRootFolderNameFromPath,
  planSongDownloadEnqueue,
} from '@/utils/ui/songDownloadQueueMath';

// test/unit/ui/songDownloadQueueMath.test.ts

describe('songDownloadQueueMath', () => {
  it('builds stable dedupe keys', () => {
    expect(buildSongDownloadDedupeKey({ id: 1, musicProvider: 'qishui' })).toBe('qishui:1');
    expect(buildSongDownloadDedupeKey({ id: 'a', musicProvider: null })).toBe('netease:a');
  });

  it('parses download root folder names from paths', () => {
    expect(downloadRootFolderNameFromPath('/Users/me/Music/Lyra')).toBe('Lyra');
    expect(downloadRootFolderNameFromPath('C:\\Users\\me\\Music\\Lyra\\')).toBe('Lyra');
    expect(downloadRootFolderNameFromPath('')).toBe('Lyra');
  });

  it('filters unsupported and duplicates when planning enqueue', () => {
    const songs = [
      { id: 1, musicProvider: 'qishui', name: 'A' },
      { id: 2, musicProvider: 'qishui', name: 'B' },
      { id: 1, musicProvider: 'qishui', name: 'A again' },
      { id: 3, musicProvider: 'local', name: 'Local' },
    ];
    const result = planSongDownloadEnqueue(songs, {
      existingKeys: new Set(['qishui:2']),
      canDownload: (song) => song.musicProvider !== 'local',
    });
    expect(result.accepted.map((s) => s.id)).toEqual([1]);
    expect(result.skippedDuplicate).toBe(2);
    expect(result.skippedUnsupported).toBe(1);
  });

  it('advances progress counters', () => {
    const base = {
      ...createEmptySongDownloadQueueProgress(),
      total: 3,
      pending: 3,
      running: true,
    };
    const afterOk = applySongDownloadQueueItemResult(base, true);
    expect(afterOk).toMatchObject({ done: 1, failed: 0, pending: 2 });
    const afterFail = applySongDownloadQueueItemResult(afterOk, false);
    expect(afterFail).toMatchObject({ done: 1, failed: 1, pending: 1 });
  });
});

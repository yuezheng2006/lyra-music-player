import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canDownloadSongToDirectory } from '@/services/songDownloadService';
import type { SongResult } from '@/types';

// test/unit/services/songDownloadService.test.ts

vi.mock('@/services/audioCache', () => ({
  getCachedAudioBlob: vi.fn(async () => null),
}));

vi.mock('@/services/musicProviders/registry', () => ({
  getSongMusicProviderId: () => 'qishui',
  getProviderSongCacheKey: () => 'audio_qishui_1',
  getMusicProviderForSong: () => ({
    getAudioUrl: async () => ({ kind: 'ok', audioUrl: 'https://example.com/a.mp3' }),
  }),
}));

describe('songDownloadService', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      electron: {
        downloadSongFile: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects local / navidrome / ytm / stage songs', () => {
    const base = {
      id: 1,
      name: 'A',
      artists: [{ id: 1, name: 'X' }],
      album: { id: 1, name: 'Y' },
      duration: 1000,
    };
    expect(canDownloadSongToDirectory({ ...base, isLocal: true } as SongResult)).toBe(false);
    expect(canDownloadSongToDirectory({ ...base, isNavidrome: true } as SongResult)).toBe(false);
    expect(canDownloadSongToDirectory({
      ...base,
      isYtm: true,
      ytmData: { videoId: 'x' },
    } as SongResult)).toBe(false);
    expect(canDownloadSongToDirectory({ ...base, isStage: true } as SongResult)).toBe(false);
  });

  it('allows online peer songs when electron download API exists', () => {
    expect(canDownloadSongToDirectory({
      id: 1,
      name: '夜曲',
      artists: [{ id: 1, name: '周杰伦' }],
      album: { id: 1, name: '十一月的萧邦' },
      duration: 1000,
      musicProvider: 'qishui',
    })).toBe(true);
  });
});

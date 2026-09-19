import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { maybeWriteDownloadLyricSidecars } from '@/services/songDownloadLyricSidecar';
import { getMusicProviderForSong } from '@/services/musicProviders/registry';
import type { MusicProvider } from '@/services/musicProviders/types';
import type { SongResult } from '@/types';

// test/unit/services/songDownloadLyricSidecar.test.ts

vi.mock('@/services/musicProviders/registry', () => ({
  getMusicProviderForSong: vi.fn(),
}));

const song = {
  id: 1,
  name: '茉莉花',
  artists: [{ id: 1, name: 'Folk' }],
  album: { id: 1, name: 'Demo' },
  duration: 1000,
} as SongResult;

describe('maybeWriteDownloadLyricSidecars', () => {
  const writeDownloadSidecarFile = vi.fn(async () => ({ ok: true, path: '/tmp/a.lrc' }));

  beforeEach(() => {
    writeDownloadSidecarFile.mockClear();
    vi.stubGlobal('window', {
      electron: { writeDownloadSidecarFile },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes main and translation sidecars when lyrics exist', async () => {
    vi.mocked(getMusicProviderForSong).mockReturnValue({
      getLyrics: async () => ({
        lines: [{
          words: [],
          startTime: 1.5,
          endTime: 3,
          fullText: '好一朵美丽的茉莉花',
          translation: 'A beautiful jasmine flower',
        }],
      }),
    } as unknown as MusicProvider);

    await maybeWriteDownloadLyricSidecars(song, '/Music/Lyra/track.mp3');

    expect(writeDownloadSidecarFile).toHaveBeenCalledTimes(2);
    expect(writeDownloadSidecarFile).toHaveBeenNthCalledWith(1, {
      audioPath: '/Music/Lyra/track.mp3',
      kind: 'lyric',
      text: '[00:01.50]好一朵美丽的茉莉花\n',
    });
    expect(writeDownloadSidecarFile).toHaveBeenNthCalledWith(2, {
      audioPath: '/Music/Lyra/track.mp3',
      kind: 'translation',
      text: '[00:01.50]A beautiful jasmine flower\n',
    });
  });

  it('skips writing when getLyrics returns empty lines', async () => {
    vi.mocked(getMusicProviderForSong).mockReturnValue({
      getLyrics: async () => ({ lines: [] }),
    } as unknown as MusicProvider);

    await maybeWriteDownloadLyricSidecars(song, '/Music/Lyra/track.mp3');
    expect(writeDownloadSidecarFile).not.toHaveBeenCalled();
  });
});

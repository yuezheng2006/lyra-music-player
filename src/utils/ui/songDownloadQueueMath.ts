// src/utils/ui/songDownloadQueueMath.ts
// Pure helpers for download queue dedupe, filtering, and progress.

import { DEFAULT_DOWNLOAD_FOLDER_NAME } from './downloadDirectoryMath';

export type SongDownloadQueueProgress = {
  total: number;
  done: number;
  failed: number;
  pending: number;
  currentTitle: string | null;
  running: boolean;
};

export type SongDownloadEnqueueMathResult<T> = {
  accepted: T[];
  skippedDuplicate: number;
  skippedUnsupported: number;
};

export const createEmptySongDownloadQueueProgress = (): SongDownloadQueueProgress => ({
  total: 0,
  done: 0,
  failed: 0,
  pending: 0,
  currentTitle: null,
  running: false,
});

/** Stable queue key: provider + song id. */
export const buildSongDownloadDedupeKey = (song: {
  id?: string | number | null;
  musicProvider?: string | null;
}): string => {
  const provider = String(song.musicProvider || 'netease').trim().toLowerCase() || 'netease';
  const id = song.id == null ? '' : String(song.id);
  return `${provider}:${id}`;
};

/** Basename of a download root path (POSIX or Windows). */
export const downloadRootFolderNameFromPath = (
  dirPath: string | null | undefined,
  fallback = DEFAULT_DOWNLOAD_FOLDER_NAME,
): string => {
  const normalized = String(dirPath || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || fallback;
};

/** Filter + dedupe songs against an existing key set. */
export function planSongDownloadEnqueue<T extends { id?: string | number | null; musicProvider?: string | null; name?: string }>(
  songs: readonly T[],
  options: {
    existingKeys: ReadonlySet<string>;
    canDownload: (song: T) => boolean;
  },
): SongDownloadEnqueueMathResult<T> {
  const accepted: T[] = [];
  const seen = new Set(options.existingKeys);
  let skippedDuplicate = 0;
  let skippedUnsupported = 0;

  for (const song of songs) {
    if (!options.canDownload(song)) {
      skippedUnsupported += 1;
      continue;
    }
    const key = buildSongDownloadDedupeKey(song);
    if (!key.endsWith(':') && seen.has(key)) {
      skippedDuplicate += 1;
      continue;
    }
    if (key.endsWith(':')) {
      skippedUnsupported += 1;
      continue;
    }
    seen.add(key);
    accepted.push(song);
  }

  return { accepted, skippedDuplicate, skippedUnsupported };
}

/** HOV-shaped local client: two concurrent session downloads. */
export const SONG_DOWNLOAD_QUEUE_CONCURRENCY = 2;

/** One retry after a failed session download. */
export const SONG_DOWNLOAD_MAX_ATTEMPTS = 2;

/** Spawn at most `concurrency` workers, and never more than remaining items. */
export const resolveSongDownloadWorkerCount = (
  queueLength: number,
  concurrency = SONG_DOWNLOAD_QUEUE_CONCURRENCY,
): number => Math.min(Math.max(0, concurrency), Math.max(0, queueLength));

/** Items waiting plus in-flight session downloads. */
export const songDownloadPendingCount = (queueLength: number, inFlight: number): number =>
  Math.max(0, queueLength) + Math.max(0, inFlight);

export function applySongDownloadQueueItemResult(
  progress: SongDownloadQueueProgress,
  ok: boolean,
): SongDownloadQueueProgress {
  return {
    ...progress,
    done: progress.done + (ok ? 1 : 0),
    failed: progress.failed + (ok ? 0 : 1),
    pending: Math.max(0, progress.pending - 1),
  };
}

import type { SongResult } from '../types';
import { getLocalSongs } from './db';
import {
  listImportedLocalRootFolderNames,
  resyncFolder,
} from './localMusicService';
import {
  canDownloadSongToDirectory,
  downloadSongToUserDirectory,
} from './songDownloadService';
import { DEFAULT_DOWNLOAD_FOLDER_NAME } from '../utils/ui/downloadDirectoryMath';
import {
  applySongDownloadQueueItemResult,
  buildSongDownloadDedupeKey,
  createEmptySongDownloadQueueProgress,
  downloadRootFolderNameFromPath,
  planSongDownloadEnqueue,
  resolveSongDownloadWorkerCount,
  songDownloadPendingCount,
  SONG_DOWNLOAD_MAX_ATTEMPTS,
  type SongDownloadQueueProgress,
} from '../utils/ui/songDownloadQueueMath';

// src/services/songDownloadQueue.ts
// Concurrent download queue (2 workers) for saving playable online songs to the user download folder.

export type SongDownloadQueueListener = (progress: SongDownloadQueueProgress) => void;

type QueueItem = {
  dedupeKey: string;
  song: SongResult;
};

type EnqueueOptions = {
  audioQuality: string;
  onProgress?: SongDownloadQueueListener;
  /** When true (default), try resync of imported download root after a successful batch. */
  autoResyncDownloadFolder?: boolean;
};

type EnqueueResult = {
  accepted: number;
  skippedDuplicate: number;
  skippedUnsupported: number;
};

const queue: QueueItem[] = [];
const queuedKeys = new Set<string>();
let draining = false;
let progress = createEmptySongDownloadQueueProgress();
const listeners = new Set<SongDownloadQueueListener>();

const emit = () => {
  for (const listener of listeners) {
    listener(progress);
  }
};

const setProgress = (next: SongDownloadQueueProgress) => {
  progress = next;
  emit();
};

export const subscribeSongDownloadQueue = (listener: SongDownloadQueueListener): (() => void) => {
  listeners.add(listener);
  listener(progress);
  return () => {
    listeners.delete(listener);
  };
};

export const getSongDownloadQueueProgress = (): SongDownloadQueueProgress => progress;

/** Resolve download root folder name for local-library resync matching. */
export async function resolveDownloadRootFolderName(): Promise<string> {
  try {
    const result = await window.electron?.getDownloadDirectory?.();
    return downloadRootFolderNameFromPath(result?.path, DEFAULT_DOWNLOAD_FOLDER_NAME);
  } catch {
    return DEFAULT_DOWNLOAD_FOLDER_NAME;
  }
}

/** If the download root was already imported as a local library folder, resync it. */
export async function maybeResyncImportedDownloadFolder(): Promise<'synced' | 'not-imported' | 'skipped'> {
  if (typeof window === 'undefined' || !window.electron?.downloadSongFile) {
    return 'skipped';
  }
  const rootName = await resolveDownloadRootFolderName();
  const localSongs = await getLocalSongs();
  const roots = listImportedLocalRootFolderNames(localSongs);
  if (!roots.includes(rootName)) {
    return 'not-imported';
  }
  await resyncFolder(rootName);
  return 'synced';
}

async function downloadSongWithRetry(
  song: QueueItem['song'],
  audioQuality: string,
  reveal: boolean,
): Promise<boolean> {
  for (let attempt = 1; attempt <= SONG_DOWNLOAD_MAX_ATTEMPTS; attempt += 1) {
    const result = await downloadSongToUserDirectory(song, audioQuality, { reveal });
    if (result.ok) return true;
  }
  return false;
}

async function drainQueue(options: EnqueueOptions): Promise<void> {
  if (draining) return;
  draining = true;

  const batchSizeAtStart = queue.length;
  const revealEach = batchSizeAtStart <= 1;
  let successCount = 0;
  let inFlight = 0;
  let becameIdle = false;

  setProgress({
    ...progress,
    running: true,
    total: progress.done + progress.failed + queue.length,
    pending: songDownloadPendingCount(queue.length, inFlight),
  });

  const runWorker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      queuedKeys.delete(item.dedupeKey);
      inFlight += 1;
      setProgress({
        ...progress,
        currentTitle: item.song.name || null,
        pending: songDownloadPendingCount(queue.length, inFlight),
        running: true,
      });
      options.onProgress?.(progress);

      const ok = await downloadSongWithRetry(item.song, options.audioQuality, revealEach);
      if (ok) successCount += 1;
      inFlight -= 1;
      const counted = applySongDownloadQueueItemResult({
        ...progress,
        currentTitle: item.song.name || null,
        running: true,
      }, ok);
      setProgress({
        ...counted,
        currentTitle: item.song.name || null,
        pending: songDownloadPendingCount(queue.length, inFlight),
        running: true,
      });
      options.onProgress?.(progress);
    }
  };

  try {
    while (queue.length > 0) {
      const workerCount = resolveSongDownloadWorkerCount(queue.length);
      if (workerCount <= 0) break;
      await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
    }

    if (!revealEach && successCount > 0 && window.electron?.openDownloadDirectory) {
      try {
        await window.electron.openDownloadDirectory();
      } catch {
        // ignore reveal failures
      }
    }

    const shouldResync = options.autoResyncDownloadFolder !== false && successCount > 0;
    if (shouldResync) {
      try {
        await maybeResyncImportedDownloadFolder();
      } catch {
        // resync is best-effort
      }
    }

    becameIdle = queue.length === 0;
  } finally {
    if (becameIdle) {
      setProgress({
        ...progress,
        currentTitle: null,
        running: false,
        pending: 0,
      });
      options.onProgress?.(progress);
    }
    draining = false;
  }

  if (queue.length > 0) {
    void drainQueue(options);
  }
}

/** Enqueue one or more songs; starts concurrent drain if idle. */
export async function enqueueSongsForDownload(
  songs: SongResult | SongResult[] | null | undefined,
  options: EnqueueOptions,
): Promise<EnqueueResult> {
  const list = !songs ? [] : Array.isArray(songs) ? songs : [songs];
  const planned = planSongDownloadEnqueue(list, {
    existingKeys: queuedKeys,
    canDownload: canDownloadSongToDirectory,
  });

  for (const song of planned.accepted) {
    const dedupeKey = buildSongDownloadDedupeKey(song);
    queuedKeys.add(dedupeKey);
    queue.push({ dedupeKey, song });
  }

  if (planned.accepted.length > 0) {
    if (draining || progress.running) {
      setProgress({
        ...progress,
        total: progress.total + planned.accepted.length,
        pending: queue.length,
        running: true,
      });
    } else {
      setProgress({
        ...createEmptySongDownloadQueueProgress(),
        total: queue.length,
        pending: queue.length,
        running: true,
      });
    }
    options.onProgress?.(progress);
    void drainQueue(options);
  }

  return {
    accepted: planned.accepted.length,
    skippedDuplicate: planned.skippedDuplicate,
    skippedUnsupported: planned.skippedUnsupported,
  };
}

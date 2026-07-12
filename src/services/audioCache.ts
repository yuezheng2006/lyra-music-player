import { getFromCache, saveToCache } from './db';

interface ElectronAudioCacheEntry {
  found: boolean;
  data?: Uint8Array | ArrayBuffer;
  mimeType?: string | null;
}

const isElectronAudioCacheAvailable = () =>
  Boolean(
    window.electron &&
    typeof window.electron.getAudioCache === 'function' &&
    typeof window.electron.hasAudioCache === 'function' &&
    typeof window.electron.saveAudioCache === 'function'
  );

const toBlob = (entry: ElectronAudioCacheEntry): Blob | null => {
  if (!entry.found || !entry.data) {
    return null;
  }

  const mimeType = entry.mimeType || 'audio/mpeg';
  return new Blob([entry.data], { type: mimeType });
};

export async function getCachedAudioBlob(cacheKey: string): Promise<Blob | null> {
  if (isElectronAudioCacheAvailable()) {
    const electronEntry = await window.electron!.getAudioCache(cacheKey);
    const electronBlob = toBlob(electronEntry);
    if (electronBlob) {
      return electronBlob;
    }
    // Packaged Electron owns audio on disk. Do not fall through to IndexedDB —
    // under file:// (and while migrating to lyra://) IDB open can hang forever
    // and block playSong before any network audio fetch runs.
    return null;
  }

  return getFromCache<Blob>(cacheKey);
}

export async function hasCachedAudio(cacheKey: string): Promise<boolean> {
  if (isElectronAudioCacheAvailable()) {
    return window.electron!.hasAudioCache(cacheKey);
  }

  return Boolean(await getFromCache<Blob>(cacheKey));
}

export async function saveAudioBlob(cacheKey: string, blob: Blob): Promise<void> {
  if (isElectronAudioCacheAvailable()) {
    const buffer = await blob.arrayBuffer();
    await window.electron!.saveAudioCache(cacheKey, buffer, blob.type || 'audio/mpeg');
    return;
  }

  await saveToCache(cacheKey, blob);
}

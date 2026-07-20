import type { SongResult } from '../types';
import {
  isLocalPlaybackSong,
  isNavidromePlaybackSong,
  isStagePlaybackSong,
  isYtmPlaybackSong,
} from '../utils/appPlaybackGuards';
import {
  buildProviderDownloadRelativePath,
  guessAudioExtension,
} from '../utils/ui/downloadDirectoryMath';
import { getCachedAudioBlob } from './audioCache';
import {
  getMusicProviderForSong,
  getProviderSongCacheKey,
  getSongMusicProviderId,
} from './musicProviders/registry';

// src/services/songDownloadService.ts
// Save a playable online song into the user-visible download directory.

export type SongDownloadErrorCode =
  | 'electron-only'
  | 'no-song'
  | 'unsupported-source'
  | 'unavailable'
  | 'download-failed';

export type SongDownloadResult =
  | { ok: true; path: string; bytes?: number }
  | { ok: false; error: SongDownloadErrorCode; detail?: string };

const normalizeAudioUrl = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
};

const resolveSongArtists = (song: SongResult): string[] => {
  const fromAr = song.ar?.map(artist => artist.name).filter(Boolean) ?? [];
  if (fromAr.length > 0) return fromAr;
  return song.artists?.map(artist => artist.name).filter(Boolean) ?? [];
};

export const canDownloadSongToDirectory = (song: SongResult | null | undefined): boolean => {
  if (!song) return false;
  if (isLocalPlaybackSong(song)) return false;
  if (isNavidromePlaybackSong(song)) return false;
  if (isYtmPlaybackSong(song)) return false;
  if (isStagePlaybackSong(song)) return false;
  return Boolean(typeof window !== 'undefined' && window.electron?.downloadSongFile);
};

/** Download the song's current playable audio into ~/Music/Lyra (or custom dir). */
export async function downloadSongToUserDirectory(
  song: SongResult | null | undefined,
  audioQuality: string,
  options?: { reveal?: boolean },
): Promise<SongDownloadResult> {
  if (!song) {
    return { ok: false, error: 'no-song' };
  }

  if (!window.electron?.downloadSongFile) {
    return { ok: false, error: 'electron-only' };
  }

  if (!canDownloadSongToDirectory(song)) {
    return { ok: false, error: 'unsupported-source' };
  }

  const providerId = getSongMusicProviderId(song);
  const cacheKey = getProviderSongCacheKey('audio', song);
  const cachedBlob = await getCachedAudioBlob(cacheKey);

  let audioUrl: string | null = null;
  let mimeType: string | null = cachedBlob?.type || null;
  let data: ArrayBuffer | undefined;

  if (cachedBlob) {
    data = await cachedBlob.arrayBuffer();
    mimeType = cachedBlob.type || mimeType;
  } else {
    const audioResult = await getMusicProviderForSong(song).getAudioUrl(song, { quality: audioQuality });
    if (audioResult.kind !== 'ok') {
      return { ok: false, error: 'unavailable' };
    }
    audioUrl = normalizeAudioUrl(audioResult.audioUrl);
    if (!audioUrl) {
      return { ok: false, error: 'unavailable' };
    }
  }

  const extension = guessAudioExtension({
    mimeType,
    audioUrl,
    fallback: 'mp3',
  });

  const relativePath = buildProviderDownloadRelativePath({
    providerId,
    title: song.name,
    artists: resolveSongArtists(song),
    extension,
  });

  try {
    const result = await window.electron.downloadSongFile({
      relativePath,
      audioUrl: data ? undefined : audioUrl || undefined,
      data,
      mimeType,
      reveal: options?.reveal !== false,
    });

    if (!result?.ok || !result.path) {
      return {
        ok: false,
        error: 'download-failed',
        detail: result?.error || undefined,
      };
    }

    return {
      ok: true,
      path: result.path,
      bytes: result.bytes,
    };
  } catch (error) {
    return {
      ok: false,
      error: 'download-failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

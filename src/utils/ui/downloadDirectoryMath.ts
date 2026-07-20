// src/utils/ui/downloadDirectoryMath.ts
// Pure helpers for user-visible download paths (provider subdirs + readable names).

export const DEFAULT_DOWNLOAD_FOLDER_NAME = 'Lyra';

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

/** Strip characters that break Finder / Explorer paths. */
export const sanitizeDownloadFileName = (value: string, fallback = 'Untitled'): string => {
  const cleaned = String(value || '')
    .replace(INVALID_FILENAME_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 120);
  return cleaned || fallback;
};

export const formatDownloadArtists = (artists: string[] | string | undefined): string => {
  if (Array.isArray(artists)) {
    return artists.map(part => String(part || '').trim()).filter(Boolean).join(', ');
  }
  return String(artists || '').trim();
};

export const guessAudioExtension = (options: {
  mimeType?: string | null;
  audioUrl?: string | null;
  fallback?: string;
}): string => {
  const mime = String(options.mimeType || '').toLowerCase();
  if (mime.includes('flac')) return 'flac';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg') || mime.includes('opus')) return 'ogg';
  if (mime.includes('aac') || mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';

  const url = String(options.audioUrl || '').split('?')[0].toLowerCase();
  const match = url.match(/\.(flac|wav|ogg|opus|m4a|aac|mp3)$/);
  if (match?.[1] === 'opus') return 'ogg';
  if (match?.[1] === 'aac') return 'm4a';
  if (match?.[1]) return match[1];

  return options.fallback || 'mp3';
};

/** Relative path: `{provider}/{artists - title}.ext` under the user download root. */
export const buildProviderDownloadRelativePath = (options: {
  providerId: string;
  title?: string;
  artists?: string[] | string;
  extension: string;
}): string => {
  const provider = sanitizeDownloadFileName(options.providerId, 'unknown').toLowerCase();
  const title = sanitizeDownloadFileName(options.title || '', 'Untitled');
  const artists = sanitizeDownloadFileName(formatDownloadArtists(options.artists), 'Unknown Artist');
  const ext = String(options.extension || 'mp3').replace(/^\./, '').toLowerCase() || 'mp3';
  return `${provider}/${artists} - ${title}.${ext}`;
};

export const guessDownloadExtension = (options: {
  mimeType?: string | null;
  audioUrl?: string | null;
  fallback?: string;
}): string => {
  const mime = String(options.mimeType || '').toLowerCase();
  if (mime.includes('flac')) return 'flac';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('aac') || mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';

  const url = String(options.audioUrl || '');
  const match = url.match(/\.([a-z0-9]{2,5})(?:\?|#|$)/i);
  if (match?.[1]) {
    const ext = match[1].toLowerCase();
    if (['mp3', 'flac', 'm4a', 'aac', 'wav', 'ogg', 'opus'].includes(ext)) {
      return ext === 'aac' ? 'm4a' : ext;
    }
  }

  return options.fallback || 'mp3';
};

// scripts/music-provider-adapters/kugou-provider-adapter.mjs
// Kugou search / free-tier audio / LRC lyrics via public mobile endpoints.

const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const DEFAULT_HEADERS = {
  'User-Agent': MOBILE_UA,
  Referer: 'https://www.kugou.com/',
  Accept: 'application/json,text/plain,*/*',
};

const stripEm = (value) => String(value || '').replace(/<\/?em>/gi, '').trim();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchJson = async (url, timeoutMs = 8_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Kugou adapter request failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
};

const parseId = (rawId) => {
  const value = String(rawId || '');
  const [hash, albumId = ''] = value.split(':');
  return { hash: hash.trim(), albumId: albumId.trim() };
};

const encodeId = (hash, albumId) => {
  const safeHash = String(hash || '').trim();
  const safeAlbum = String(albumId || '').trim();
  return safeAlbum ? `${safeHash}:${safeAlbum}` : safeHash;
};

const normalizeCover = (image) => {
  if (typeof image !== 'string' || !image) return '';
  return image.replace('{size}', '240').replace('http://', 'https://');
};

const normalizeSong = (raw, index = 0) => {
  const hash = String(raw?.FileHash || raw?.hash || '').trim();
  const albumId = String(raw?.AlbumID || raw?.album_id || '').trim();
  const title = stripEm(raw?.SongName || raw?.songname || raw?.title || 'Unknown');
  const artist = stripEm(raw?.SingerName || raw?.singername || raw?.author_name || '');
  const artists = artist
    ? artist.split(/[、,\/]/).map(part => part.trim()).filter(Boolean)
    : [];
  const durationSec = Number(raw?.Duration || raw?.duration || 0);
  return {
    id: encodeId(hash || `kugou-${index}`, albumId),
    title,
    artists,
    album: stripEm(raw?.AlbumName || raw?.album_name || ''),
    durationMs: Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : 0,
    coverUrl: normalizeCover(raw?.Image || raw?.imgUrl || raw?.album_img),
    source: 'kugou',
    hash,
    albumId,
  };
};

export async function search({ query, limit = 30, offset = 0 }) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { songs: [], total: 0, hasMore: false };
  }

  const pageSize = Math.min(Math.max(Number(limit) || 30, 1), 50);
  const page = Math.floor(Math.max(Number(offset) || 0, 0) / pageSize) + 1;
  const url = new URL('https://songsearch.kugou.com/song_search_v2');
  url.searchParams.set('keyword', trimmed);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pagesize', String(pageSize));
  url.searchParams.set('platform', 'WebFilter');
  url.searchParams.set('format', 'json');
  url.searchParams.set('filter', '2');
  url.searchParams.set('iscorrection', '1');

  const payload = await fetchJson(url);
  const rows = Array.isArray(payload?.data?.lists) ? payload.data.lists : [];
  const songs = rows
    .map((row, index) => normalizeSong(row, index))
    .filter(song => song.hash);
  const total = Number(payload?.data?.total || songs.length);

  return {
    songs,
    total,
    hasMore: page * pageSize < total,
  };
}

export async function audio({ id, song }) {
  const fromSong = String(song?.providerSongId || song?.id || id || '');
  const { hash } = parseId(fromSong);
  if (!hash) {
    return { audioUrl: null };
  }

  // Free-tier mobile playInfo. VIP / privilege tracks often return an empty url.
  const url = `https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${encodeURIComponent(hash)}`;
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const payload = await fetchJson(url);
      const audioUrl = typeof payload?.url === 'string' ? payload.url.trim() : '';
      if (!audioUrl) {
        return { audioUrl: null };
      }
      return {
        audioUrl: audioUrl.replace('http://', 'https://'),
        bitrate: payload?.bitRate || payload?.bitrate || undefined,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(200);
    }
  }
  throw lastError || new Error('Kugou audio lookup failed');
}

export async function lyrics({ id, song, title, artist }) {
  const fromSong = String(song?.providerSongId || song?.id || id || '');
  const { hash } = parseId(fromSong);
  const songTitle = String(title || song?.title || song?.name || '').trim();
  const durationMs = Number(song?.durationMs || song?.duration || song?.dt || 0);

  const keyword = [songTitle, artist || song?.artist || ''].filter(Boolean).join(' ').trim()
    || songTitle
    || hash;
  if (!keyword && !hash) {
    return { lyrics: null };
  }

  const searchUrl = new URL('https://lyrics.kugou.com/search');
  searchUrl.searchParams.set('ver', '1');
  searchUrl.searchParams.set('man', 'yes');
  searchUrl.searchParams.set('client', 'pc');
  searchUrl.searchParams.set('keyword', keyword);
  if (durationMs > 0) searchUrl.searchParams.set('duration', String(Math.round(durationMs)));
  if (hash) searchUrl.searchParams.set('hash', hash);

  const searchPayload = await fetchJson(searchUrl);
  const candidate = Array.isArray(searchPayload?.candidates) ? searchPayload.candidates[0] : null;
  if (!candidate?.id || !candidate?.accesskey) {
    return { lyrics: null };
  }

  const downloadUrl = new URL('https://lyrics.kugou.com/download');
  downloadUrl.searchParams.set('ver', '1');
  downloadUrl.searchParams.set('client', 'pc');
  downloadUrl.searchParams.set('id', String(candidate.id));
  downloadUrl.searchParams.set('accesskey', String(candidate.accesskey));
  downloadUrl.searchParams.set('fmt', 'lrc');
  downloadUrl.searchParams.set('charset', 'utf8');

  const downloadPayload = await fetchJson(downloadUrl);
  const encoded = downloadPayload?.content;
  if (typeof encoded !== 'string' || !encoded) {
    return { lyrics: null };
  }

  try {
    const lyricsText = Buffer.from(encoded, 'base64').toString('utf8').trim();
    return lyricsText ? { lyricsText, lyrics: lyricsText } : { lyrics: null };
  } catch {
    return { lyrics: null };
  }
}

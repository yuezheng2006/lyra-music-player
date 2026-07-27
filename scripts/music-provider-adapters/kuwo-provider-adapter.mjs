// scripts/music-provider-adapters/kuwo-provider-adapter.mjs
// Kuwo search / free-tier audio / timed lyrics via public mobile endpoints.

const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const DEFAULT_HEADERS = {
  'User-Agent': MOBILE_UA,
  Referer: 'https://www.kuwo.cn/',
  Accept: 'application/json,text/plain,*/*',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeHttps = (url) => {
  if (typeof url !== 'string' || !url) return '';
  return url.replace(/^http:\/\//i, 'https://').trim();
};

const stripMusicPrefix = (rawId) => {
  const value = String(rawId || '').trim();
  return value.replace(/^MUSIC_/i, '');
};

const encodeId = (mid) => {
  const id = stripMusicPrefix(mid);
  return id || '';
};

const fetchText = async (url, timeoutMs = 8_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Kuwo adapter request failed: ${response.status}`);
    }
    return response.text();
  } finally {
    clearTimeout(timer);
  }
};

const fetchJson = async (url, timeoutMs = 8_000) => {
  const text = await fetchText(url, timeoutMs);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Kuwo adapter returned invalid JSON');
  }
};

/** Build cover URL from rid via Kuwo pic server (returns plain URL text). */
const resolveCoverUrl = async (mid) => {
  const id = encodeId(mid);
  if (!id) return '';
  try {
    const url = `https://artistpicserver.kuwo.cn/pic.web?type=rid_pic&pictype=url&size=300&rid=${encodeURIComponent(id)}`;
    const text = (await fetchText(url, 5_000)).trim();
    if (text.startsWith('http')) {
      return normalizeHttps(text);
    }
  } catch {
    // Cover is optional.
  }
  return '';
};

const normalizeSong = (raw, index = 0) => {
  const mid = encodeId(raw?.MUSICRID || raw?.DC_TARGETID || raw?.rid || `kuwo-${index}`);
  const title = String(raw?.SONGNAME || raw?.NAME || raw?.name || 'Unknown').trim();
  const artist = String(raw?.ARTIST || raw?.AARTIST || raw?.artist || '').trim();
  const artists = artist
    ? artist.split(/[、,&\/]/).map(part => part.trim()).filter(Boolean)
    : [];
  const durationSec = Number(raw?.DURATION || raw?.duration || 0);
  return {
    id: mid || `kuwo-${index}`,
    title,
    artists,
    album: String(raw?.ALBUM || raw?.album || '').trim(),
    durationMs: Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : 0,
    coverUrl: '',
    source: 'kuwo',
    mid,
  };
};

export async function search({ query, limit = 30, offset = 0 }) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { songs: [], total: 0, hasMore: false };
  }

  const pageSize = Math.min(Math.max(Number(limit) || 30, 1), 50);
  const page = Math.floor(Math.max(Number(offset) || 0, 0) / pageSize);
  const url = new URL('https://search.kuwo.cn/r.s');
  url.searchParams.set('client', 'kt');
  url.searchParams.set('all', trimmed);
  url.searchParams.set('pn', String(page));
  url.searchParams.set('rn', String(pageSize));
  url.searchParams.set('uid', '794762570');
  url.searchParams.set('ver', 'kwplayer_ar_9.2.2.1');
  url.searchParams.set('vipver', '1');
  url.searchParams.set('show_copyright_off', '1');
  url.searchParams.set('newver', '1');
  url.searchParams.set('ft', 'music');
  url.searchParams.set('cluster', '0');
  url.searchParams.set('strategy', '2012');
  url.searchParams.set('encoding', 'utf8');
  url.searchParams.set('rformat', 'json');
  url.searchParams.set('vermerge', '1');
  url.searchParams.set('mobi', '1');
  url.searchParams.set('issubtitle', '1');

  const payload = await fetchJson(url);
  const rows = Array.isArray(payload?.abslist) ? payload.abslist : [];
  const songs = rows
    .map((row, index) => normalizeSong(row, index))
    .filter(song => Boolean(song.mid));

  // Resolve covers for the first page of hits (best-effort, capped).
  const coverBudget = Math.min(songs.length, 12);
  await Promise.all(songs.slice(0, coverBudget).map(async (song) => {
    song.coverUrl = await resolveCoverUrl(song.id);
  }));

  const total = Number(payload?.TOTAL || payload?.HIT || songs.length) || songs.length;
  return {
    songs,
    total,
    hasMore: (page + 1) * pageSize < total,
  };
}

export async function audio({ id, song }) {
  const mid = encodeId(song?.providerSongId || song?.id || id);
  if (!mid) {
    return { audioUrl: null };
  }

  // Free-tier anti.s convert. VIP / privilege tracks often return empty.
  const url = `https://antiserver.kuwo.cn/anti.s?type=convert_url3&rid=${encodeURIComponent(mid)}&format=mp3&response=url&br=128kmp3`;
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const payload = await fetchJson(url);
      const audioUrl = normalizeHttps(
        typeof payload?.url === 'string'
          ? payload.url
          : (typeof payload === 'string' ? payload : ''),
      );
      if (!audioUrl) {
        return { audioUrl: null };
      }
      return { audioUrl };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(200);
    }
  }
  throw lastError || new Error('Kuwo audio lookup failed');
}

/** Convert Kuwo lrclist JSON into standard LRC text. */
const lrclistToLrc = (lrclist) => {
  if (!Array.isArray(lrclist) || lrclist.length === 0) return '';
  const lines = [];
  for (const row of lrclist) {
    const text = String(row?.lineLyric || row?.line_lyric || '').trim();
    if (!text) continue;
    const sec = Number(row?.time ?? row?.Time ?? NaN);
    if (!Number.isFinite(sec)) {
      lines.push(text);
      continue;
    }
    const totalCs = Math.max(0, Math.round(sec * 100));
    const mm = Math.floor(totalCs / 6000);
    const ss = Math.floor((totalCs % 6000) / 100);
    const cs = totalCs % 100;
    lines.push(`[${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cs).padStart(2, '0')}]${text}`);
  }
  return lines.join('\n').trim();
};

export async function lyrics({ id, song }) {
  const mid = encodeId(song?.providerSongId || song?.id || id);
  if (!mid) {
    return { lyrics: null };
  }

  const url = `https://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${encodeURIComponent(mid)}`;
  try {
    const payload = await fetchJson(url);
    const lrc = lrclistToLrc(payload?.data?.lrclist);
    return lrc ? { lyricsText: lrc, lyrics: lrc } : { lyrics: null };
  } catch {
    return { lyrics: null };
  }
}

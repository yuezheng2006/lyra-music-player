// scripts/music-provider-adapters/coco-provider-adapter.mjs
// Free guest keyword search + audio resolve for the Coco peer channel.

const SEARCH_API = process.env.MUSIC_PROVIDER_COCO_SEARCH_API
  || 'https://music-api.gdstudio.xyz/api.php';

// Upstream often returns HTTP 200 with an empty array for some source/count pairs.
// Prefer sources that can both search and resolve playable URLs.
const SEARCH_SOURCES = String(process.env.MUSIC_PROVIDER_COCO_SEARCH_SOURCES || 'netease,joox,kuwo')
  .split(',')
  .map(part => part.trim())
  .filter(Boolean);

const AUDIO_SOURCES = String(process.env.MUSIC_PROVIDER_COCO_AUDIO_SOURCES || 'netease,joox,kuwo')
  .split(',')
  .map(part => part.trim())
  .filter(Boolean);

const SEARCH_COUNT_CANDIDATES = [20, 25, 30, 16, 10, 50];
const SEARCH_ATTEMPTS_PER_SOURCE = 2;
const AUDIO_BITRATES = ['320', '192', '128'];
// Resolve covers for the first page only so search stays fast.
const COVER_RESOLVE_LIMIT = 16;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const flattenArtistNames = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    return value.split(/[\/,、]/).map(part => part.trim()).filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => flattenArtistNames(item));
  }
  if (typeof value === 'object' && typeof value.name === 'string') {
    return [value.name.trim()].filter(Boolean);
  }
  return [];
};

const fetchJson = async (url, timeoutMs = 4_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Auralis/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Coco adapter request failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
};

const pickSearchCounts = (limit) => {
  const desired = Math.min(Math.max(Number(limit) || 30, 1), 50);
  const ordered = [desired, ...SEARCH_COUNT_CANDIDATES.filter(count => count !== desired)];
  return [...new Set(ordered)];
};

const extractSearchRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.songs)) return payload.songs;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

// Resolve cover only when needed for playback UI; never block search on pic lookups.
const resolveCoverUrl = async (raw, source) => {
  const direct = raw?.pic || raw?.cover || raw?.al?.picUrl || raw?.picUrl;
  if (typeof direct === 'string' && /^https?:\/\//i.test(direct)) {
    return direct;
  }

  const picId = raw?.pic_id || raw?.picId;
  if (!picId) {
    return '';
  }

  try {
    const url = new URL(SEARCH_API);
    url.searchParams.set('types', 'pic');
    url.searchParams.set('source', source);
    url.searchParams.set('id', String(picId));
    const payload = await fetchJson(url);
    const coverUrl = payload?.url || payload?.pic || payload?.data?.url || '';
    return typeof coverUrl === 'string' ? coverUrl : '';
  } catch {
    return '';
  }
};

const normalizeSong = (raw, index = 0, coverUrl = '') => {
  const source = raw?.source || 'netease';
  const id = String(raw?.id || raw?.songid || raw?.mid || raw?.url_id || `coco-${index}`);
  const title = raw?.name || raw?.title || raw?.song || 'Unknown';
  const artists = flattenArtistNames(raw?.artist || raw?.artists || raw?.author || raw?.singer);
  const album = typeof raw?.album === 'string' ? raw.album : (raw?.album?.name || '');
  const durationMs = Number(raw?.duration || raw?.dt || 0);
  const picId = raw?.pic_id || raw?.picId;

  return {
    id,
    title,
    artists,
    album,
    durationMs: Number.isFinite(durationMs) ? durationMs : 0,
    coverUrl: coverUrl || (typeof raw?.pic === 'string' ? raw.pic : '') || (typeof raw?.cover === 'string' ? raw.cover : ''),
    picId: picId ? String(picId) : undefined,
    source,
  };
};

const requestSearchPage = async ({ query, source, count, page }) => {
  const url = new URL(SEARCH_API);
  url.searchParams.set('types', 'search');
  url.searchParams.set('source', source);
  url.searchParams.set('name', query);
  url.searchParams.set('count', String(count));
  url.searchParams.set('pages', String(page));
  const payload = await fetchJson(url);
  return extractSearchRows(payload);
};

export async function search({ query, limit = 30, offset = 0 }) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { songs: [], total: 0, hasMore: false };
  }

  const page = Math.floor(offset / Math.max(limit, 1)) + 1;
  const countCandidates = pickSearchCounts(limit);
  const sources = SEARCH_SOURCES.length > 0 ? SEARCH_SOURCES : ['netease', 'joox', 'kuwo'];
  let lastError = null;

  for (const source of sources) {
    for (const count of countCandidates) {
      for (let attempt = 1; attempt <= SEARCH_ATTEMPTS_PER_SOURCE; attempt += 1) {
        try {
          const rows = await requestSearchPage({
            query: trimmed,
            source,
            count,
            page,
          });
          if (rows.length === 0) {
            if (attempt < SEARCH_ATTEMPTS_PER_SOURCE) {
              await sleep(120 * attempt);
            }
            continue;
          }

          const sliced = rows.slice(0, Math.max(limit, 1));
          const songs = await Promise.all(sliced.map(async (row, index) => {
            const base = normalizeSong({ ...row, source: row?.source || source }, index);
            if (index >= COVER_RESOLVE_LIMIT || base.coverUrl || !base.picId) {
              return base;
            }
            const coverUrl = await resolveCoverUrl(row, base.source);
            return coverUrl ? { ...base, coverUrl } : base;
          }));
          return {
            songs,
            total: songs.length + offset,
            hasMore: songs.length >= limit,
          };
        } catch (error) {
          lastError = error;
          if (attempt < SEARCH_ATTEMPTS_PER_SOURCE) {
            await sleep(120 * attempt);
          }
        }
      }
    }
  }

  if (lastError) {
    console.warn('[coco-adapter] search failed:', lastError instanceof Error ? lastError.message : lastError);
  } else {
    console.warn('[coco-adapter] search returned empty across sources:', sources.join(','));
  }
  return { songs: [], total: 0, hasMore: false };
}

const requestAudioUrl = async (source, songId, br) => {
  const url = new URL(SEARCH_API);
  url.searchParams.set('types', 'url');
  url.searchParams.set('source', source);
  url.searchParams.set('id', songId);
  url.searchParams.set('br', br);
  const payload = await fetchJson(url);
  const audioUrl = payload?.url || payload?.data?.url || payload?.music_url || null;
  return typeof audioUrl === 'string' && audioUrl ? audioUrl : null;
};

const resolveAudioByTitle = async (song) => {
  const title = String(song?.name || song?.title || '').trim();
  if (!title) return null;

  for (const source of AUDIO_SOURCES) {
    try {
      const rows = await requestSearchPage({
        query: title,
        source,
        count: 5,
        page: 1,
      });
      for (const row of rows) {
        const candidateId = String(row?.id || row?.songid || row?.url_id || '').trim();
        if (!candidateId) continue;
        for (const br of AUDIO_BITRATES) {
          const audioUrl = await requestAudioUrl(source, candidateId, br);
          if (audioUrl) return audioUrl;
        }
      }
    } catch {
      // try next source
    }
  }
  return null;
};

export async function audio({ id, song }) {
  const songId = String(song?.providerSongId || song?.id || id || '').trim();
  const preferredSource = song?.providerCatalogSource || song?.source || 'netease';
  if (!songId) {
    return { audioUrl: null };
  }

  const sources = [preferredSource, ...AUDIO_SOURCES.filter(source => source !== preferredSource)];

  try {
    for (const source of sources) {
      for (const br of AUDIO_BITRATES) {
        try {
          const audioUrl = await requestAudioUrl(source, songId, br);
          if (audioUrl) {
            return { audioUrl };
          }
        } catch {
          // try next bitrate / source
        }
      }
    }

    const fallbackUrl = await resolveAudioByTitle(song);
    return { audioUrl: fallbackUrl };
  } catch (error) {
    console.warn('[coco-adapter] audio failed:', error instanceof Error ? error.message : error);
    return { audioUrl: null };
  }
}

export async function lyrics({ id, song }) {
  const songId = String(song?.providerSongId || song?.id || id || '').trim();
  const source = song?.providerCatalogSource || song?.source || 'netease';
  if (!songId) {
    return { lyrics: null };
  }

  try {
    const url = new URL(SEARCH_API);
    url.searchParams.set('types', 'lyric');
    url.searchParams.set('source', source);
    url.searchParams.set('id', songId);
    const payload = await fetchJson(url);
    const lyricsText = payload?.lyric || payload?.lrc || payload?.data?.lyric || '';
    return lyricsText ? { lyricsText } : { lyrics: null };
  } catch (error) {
    console.warn('[coco-adapter] lyrics failed:', error instanceof Error ? error.message : error);
    return { lyrics: null };
  }
}

export async function resolveSongCover(song) {
  if (!song) return '';
  if (typeof song.coverUrl === 'string' && song.coverUrl) return song.coverUrl;
  return resolveCoverUrl(song, song.source || 'netease');
}

const COCO_DAILY_QUERIES = ['晴天', '起风了', '海阔天空', '夜曲', '告白气球', '稻香', '演员'];

const pickCocoDailyQuery = () => {
  const now = new Date();
  const seed = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate() + 3;
  return COCO_DAILY_QUERIES[seed % COCO_DAILY_QUERIES.length];
};

/** Fast day picks: one source, no cover fan-out (daily page must stay snappy). */
export async function recommend({ limit = 8 } = {}) {
  const query = pickCocoDailyQuery();
  const capped = Math.max(1, Math.min(Number(limit) || 8, 12));
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { songs: [], total: 0, hasMore: false, kind: 'picks', query };
  }

  const preferredSources = SEARCH_SOURCES.length > 0 ? SEARCH_SOURCES.slice(0, 2) : ['netease'];
  for (const source of preferredSources) {
    try {
      const rows = await requestSearchPage({
        query: trimmed,
        source,
        count: Math.max(capped, 10),
        page: 1,
      });
      if (!rows.length) continue;
      const songs = rows.slice(0, capped).map((row, index) =>
        normalizeSong({ ...row, source: row?.source || source }, index),
      );
      return { songs, total: songs.length, hasMore: false, kind: 'picks', query };
    } catch (error) {
      console.warn('[coco-adapter] recommend source failed:', source, error instanceof Error ? error.message : error);
    }
  }

  return { songs: [], total: 0, hasMore: false, kind: 'picks', query };
}

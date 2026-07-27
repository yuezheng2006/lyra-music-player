// scripts/music-provider-adapters/qishui-provider-adapter.mjs
// Keyword search + audition playback for Qishui (Soda), following musicdl's LunaPC path.
// Cookie / track_v2 / play_auth decrypt are intentionally out of scope for this first cut.

import { fetchWithProxyFallback } from './fetchWithProxyFallback.mjs';

const DEVICE_ID = process.env.MUSIC_PROVIDER_QISHUI_DEVICE_ID || '3753066532709850';
const INSTALL_ID = process.env.MUSIC_PROVIDER_QISHUI_IID || '3753066532713946';
const LUNA_UA = 'LunaPC/3.5.1(408871041)';
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const QISHUI_SHARE_URL_RE = /^https?:\/\/qishui\.douyin\.com\/s\/[A-Za-z0-9]+/i;
const BUGPK_API = process.env.MUSIC_PROVIDER_QISHUI_API_BASE || 'https://api.bugpk.com/api/qsmusic';

const buildLunaQuery = (extra = {}) => {
  const params = new URLSearchParams({
    aid: '386088',
    app_name: 'luna_pc',
    region: 'cn',
    geo_region: 'cn',
    os_region: 'cn',
    sim_region: '',
    device_id: DEVICE_ID,
    cdid: '',
    iid: INSTALL_ID,
    version_name: '3.5.1',
    version_code: '30050100',
    channel: 'official',
    build_mode: 'master',
    network_carrier: '',
    ac: 'wifi',
    tz_name: 'Asia/Shanghai',
    resolution: '',
    device_platform: 'windows',
    device_type: 'Windows',
    os_version: 'Windows 10 Education',
    fp: DEVICE_ID,
    ...extra,
  });
  return params;
};

const isQishuiShareUrl = (value) =>
  typeof value === 'string' && QISHUI_SHARE_URL_RE.test(value.trim());

const unescapeAudioUrl = (value) => String(value || '')
  .replace(/\\u002F/g, '/')
  .replace(/%7C/gi, '|')
  .replace(/%3D/gi, '=');

const flattenArtistNames = (artists) => {
  if (!Array.isArray(artists)) return [];
  return artists
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .map((name) => String(name || '').trim())
    .filter(Boolean);
};

const buildCoverUrl = (track) => {
  const cover = track?.album?.url_cover;
  if (!cover || typeof cover !== 'object') return '';
  const host = Array.isArray(cover.urls) ? cover.urls[0] : '';
  const uri = cover.uri || '';
  if (host && uri) return `${host}${uri}~c5_500x500.jpg`;
  if (typeof cover.url === 'string') return cover.url;
  return '';
};

const normalizeTrackSong = (track) => {
  const id = String(track?.id || '').trim();
  if (!id) return null;
  const durationRaw = Number(track?.duration || 0);
  // Official search returns ms; share-page meta may already be seconds.
  const durationMs = durationRaw > 10000 ? durationRaw : durationRaw * 1000;
  return {
    id,
    title: track?.name || 'Qishui Music',
    artists: flattenArtistNames(track?.artists),
    album: track?.album?.name || '',
    durationMs: Number.isFinite(durationMs) ? durationMs : 0,
    coverUrl: buildCoverUrl(track),
  };
};

const extractSearchTracks = (payload) => {
  const groups = Array.isArray(payload?.result_groups) ? payload.result_groups : [];
  const trackGroup = groups.find((group) => group?.id === 'tracks') || groups[0];
  const rows = Array.isArray(trackGroup?.data) ? trackGroup.data : [];
  return rows
    .map((row) => normalizeTrackSong(row?.entity?.track))
    .filter(Boolean);
};

const extractSearchPlaylists = (payload) => {
  const groups = Array.isArray(payload?.result_groups) ? payload.result_groups : [];
  const playlistGroup = groups.find((group) => group?.id === 'playlists') || groups[0];
  const rows = Array.isArray(playlistGroup?.data) ? playlistGroup.data : [];
  return rows
    .map((row) => {
      const playlist = row?.entity?.playlist || row?.entity || {};
      const id = String(playlist?.id || '').trim();
      if (!id) return null;
      return {
        id,
        title: playlist?.title || playlist?.name || '',
        trackCount: Number(playlist?.count_tracks || 0),
      };
    })
    .filter(Boolean);
};

const extractPlaylistTracks = (payload) => {
  const rows = Array.isArray(payload?.media_resources) ? payload.media_resources : [];
  return rows
    .map((row) => normalizeTrackSong(
      row?.entity?.track_wrapper?.track
      || row?.entity?.track
      || row?.entity?.track_wrapper,
    ))
    .filter(Boolean);
};

/**
 * Detect Qishui search intent: `cat:分类` searches playlists; default is track search.
 */
export const parseQishuiSearchIntent = (rawQuery) => {
  const trimmed = String(rawQuery || '').trim();
  if (!trimmed) return { mode: 'track', query: '' };

  const categoryMatch = /^(?:cat:|分类:)\s*(.+)$/i.exec(trimmed);
  if (categoryMatch) {
    return { mode: 'category', query: categoryMatch[1].trim() };
  }

  const songMatch = /^(?:song:|歌曲:)\s*(.+)$/i.exec(trimmed);
  if (songMatch) {
    return { mode: 'track', query: songMatch[1].trim() };
  }

  return { mode: 'track', query: trimmed };
};

const normalizeSearchName = (value) => String(value || '').trim().toLowerCase();

const isTagCategoryQuery = (query) => /^ai/i.test(String(query || '').trim());

const matchesCategoryArtist = (artists, artistName) => {
  const needle = normalizeSearchName(artistName);
  if (!needle) return true;
  return (Array.isArray(artists) ? artists : []).some((name) => {
    const normalized = normalizeSearchName(name);
    return normalized === needle || normalized.includes(needle) || needle.includes(normalized);
  });
};

/** Prefer focused playlists over mixed-artist collections. */
const scoreCategoryPlaylist = (query, playlist) => {
  const q = normalizeSearchName(query);
  const title = normalizeSearchName(playlist?.title);
  if (!q || !title) return 0;

  let score = 0;
  if (title === q) score += 100;
  if (title.includes(q)) score += 40;
  if (title.startsWith(q)) score += 20;
  if (title.includes('全部歌曲')) score += 25;
  if (title.includes('经典')) score += 15;
  if (title.includes('精选')) score += 10;
  if (/[+,&/|、]/.test(title)) score -= 35;
  if ((title.match(/[\u4e00-\u9fff]{2,}/g) || []).filter((word) => word !== q).length > 2) {
    score -= 10;
  }
  return score;
};

const pickBestCategoryPlaylist = (query, playlists) => {
  if (!Array.isArray(playlists) || playlists.length === 0) return null;
  return [...playlists].sort(
    (left, right) => scoreCategoryPlaylist(query, right) - scoreCategoryPlaylist(query, left),
  )[0];
};

const extractSearchArtists = (payload) => {
  const groups = Array.isArray(payload?.result_groups) ? payload.result_groups : [];
  const artistGroup = groups.find((group) => group?.id === 'artists') || groups[0];
  const rows = Array.isArray(artistGroup?.data) ? artistGroup.data : [];
  return rows
    .map((row) => {
      const artist = row?.entity?.artist || row?.entity || {};
      const id = String(artist?.id || '').trim();
      if (!id) return null;
      return {
        id,
        name: artist?.name || '',
        trackCount: Number(artist?.count_tracks || 0),
      };
    })
    .filter(Boolean);
};

const searchExactArtist = async (query) => {
  const params = buildLunaQuery({
    q: query,
    cursor: '0',
    search_id: crypto.randomUUID?.() || `${Date.now()}`,
    search_method: 'input',
    debug_params: '',
    from_search_id: '',
    search_scene: '',
  });
  const payload = await fetchJson(
    `https://api.qishui.com/luna/pc/search/artist?${params.toString()}`,
    {
      'User-Agent': LUNA_UA,
      'Content-Type': 'application/json; charset=utf-8',
    },
  );
  const needle = normalizeSearchName(query);
  return extractSearchArtists(payload).find(
    (artist) => normalizeSearchName(artist.name) === needle,
  ) || null;
};

const fetchPlaylistTrackPage = async (playlistId, cursor, pageSize) => {
  const detailParams = new URLSearchParams({
    playlist_id: playlistId,
    cursor: String(Math.max(0, Number(cursor) || 0)),
    cnt: String(Math.max(1, Math.min(Number(pageSize) || 30, 50))),
    aid: '386088',
    device_platform: 'web',
    channel: 'pc_web',
  });
  return fetchJson(
    `https://api.qishui.com/luna/pc/playlist/detail?${detailParams.toString()}`,
    {
      'User-Agent': LUNA_UA,
      'Content-Type': 'application/json; charset=utf-8',
    },
  );
};

const collectFilteredPlaylistTracks = async (playlist, { artistName, limit, offset }) => {
  const pageSize = Math.max(1, Math.min(Number(limit) || 30, 50));
  const startOffset = Math.max(0, Number(offset) || 0);
  const batchSize = artistName ? Math.min(50, pageSize * 4) : pageSize;
  const filtered = [];
  let playlistCursor = 0;
  let totalTracks = Number(playlist?.trackCount || 0);
  let reachedEnd = false;

  while (filtered.length < startOffset + pageSize && !reachedEnd) {
    const detailPayload = await fetchPlaylistTrackPage(playlist.id, playlistCursor, batchSize);
    totalTracks = Number(detailPayload?.playlist?.count_tracks || totalTracks || 0);
    const batch = extractPlaylistTracks(detailPayload);
    if (batch.length === 0) {
      reachedEnd = true;
      break;
    }

    const accepted = artistName
      ? batch.filter((song) => matchesCategoryArtist(song.artists, artistName))
      : batch;
    filtered.push(...accepted);
    playlistCursor += batch.length;
    if (batch.length < batchSize || playlistCursor >= totalTracks) {
      reachedEnd = true;
    }
  }

  return {
    songs: filtered.slice(startOffset, startOffset + pageSize),
    total: filtered.length,
    hasMore: !reachedEnd || filtered.length > startOffset + pageSize,
  };
};

const fetchJson = async (url, headers = {}) => {
  const response = await fetchWithProxyFallback(url, { headers });
  if (!response.ok) {
    throw new Error(`Qishui request failed: ${response.status}`);
  }
  return response.json();
};

const fetchText = async (url, headers = {}) => {
  const response = await fetchWithProxyFallback(url, { headers });
  if (!response.ok) {
    throw new Error(`Qishui request failed: ${response.status}`);
  }
  return response.text();
};

// Parse share-page SSR payload the same way musicdl does for non-VIP audition.
const parseShareTrackPage = async (trackId) => {
  const html = await fetchText(
    `https://music.douyin.com/qishui/share/track?track_id=${encodeURIComponent(trackId)}`,
    {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml',
    },
  );
  const match = html.match(/_ROUTER_DATA\s*=\s*(\{.*?\});/s);
  if (!match) {
    throw new Error('Qishui share page missing _ROUTER_DATA');
  }
  const data = JSON.parse(match[1]);
  const trackPage = data?.loaderData?.track_page || {};
  const option = trackPage?.audioWithLyricsOption || {};
  const trackInfo = option?.trackInfo || {};
  const audioUrl = unescapeAudioUrl(option?.url || '');
  const sentences = option?.lyrics?.sentences;
  let lyricsText = '';
  if (Array.isArray(sentences)) {
    lyricsText = sentences
      .map((line) => {
        const startMs = Number(line?.startMs ?? line?.start_time_ms ?? line?.startTimeMs ?? 0);
        const text = String(line?.text || line?.content || '').trim();
        if (!text) return '';
        const totalSec = Math.max(0, startMs) / 1000;
        const minutes = Math.floor(totalSec / 60);
        const seconds = (totalSec % 60).toFixed(2).padStart(5, '0');
        return `[${String(minutes).padStart(2, '0')}:${seconds}]${text}`;
      })
      .filter(Boolean)
      .join('\n');
  }
  return {
    track: trackInfo,
    audioUrl,
    lyricsText,
  };
};

const parseShareShortLinkViaBugpk = async (shareUrl) => {
  const requestUrl = new URL(BUGPK_API);
  requestUrl.searchParams.set('url', shareUrl.trim());
  const data = await fetchJson(requestUrl, {
    'User-Agent': 'Lyra/1.0',
    Referer: 'https://www.baidu.com/',
  });
  const raw = data?.data && typeof data.data === 'object' ? data.data : data;
  const audioUrl = raw?.url || raw?.music_url || raw?.play_url || '';
  if (!audioUrl) return null;
  const artist = raw?.artistsname || raw?.artist || raw?.author || '';
  return {
    id: shareUrl.trim(),
    title: raw?.albumname || raw?.name || raw?.title || 'Qishui Music',
    artists: artist ? [artist] : [],
    album: raw?.albumname || '',
    coverUrl: Array.isArray(raw?.artistsmedium_avatar_url)
      ? raw.artistsmedium_avatar_url[0]
      : (raw?.cover || raw?.pic || ''),
    audioUrl,
    lyricsText: raw?.lyrics || raw?.lyric || '',
  };
};

const searchOfficialTracks = async (query, limit = 30, offset = 0) => {
  const cursor = Math.max(0, Number(offset) || 0);
  const params = buildLunaQuery({
    q: query,
    cursor: String(cursor),
    search_id: crypto.randomUUID?.() || `${Date.now()}`,
    search_method: 'input',
    debug_params: '',
    from_search_id: '',
    search_scene: '',
  });
  const payload = await fetchJson(
    `https://api.qishui.com/luna/pc/search/track?${params.toString()}`,
    {
      'User-Agent': LUNA_UA,
      'Content-Type': 'application/json; charset=utf-8',
    },
  );
  const songs = extractSearchTracks(payload).slice(0, Math.max(1, Number(limit) || 30));
  const groups = Array.isArray(payload?.result_groups) ? payload.result_groups : [];
  const trackGroup = groups.find((group) => group?.id === 'tracks') || groups[0];
  return {
    songs,
    total: songs.length + cursor,
    hasMore: Boolean(trackGroup?.has_more),
    searchMode: 'track',
  };
};

const searchOfficialPlaylists = async (query, limit = 30, offset = 0) => {
  const params = buildLunaQuery({
    q: query,
    cursor: '0',
    search_id: crypto.randomUUID?.() || `${Date.now()}`,
    search_method: 'input',
    debug_params: '',
    from_search_id: '',
    search_scene: '',
  });
  const [artist, payload] = await Promise.all([
    isTagCategoryQuery(query) ? Promise.resolve(null) : searchExactArtist(query),
    fetchJson(
      `https://api.qishui.com/luna/pc/search/playlist?${params.toString()}`,
      {
        'User-Agent': LUNA_UA,
        'Content-Type': 'application/json; charset=utf-8',
      },
    ),
  ]);
  const playlists = extractSearchPlaylists(payload);
  const playlist = pickBestCategoryPlaylist(query, playlists);
  if (!playlist) {
    return { songs: [], total: 0, hasMore: false, searchMode: 'category' };
  }

  const artistName = artist?.name || null;
  const result = await collectFilteredPlaylistTracks(playlist, {
    artistName,
    limit,
    offset,
  });

  return {
    songs: result.songs,
    total: result.total,
    hasMore: result.hasMore,
    searchMode: 'category',
    playlist,
    ...(artistName ? { artist: artistName } : {}),
  };
};

const resolveTrackId = (payload) => {
  const fromSong = payload?.song?.providerSongId || payload?.song?.id || payload?.id;
  const value = String(fromSong || '').trim();
  if (!value) return '';
  if (isQishuiShareUrl(value)) return '';
  // Numeric / snowflake track ids only.
  if (/^\d{6,}$/.test(value)) return value;
  return value;
};

export async function search({ query, limit = 30, offset = 0 }) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { songs: [], total: 0, hasMore: false };
  }

  if (isQishuiShareUrl(trimmed)) {
    const parsed = await parseShareShortLinkViaBugpk(trimmed);
    return parsed
      ? { songs: [parsed], total: 1, hasMore: false, searchMode: 'track' }
      : { songs: [], total: 0, hasMore: false, searchMode: 'track' };
  }

  const intent = parseQishuiSearchIntent(trimmed);
  if (intent.mode === 'category') {
    return searchOfficialPlaylists(intent.query, limit, offset);
  }
  return searchOfficialTracks(intent.query, limit, offset);
}

export async function audio({ id, song }) {
  const shareId = String(song?.providerSongId || id || '').trim();
  if (isQishuiShareUrl(shareId)) {
    const parsed = await parseShareShortLinkViaBugpk(shareId);
    return { audioUrl: parsed?.audioUrl || null };
  }

  const trackId = resolveTrackId({ id, song });
  if (!trackId) {
    return { audioUrl: null };
  }

  const page = await parseShareTrackPage(trackId);
  return { audioUrl: page.audioUrl || null };
}

export async function lyrics({ id, song }) {
  const shareId = String(song?.providerSongId || id || '').trim();
  if (isQishuiShareUrl(shareId)) {
    const parsed = await parseShareShortLinkViaBugpk(shareId);
    return { lyricsText: parsed?.lyricsText || '' };
  }

  const trackId = resolveTrackId({ id, song });
  if (!trackId) {
    return { lyrics: null };
  }

  const page = await parseShareTrackPage(trackId);
  return page.lyricsText
    ? { lyricsText: page.lyricsText }
    : { lyrics: null };
}

const QISHUI_DAILY_QUERIES = ['消愁', '光年之外', '孤勇者', '错位时空', '演员', '起风了', '晴天'];

const pickQishuiDailyQuery = () => {
  const now = new Date();
  const seed = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
  return QISHUI_DAILY_QUERIES[seed % QISHUI_DAILY_QUERIES.length];
};

/** Day-seeded keyword picks — Qishui has no personalized daily API yet. */
export async function recommend({ limit = 12 } = {}) {
  const query = pickQishuiDailyQuery();
  const result = await search({ query, limit, offset: 0 });
  return { ...result, kind: 'picks', query };
}

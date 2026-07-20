// scripts/music-provider-adapters/bilibili-provider-adapter.mjs
// Bilibili video / UP search → DASH audio (+ light video). Lyrics unavailable.

import { encWbi, getBuvidCookie, getWbiKeys } from './bilibili-wbi.mjs';

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const BASE_HEADERS = {
  'User-Agent': DESKTOP_UA,
  Referer: 'https://www.bilibili.com/',
  Origin: 'https://www.bilibili.com',
  Accept: 'application/json,text/plain,*/*',
};

const stripHtml = (value) => String(value || '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .trim();

const ensureHttps = (url) => {
  if (typeof url !== 'string' || !url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  return url.replace(/^http:\/\//i, 'https://');
};

const normalizeName = (value) => stripHtml(value).toLowerCase().replace(/\s+/g, '');

/** Parse mm:ss / h:mm:ss duration labels from space/search payloads. */
const parseDurationMs = (raw) => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 10_000 ? raw : raw * 1000;
  }
  const text = String(raw || '').trim();
  if (!text) return 0;
  if (/^\d+$/.test(text)) {
    const sec = Number(text);
    return Number.isFinite(sec) ? sec * 1000 : 0;
  }
  const parts = text.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) {
    return ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000;
  }
  if (parts.length === 2) {
    return ((parts[0] * 60) + parts[1]) * 1000;
  }
  return 0;
};

const fetchJsonRaw = async (url, { timeoutMs = 10_000, headers = {}, cookie = '', referer } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        ...BASE_HEADERS,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(referer ? { Referer: referer } : {}),
        ...headers,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Bilibili adapter request failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
};

const fetchJson = async (url, options = {}) => {
  let cookie = '';
  try {
    cookie = await getBuvidCookie((spiUrl) => fetchJsonRaw(spiUrl));
  } catch {
    cookie = 'buvid3=00000000-0000-0000-0000-000000000000infoc';
  }
  return fetchJsonRaw(url, { ...options, cookie });
};

const encodeId = (bvid, cid) => {
  const safeBvid = String(bvid || '').trim();
  const safeCid = String(cid || '').trim();
  return safeCid ? `${safeBvid}|${safeCid}` : safeBvid;
};

const parseId = (rawId) => {
  const value = String(rawId || '').trim();
  if (!value) return { bvid: '', cid: '' };
  if (value.includes('|')) {
    const [bvid, cid = ''] = value.split('|');
    return { bvid: bvid.trim(), cid: cid.trim() };
  }
  // Legacy Listen1-style: bitrack_v_<bvid>-<cid>
  const legacy = /^bitrack_v_(.+)-(\d+)$/.exec(value);
  if (legacy) {
    return { bvid: legacy[1], cid: legacy[2] };
  }
  return { bvid: value, cid: '' };
};

const pickDashAudioUrl = (dash) => {
  const audios = Array.isArray(dash?.audio) ? [...dash.audio] : [];
  if (audios.length === 0) return '';
  audios.sort((a, b) => Number(b?.id || b?.bandwidth || 0) - Number(a?.id || a?.bandwidth || 0));
  const best = audios[0];
  return ensureHttps(best?.baseUrl || best?.base_url || best?.backupUrl?.[0] || best?.backup_url?.[0] || '');
};

/** Prefer a light AVC stream (360p, max 480p) so muted video + audio stays CPU-friendly. */
const pickDashVideoUrl = (dash) => {
  const videos = Array.isArray(dash?.video) ? [...dash.video] : [];
  if (videos.length === 0) return '';
  // Bilibili qn ids: 16=360p, 32=480p, 64=720p+. Cap at 480p and prefer AVC over HEVC/AV1.
  const ranked = videos
    .map((item) => ({
      item,
      id: Number(item?.id || 0),
      bandwidth: Number(item?.bandwidth || 0),
      codecs: String(item?.codecs || '').toLowerCase(),
    }))
    .filter((entry) => entry.id > 0 && entry.id <= 32)
    .sort((a, b) => {
      const score = (entry) => {
        const codecBonus = entry.codecs.includes('avc') ? 1_000_000 : 0;
        // Prefer 360p, then 480p; within a tier pick lower bandwidth.
        if (entry.id === 16) return codecBonus + 200_000 - entry.bandwidth;
        if (entry.id === 32) return codecBonus + 100_000 - entry.bandwidth;
        return codecBonus - entry.bandwidth;
      };
      return score(b) - score(a);
    });
  const best = ranked[0]?.item;
  return ensureHttps(best?.baseUrl || best?.base_url || best?.backupUrl?.[0] || best?.backup_url?.[0] || '');
};

const resolveViewMeta = async (bvid) => {
  const payload = await fetchJson(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`);
  const data = payload?.data;
  const page = Array.isArray(data?.pages) ? data.pages[0] : null;
  return {
    cid: page?.cid ? String(page.cid) : '',
    durationSec: Number(page?.duration || data?.duration || 0),
    title: stripHtml(data?.title || ''),
    artist: stripHtml(data?.owner?.name || ''),
    coverUrl: ensureHttps(data?.pic || ''),
  };
};

/**
 * Detect explicit UP search: `up:名称` / `@名称` / `账号:名称` / `mid:123`.
 * Bare queries still try exact UP match before falling back to video keyword search.
 */
export const parseBilibiliSearchIntent = (rawQuery) => {
  const trimmed = String(rawQuery || '').trim();
  if (!trimmed) return { mode: 'video', query: '' };

  const midMatch = /^(?:mid:|uid:)\s*(\d+)\s*$/i.exec(trimmed);
  if (midMatch) {
    return { mode: 'user', query: midMatch[1], mid: Number(midMatch[1]) };
  }

  const prefixMatch = /^(?:up:|账号:|用户:|@)\s*(.+)$/i.exec(trimmed);
  if (prefixMatch) {
    return { mode: 'user', query: prefixMatch[1].trim() };
  }

  return { mode: 'auto', query: trimmed };
};

const mapSongFromVideoRow = async (row, { authorFallback = '', resolveCid = false } = {}) => {
  const bvid = String(row?.bvid || '').trim();
  if (!bvid) return null;

  let cid = String(row?.cid || '').trim();
  let durationMs = parseDurationMs(row?.duration ?? row?.length ?? row?.durationMs);
  let coverUrl = ensureHttps(row?.pic || row?.cover || '');
  let title = stripHtml(row?.title || 'Unknown');
  let author = stripHtml(row?.author || row?.owner?.name || authorFallback || 'Bilibili');

  if (resolveCid) {
    try {
      const meta = await resolveViewMeta(bvid);
      cid = cid || meta.cid;
      if (!durationMs && Number.isFinite(meta.durationSec)) {
        durationMs = meta.durationSec * 1000;
      }
      coverUrl = coverUrl || meta.coverUrl;
      title = title || meta.title;
      author = author || meta.artist;
    } catch {
      // Keep the search hit even when view lookup fails; audio() will retry cid.
    }
  }

  return {
    id: encodeId(bvid, cid),
    title,
    artists: [author].filter(Boolean),
    album: bvid,
    durationMs,
    coverUrl,
    source: 'bilibili',
    bvid,
    cid,
  };
};

const searchUsers = async (keyword) => {
  const url = new URL('https://api.bilibili.com/x/web-interface/search/type');
  url.searchParams.set('search_type', 'bili_user');
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('page', '1');
  url.searchParams.set('page_size', '10');
  url.searchParams.set('platform', 'pc');
  url.searchParams.set('highlight', '0');
  const payload = await fetchJson(url, { referer: 'https://search.bilibili.com/upuser' });
  const rows = Array.isArray(payload?.data?.result) ? payload.data.result : [];
  return rows
    .map((row) => ({
      mid: Number(row?.mid || 0),
      uname: stripHtml(row?.uname || ''),
      videos: Number(row?.videos || 0),
      // bili_user hits often embed recent uploads — useful when space WBI is风控'd.
      recent: Array.isArray(row?.res) ? row.res : [],
    }))
    .filter((row) => row.mid > 0 && row.uname);
};

const resolveUserTarget = async (intent) => {
  if (intent.mid && Number.isFinite(intent.mid) && intent.mid > 0) {
    return {
      mid: intent.mid,
      uname: intent.query || String(intent.mid),
      videos: 0,
      recent: [],
    };
  }

  const keyword = intent.query;
  if (!keyword) return null;

  const users = await searchUsers(keyword);
  if (users.length === 0) return null;

  const exact = users.find((user) => normalizeName(user.uname) === normalizeName(keyword));
  if (exact) return exact;

  // Explicit up:/@ prefix: accept the top hit even without exact name match.
  if (intent.mode === 'user') {
    return users[0];
  }

  return null;
};

const buildSongPage = async (rows, { authorFallback = '', total = rows.length, page, pageSize, mid, uname }) => {
  const resolveLimit = Math.min(rows.length, 12);
  const songs = [];
  for (let index = 0; index < rows.length; index += 1) {
    const song = await mapSongFromVideoRow(rows[index], {
      authorFallback: uname || authorFallback,
      resolveCid: index < resolveLimit,
    });
    if (song) songs.push(song);
  }
  return {
    songs,
    total,
    hasMore: page * pageSize < total,
    searchMode: 'user',
    uploader: { mid, uname },
  };
};

const searchUserVideos = async ({ mid, uname, page, pageSize, recent = [], videos = 0 }) => {
  try {
    const { imgKey, subKey } = await getWbiKeys(fetchJson);
    const query = encWbi(
      {
        mid,
        pn: page,
        ps: pageSize,
        order: 'pubdate',
      },
      imgKey,
      subKey,
    );
    const payload = await fetchJson(
      `https://api.bilibili.com/x/space/wbi/arc/search?${query}`,
      { referer: `https://space.bilibili.com/${mid}/` },
    );
    if (payload?.code === 0) {
      const rows = Array.isArray(payload?.data?.list?.vlist) ? payload.data.list.vlist : [];
      const total = Number(payload?.data?.page?.count || rows.length);
      if (rows.length > 0) {
        return buildSongPage(rows, { mid, uname, total, page, pageSize });
      }
    }
    throw new Error(`Bilibili space search failed: ${payload?.code || 'unknown'} ${payload?.message || ''}`.trim());
  } catch (error) {
    // Prefer mid-filtered video search for fuller lists; recent embeds are usually only ~3 clips.
    try {
      const filtered = await searchVideosByUploader({
        keyword: uname,
        mid,
        uname,
        page,
        pageSize,
      });
      if (filtered.songs.length > 0) {
        return filtered;
      }
    } catch (filterError) {
      console.warn('[bilibili-provider-adapter] mid-filtered UP search failed', filterError);
    }

    if (page === 1 && recent.length > 0) {
      const rows = recent.slice(0, pageSize).map((item) => ({
        ...item,
        author: uname,
      }));
      return buildSongPage(rows, {
        mid,
        uname,
        total: videos || recent.length,
        page,
        pageSize,
      });
    }
    throw error;
  }
};

/** Last-resort UP mode: keyword video search filtered to the target mid/author. */
const searchVideosByUploader = async ({ keyword, mid, uname, page, pageSize }) => {
  const collected = [];
  const seen = new Set();
  let remotePage = 1;
  let remoteTotal = 0;
  const maxRemotePages = Math.min(8, page + 4);

  while (collected.length < page * pageSize && remotePage <= maxRemotePages) {
    const url = new URL('https://api.bilibili.com/x/web-interface/search/type');
    url.searchParams.set('search_type', 'video');
    url.searchParams.set('keyword', keyword || uname);
    url.searchParams.set('page', String(remotePage));
    url.searchParams.set('page_size', '42');
    url.searchParams.set('platform', 'pc');
    url.searchParams.set('highlight', '0');
    const payload = await fetchJson(url, { referer: 'https://search.bilibili.com/video' });
    const rows = Array.isArray(payload?.data?.result) ? payload.data.result : [];
    remoteTotal = Number(payload?.data?.numResults || remoteTotal);
    if (rows.length === 0) break;

    let added = 0;
    for (const row of rows) {
      const bvid = String(row?.bvid || '').trim();
      if (!bvid || seen.has(bvid)) continue;
      const rowMid = Number(row?.mid || 0);
      const rowAuthor = stripHtml(row?.author || '');
      if (rowMid === mid || normalizeName(rowAuthor) === normalizeName(uname)) {
        seen.add(bvid);
        collected.push(row);
        added += 1;
      }
    }
    if (added === 0) break;
    remotePage += 1;
  }

  const start = (page - 1) * pageSize;
  const pageRows = collected.slice(start, start + pageSize);
  return buildSongPage(pageRows, {
    mid,
    uname,
    total: Math.max(collected.length, videosTotalHint(remoteTotal, collected.length)),
    page,
    pageSize,
  });
};

const videosTotalHint = (remoteTotal, collectedLength) => (
  remoteTotal > 0
    ? Math.min(remoteTotal, Math.max(collectedLength, collectedLength + 1))
    : collectedLength
);

const searchVideos = async ({ keyword, page, pageSize }) => {
  const url = new URL('https://api.bilibili.com/x/web-interface/search/type');
  url.searchParams.set('search_type', 'video');
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('platform', 'pc');
  url.searchParams.set('highlight', '0');

  const payload = await fetchJson(url, { referer: 'https://search.bilibili.com/video' });
  const rows = Array.isArray(payload?.data?.result) ? payload.data.result : [];
  const total = Number(payload?.data?.numResults || rows.length);
  const resolveLimit = Math.min(rows.length, 12);
  const songs = [];
  for (let index = 0; index < rows.length; index += 1) {
    const song = await mapSongFromVideoRow(rows[index], { resolveCid: index < resolveLimit });
    if (song) songs.push(song);
  }

  return {
    songs,
    total,
    hasMore: page * pageSize < total,
    searchMode: 'video',
  };
};

export async function search({ query, limit = 30, offset = 0 }) {
  const intent = parseBilibiliSearchIntent(query);
  if (!intent.query && !intent.mid) {
    return { songs: [], total: 0, hasMore: false, searchMode: 'video' };
  }

  const pageSize = Math.min(Math.max(Number(limit) || 30, 1), 42);
  const page = Math.floor(Math.max(Number(offset) || 0, 0) / pageSize) + 1;

  try {
    if (intent.mode === 'user' || intent.mode === 'auto') {
      const target = await resolveUserTarget(intent);
      if (target) {
        try {
          return await searchUserVideos({
            mid: target.mid,
            uname: target.uname,
            page,
            pageSize,
            recent: target.recent,
            videos: target.videos,
          });
        } catch (spaceError) {
          console.warn('[bilibili-provider-adapter] space UP search failed, trying mid-filtered videos', spaceError);
          return await searchVideosByUploader({
            keyword: intent.query || target.uname,
            mid: target.mid,
            uname: target.uname,
            page,
            pageSize,
          });
        }
      }
      if (intent.mode === 'user') {
        return { songs: [], total: 0, hasMore: false, searchMode: 'user' };
      }
    }
  } catch (error) {
    console.warn('[bilibili-provider-adapter] UP search failed, falling back to video keyword', error);
  }

  return searchVideos({ keyword: intent.query, page, pageSize });
}

export async function audio({ id, song }) {
  const fromSong = String(song?.providerSongId || song?.id || id || '');
  let { bvid, cid } = parseId(fromSong);
  if (!bvid && typeof song?.album === 'string') {
    bvid = song.album;
  }
  if (!bvid) {
    return { audioUrl: null, videoUrl: null };
  }

  if (!cid) {
    const meta = await resolveViewMeta(bvid);
    cid = meta.cid;
  }
  if (!cid) {
    return { audioUrl: null, videoUrl: null };
  }

  let bestAudio = '';
  let bestVideo = '';
  let progressive = '';

  // Prefer DASH split streams: muted video surface + audio element as master clock.
  // Progressive MP4 is the fallback when DASH video/audio is unavailable.
  for (const fnval of [16, 80, 1, 0]) {
    const playUrl = new URL('https://api.bilibili.com/x/player/playurl');
    playUrl.searchParams.set('bvid', bvid);
    playUrl.searchParams.set('cid', cid);
    playUrl.searchParams.set('fnval', String(fnval));
    // Request 360p; adapter still caps dash video selection at <=480p.
    playUrl.searchParams.set('qn', '16');

    const payload = await fetchJson(playUrl);
    if (payload?.code !== 0) continue;

    const dashAudio = pickDashAudioUrl(payload?.data?.dash);
    const dashVideo = pickDashVideoUrl(payload?.data?.dash);
    if (dashAudio && !bestAudio) bestAudio = dashAudio;
    if (dashVideo && !bestVideo) bestVideo = dashVideo;

    const durl = payload?.data?.durl?.[0]?.url;
    if (typeof durl === 'string' && durl && !progressive) {
      progressive = ensureHttps(durl);
    }

    if (bestAudio && bestVideo) break;
  }

  if (bestAudio && bestVideo) {
    return { audioUrl: bestAudio, videoUrl: bestVideo };
  }

  if (bestAudio) {
    // Do not attach muxed progressive as a second decoder alongside DASH audio.
    return { audioUrl: bestAudio, videoUrl: null };
  }

  if (progressive) {
    // Muxed MP4 would double-decode if attached to both <audio> and <video>; keep audio only.
    return { audioUrl: progressive, videoUrl: null };
  }

  return { audioUrl: null, videoUrl: null };
}

export async function lyrics() {
  // Bilibili video search has no reliable lyric catalog.
  return { lyrics: null };
}

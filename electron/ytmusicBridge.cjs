'use strict';

// electron/ytmusicBridge.cjs
// Main-process YouTube Music browse + localhost HTTP stream proxy (CORS-safe for <audio>).

const fs = require('fs');
const path = require('path');
const http = require('http');
const { app } = require('electron');

const STREAM_CACHE_TTL_SKEW_MS = 60_000;
/** googlevideo signed URLs often die sooner than the expire= query claims. */
const STREAM_CACHE_MAX_AGE_MS = 25 * 60 * 1000;
/** Home playlist cards: reuse for hours so revisiting the tab is not a live network hit. */
const HOME_SHELVES_TTL_MS = 6 * 60 * 60 * 1000;
/** Expanded playlist tracks: shorter than shelves (content churns more). */
const HOME_PLAYLIST_TTL_MS = 2 * 60 * 60 * 1000;
/** Bump when home region / mapping changes so stale foreign shelves are dropped. */
const HOME_CACHE_EPOCH = 'cn-rails-v1';
/** Public discover cards — Mandarin playlist search seeds (IP home feed is unreliable). */
const HOME_PLAYLIST_SEED_QUERIES = [
  '华语流行歌单',
  '华语经典老歌',
  '粤语金曲',
  '古风歌曲精选',
];
const HOME_SECTION_LIMIT = 12;
const HOME_TRACKS_PER_SECTION = 30;
const HOME_PLAYLIST_TIMEOUT_MS = 12_000;
const HOME_FEED_TIMEOUT_MS = 15_000;
const HOME_SEED_SEARCH_TIMEOUT_MS = 10_000;
/** Browse/API fetches — music.youtube.com origin. */
const UPSTREAM_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Referer: 'https://music.youtube.com/',
  Origin: 'https://music.youtube.com',
};
/**
 * googlevideo media fetches — match youtubei.js STREAM_HEADERS.
 * Prefer URL `range=` / `cpn=` query params over HTTP Range (more reliable mid-file).
 */
const UPSTREAM_STREAM_HEADERS = {
  accept: '*/*',
  origin: 'https://www.youtube.com',
  referer: 'https://www.youtube.com',
  DNT: '?1',
  'User-Agent': UPSTREAM_HEADERS['User-Agent'],
};

function generateCpn() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < 16; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

let innertubePromise = null;
/** @type {Map<string, { url: string, expireAt: number|null, mimeType: string|null }>} */
const streamCache = new Map();
/** @type {{ fetchedAt: number, sections: Array<{ title: string, playlistId: string, tracks: any[] }> } | null} */
let homeCache = null;
/** @type {{ fetchedAt: number, playlists: Array<{ title: string, playlistId: string, coverUrl?: string|null }> } | null} */
let homeShelvesCache = null;
/** @type {Map<string, { fetchedAt: number, section: any }>} */
const playlistSectionCache = new Map();
/** @type {Promise<Array<{ title: string, playlistId: string, tracks: any[] }>> | null} */
let homeSectionsInFlight = null;
/** @type {import('http').Server | null} */
let proxyServer = null;
let proxyPort = null;
let proxyReadyPromise = null;
let diskCacheLoaded = false;
/** @type {{ shelves: { fetchedAt: number, playlists: any[] }|null, playlists: Record<string, { fetchedAt: number, section: any }> }} */
let diskCacheState = { shelves: null, playlists: {} };
let diskCacheWriteTimer = null;

async function getInnertube() {
  if (!innertubePromise) {
    innertubePromise = (async () => {
      const { Innertube, Platform } = await import('youtubei.js');
      Platform.shim.eval = async (data) => new Function(data.output)();
      // Prefer Mandarin UI + HK geo — raw egress IP (VPN) often yields IN/SG Bollywood home.
      // Home shelves themselves use CN playlist search seeds (getHomeFeed stays geo-noisy).
      return Innertube.create({
        generate_session_locally: true,
        lang: 'zh-Hans',
        location: 'HK',
      });
    })().catch((error) => {
      innertubePromise = null;
      throw error;
    });
  }
  return innertubePromise;
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pickThumbnailUrl(thumbnails) {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return null;
  const last = thumbnails[thumbnails.length - 1];
  if (!last) return null;
  if (typeof last === 'string') return last;
  return last.url || null;
}

function resolveItemTitle(item) {
  const raw = item?.title ?? item?.name;
  if (raw && typeof raw === 'object' && raw.text != null) return String(raw.text).trim();
  return String(raw || '').trim();
}

function mapSearchSong(item) {
  const videoId = item?.id || item?.video_id || item?.videoId || null;
  if (!videoId || typeof videoId !== 'string') return null;

  const title = resolveItemTitle(item) || videoId;
  const artists = Array.isArray(item?.artists)
    ? item.artists.map((a) => a?.name).filter(Boolean).join(', ')
    : Array.isArray(item?.authors)
      ? item.authors.map((a) => a?.name).filter(Boolean).join(', ')
      : (item?.artist?.name || item?.author?.name || '');
  const album = item?.album?.name || (typeof item?.album === 'string' ? item.album : null);

  let normalizedDurationMs = 0;
  if (item?.duration?.seconds != null) {
    normalizedDurationMs = asNumber(item.duration.seconds) * 1000;
  } else if (item?.duration_seconds != null) {
    normalizedDurationMs = asNumber(item.duration_seconds) * 1000;
  } else if (typeof item?.duration === 'number') {
    normalizedDurationMs = item.duration < 10000 ? item.duration * 1000 : item.duration;
  }

  return {
    videoId,
    title,
    artist: String(artists || '').trim() || 'Unknown',
    album: album ? String(album) : null,
    durationMs: normalizedDurationMs || 0,
    coverUrl: pickThumbnailUrl(item?.thumbnails || item?.thumbnail?.contents || item?.thumbnail),
  };
}

function isPlaylistShelfItem(item) {
  const id = item?.id;
  if (!id || typeof id !== 'string') return false;
  if (!(id.startsWith('VL') || id.startsWith('PL'))) return false;
  const type = String(item?.type || item?.item_type || '');
  // Prefer playlist-like two-row cards; exclude obvious video ids (11 chars typical).
  if (type.includes('MusicTwoRowItem') || type.includes('Playlist')) return true;
  return id.length > 15;
}

function collectHomePlaylists(homeFeed, limit = HOME_SECTION_LIMIT) {
  const sections = Array.isArray(homeFeed?.sections) ? homeFeed.sections : [];
  const collected = [];
  const seen = new Set();
  for (const shelf of sections) {
    const contents = Array.isArray(shelf?.contents) ? shelf.contents : [];
    for (const item of contents) {
      if (!isPlaylistShelfItem(item)) continue;
      const playlistId = String(item.id);
      if (seen.has(playlistId)) continue;
      seen.add(playlistId);
      collected.push({
        playlistId,
        title: resolveItemTitle(item) || playlistId,
        coverUrl: pickThumbnailUrl(item?.thumbnails || item?.thumbnail?.contents || item?.thumbnail),
      });
      if (collected.length >= limit) return collected;
    }
  }
  return collected;
}

/** Walk a music.search payload and collect playlist cards. */
function collectPlaylistsFromSearchResult(searchResult, limit, seen) {
  const collected = [];

  const visit = (node) => {
    if (!node || collected.length >= limit) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== 'object') return;

    const id = node.id;
    if (typeof id === 'string' && (id.startsWith('VL') || id.startsWith('PL')) && !seen.has(id)) {
      const title = resolveItemTitle(node);
      if (title) {
        seen.add(id);
        collected.push({
          playlistId: id,
          title,
          coverUrl: pickThumbnailUrl(node.thumbnails || node.thumbnail?.contents || node.thumbnail),
        });
      }
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') visit(value);
      if (collected.length >= limit) return;
    }
  };

  visit(searchResult);
  return collected;
}

/** Build discover cards from Mandarin playlist search seeds (stable vs IP home feed). */
async function fetchSeedHomePlaylists(yt, limit = HOME_SECTION_LIMIT) {
  const seen = new Set();
  const collected = [];
  for (const query of HOME_PLAYLIST_SEED_QUERIES) {
    if (collected.length >= limit) break;
    try {
      const result = await withTimeout(
        yt.music.search(query, { type: 'playlist' }),
        HOME_SEED_SEARCH_TIMEOUT_MS,
        `seed:${query}`,
      );
      const batch = collectPlaylistsFromSearchResult(result, limit - collected.length, seen);
      collected.push(...batch);
    } catch (error) {
      console.warn('[ytmusic] home seed search failed', query, error?.message || error);
    }
  }
  return collected;
}

async function expandPlaylistSection(yt, playlist, trackLimit = HOME_TRACKS_PER_SECTION) {
  const result = await yt.music.getPlaylist(playlist.playlistId);
  const contents = Array.isArray(result?.contents)
    ? result.contents
    : (Array.isArray(result?.items) ? result.items : []);
  const tracks = [];
  for (const item of contents) {
    const track = mapSearchSong(item);
    if (track) tracks.push(track);
    if (tracks.length >= trackLimit) break;
  }
  if (tracks.length === 0) return null;
  return {
    title: playlist.title,
    playlistId: playlist.playlistId,
    coverUrl: playlist.coverUrl || null,
    tracks,
  };
}

function withTimeout(promise, ms, label) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout:${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function getDiskCachePath() {
  try {
    if (!app || typeof app.getPath !== 'function') return null;
    return path.join(app.getPath('userData'), 'ytmusic-home-cache.json');
  } catch {
    return null;
  }
}

function isFresh(fetchedAt, ttlMs, nowMs = Date.now()) {
  return Number.isFinite(fetchedAt) && nowMs - fetchedAt < ttlMs;
}

function loadDiskCacheOnce() {
  if (diskCacheLoaded) return;
  diskCacheLoaded = true;
  const cachePath = getDiskCachePath();
  if (!cachePath || !fs.existsSync(cachePath)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (raw && typeof raw === 'object') {
      diskCacheState = {
        shelves: raw.shelves && Array.isArray(raw.shelves.playlists) && raw.shelves.epoch === HOME_CACHE_EPOCH
          ? { fetchedAt: Number(raw.shelves.fetchedAt) || 0, playlists: raw.shelves.playlists, epoch: HOME_CACHE_EPOCH }
          : null,
        playlists: raw.playlists && typeof raw.playlists === 'object' ? raw.playlists : {},
      };
      if (diskCacheState.shelves && isFresh(diskCacheState.shelves.fetchedAt, HOME_SHELVES_TTL_MS)) {
        homeShelvesCache = diskCacheState.shelves;
      }
      for (const [id, entry] of Object.entries(diskCacheState.playlists)) {
        if (entry?.section && isFresh(entry.fetchedAt, HOME_PLAYLIST_TTL_MS)) {
          playlistSectionCache.set(id, entry);
        }
      }
      console.log(
        '[ytmusic] disk cache loaded',
        JSON.stringify({
          shelves: Boolean(homeShelvesCache),
          playlists: playlistSectionCache.size,
        }),
      );
    }
  } catch (error) {
    console.warn('[ytmusic] disk cache read failed', error);
  }
}

function scheduleDiskCacheWrite() {
  if (diskCacheWriteTimer) return;
  diskCacheWriteTimer = setTimeout(() => {
    diskCacheWriteTimer = null;
    const cachePath = getDiskCachePath();
    if (!cachePath) return;
    try {
      const payload = {
        shelves: homeShelvesCache
          ? {
              fetchedAt: homeShelvesCache.fetchedAt,
              playlists: homeShelvesCache.playlists,
              epoch: HOME_CACHE_EPOCH,
            }
          : diskCacheState.shelves,
        playlists: {},
      };
      for (const [id, entry] of playlistSectionCache.entries()) {
        payload.playlists[id] = entry;
      }
      // Keep a bounded number of playlist payloads on disk.
      const ids = Object.keys(payload.playlists);
      if (ids.length > 40) {
        ids
          .sort((a, b) => (payload.playlists[b].fetchedAt || 0) - (payload.playlists[a].fetchedAt || 0))
          .slice(40)
          .forEach((id) => {
            delete payload.playlists[id];
          });
      }
      diskCacheState = payload;
      fs.writeFileSync(cachePath, JSON.stringify(payload), 'utf8');
    } catch (error) {
      console.warn('[ytmusic] disk cache write failed', error);
    }
  }, 400);
}

function rememberShelves(playlists) {
  homeShelvesCache = { fetchedAt: Date.now(), playlists, epoch: HOME_CACHE_EPOCH };
  scheduleDiskCacheWrite();
}

function rememberPlaylistSection(section) {
  if (!section?.playlistId) return;
  playlistSectionCache.set(section.playlistId, {
    fetchedAt: Date.now(),
    section,
  });
  scheduleDiskCacheWrite();
}

async function getHomeShelves({ forceRefresh = false } = {}) {
  loadDiskCacheOnce();
  const now = Date.now();
  if (!forceRefresh && homeCache && isFresh(homeCache.fetchedAt, HOME_SHELVES_TTL_MS, now)) {
    return homeCache.sections.map((section) => ({
      title: section.title,
      playlistId: section.playlistId,
      coverUrl: section.coverUrl || null,
    }));
  }
  if (!forceRefresh && homeShelvesCache && isFresh(homeShelvesCache.fetchedAt, HOME_SHELVES_TTL_MS, now)) {
    return homeShelvesCache.playlists;
  }

  const startedAt = Date.now();
  const yt = await getInnertube();
  const playlists = await fetchSeedHomePlaylists(yt, HOME_SECTION_LIMIT);
  rememberShelves(playlists);
  console.log('[ytmusic] home shelves ms', Date.now() - startedAt, 'count', playlists.length);
  return playlists;
}

async function getPlaylistSection(playlistId, { title = null, coverUrl = null, limit = HOME_TRACKS_PER_SECTION, forceRefresh = false } = {}) {
  loadDiskCacheOnce();
  const id = String(playlistId || '').trim();
  if (!id) throw new Error('Missing playlist id');

  if (!forceRefresh) {
    const cached = playlistSectionCache.get(id);
    if (cached?.section && isFresh(cached.fetchedAt, HOME_PLAYLIST_TTL_MS)) {
      return cached.section;
    }
  }

  const yt = await getInnertube();
  const section = await withTimeout(
    expandPlaylistSection(
      yt,
      { playlistId: id, title: title || id, coverUrl },
      limit,
    ),
    HOME_PLAYLIST_TIMEOUT_MS,
    id,
  );
  if (!section) throw new Error('Playlist has no playable tracks');
  rememberPlaylistSection(section);
  return section;
}

async function getHomeSections({ forceRefresh = false } = {}) {
  loadDiskCacheOnce();
  const now = Date.now();
  if (!forceRefresh && homeCache && isFresh(homeCache.fetchedAt, HOME_SHELVES_TTL_MS, now)) {
    return homeCache.sections;
  }
  if (!forceRefresh && homeSectionsInFlight) {
    return homeSectionsInFlight;
  }

  homeSectionsInFlight = (async () => {
    const startedAt = Date.now();
    const yt = await getInnertube();
    const afterSession = Date.now();

    let playlists = null;
    if (!forceRefresh && homeShelvesCache && isFresh(homeShelvesCache.fetchedAt, HOME_SHELVES_TTL_MS, now)) {
      playlists = homeShelvesCache.playlists;
    } else {
      playlists = await fetchSeedHomePlaylists(yt, HOME_SECTION_LIMIT);
      rememberShelves(playlists);
    }
    const afterFeed = Date.now();

    // Expand playlists in parallel — sequential awaits made home feel stuck on slow networks.
    const settled = await Promise.allSettled(
      playlists.map((playlist) =>
        withTimeout(
          expandPlaylistSection(yt, playlist),
          HOME_PLAYLIST_TIMEOUT_MS,
          playlist.playlistId,
        ),
      ),
    );

    const sections = [];
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) {
        sections.push(result.value);
        rememberPlaylistSection(result.value);
      } else if (result.status === 'rejected') {
        console.warn('[ytmusic] skip home playlist', result.reason);
      }
    }

    console.log(
      '[ytmusic] home timing',
      JSON.stringify({
        sessionMs: afterSession - startedAt,
        feedMs: afterFeed - afterSession,
        expandMs: Date.now() - afterFeed,
        totalMs: Date.now() - startedAt,
        playlists: playlists.length,
        sections: sections.length,
      }),
    );

    homeCache = { fetchedAt: Date.now(), sections };
    return sections;
  })().finally(() => {
    homeSectionsInFlight = null;
  });

  return homeSectionsInFlight;
}

/** Warm Innertube + home cache so the YTM tab is not cold on first open. */
function prefetchHomeInBackground() {
  void getHomeSections()
    .then((sections) => {
      console.log('[ytmusic] home prefetched', sections.length, 'sections');
    })
    .catch((error) => {
      console.warn('[ytmusic] home prefetch failed', error);
    });
}

function extractExpireAt(url) {
  try {
    const parsed = new URL(url);
    const exp = parsed.searchParams.get('expire');
    if (!exp) return null;
    const sec = Number(exp);
    return Number.isFinite(sec) ? sec * 1000 : null;
  } catch {
    return null;
  }
}

function pickAudioFormat(streamingData) {
  const formats = [
    ...(streamingData?.adaptive_formats || streamingData?.adaptiveFormats || []),
    ...(streamingData?.formats || []),
  ];
  const audioFormats = formats.filter((f) => String(f.mime_type || f.mimeType || '').includes('audio'));
  if (audioFormats.length === 0) return null;
  audioFormats.sort((a, b) => {
    const score = (f) => {
      const mime = String(f.mime_type || f.mimeType || '');
      const bitrate = asNumber(f.bitrate || f.average_bitrate);
      const containerBonus = mime.includes('mp4') ? 50_000 : 0;
      return bitrate + containerBonus;
    };
    return score(b) - score(a);
  });
  return audioFormats[0];
}

function isStreamCacheFresh(entry, nowMs = Date.now()) {
  if (!entry?.url) return false;
  if (entry.resolvedAt != null && nowMs - entry.resolvedAt > STREAM_CACHE_MAX_AGE_MS) {
    return false;
  }
  if (entry.expireAt == null) return true;
  return entry.expireAt - STREAM_CACHE_TTL_SKEW_MS > nowMs;
}

async function searchTracks(query, limit = 20, type = 'song') {
  const q = String(query || '').trim();
  if (!q) return { tracks: [], playlists: [] };

  const searchType = type === 'playlist' ? 'playlist' : 'song';
  const yt = await getInnertube();
  const result = await yt.music.search(q, { type: searchType });

  if (searchType === 'playlist') {
    const playlists = collectPlaylistsFromSearchResult(result, limit, new Set());
    return { tracks: [], playlists };
  }

  const contents = result?.songs?.contents || [];
  const list = Array.isArray(contents) ? contents : [];
  const mapped = [];
  for (const item of list) {
    const track = mapSearchSong(item);
    if (track) mapped.push(track);
    if (mapped.length >= limit) break;
  }
  return { tracks: mapped, playlists: [] };
}

async function resolveStream(videoId, { forceRefresh = false } = {}) {
  const id = String(videoId || '').trim();
  if (!id) {
    throw new Error('Missing YouTube video id');
  }

  if (!forceRefresh) {
    const cached = streamCache.get(id);
    if (isStreamCacheFresh(cached)) {
      return cached;
    }
  }

  const yt = await getInnertube();
  const musicInfo = await yt.music.getInfo(id);
  const format = pickAudioFormat(musicInfo?.streaming_data || musicInfo?.streamingData);
  if (!format) {
    throw new Error('No audio format available');
  }

  let url = format.url || null;
  if (!url && typeof format.decipher === 'function') {
    url = await format.decipher(yt.session.player);
  }

  if (!url) {
    throw new Error('Failed to resolve YouTube audio stream URL');
  }

  const contentLength = asNumber(format.content_length || format.contentLength);
  const stream = {
    url: String(url),
    cpn: generateCpn(),
    expireAt: extractExpireAt(String(url)),
    mimeType: format.mime_type || format.mimeType || null,
    contentLength: contentLength > 0 ? contentLength : undefined,
    resolvedAt: Date.now(),
  };
  streamCache.set(id, stream);
  return stream;
}

function buildPlaybackUrl(videoId) {
  if (!proxyPort) {
    throw new Error('YouTube Music proxy is not ready');
  }
  return `http://127.0.0.1:${proxyPort}/ytm/${encodeURIComponent(String(videoId || '').trim())}`;
}

/**
 * googlevideo closed windows via URL `range=` (not HTTP Range):
 * - ~512KB windows work from byte 0 and mid-file when the signed URL is healthy
 * - stitching many tiny HTTP-Range mid windows burned URLs and caused
 *   Content-Length mismatches when the pipe stopped early
 */
const MAX_UPSTREAM_RANGE_FROM_START = 512 * 1024;
const MAX_UPSTREAM_RANGE_MID = 512 * 1024;
/** How much one proxy response returns for open-ended client ranges. */
const MAX_CLIENT_RESPONSE_BYTES = 512 * 1024;
const MAX_CLIENT_RESPONSE_BYTES_MID = MAX_UPSTREAM_RANGE_MID;

function parseClientByteRange(rangeHeader) {
  let start = 0;
  let end = null;
  const match = String(rangeHeader || '').match(/bytes=(\d+)-(\d*)/i);
  if (match) {
    start = Number(match[1]);
    end = match[2] === '' ? null : Number(match[2]);
  }
  return { start, end, hadRange: Boolean(rangeHeader) };
}

/** Build googlevideo URL with youtubei-style range/cpn query params (no HTTP Range). */
function buildUpstreamMediaUrl(stream, start, end) {
  const url = new URL(stream.url);
  url.searchParams.set('range', `${start}-${end}`);
  if (stream.cpn) {
    url.searchParams.set('cpn', stream.cpn);
  }
  return url.toString();
}

async function probeContentLength(stream, start = 0) {
  if (Number.isFinite(stream.contentLength) && stream.contentLength > 0) {
    return stream.contentLength;
  }
  const probe = await fetch(buildUpstreamMediaUrl(stream, start, start), {
    method: 'GET',
    headers: UPSTREAM_STREAM_HEADERS,
    redirect: 'follow',
  });
  const contentRange = probe.headers.get('content-range') || '';
  const totalMatch = contentRange.match(/\/(\d+)\s*$/);
  let total = totalMatch ? Number(totalMatch[1]) : NaN;
  // Query-range responses are often 200 without Content-Range; fall back to clen= / content_length.
  if (!Number.isFinite(total) || total <= 0) {
    try {
      const clen = new URL(stream.url).searchParams.get('clen');
      const n = Number(clen);
      if (Number.isFinite(n) && n > 0) total = n;
    } catch {
      // ignore
    }
  }
  try {
    await probe.arrayBuffer();
  } catch {
    // ignore probe body errors
  }
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error(`Unable to probe stream size (${probe.status})`);
  }
  stream.contentLength = total;
  return total;
}

async function fetchUpstreamClosed(stream, start, end) {
  return fetch(buildUpstreamMediaUrl(stream, start, end), {
    method: 'GET',
    headers: UPSTREAM_STREAM_HEADERS,
    redirect: 'follow',
  });
}

/** Fetch one closed upstream window; refresh deciphered URL once on 401/403. */
async function fetchUpstreamWindow(videoId, stream, start, end) {
  let current = stream;
  let response = await fetchUpstreamClosed(current, start, end);
  if (response.status === 403 || response.status === 401) {
    console.warn('[ytmusic] upstream', response.status, '— refreshing stream for', videoId);
    // Refresh signed URL only — do not drop the whole Innertube session (expensive + flaky).
    streamCache.delete(videoId);
    current = await resolveStream(videoId, { forceRefresh: true });
    if (Number.isFinite(stream.contentLength)) {
      current.contentLength = stream.contentLength;
    }
    response = await fetchUpstreamClosed(current, start, end);
  }
  return { stream: current, response };
}

/** Read one upstream byte window into a Buffer; empty when upstream ends early. */
async function readUpstreamWindow(videoId, stream, start, end) {
  const { stream: nextStream, response } = await fetchUpstreamWindow(videoId, stream, start, end);
  if (!response.ok && response.status !== 206) {
    const body = await response.text().catch(() => '');
    const err = new Error(`Upstream stream failed (${response.status}) ${body.slice(0, 120)}`);
    err.status = response.status;
    err.stream = nextStream;
    throw err;
  }
  const buf = Buffer.from(await response.arrayBuffer());
  return { stream: nextStream, buf };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Full-track media cache: fill sequentially from googlevideo, serve Range from RAM.
 * Prevents <audio> onError→skip when a live upstream window 403s mid-song.
 */
const MEDIA_CACHE_MAX_ENTRIES = 6;
const MEDIA_FILL_WINDOW = 512 * 1024;
const MEDIA_WAIT_SLICE_MS = 40;
const MEDIA_WAIT_TIMEOUT_MS = 60_000;
/** @type {Map<string, {
 *   videoId: string,
 *   total: number,
 *   mimeType: string,
 *   buffer: Buffer,
 *   filledUpTo: number,
 *   stream: any,
 *   fillPromise: Promise<void>|null,
 *   aborted: boolean,
 * }>} */
const mediaCache = new Map();

function touchMediaCache(videoId, entry) {
  mediaCache.delete(videoId);
  mediaCache.set(videoId, entry);
  while (mediaCache.size > MEDIA_CACHE_MAX_ENTRIES) {
    const oldest = mediaCache.keys().next().value;
    const old = mediaCache.get(oldest);
    if (old) old.aborted = true;
    mediaCache.delete(oldest);
  }
}

async function fillMediaCache(entry) {
  while (!entry.aborted && entry.filledUpTo < entry.total) {
    const start = entry.filledUpTo;
    const end = Math.min(start + MEDIA_FILL_WINDOW - 1, entry.total - 1);
    let ok = false;
    for (let attempt = 0; attempt < 5 && !ok && !entry.aborted; attempt += 1) {
      try {
        if (attempt > 0) {
          streamCache.delete(entry.videoId);
          entry.stream = await resolveStream(entry.videoId, { forceRefresh: true });
          entry.stream.contentLength = entry.total;
          await sleep(250 * attempt);
        }
        const read = await readUpstreamWindow(entry.videoId, entry.stream, start, end);
        entry.stream = read.stream;
        if (!read.buf.length) {
          throw new Error('empty upstream window');
        }
        read.buf.copy(entry.buffer, start);
        entry.filledUpTo = start + read.buf.length;
        ok = true;
      } catch (error) {
        console.warn(
          '[ytmusic] media cache fill',
          entry.videoId,
          `bytes=${start}-${end}`,
          `attempt=${attempt + 1}`,
          error.message || error,
        );
      }
    }
    if (!ok) {
      // Drop the Innertube session and cool down — googlevideo often 403s the same signed URL after ~1MB.
      innertubePromise = null;
      streamCache.delete(entry.videoId);
      console.warn('[ytmusic] media cache cooldown', entry.videoId, `at=${entry.filledUpTo}`);
      await sleep(2500);
      try {
        entry.stream = await resolveStream(entry.videoId, { forceRefresh: true });
        entry.stream.contentLength = entry.total;
      } catch (error) {
        console.warn('[ytmusic] media cache re-resolve failed', entry.videoId, error.message || error);
      }
    }
  }
}

async function getOrCreateMediaCache(videoId) {
  const existing = mediaCache.get(videoId);
  if (existing && !existing.aborted) {
    touchMediaCache(videoId, existing);
    if (!existing.fillPromise && existing.filledUpTo < existing.total) {
      existing.fillPromise = fillMediaCache(existing).finally(() => {
        existing.fillPromise = null;
      });
    }
    return existing;
  }

  let stream = await resolveStream(videoId);
  const total = await probeContentLength(stream, 0);
  const entry = {
    videoId,
    total,
    mimeType: stream.mimeType || 'audio/mp4',
    buffer: Buffer.alloc(total),
    filledUpTo: 0,
    stream,
    fillPromise: null,
    aborted: false,
  };
  touchMediaCache(videoId, entry);
  entry.fillPromise = fillMediaCache(entry).finally(() => {
    entry.fillPromise = null;
  });
  return entry;
}

async function waitForMediaBytes(entry, needEndExclusive, timeoutMs = MEDIA_WAIT_TIMEOUT_MS) {
  const need = Math.min(needEndExclusive, entry.total);
  const deadline = Date.now() + timeoutMs;
  while (entry.filledUpTo < need) {
    if (entry.aborted) {
      throw new Error('Media cache aborted');
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for media bytes ${need} (have ${entry.filledUpTo})`);
    }
    if (!entry.fillPromise) {
      entry.fillPromise = fillMediaCache(entry).finally(() => {
        entry.fillPromise = null;
      });
    }
    await sleep(MEDIA_WAIT_SLICE_MS);
  }
}

/**
 * Serve byte ranges from the full-track media cache (Content-Length always matches body).
 */
async function pipeUpstreamToResponse(req, res, videoId) {
  const { start: clientStart, end: clientEnd, hadRange } = parseClientByteRange(req.headers.range);

  let entry;
  try {
    entry = await getOrCreateMediaCache(videoId);
  } catch (error) {
    console.error('[ytmusic] media cache init failed', videoId, error.message || error);
    res.writeHead(502, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end('Upstream stream size probe failed');
    return;
  }

  const total = entry.total;
  const lastByte = total - 1;
  const responseStart = Math.min(Math.max(0, clientStart), lastByte);
  const maxClientBytes =
    responseStart <= 0 ? MAX_CLIENT_RESPONSE_BYTES : MAX_CLIENT_RESPONSE_BYTES_MID;
  let responseEnd =
    clientEnd != null && Number.isFinite(clientEnd)
      ? Math.min(clientEnd, responseStart + maxClientBytes - 1, lastByte)
      : Math.min(responseStart + maxClientBytes - 1, lastByte);
  if (responseEnd < responseStart) {
    responseEnd = responseStart;
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': '*',
    'Cache-Control': 'no-store',
    'Accept-Ranges': 'bytes',
    'Content-Type': entry.mimeType || 'audio/mp4',
  };

  if (req.method === 'HEAD') {
    const headers = {
      ...corsHeaders,
      'Content-Length': String(responseEnd - responseStart + 1),
      'Content-Range': `bytes ${responseStart}-${responseEnd}/${total}`,
    };
    res.writeHead(hadRange || responseStart > 0 || responseEnd < lastByte ? 206 : 200, headers);
    res.end();
    return;
  }

  try {
    await waitForMediaBytes(entry, responseEnd + 1);
  } catch (error) {
    // Return whatever contiguous prefix we already have rather than 403 (which skips the track).
    if (entry.filledUpTo <= responseStart) {
      console.error('[ytmusic] media cache wait failed', videoId, error.message || error);
      res.writeHead(503, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': '2',
      });
      res.end('Stream cache warming');
      return;
    }
    responseEnd = entry.filledUpTo - 1;
  }

  const body = entry.buffer.subarray(responseStart, responseEnd + 1);
  const actualEnd = responseStart + body.length - 1;
  const headers = {
    ...corsHeaders,
    'Content-Length': String(body.length),
    'Content-Range': `bytes ${responseStart}-${actualEnd}/${total}`,
  };
  res.writeHead(206, headers);
  res.end(body);
}

function ensureLocalProxy() {
  if (proxyReadyPromise) {
    return proxyReadyPromise;
  }

  proxyReadyPromise = new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
      }

      try {
        const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
        const match = requestUrl.pathname.match(/^\/ytm\/([^/]+)\/?$/);
        if (!match) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        const videoId = decodeURIComponent(match[1]).trim();
        if (!videoId) {
          res.writeHead(400);
          res.end('Missing video id');
          return;
        }

        void pipeUpstreamToResponse(req, res, videoId).catch((error) => {
          console.error('[ytmusic] proxy handler failed', error);
          if (!res.headersSent) {
            res.writeHead(502, {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'text/plain; charset=utf-8',
            });
          }
          res.end(error instanceof Error ? error.message : 'stream proxy error');
        });
      } catch (error) {
        console.error('[ytmusic] bad proxy request', error);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });

    server.once('error', (error) => {
      proxyReadyPromise = null;
      reject(error);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      proxyPort = typeof address === 'object' && address ? address.port : null;
      proxyServer = server;
      if (!proxyPort) {
        proxyReadyPromise = null;
        reject(new Error('Failed to bind YouTube Music proxy port'));
        return;
      }
      console.log(`[ytmusic] local stream proxy listening on http://127.0.0.1:${proxyPort}`);
      resolve(proxyPort);
    });
  });

  return proxyReadyPromise;
}

/** Kept for API compatibility; custom scheme is no longer used for playback. */
function registerPrivilegedScheme() {
  // no-op — playback uses localhost HTTP proxy instead of lyra-ytm://
}

/** Start localhost proxy after app ready. */
async function registerProtocolHandler() {
  await ensureLocalProxy();
  // Do not prefetch home feed — getHomeFeed/getPlaylist often hang on slow networks and
  // contend with search. Empty-state recommendations use search seeds in the renderer.
}

function registerIpcHandlers(ipcMain) {
  ipcMain.handle('ytmusic:search', async (_event, payload = {}) => {
    try {
      const searched = await searchTracks(
        payload.query,
        payload.limit ?? 20,
        payload.type === 'playlist' ? 'playlist' : 'song',
      );
      return {
        ok: true,
        tracks: searched.tracks,
        playlists: searched.playlists,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        tracks: [],
        playlists: [],
      };
    }
  });

  ipcMain.handle('ytmusic:resolveStream', async (_event, payload = {}) => {
    try {
      await ensureLocalProxy();
      const videoId = String(payload.videoId || '').trim();
      if (payload.forceRefresh && videoId) {
        // Refresh signed googlevideo URL for the fill loop, but keep any bytes already cached.
        streamCache.delete(videoId);
      }
      const stream = await resolveStream(videoId, {
        forceRefresh: Boolean(payload.forceRefresh),
      });
      // Point an in-flight media cache at the fresh signed URL.
      const cached = mediaCache.get(videoId);
      if (cached && !cached.aborted) {
        cached.stream = stream;
        if (Number.isFinite(cached.total)) {
          stream.contentLength = cached.total;
        }
      }
      return {
        ok: true,
        stream: {
          ...stream,
          playbackUrl: buildPlaybackUrl(videoId),
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stream: null,
      };
    }
  });

  ipcMain.handle('ytmusic:getHomeShelves', async (_event, payload = {}) => {
    try {
      const shelves = await getHomeShelves({ forceRefresh: Boolean(payload.forceRefresh) });
      return { ok: true, shelves };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        shelves: [],
      };
    }
  });

  ipcMain.handle('ytmusic:getPlaylist', async (_event, payload = {}) => {
    try {
      const section = await getPlaylistSection(payload.playlistId, {
        title: payload.title || null,
        coverUrl: payload.coverUrl || null,
        limit: payload.limit ?? HOME_TRACKS_PER_SECTION,
        forceRefresh: Boolean(payload.forceRefresh),
      });
      return { ok: true, section };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        section: null,
      };
    }
  });

  ipcMain.handle('ytmusic:getHome', async (_event, payload = {}) => {
    try {
      const sections = await getHomeSections({ forceRefresh: Boolean(payload.forceRefresh) });
      return { ok: true, sections };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        sections: [],
      };
    }
  });

  console.log('[ytmusic] IPC handlers registered (search, resolveStream, getHomeShelves, getPlaylist, getHome)');
}

module.exports = {
  registerPrivilegedScheme,
  registerProtocolHandler,
  registerIpcHandlers,
  searchTracks,
  resolveStream,
  getHomeShelves,
  getPlaylistSection,
  getHomeSections,
  buildPlaybackUrl,
  ensureLocalProxy,
  prefetchHomeInBackground,
};
